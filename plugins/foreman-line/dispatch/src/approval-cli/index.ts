/**
 * Dispatch Approval CLI (W2-P2) — integrating CLI.
 *
 * Orchestrates W2-P3 (routing eval), W2-P5 (skill resolver), and W2-P4
 * (Kompress) into a complete dispatch package, assembles and validates a
 * schema-valid DispatchOrder, and — on coordinator approval — invokes the
 * permission-profile emitter to create the builder worktree, then writes the
 * Stage-C dispatch receipt.
 *
 * Two-phase API:
 *   Phase 1 — prepareDispatch: pure, no disk writes (except sub-module receipts).
 *   Phase 2 — executeDispatch: side-effectful; calls dispatchWorktree FIRST
 *              (lesson #18), then writes the Stage-C ReceiptDocument.
 *
 * External-call wrapping (lesson #22): every external call is wrapped in a
 * typed try-catch that rethrows as DispatchError.
 */

import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, join, relative } from 'node:path'
import { Ajv } from 'ajv'
import { parse } from 'yaml'
import type { JsonValue } from '../../../approval/src/index.js'
import { canonicalize, sha256Hex, writeReceiptDocument } from '../../../approval/src/index.js'
import type {
  CorrelationContext,
  CorrelationId,
  RunId,
  SessionId,
  WorkflowId,
} from '../../../contracts/src/index.js'
import type { DispatchOrder } from '../../../contracts/src/stages/c-dispatch.js'
import { dispatchOrderSchema } from '../../../contracts/src/stages/c-dispatch.js'
import type { ScopeEnvelope } from '../../../mutation-scope-guard/src/index.js'
import { postHocCheck, preflightCheck } from '../../../mutation-scope-guard/src/index.js'
import { dispatchWorktree as realDispatchWorktree } from '../../../permission-profiles/src/emitter.js'
import type { ReceiptDocument } from '../../../receipts/src/index.js'
import { receiptPath, validateReceiptDocument } from '../../../receipts/src/index.js'
import type {
  ClassName,
  ExpertiseArea,
  InputModality,
  ThinkingLevelName,
} from '../../../routing-policy/src/types.js'
import {
  EXPERTISE_AREAS,
  INPUT_MODALITIES,
  THINKING_DEFAULT_BY_CLASS,
  THINKING_LEVELS,
} from '../../../routing-policy/src/types.js'
import type { KompressFn, KompressResult } from '../kompress-adapter/index.js'
import { kompressContext } from '../kompress-adapter/index.js'
import type { CandidateRecord } from '../query/index.js'
import type { RoutingResult } from '../routing-eval/index.js'
import { evaluateRouting, RoutingError, readChainState } from '../routing-eval/index.js'
import type { SkillResolverResult } from '../skill-resolver/index.js'
import { resolveSkills } from '../skill-resolver/index.js'

// ─── Error class ──────────────────────────────────────────────────────────────

export class DispatchError extends Error {
  readonly code:
    | 'SPEC_UNREADABLE'
    | 'SPEC_INVALID_FRONTMATTER'
    | 'PRIOR_RECEIPT_UNREADABLE'
    | 'PRIOR_CORRELATION_MISSING'
    | 'ROUTING_FAILED'
    | 'REQUIREMENTS_UNSATISFIABLE'
    | 'SKILL_RESOLUTION_FAILED'
    | 'COMPRESS_FAILED'
    | 'ORDER_INVALID'
    | 'WORKTREE_FAILED'
    | 'MUTATION_SCOPE_FAILED'
    | 'RECEIPT_WRITE_FAILED'
    | 'ROOT_NOT_ABSOLUTE'

  constructor(code: DispatchError['code'], message: string) {
    super(message)
    this.name = 'DispatchError'
    this.code = code
  }
}

// ─── Root / path guards (P2b-i / D1) ──────────────────────────────────────────

/**
 * Refuse a non-absolute root BEFORE any fs/subprocess work (D1): a relative
 * root would silently anchor to the process cwd. Typed ROOT_NOT_ABSOLUTE,
 * mirroring routing-eval / skill-resolver's message style.
 */
function assertAbsoluteRoot(seam: string, name: string, root: string): void {
  if (!isAbsolute(root)) {
    throw new DispatchError(
      'ROOT_NOT_ABSOLUTE',
      `${seam}: ${name} '${root}' is not an absolute path; a relative root would silently anchor to the process cwd and is refused (P2b-i / D19)`,
    )
  }
}

/**
 * Refuse a caller-supplied path that resolves outside `root` BEFORE any fs
 * work happens at the constructed path (D1). `rel` starting with '..' means
 * the target climbed out of root; an absolute `rel` (e.g. a different Windows
 * drive) escapes it too. Cross-package containment vocabulary: plain Error
 * carrying 'resolves outside repoRoot and is refused'.
 */
function assertContainedRootPath(seam: string, ref: string, absPath: string, root: string): void {
  const rel = relative(root, absPath)
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`${seam}: '${ref}' resolves outside repoRoot and is refused`)
  }
}

// ─── Public types ──────────────────────────────────────────────────────────────

export interface SpecFrontmatter {
  readonly routing_class: string
  readonly data_classification: string
  readonly surfaces: readonly string[]
  readonly permission_profile?: string
  /**
   * RCM-P4A (C2.1, schema v0.4): `inputs:` — the closed `text | image`
   * modality vocabulary (`INPUT_MODALITIES`). Absent = text-only (D8 legacy
   * omission). No model identity may enter through these fields (RCM D9).
   */
  readonly inputs?: readonly string[]
  /** RCM-P4A (C2.1): `thinking_level:` — one of the seven `ThinkingLevel` names. */
  readonly thinking_level?: string
  /** RCM-P4A (C2.1): `min_context:` — positive-integer token floor (upward-only override; declared value used as-is). */
  readonly min_context?: number
  /** RCM-P4A (C2.1): `expertise:` — one closed-vocabulary expertise area (`EXPERTISE_AREAS`). */
  readonly expertise?: string
}

export interface DispatchInput {
  readonly candidate: CandidateRecord
  readonly specPath: string
  readonly compressFn: KompressFn
  readonly worktreePath: string
  /** Optional task-envelope scope; when present, both preflight and post-hoc checks are mandatory. */
  readonly mutationScope?: ScopeEnvelope
}

export interface DispatchPackage {
  readonly candidate: CandidateRecord
  readonly specFrontmatter: SpecFrontmatter
  readonly specText: string
  readonly routingResult: RoutingResult
  readonly skillResult: SkillResolverResult
  readonly kompressResult: KompressResult
  readonly order: DispatchOrder
  readonly prevHash: string
  readonly priorCorrelationId: CorrelationId
  readonly mutationScope?: ScopeEnvelope
}

export interface ExecuteResult {
  readonly order: DispatchOrder
  readonly receiptLocator: string
  readonly worktreePath: string
}

export interface DispatchWorktreeInput {
  readonly parcel: string
  readonly profile: string
  readonly path: string
  readonly cwd?: string
}

export interface DispatchWorktreeOutput {
  readonly code: 0 | 1 | 2
  readonly stdout: string
  readonly stderr: string
  /** Repo-relative paths observed as changed by the worktree operation. */
  readonly changedPaths?: readonly string[]
}

export interface DispatchOptions {
  /** Target repo root — required (P2a/D19): never derived from process.cwd(). */
  readonly repoRoot: string
  /**
   * Absolute INSTALLED PLUGIN root (P2b-i R1/Q3) — threaded to routing eval
   * and skill resolution, which read the plugin's own frozen assets. Required,
   * no default, no discovery; its own explicit input (R2 principle).
   */
  readonly pluginRoot: string
  readonly dispatchWorktreeFn?: (opts: DispatchWorktreeInput) => DispatchWorktreeOutput
}

// ─── AJV setup ────────────────────────────────────────────────────────────────

const ajv = new Ajv()
const validateDispatchOrder = ajv.compile(dispatchOrderSchema)

// ─── Frontmatter parsing ──────────────────────────────────────────────────────

function parseFrontmatter(text: string, specPath: string): SpecFrontmatter {
  const fmMatch = text.match(/^---\n([\s\S]*?)\n---/)
  if (!fmMatch) {
    throw new DispatchError(
      'SPEC_INVALID_FRONTMATTER',
      `No YAML frontmatter block found in spec at '${specPath}'`,
    )
  }
  const fmBlock = fmMatch[1]
  if (fmBlock === undefined) {
    throw new DispatchError(
      'SPEC_INVALID_FRONTMATTER',
      `No YAML frontmatter content found in spec at '${specPath}'`,
    )
  }
  let fm: Record<string, unknown>
  try {
    fm = parse(fmBlock) as Record<string, unknown>
  } catch (err) {
    throw new DispatchError(
      'SPEC_INVALID_FRONTMATTER',
      `Cannot parse frontmatter YAML in spec at '${specPath}': ${String(err)}`,
    )
  }

  // Validate required fields
  if (typeof fm.routing_class !== 'string' || fm.routing_class.length === 0) {
    throw new DispatchError(
      'SPEC_INVALID_FRONTMATTER',
      `Frontmatter missing required string field 'routing_class' in '${specPath}'`,
    )
  }
  if (typeof fm.data_classification !== 'string' || fm.data_classification.length === 0) {
    throw new DispatchError(
      'SPEC_INVALID_FRONTMATTER',
      `Frontmatter missing required string field 'data_classification' in '${specPath}'`,
    )
  }
  if (!Array.isArray(fm.surfaces)) {
    throw new DispatchError(
      'SPEC_INVALID_FRONTMATTER',
      `Frontmatter missing required array field 'surfaces' in '${specPath}'`,
    )
  }

  const surfacesArr = fm.surfaces as unknown[]
  for (const s of surfacesArr) {
    if (typeof s !== 'string') {
      throw new DispatchError(
        'SPEC_INVALID_FRONTMATTER',
        `Frontmatter 'surfaces' must be an array of strings in '${specPath}'`,
      )
    }
  }

  // RCM-P4A (C2.1): schema-v0.4 requirement fields — runtime-validated
  // against the closed vocabularies (RCM D7/D8) in the existing typed style.
  // No model identity may enter through these fields (RCM D9): the
  // vocabularies are closed, so an identity value refuses here.
  let inputs: string[] | undefined
  if (fm.inputs !== undefined) {
    if (!Array.isArray(fm.inputs) || fm.inputs.length === 0) {
      throw new DispatchError(
        'SPEC_INVALID_FRONTMATTER',
        `Frontmatter 'inputs' must be a non-empty array in '${specPath}'`,
      )
    }
    const inputsArr = fm.inputs as unknown[]
    for (const entry of inputsArr) {
      if (typeof entry !== 'string' || !(INPUT_MODALITIES as readonly string[]).includes(entry)) {
        throw new DispatchError(
          'SPEC_INVALID_FRONTMATTER',
          `Frontmatter 'inputs' values must be drawn from ${INPUT_MODALITIES.join(' | ')} in '${specPath}'`,
        )
      }
    }
    inputs = inputsArr as string[]
    if (new Set(inputs).size !== inputs.length) {
      throw new DispatchError(
        'SPEC_INVALID_FRONTMATTER',
        `Frontmatter 'inputs' must have unique values in '${specPath}'`,
      )
    }
  }
  let thinkingLevel: string | undefined
  if (fm.thinking_level !== undefined) {
    if (
      typeof fm.thinking_level !== 'string' ||
      !(THINKING_LEVELS as readonly string[]).includes(fm.thinking_level)
    ) {
      throw new DispatchError(
        'SPEC_INVALID_FRONTMATTER',
        `Frontmatter 'thinking_level' must be one of ${THINKING_LEVELS.join(' | ')} in '${specPath}'`,
      )
    }
    thinkingLevel = fm.thinking_level
  }
  let minContext: number | undefined
  if (fm.min_context !== undefined) {
    if (
      typeof fm.min_context !== 'number' ||
      !Number.isInteger(fm.min_context) ||
      fm.min_context < 1
    ) {
      throw new DispatchError(
        'SPEC_INVALID_FRONTMATTER',
        `Frontmatter 'min_context' must be a positive integer in '${specPath}'`,
      )
    }
    minContext = fm.min_context
  }
  let expertise: string | undefined
  if (fm.expertise !== undefined) {
    if (
      typeof fm.expertise !== 'string' ||
      !(EXPERTISE_AREAS as readonly string[]).includes(fm.expertise)
    ) {
      throw new DispatchError(
        'SPEC_INVALID_FRONTMATTER',
        `Frontmatter 'expertise' must be one of ${EXPERTISE_AREAS.join(' | ')} in '${specPath}'`,
      )
    }
    expertise = fm.expertise
  }

  const permissionProfile =
    typeof fm.permission_profile === 'string' ? fm.permission_profile : undefined

  return {
    routing_class: fm.routing_class as string,
    data_classification: fm.data_classification as string,
    surfaces: surfacesArr as string[],
    ...(permissionProfile !== undefined ? { permission_profile: permissionProfile } : {}),
    ...(inputs !== undefined ? { inputs } : {}),
    ...(thinkingLevel !== undefined ? { thinking_level: thinkingLevel } : {}),
    ...(minContext !== undefined ? { min_context: minContext } : {}),
    ...(expertise !== undefined ? { expertise } : {}),
  }
}

// ─── Correlation inheritance (validateChain AC5c) ─────────────────────────────

/**
 * Extract the prior stage's `correlation.correlationId` from a parsed receipt
 * so Stage C can INHERIT it (never mint a fresh one). This is a deliberate
 * local replica of the harness helper `inheritCorrelation`
 * (verification/src/harness/index.ts:314-338), duplicated on purpose:
 * `verification` consumes `dispatch` output, so a `dispatch -> verification`
 * import would invert the dependency direction. The harness returns a full
 * CorrelationContext because it has sessionId/runId in hand; here only the
 * correlationId exists at prepareDispatch time (sessionId/runId are minted
 * later in executeDispatch), so this returns the bare validated CorrelationId.
 *
 * Fail-loud: a missing `correlation` object, or a missing/empty/non-string
 * `correlationId`, throws DispatchError('PRIOR_CORRELATION_MISSING'). Silent
 * fallback to randomUUID() is forbidden — that is the exact defect removed here.
 */
function extractPriorCorrelationId(
  source: Record<string, unknown>,
  sourceLabel: string,
): CorrelationId {
  const correlation = source.correlation
  if (typeof correlation !== 'object' || correlation === null || Array.isArray(correlation)) {
    throw new DispatchError(
      'PRIOR_CORRELATION_MISSING',
      `${sourceLabel} has no 'correlation' object`,
    )
  }
  const { correlationId } = correlation as Record<string, unknown>
  if (typeof correlationId !== 'string' || correlationId.trim().length === 0) {
    throw new DispatchError(
      'PRIOR_CORRELATION_MISSING',
      `${sourceLabel} correlation is missing a non-empty string correlationId`,
    )
  }
  return correlationId as CorrelationId
}

// ─── Phase 1: prepareDispatch ─────────────────────────────────────────────────

export async function prepareDispatch(
  input: DispatchInput,
  options: DispatchOptions,
): Promise<DispatchPackage> {
  // D1 guards run FIRST — before any fs/subprocess work below.
  assertAbsoluteRoot('prepareDispatch', 'repoRoot', options.repoRoot)
  assertAbsoluteRoot('prepareDispatch', 'pluginRoot', options.pluginRoot)
  // specPath is an explicit standalone caller path (never resolved against a
  // root) — a relative one would silently anchor to the process cwd, so it is
  // refused with the same typed family before readFileSync touches it.
  if (!isAbsolute(input.specPath)) {
    throw new DispatchError(
      'ROOT_NOT_ABSOLUTE',
      `prepareDispatch: specPath '${input.specPath}' is not an absolute path; a relative artifact path would silently anchor to the process cwd and is refused (P2b-i / D19)`,
    )
  }
  const repoRoot = options.repoRoot
  const pluginRoot = options.pluginRoot
  const { candidate, specPath, compressFn, mutationScope } = input

  // Guard: workflowId must be non-null (null means no receipt chain exists)
  if (candidate.workflowId === null) {
    throw new DispatchError(
      'SPEC_INVALID_FRONTMATTER',
      `candidate.workflowId is null for '${candidate.ticketKey}'; no receipt chain possible`,
    )
  }
  const workflowId = candidate.workflowId

  // 1. Read spec file
  let specText: string
  try {
    specText = readFileSync(specPath, 'utf8')
  } catch (err) {
    throw new DispatchError('SPEC_UNREADABLE', `Cannot read spec at '${specPath}': ${String(err)}`)
  }

  // 2. Parse frontmatter
  const specFrontmatter = parseFrontmatter(specText, specPath)
  if (mutationScope !== undefined) {
    try {
      preflightCheck(mutationScope, specFrontmatter.surfaces)
    } catch (err) {
      throw new DispatchError(
        'MUTATION_SCOPE_FAILED',
        `Mutation scope preflight refused dispatch: ${String(err)}`,
      )
    }
  }

  // 3. Read prior (Stage-B) receipt
  if (candidate.priorReceiptLocator === null) {
    throw new DispatchError(
      'PRIOR_RECEIPT_UNREADABLE',
      `candidate.priorReceiptLocator is null for '${candidate.ticketKey}'`,
    )
  }
  const priorReceiptAbsPath = join(repoRoot, ...candidate.priorReceiptLocator.split('/'))
  // D1 containment: the locator is caller-supplied and resolved against
  // repoRoot — an out-of-root candidate is refused before any fs read below.
  assertContainedRootPath(
    'prepareDispatch',
    candidate.priorReceiptLocator,
    priorReceiptAbsPath,
    repoRoot,
  )
  if (!existsSync(priorReceiptAbsPath)) {
    throw new DispatchError(
      'PRIOR_RECEIPT_UNREADABLE',
      `Stage-B receipt not found at '${priorReceiptAbsPath}'`,
    )
  }
  let stageBReceiptText: string
  try {
    stageBReceiptText = readFileSync(priorReceiptAbsPath, 'utf8')
  } catch (err) {
    throw new DispatchError(
      'PRIOR_RECEIPT_UNREADABLE',
      `Cannot read Stage-B receipt at '${priorReceiptAbsPath}': ${String(err)}`,
    )
  }

  // 4. Extract prevHash from Stage-B receipt
  let stageBParsed: unknown
  try {
    stageBParsed = JSON.parse(stageBReceiptText)
  } catch (err) {
    throw new DispatchError(
      'PRIOR_RECEIPT_UNREADABLE',
      `Stage-B receipt at '${priorReceiptAbsPath}' is not valid JSON: ${String(err)}`,
    )
  }
  const prevHash = (stageBParsed as Record<string, unknown>).hash
  if (typeof prevHash !== 'string' || prevHash.length === 0) {
    throw new DispatchError(
      'PRIOR_RECEIPT_UNREADABLE',
      `Stage-B receipt at '${priorReceiptAbsPath}' is missing or has empty 'hash' field`,
    )
  }

  // 4b. Extract the prior correlationId so Stage C inherits it (never mints).
  //     Lesson #22: this is an external-shape read — wrap in a typed try-catch
  //     that rethrows as DispatchError.
  let priorCorrelationId: CorrelationId
  try {
    priorCorrelationId = extractPriorCorrelationId(
      stageBParsed as Record<string, unknown>,
      `Stage-B receipt at '${priorReceiptAbsPath}'`,
    )
  } catch (err) {
    if (err instanceof DispatchError) throw err
    throw new DispatchError(
      'PRIOR_CORRELATION_MISSING',
      `Cannot extract prior correlationId from Stage-B receipt at '${priorReceiptAbsPath}': ${String(err)}`,
    )
  }

  // 5. Routing eval (W2-P3). MRC-05 (C1.3/C2.3): ONE CorrelationContext per
  // dispatch run — correlationId INHERITED from the prior stage (W4-P0
  // discipline, extracted above), sessionId/runId minted fresh per run — is
  // passed as `input.correlation` on every dispatch so the decision/cache/
  // attempt events append to the workflowId chain (one chain per parcel, never
  // fork; the evaluator refuses a mismatched chain key). The declared
  // schema-v0.4 requirement fields ride along as additive RoutingInput fields
  // (absent = the pre-existing evaluator behavior; D8 legacy-omission defaults
  // are applied inside the evaluator).
  const correlation: CorrelationContext = {
    correlationId: priorCorrelationId,
    sessionId: randomUUID() as SessionId,
    workflowId: workflowId as WorkflowId,
    runId: randomUUID() as RunId,
  }
  let routingResult: RoutingResult
  try {
    routingResult = evaluateRouting(
      {
        routing_class: specFrontmatter.routing_class,
        data_classification: specFrontmatter.data_classification,
        workflowId,
        correlation,
        ...(specFrontmatter.inputs !== undefined
          ? { required_inputs: specFrontmatter.inputs as InputModality[] }
          : {}),
        ...(specFrontmatter.thinking_level !== undefined
          ? { required_thinking_level: specFrontmatter.thinking_level as ThinkingLevelName }
          : {}),
        ...(specFrontmatter.min_context !== undefined
          ? { required_context_tokens: specFrontmatter.min_context }
          : {}),
        ...(specFrontmatter.expertise !== undefined
          ? { expertise: specFrontmatter.expertise as ExpertiseArea }
          : {}),
      },
      { repoRoot, pluginRoot },
    )
  } catch (err) {
    // C3.3: the gate's typed failure is preserved through the dispatch caller
    // (exit criterion 4 — "refuses with a typed error naming the unsatisfiable
    // predicate"; the named refusals travel in the message).
    if (err instanceof RoutingError && err.code === 'REQUIREMENTS_UNSATISFIABLE') {
      throw new DispatchError('REQUIREMENTS_UNSATISFIABLE', err.message)
    }
    throw new DispatchError('ROUTING_FAILED', `Routing evaluation failed: ${String(err)}`)
  }

  // 6. Skill resolver (W2-P5)
  let skillResult: SkillResolverResult
  try {
    skillResult = resolveSkills(
      { surfaces: specFrontmatter.surfaces, workflowId },
      { repoRoot, pluginRoot },
    )
  } catch (err) {
    throw new DispatchError('SKILL_RESOLUTION_FAILED', `Skill resolution failed: ${String(err)}`)
  }

  // 7. Kompress (W2-P4) — priorReceiptChain = [stageBReceiptText]
  let kompressResult: KompressResult
  try {
    kompressResult = await kompressContext(
      {
        parcelSpecText: specText,
        priorReceiptChain: [stageBReceiptText],
        workflowId,
      },
      compressFn,
      { repoRoot },
    )
  } catch (err) {
    // KompressError bubbles up as COMPRESS_FAILED
    throw new DispatchError('COMPRESS_FAILED', `Kompress failed: ${String(err)}`)
  }

  // 8. Assemble Step 0 restatement. C2.4: the resolved thinking level (the
  // declared `thinking_level:` or the routing-class default — the resolver's
  // identical computation) is surfaced here and bound in the decision receipt.
  const resolvedThinkingLevel: ThinkingLevelName =
    (specFrontmatter.thinking_level as ThinkingLevelName | undefined) ??
    THINKING_DEFAULT_BY_CLASS[specFrontmatter.routing_class as ClassName]
  const injectedSkillsList = [...skillResult.injectedSkills].join(', ')
  const stepZeroRestatement = [
    `Parcel: ${candidate.ticketKey}`,
    `Workflow ID: ${workflowId}`,
    `Resolved model: ${routingResult.resolvedModelId}`,
    `Resolved thinking level: ${resolvedThinkingLevel}`,
    `Injected skills: ${injectedSkillsList}`,
    `Kompress artifact ID: ${kompressResult.artifactId}`,
  ].join('\n')

  // 9. Assemble DispatchOrder
  const orderBase = {
    parcelRef: candidate.ticketKey,
    stepZeroRestatement,
    routingDecisionRef: routingResult.routingDecisionRef,
    injectedSkills: [...skillResult.injectedSkills],
    ...(specFrontmatter.permission_profile !== undefined
      ? { permissionProfile: specFrontmatter.permission_profile }
      : {}),
  }

  // 10. Validate against frozen schema
  if (!validateDispatchOrder(orderBase)) {
    throw new DispatchError(
      'ORDER_INVALID',
      `DispatchOrder failed schema validation: ${ajv.errorsText(validateDispatchOrder.errors)}`,
    )
  }

  const order = orderBase as unknown as DispatchOrder

  return {
    candidate,
    specFrontmatter,
    specText,
    routingResult,
    skillResult,
    kompressResult,
    order,
    prevHash,
    priorCorrelationId,
    ...(mutationScope !== undefined ? { mutationScope } : {}),
  }
}

// ─── Phase 2: executeDispatch ─────────────────────────────────────────────────

export async function executeDispatch(
  pkg: DispatchPackage,
  worktreePath: string,
  options: DispatchOptions,
): Promise<ExecuteResult> {
  // D1 guards run FIRST — before the worktree subprocess call below.
  assertAbsoluteRoot('executeDispatch', 'repoRoot', options.repoRoot)
  assertAbsoluteRoot('executeDispatch', 'pluginRoot', options.pluginRoot)
  const repoRoot = options.repoRoot
  const workflowId = pkg.candidate.workflowId as string

  // Resolve profile — default to 'builder-standard' if not in frontmatter
  const profile = pkg.specFrontmatter.permission_profile ?? 'builder-standard'

  // Lesson #18: call dispatchWorktree FIRST — before any file writes
  const fn = options.dispatchWorktreeFn ?? realDispatchWorktree
  let worktreeResult: DispatchWorktreeOutput
  try {
    worktreeResult = fn({
      parcel: pkg.candidate.ticketKey,
      profile,
      path: worktreePath,
      cwd: repoRoot,
    })
  } catch (err) {
    throw new DispatchError('WORKTREE_FAILED', `dispatchWorktree threw: ${String(err)}`)
  }
  if (worktreeResult.code !== 0) {
    throw new DispatchError(
      'WORKTREE_FAILED',
      `dispatchWorktree failed (code ${worktreeResult.code}): ${worktreeResult.stderr}`,
    )
  }

  if (pkg.mutationScope !== undefined) {
    if (worktreeResult.changedPaths === undefined) {
      throw new DispatchError(
        'MUTATION_SCOPE_FAILED',
        'Mutation scope enforcement requires the worktree adapter to report changedPaths',
      )
    }
    try {
      postHocCheck(pkg.mutationScope, worktreeResult.changedPaths)
    } catch (err) {
      throw new DispatchError(
        'MUTATION_SCOPE_FAILED',
        `Mutation scope post-hoc check refused changes: ${String(err)}`,
      )
    }
  }

  // Stage-C receipt assembly — wrapped so receiptPath / canonicalize / sha256Hex
  // RangeError throws surface as RECEIPT_WRITE_FAILED (Lesson #22).
  let receiptLocator: string
  try {
    // C1 INVARIANT (RCM-05) — one chain per parcel, keyed by
    // correlation.workflowId/correlationId (checkSharedCorrelation; a fork
    // refuses at the evaluator's CORRELATION_MISMATCH gate). The Stage-C
    // DispatchOrder receipt and the routing event entries COEXIST on that
    // chain with sequence values exactly 0..M-1, contiguous, no gaps and no
    // duplicate sequences (checkSequenceContiguity), each entry's prevHash
    // pointing at its immediate predecessor's hash (checkPrevHashPointers) —
    // every chain produced here is validateChain-valid, and the DispatchOrder
    // is always the tip entry at its write time.
    //
    // The slot is derived from the chain tip AT WRITE TIME (the Stage-E
    // emitter's rule: `sequence` is tip.sequence + 1; `prevHash` is tip.hash)
    // through the evaluator's own readChainState — never a literal slot, never
    // the prepare-time Stage-B read alone. At the legacy tip (no entries
    // landed after Stage-B) the tip IS Stage-B, so the derived values are
    // exactly 2 and the Stage-B hash — byte-identical to the historical
    // `000002-C-dispatch-order.json` outcome, preserved by construction, not
    // by special case. A reserved-but-later-filled slot is rejected by design
    // (it would introduce a gap whenever events land in between — contiguity
    // has no gaps by construction).
    const chainState = readChainState(join(repoRoot, 'docs', 'receipts', workflowId))
    const sequence = chainState.nextSequence
    const tipPrevHash = chainState.prevHash
    const locator = receiptPath(workflowId, sequence, 'C', 'DispatchOrder')

    const draft = {
      schemaVersion: '1',
      kind: 'stage' as const,
      stage: 'C' as const,
      claimRef: null,
      correlation: {
        // Stage C INHERITS the prior stage's correlationId (validateChain AC5c):
        // the whole chain must share one identical correlationId. sessionId and
        // runId remain freshly minted per-execution.
        correlationId: pkg.priorCorrelationId,
        sessionId: randomUUID() as SessionId,
        workflowId: workflowId as WorkflowId,
        runId: randomUUID() as RunId,
      },
      sequence,
      prevHash: tipPrevHash,
      timestamp: new Date().toISOString(),
      subjectKind: 'DispatchOrder',
      subject: {
        kompressArtifactId: pkg.kompressResult.artifactId,
        kompressReceiptRef: pkg.kompressResult.kompressReceiptRef,
        compressedText: pkg.kompressResult.compressedText,
        routingDecisionRef: pkg.routingResult.routingDecisionRef,
        injectedSkills: [...pkg.skillResult.injectedSkills],
        ...(pkg.order.permissionProfile !== undefined
          ? { permissionProfile: pkg.order.permissionProfile }
          : {}),
      },
      signature: null,
    }

    const hash = sha256Hex(canonicalize(draft as unknown as JsonValue))
    const document = { ...draft, hash } as unknown as ReceiptDocument

    const validation = validateReceiptDocument(document)
    if (!validation.valid) {
      throw new DispatchError(
        'RECEIPT_WRITE_FAILED',
        `Stage-C receipt failed schema validation: ${validation.errors.join('; ')}`,
      )
    }

    writeReceiptDocument(document, locator, repoRoot)
    receiptLocator = locator
  } catch (err) {
    if (err instanceof DispatchError) throw err
    throw new DispatchError('RECEIPT_WRITE_FAILED', `Receipt write failed: ${String(err)}`)
  }

  return {
    order: pkg.order,
    receiptLocator,
    worktreePath,
  }
}
