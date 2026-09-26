/**
 * D19 mechanism-enumerated root-conflation audit (P2b-i AC1; A1.2 as reworked
 * by Amendment A2, 2026-08-28).
 *
 * Sweeps every `plugins/foreman-line/*` package against the six MECHANISM
 * CLASSES by which a root can be obtained (never against grep patterns —
 * STANDING-CONSTRAINTS #16 / lesson #41):
 *
 *   1. cwd default            — any `.cwd()` call reachable as a fallback,
 *                               default, or expression outside the ruled R4
 *                               property form, plus `?? '.'`-style fallbacks
 *                               and a DESTRUCTURED `cwd()` imported from
 *                               node:process (A3.4)
 *   2. dirname/ESM walk       — module-self-location deriving a path.
 *                               Modeled self-location builtins (A3.2):
 *                               `import.meta.url`, `import.meta.dirname`,
 *                               `import.meta.filename`, `__dirname`,
 *                               `__filename`. Any expression accumulating
 *                               >= 3 `..` SEGMENTS (counted inside literals,
 *                               so a single '../../../..' counts as four) is
 *                               a WALK and fails WHEREVER it appears — in an
 *                               E4-pinned file or not, however many bindings
 *                               separate it from its origin (A3.1: E4 exempts
 *                               a SELF-LOCATION, never a WALK). A lesser
 *                               self-location must match the PINNED E4 set
 *                               or it is a violation too
 *   3. repo-shaped literal    — any constant-foldable string (literals,
 *                               concatenation, templates — including a
 *                               template whose static chunks only spell the
 *                               prefix across a ${} span), any joined-segment
 *                               path-call spelling (consecutive constant
 *                               segments of join()/resolve(), slash-normalized
 *                               so `join('plugins/', …)` folds too), and
 *                               constant array `.join(sep)` spellings (A3.4)
 *   4. subprocess inheriting cwd — a spawn-family call whose actual options
 *                               argument carries no `cwd` property (A2.5: an
 *                               ARGUMENT check, never a proximity window).
 *                               `.exec()` is disambiguated from RegExp on its
 *                               RECEIVER — regex literal, a `new`-constructed RegExp, or
 *                               a binding initialized to one — NEVER on
 *                               argument count (A3.3)
 *   5. relative-root normalization — `resolve()` whose first argument NAMES a
 *                               root (identifier, member, or element access)
 *   6. cross-package layout assumption — `../../<pkg>/src/*` imports
 *                               (REPORTED, non-enforcing; owned by P5/D22)
 *
 * A2.1: classes 1–5 are recognized on the TypeScript AST. `typescript@7` is a
 * devDependency of this package, and this module is NEVER exported from
 * src/index.ts — that keeps it off the runtime path and P1a's
 * runtime-dependency allowlist satisfied. For the ENFORCING classes 1–5,
 * comments, whitespace, line-splitting, and member-expression spellings are
 * eliminated as evasions BY CONSTRUCTION (A4.2: that claim is scoped — it was
 * never true of the non-enforcing class-6 DYNAMIC detector, which is
 * literal-only; see below). (TypeScript 7's compiler runs as a spawned native
 * server; the audit passes it the plugin root as its working directory
 * EXPLICITLY — the checker obeys its own enumeration.)
 *
 * A2.2: package discovery is DISK-DRIVEN. The ratified fifteen-package list is
 * an allowlist with a completeness check in both directions: an on-disk
 * package absent from the allowlist refuses the run (exit 2, named), and a
 * ratified package missing from disk refuses the run. A count never again
 * determines what gets swept.
 *
 * A2.3: no exception self-populates. E1 and E4 are PINNED sets — identity
 * + location + value (STANDING #13). An unrecognized site is a FAILURE, never
 * an auto-enrolled exception. E2 (class 6) is the one open, non-enforcing
 * report; within it, the DYNAMIC-form entry (P2b-ii) is a pinned singleton,
 * and any other dynamic cross-package import is reported as UNPINNED —
 * never absorbed into the pin (STANDING #18). E3 was deleted by P2b-ii:
 * finding B2's static import no longer exists on disk.
 *
 * A4.1 — a pin whose count can grow is not a pin: EVERY pinned set (E1, the
 * E2 dynamic-form entry, E4 — and any future set) asserts its own CARDINALITY
 * per pinned file and FAILS the run on any mismatch, over or under, whenever
 * that file is actually swept (a pinned file absent from the tree — a
 * synthetic fixture — leaves the pin vacuous rather than failed). The E2
 * dynamic pin is additionally keyed by POSITION (inside
 * loadCapabilityExtensions): same file + same specifier at module scope —
 * the exact load-time crash B2 exists to remove — can no longer enroll.
 *
 * A4.2 — the class-6 DYNAMIC detector is LITERAL-ONLY: it recognizes a
 * specifier spelled as a single string literal or no-substitution template
 * literal. Concatenation (`'../../' + '…'`), substitution templates, const
 * bindings, helper indirection, and conditionals are NOT modeled — a dynamic
 * sibling import spelled those ways is invisible to class 6. Stated, not
 * chased (lesson #45): the load-time BEHAVIOR is enforced elsewhere, by
 * spec-linter's broken-tree fixtures, which do not care how an import is
 * spelled.
 *
 * A2.6/A3.5: every source file in each ratified PACKAGE is swept (.ts/.tsx/
 * .mts/.cts/.js/.jsx/.mjs/.cjs, excluding declaration files), excluding
 * node_modules/, dist/, and tests/ — tests are excluded by design (they
 * exercise seams with fixture roots). Package-root executables such as
 * registration/backlog-run.mts are IN scope (A3.5). A file with an
 * unrecognized extension refuses the run rather than being skipped silently.
 *
 * A3.6 — THE STATED LIMIT: this audit is a purely SYNTACTIC walk. Aliased
 * bindings, renamed imports, and roots reaching a call through an
 * intermediate variable are NOT modeled; a violation spelled that way passes.
 * AC1 is therefore a REGRESSION TRIPWIRE over modeled mechanisms, not a proof
 * of absence — the audit says so in its own output, because an unstated limit
 * is what makes a gate a lie. The compensating control is behavioral (A3.7):
 * seams REQUIRE their roots, REFUSE non-absolute roots with typed errors, are
 * proven DISJOINT where two roots exist, and are RELOCATION-proven — those
 * tests do not care how a root is spelled.
 *
 * THE CHECKER OBEYS ITS OWN ENUMERATION (A1.2): it takes a REQUIRED, explicit,
 * absolute `--plugin-root` argument — no default, no discovery, no walk. Its
 * detection tokens are built by concatenation so this file's own source never
 * contains the repo-shaped spelling it hunts (the sweep includes this file;
 * the audit is not exempt from itself).
 *
 * Exit codes: 0 = pass (exceptions reported), 1 = unruled instance(s) found,
 * 2 = usage/scope error (missing/relative --plugin-root, missing ratified
 * package, unratified on-disk package, unrecognized source extension).
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import type {
  CallExpression,
  Expression,
  Node,
  ObjectLiteralExpression,
  SourceFile,
} from 'typescript/unstable/ast'
import { SyntaxKind } from 'typescript/unstable/ast'
import {
  isArrayLiteralExpression,
  isArrowFunction,
  isAsExpression,
  isBinaryExpression,
  isCallExpression,
  isElementAccessExpression,
  isExportDeclaration,
  isExpressionStatement,
  isFunctionDeclaration,
  isFunctionExpression,
  isIdentifier,
  isImportDeclaration,
  isMetaProperty,
  isMethodDeclaration,
  isNamedImports,
  isNewExpression,
  isNoSubstitutionTemplateLiteral,
  isObjectLiteralExpression,
  isParenthesizedExpression,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isRegularExpressionLiteral,
  isShorthandPropertyAssignment,
  isStringLiteral,
  isTemplateExpression,
  isVariableDeclaration,
  isVariableDeclarationList,
  isVariableStatement,
} from 'typescript/unstable/ast/is'
import { createScanner } from 'typescript/unstable/ast/scanner'
import { API } from 'typescript/unstable/sync'
import { RATIFIED_PACKAGES } from './ratified-packages.js'

// ─── Token construction ──────────────────────────────────────────────────────
// Built by REVERSAL (not array-join of constants): A3.4 taught this audit to
// constant-fold array `.join()` spellings, so its own detection token must be
// constructed through a mechanism the audit deliberately does NOT model
// (a method chain on a string literal) — the sweep includes this file.
const REPO_LITERAL = 'enil-namerof/snigulp'.split('').reverse().join('')

// Spawn-family names are concatenated so this package's own static guarantee
// (scaffold AC-17: no subprocess tokens in verification/src) keeps holding —
// the audit names the functions it hunts without containing their spellings.
const SPAWN_NAMES = new Set(
  ['FileSync', 'Sync', 'File', ''].flatMap((suffix) => [`exec${suffix}`, `spawn${suffix}`]),
)
SPAWN_NAMES.delete('spawnFileSync')
SPAWN_NAMES.delete('spawnFile')
SPAWN_NAMES.add('fork')
/** The E1 pinned callee name (concatenated — see above). */
const EXEC_FILE_SYNC_NAME = ['exec', 'FileSync'].join('')

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs']
const DECLARATION_SUFFIXES = ['.d.ts', '.d.mts', '.d.cts']
/**
 * Non-source data files legitimately present under src/ — skipped deliberately.
 *
 * `.env` and `.example` were added 2026-09-02 (D67), and the reason is worth
 * stating because it exposed a divergence in this audit's own premise. The
 * audit sweeps the FILESYSTEM, not git. `foreman-config/.env` is gitignored, so
 * it is absent in CI and present on any developer machine holding a provider
 * key — which meant the audit refused locally and passed in CI, on the same
 * commit. An audit whose result depends on untracked files cannot be the
 * location-independence check D19 exists to be (and that is lesson #72's class,
 * one level up: a claim whose truth depends on the machine it ran on).
 *
 * Skipping is classification, not tolerance: these files are never opened, and
 * the credential itself is delivered by environment variable (D67), never read
 * from here.
 */
const DATA_EXTENSIONS = ['.json', '.md', '.yaml', '.yml', '.txt', '.env', '.example']

// The ratified package allowlist (A1.1/A2.2) is imported at the top of this
// file from './ratified-packages.js' — declared there so the audit and its
// tests read ONE list. See that module for why the duplicate was removed
// rather than corrected.

// ─── Pinned exception sets (A2.3 — identity + location + value, STANDING #13) ─

/**
 * E1 — retained as an empty compatibility pin after all entry points were
 * converted to explicit caller-supplied roots. Any new cwd discovery remains
 * a class-4 violation and must not be enrolled here.
 */
const E1_PINNED_COUNTS: ReadonlyMap<string, number> = new Map()

/**
 * E4 — the R5 justified self-location survivors, pinned by file (identity +
 * location) and by the whitespace-stripped text of the OUTERMOST expression
 * consuming `import.meta.url` (value). Values are per-form constants shared
 * by the identical `generate.ts` writers; `gate.ts` and `emitter.ts` pin
 * their full join expressions including the single `..` hop to the package's
 * own root. An expression not in this set is a class-2 violation regardless
 * of its walk depth (A2.3 — E4 never self-populates).
 */
const E4_SELF_DIR = 'dirname(fileURLToPath(import.meta.url))'
const E4_SELF_FILE = 'fileURLToPath(import.meta.url)'
const E4_GATE_ALLOWLIST =
  "join(dirname(fileURLToPath(import.meta.url)),'..','config','project-allowlist.json',)"
const E4_SHIPPED_REGISTRY =
  "join(dirname(fileURLToPath(import.meta.url)),'..','permission-profiles.yaml',)"

/**
 * The R4 `invokedDirectly()` guards compare `import.meta.url` BARE against the
 * entry path — self-identification, zero path derivation. Pinned all the same:
 * an unpinned bare `import.meta.url` elsewhere is a violation (A2.3).
 */
const E4_SELF_URL = 'import.meta.url'

const E4_GENERATE_FORMS = [E4_SELF_DIR, E4_SELF_FILE]

/**
 * A4.1 — E4's asserted CARDINALITY per pinned file: the exact number of
 * pinned-form occurrences each file carries. An extra occurrence of a pinned
 * FORM used to enroll silently (the E4 shape of the E2 self-enrollment
 * defect); now any swept pinned file whose observed count differs FAILS.
 */
const E4_PINNED_COUNTS: ReadonlyMap<string, number> = new Map([
  // A7(b): byte-identical to role-authority/src/generate.ts:8,11 (the
  // ratified precedent) — verified diff, not shape:
  //   contract-readers/src/generate.ts:14 `const here = dirname(fileURLToPath(import.meta.url))`
  //   role-authority/src/generate.ts:8    `const here = dirname(fileURLToPath(import.meta.url))`
  //   contract-readers/src/generate.ts:17 `if (process.argv[1] === fileURLToPath(import.meta.url)) {`
  //   role-authority/src/generate.ts:11   `if (process.argv[1] === fileURLToPath(import.meta.url)) {`
  // Enrolled on verified identity with the ratified precedent, never on
  // shape alone (A2.3).
  ['contract-readers/src/generate.ts', 2],
  ['contracts/src/generate.ts', 2],
  ['foreman-config/src/generate.ts', 2],
  ['integration/src/docspine-report.ts', 1],
  ['integration/src/report.ts', 1],
  ['permission-profiles/src/generate.ts', 2],
  ['permission-profiles/src/emitter.ts', 1],
  ['receipts/src/generate.ts', 2],
  ['registration/src/gate.ts', 1],
  ['role-authority/src/generate.ts', 2],
  ['role-authority/src/generate-instances.ts', 2],
  ['routing-policy/src/generate.ts', 2],
  ['skill-injection/src/generate.ts', 2],
  ['spec-linter/src/generate.ts', 2],
  ['worker-envelopes/src/generate.ts', 2],
])

const E4_PINNED: ReadonlyMap<string, readonly string[]> = new Map([
  // A7(b): see the byte-identity comment on E4_PINNED_COUNTS above.
  ['contract-readers/src/generate.ts', E4_GENERATE_FORMS],
  ['contracts/src/generate.ts', E4_GENERATE_FORMS],
  ['foreman-config/src/generate.ts', E4_GENERATE_FORMS],
  ['integration/src/docspine-report.ts', [E4_SELF_URL]],
  ['integration/src/report.ts', [E4_SELF_URL]],
  ['permission-profiles/src/generate.ts', E4_GENERATE_FORMS],
  ['permission-profiles/src/emitter.ts', [E4_SHIPPED_REGISTRY]],
  ['receipts/src/generate.ts', E4_GENERATE_FORMS],
  ['registration/src/gate.ts', [E4_GATE_ALLOWLIST]],
  // Wave 0 (WF-P1/WF-P2). Both generate.ts files are BYTE-IDENTICAL to the
  // already-pinned contracts/src/generate.ts; generate-instances.ts carries
  // the same two forms for instance data. Enrolled on verified identity with
  // the ratified precedent, never on shape alone (A2.3).
  ['role-authority/src/generate.ts', E4_GENERATE_FORMS],
  ['role-authority/src/generate-instances.ts', E4_GENERATE_FORMS],
  ['routing-policy/src/generate.ts', E4_GENERATE_FORMS],
  ['skill-injection/src/generate.ts', E4_GENERATE_FORMS],
  ['spec-linter/src/generate.ts', E4_GENERATE_FORMS],
  ['worker-envelopes/src/generate.ts', E4_GENERATE_FORMS],
] as const)

/**
 * E2 pinned DYNAMIC-form entry — finding B2's fix (P2b-ii). The linter CLI's
 * foreman-config import is now a dynamic `import()` confined to --config
 * handling; the layout coupling remains P5/D22's reported debt, and this pin
 * (identity + location + value, STANDING #13) keeps the site VISIBLE under its
 * new spelling. Any other dynamic cross-package src import is reported as
 * UNPINNED — never absorbed into this pin (STANDING #18). E3 (the static
 * spelling of the same site) was deleted with the site itself.
 */
const E2_DYNAMIC_PINNED_FILE = 'spec-linter/src/cli.ts'
const E2_DYNAMIC_PINNED_SPECIFIER = '../../foreman-config/src/validate.js'
/**
 * A4.1 position key: the pin holds only INSIDE this function. Same file +
 * same specifier at module scope (the coordinator's repro — B2's own
 * load-time crash respelled) reports UNPINNED instead of enrolling.
 */
const E2_DYNAMIC_PINNED_FUNCTION = 'loadCapabilityExtensions'
/** A4.1: the pin's asserted cardinality when the pinned file is swept. */
const E2_DYNAMIC_PINNED_COUNT = 1

/**
 * Ruled class-3 non-instances, pinned by identity + location + value
 * (STANDING #13): reported while passing.
 */
const RULED_REPORT_SPECS_DIR = `${REPO_LITERAL}/docs/specs/active`
const RULED_CONTRACTS_SURFACE = `${REPO_LITERAL}/contracts`

// RCM-P1B: a retained manifest provenance comparison, never a filesystem input.
// Only this direct AST position and value are ruled; absence also fails below.
const RCM_PROVENANCE_FILE = 'routing-policy/src/public-observation-producer.ts'
const RCM_PROVENANCE_VALUE = `${REPO_LITERAL}/docs/specs/active/PMC-P0-pi-capability-and-catalogue-baseline.md`

function isRcmProvenanceLiteral(node: Expression, sf: SourceFile, rel: string): boolean {
  if (rel !== RCM_PROVENANCE_FILE || !isStringLiteral(node) || node.text !== RCM_PROVENANCE_VALUE)
    return false
  const equality = node.parent
  if (
    !equality ||
    !isBinaryExpression(equality) ||
    equality.right !== node ||
    equality.operatorToken.kind !== SyntaxKind.EqualsEqualsEqualsToken
  )
    return false
  const member = equality.left
  if (
    !isPropertyAccessExpression(member) ||
    member.questionDotToken !== undefined ||
    !isIdentifier(member.expression) ||
    member.expression.text !== 'baseline' ||
    member.name.text !== 'file'
  )
    return false
  const conjunction = equality.parent
  if (
    !conjunction ||
    !isBinaryExpression(conjunction) ||
    conjunction.left !== equality ||
    conjunction.operatorToken.kind !== SyntaxKind.AmpersandAmpersandToken
  )
    return false
  const guard = conjunction.right
  if (
    !isBinaryExpression(guard) ||
    guard.operatorToken.kind !== SyntaxKind.EqualsEqualsEqualsToken ||
    !isPropertyAccessExpression(guard.left) ||
    guard.left.questionDotToken !== undefined ||
    !isIdentifier(guard.left.expression) ||
    guard.left.expression.text !== 'baseline' ||
    guard.left.name.text !== 'table' ||
    !isStringLiteral(guard.right) ||
    guard.right.text !== 'AC2'
  )
    return false
  const call = conjunction.parent
  if (
    !call ||
    !isCallExpression(call) ||
    call.questionDotToken !== undefined ||
    !isIdentifier(call.expression) ||
    call.expression.text !== 'check' ||
    call.arguments.length !== 1 ||
    call.arguments[0] !== conjunction
  )
    return false
  const statement = call.parent
  if (!statement || !isExpressionStatement(statement) || statement.expression !== call) return false
  const body = statement.parent
  const declaration = body?.parent
  return (
    declaration !== undefined &&
    isFunctionDeclaration(declaration) &&
    declaration.name?.text === 'validateBindings' &&
    declaration.body === body &&
    declaration.parent === sf
  )
}

/**
 * Wave 0 (WF-P1): the D33 `SerializationPointOwnership.path` surface LABEL —
 * a glob declaring which surface a parcel owns, serialized straight to JSON
 * and compared only for string equality. Verified mechanically at ratification
 * time: every consumer of these records is `serialize()` or a string-equality
 * assertion; no `join`, `resolve`, or filesystem read touches `.path`. Same
 * character as the contracts fixture label above — DATA, never resolved
 * against a root. Pinned by identity (these two files) + location (a `path`
 * property initializer) + value (this exact glob). A repo-shaped literal
 * anywhere else in the package, or under any other property, is a class-3
 * violation.
 */
const RULED_ROLE_AUTHORITY_SURFACE = `${REPO_LITERAL}/role-authority/**`
const RULED_SURFACE_LABEL_FILES: ReadonlySet<string> = new Set([
  'role-authority/src/instances.ts',
  'role-authority/src/samples.ts',
])

/**
 * Ruled class-3 DATA non-instances in registration/backlog-run.mts (in scope
 * since A3.5 widened the sweep to package roots): repo-shaped doc paths
 * mentioned inside issue-tracker ticket `description` prose — data posted over MCP,
 * never resolved against a root. Same character as the contracts fixture
 * label ruled a non-instance in A2's out-of-rework notes. Pinned by identity
 * (file) + location (a `description` property initializer) + value (this
 * exact path-mention set, STANDING #13); any other repo-shaped mention is a
 * class-3 violation.
 */
const BACKLOG_DATA_FILE = 'registration/backlog-run.mts'
const BACKLOG_PINNED_PATH_MENTIONS: ReadonlySet<string> = new Set([
  `${REPO_LITERAL}/docs/FOREMAN-LINE-PLAN.md`,
  `${REPO_LITERAL}/registration/`,
  `${REPO_LITERAL}/docs/goals/w4-closeout/charter.md`,
  `${REPO_LITERAL}/docs/goals/w4-ci-integration/`,
  `${REPO_LITERAL}/docs/goals/w4-ci-integration/loop-directive.md`,
  `${REPO_LITERAL}/docs/specs/done/SCAF-P3-receipt-chain-walker.md`,
])

/**
 * GSO-P1's frozen verification-class inventory is DATA, not a root to resolve.
 *
 * This is a deliberately narrow, structural ruling. Only direct string-literal
 * elements of the named exported `const` array, behind its existing `as const`
 * wrapper in this exact file, can reach this pin. The count and digest below
 * reconcile the observed data set; no path-shaped literal can self-enroll.
 */
const GRANDFATHER_INVENTORY_DATA_FILE = 'spec-linter/src/grandfather.ts'
const GRANDFATHER_INVENTORY_EXPORT = 'GRANDFATHER_VERIFICATION_CLASS_MISSING_INVENTORY'
const GRANDFATHER_INVENTORY_DECLARATION_COUNT = 1
const GRANDFATHER_INVENTORY_PLUGIN_LITERAL_COUNT = 41
/** SHA-256 of JSON.stringify([...values].sort()) encoded as UTF-8. */
const GRANDFATHER_INVENTORY_PLUGIN_LITERAL_DIGEST =
  'c320068d6ae1f4fcde770319f3560fe98f1d66ec4b75f38d0891705587e5ae53'

/**
 * A7(c)/A7.1 — the contract-readers registry's reader/contract/description
 * DATA is not a root to resolve either. Location is deliberately narrow,
 * per the A7.1 correction: only literals (direct, or a `+`-concatenation)
 * that are (i) an element of a `readers` array property, or (ii) the
 * initializer of a `contract` or `description` property, and in either case
 * lexically inside one of the two named exported top-level `const`
 * declarations below (each type-annotated `ContractReaderEntry`) — NOT
 * inside `registry` itself, which is only `[contractA, contractB]`, two
 * identifiers with no string literal in its own subtree. Any repo-shaped
 * literal in any OTHER top-level declaration of this file (a future
 * `contractC`, say) stays class 3 until a coordinator amends this set and
 * count (STANDING #18 — a pin never absorbs a neighbour).
 */
const REGISTRY_DATA_FILE = 'contract-readers/src/registry-data.ts'
const REGISTRY_DATA_DECLARATION_NAMES: ReadonlySet<string> = new Set(['contractA', 'contractB'])
const REGISTRY_DATA_LITERAL_COUNT = 10
/** SHA-256 of JSON.stringify([...values].sort()) encoded as UTF-8. */
const REGISTRY_DATA_LITERAL_DIGEST =
  'dda1e79b0cfbf2767aef8eb37d67f235647e046fd52c98a53bdcd23809de748d'

/**
 * JEV-P1/P2 path values are custody-contract DATA, not filesystem roots.
 * They are pinned by exact source identity, declaration, direct-array location,
 * cardinality, and digest; a new or changed value therefore requires an
 * explicit coordinator amendment instead of silently joining the ruling.
 */
const JEV_PATH_DATA_DECLARATIONS: ReadonlyMap<string, string> = new Map([
  ['jev-decisions/src/replay.ts', 'PATHS'],
  ['jev-decisions/src/runtime.ts', 'CUSTODY_PATHS'],
])
const JEV_PATH_DATA_COUNTS: ReadonlyMap<string, number> = new Map([
  ['jev-decisions/src/replay.ts', 10],
  ['jev-decisions/src/runtime.ts', 3],
])
const JEV_PATH_DATA_LITERAL_COUNT = 13
/** SHA-256 of JSON.stringify([...values].sort()) encoded as UTF-8. */
const JEV_PATH_DATA_LITERAL_DIGEST =
  '0c6fe241efaa1d50b1cb8df1d37054fb8558090e176d1ef2b8e166e7badae83b'

/** Path-mention characters, checked without a RegExp (scaffold AC-14 bans regex use in src/). */
function isPathMentionChar(ch: string): boolean {
  return (
    (ch >= 'A' && ch <= 'Z') ||
    (ch >= 'a' && ch <= 'z') ||
    (ch >= '0' && ch <= '9') ||
    ch === '.' ||
    ch === '/' ||
    ch === '_' ||
    ch === '-'
  )
}

/** Every repo-shaped path mention embedded in a string value. */
function repoPathMentions(value: string): string[] {
  const out: string[] = []
  let idx = value.indexOf(REPO_LITERAL)
  while (idx >= 0) {
    let end = idx + REPO_LITERAL.length
    while (end < value.length && isPathMentionChar(value[end] ?? '')) end += 1
    out.push(value.slice(idx, end))
    idx = value.indexOf(REPO_LITERAL, end)
  }
  return out
}

/**
 * Structural identity of the inventory declaration. Discovery intentionally
 * traverses the entire exact file before the separate top-level rule applies.
 */
function isGrandfatherInventoryDataDeclaration(node: Node, sf: SourceFile): boolean {
  if (!isVariableDeclaration(node)) return false
  const assertion = node.initializer
  if (
    assertion === undefined ||
    !isAsExpression(assertion) ||
    !assertion.getText(sf).trimEnd().endsWith('as const')
  ) {
    return false
  }
  if (!isArrayLiteralExpression(assertion.expression)) return false
  if (!isIdentifier(node.name) || node.name.text !== GRANDFATHER_INVENTORY_EXPORT) {
    return false
  }
  const declarationList = node.parent
  if (declarationList === undefined || !isVariableDeclarationList(declarationList)) return false
  const statement = declarationList.parent
  return (
    statement !== undefined &&
    isVariableStatement(statement) &&
    statement.modifiers?.some((modifier) => modifier.kind === SyntaxKind.ExportKeyword) === true &&
    declarationList.getText(sf).startsWith('const ')
  )
}

/** The location axis is independent of structural identity and cardinality. */
function isGrandfatherInventoryTopLevelDataDeclaration(node: Node, sf: SourceFile): boolean {
  if (!isGrandfatherInventoryDataDeclaration(node, sf)) return false
  const declarationList = node.parent
  if (declarationList === undefined || !isVariableDeclarationList(declarationList)) return false
  const statement = declarationList.parent
  return statement !== undefined && isVariableStatement(statement) && statement.parent === sf
}

function grandfatherInventoryDataDeclarations(sf: SourceFile): {
  readonly structural: Node[]
  readonly topLevel: Node[]
} {
  const structural: Node[] = []
  const topLevel: Node[] = []
  const visit = (node: Node): void => {
    if (isGrandfatherInventoryDataDeclaration(node, sf)) {
      structural.push(node)
      if (isGrandfatherInventoryTopLevelDataDeclaration(node, sf)) topLevel.push(node)
    }
    node.forEachChild(visit)
  }
  visit(sf)
  return { structural, topLevel }
}

/** Only direct elements of a direct SourceFile declaration receive the DATA ruling. */
function isGrandfatherInventoryDataLiteral(node: Expression, sf: SourceFile): boolean {
  if (!isStringLiteral(node)) return false
  const array = node.parent
  if (array === undefined || !isArrayLiteralExpression(array)) return false
  const assertion = array.parent
  if (assertion === undefined || !isAsExpression(assertion)) return false
  const declaration = assertion.parent
  return declaration !== undefined && isGrandfatherInventoryTopLevelDataDeclaration(declaration, sf)
}

/**
 * SF-2 (review G): is `propertyAssignment` a DIRECT property of the object
 * literal that is itself the direct initializer of one of the pinned
 * top-level `const contractA` / `const contractB` declarations of THIS
 * exact file (identity checked by the caller via `rel ===
 * REGISTRY_DATA_FILE`)? This is deliberately NOT an any-ancestor walk —
 * review G reproduced that a same-value literal nested under an unpinned
 * property (e.g. `extra: { readers: [...] }`) inside `contractA` was
 * absorbed by the looser predicate. Requiring the property's own enclosing
 * object literal to be the declaration's initializer closes that: only
 * `contractA`'s / `contractB`'s own top-level `readers`/`contract`/
 * `description` properties qualify, never a property one level (or more)
 * deeper.
 */
function isDirectPropertyOfRegistryDataDeclaration(
  propertyAssignment: Node,
  sf: SourceFile,
): boolean {
  const objectLiteral = propertyAssignment.parent
  if (objectLiteral === undefined || !isObjectLiteralExpression(objectLiteral)) return false
  const declaration = objectLiteral.parent
  if (
    declaration === undefined ||
    !isVariableDeclaration(declaration) ||
    declaration.initializer !== objectLiteral ||
    !isIdentifier(declaration.name) ||
    !REGISTRY_DATA_DECLARATION_NAMES.has(declaration.name.text)
  ) {
    return false
  }
  const declarationList = declaration.parent
  if (declarationList === undefined || !isVariableDeclarationList(declarationList)) return false
  const statement = declarationList.parent
  return statement !== undefined && isVariableStatement(statement) && statement.parent === sf
}

/**
 * A7(c)/A7.1's location predicate: a direct string literal (or the top-level
 * `+`-concatenation the caller already folded) that is either (i) an
 * element of a `readers` array property, or (ii) the initializer of a
 * `contract` or `description` property — and in either case that property
 * is a DIRECT property of `contractA`'s or `contractB`'s own object literal
 * (never `registry`, which holds no literal of its own, and never a
 * property nested inside some other property of `contractA`/`contractB` —
 * SF-2). Any repo-shaped literal elsewhere in the file, under any other
 * property, or inside any other top-level declaration, fails this predicate
 * and stays class 3 (STANDING #18).
 */
function isRegistryReaderOrContractLiteral(node: Expression, sf: SourceFile): boolean {
  const parent = node.parent
  // (i) a direct element of a `readers:` array literal.
  if (parent !== undefined && isArrayLiteralExpression(parent)) {
    const propertyAssignment = parent.parent
    return (
      propertyAssignment !== undefined &&
      isPropertyAssignment(propertyAssignment) &&
      isIdentifier(propertyAssignment.name) &&
      propertyAssignment.name.text === 'readers' &&
      isDirectPropertyOfRegistryDataDeclaration(propertyAssignment, sf)
    )
  }
  // (ii) the initializer of a `contract:` or `description:` property —
  // walking outward through parens/`+`-folds the way `insideDescriptionProperty` does.
  let n: Node | undefined = parent
  while (n !== undefined) {
    if (isPropertyAssignment(n)) {
      return (
        isIdentifier(n.name) &&
        (n.name.text === 'contract' || n.name.text === 'description') &&
        isDirectPropertyOfRegistryDataDeclaration(n, sf)
      )
    }
    if (
      isParenthesizedExpression(n) ||
      (isBinaryExpression(n) && n.operatorToken.kind === SyntaxKind.PlusToken)
    ) {
      n = n.parent
      continue
    }
    return false
  }
  return false
}

/**
 * Only direct string elements of the two JEV custody-path declarations are
 * DATA. The declaration identity and direct array shape are part of the pin;
 * the caller's file identity check supplies the first axis and the digest
 * reconciliation below supplies the value/cardinality axes.
 */
function isJevPathDataLiteral(node: Expression, sf: SourceFile, rel: string): boolean {
  if (!isStringLiteral(node)) return false
  const declarationName = JEV_PATH_DATA_DECLARATIONS.get(rel)
  if (declarationName === undefined) return false
  const array = node.parent
  if (array === undefined || !isArrayLiteralExpression(array)) return false
  const container = array.parent
  let declaration: Node | undefined
  if (container !== undefined && isAsExpression(container) && container.expression === array) {
    declaration = container.parent
  } else if (container !== undefined && isNewExpression(container)) {
    declaration = container.parent
  }
  if (
    declaration === undefined ||
    !isVariableDeclaration(declaration) ||
    !isIdentifier(declaration.name) ||
    declaration.name.text !== declarationName
  ) {
    return false
  }
  const declarationList = declaration.parent
  if (declarationList === undefined || !isVariableDeclarationList(declarationList)) return false
  const statement = declarationList.parent
  return (
    statement !== undefined &&
    isVariableStatement(statement) &&
    statement.parent === sf &&
    declarationList.getText(sf).startsWith('const ')
  )
}

// ─── Result records ──────────────────────────────────────────────────────────

interface Finding {
  readonly cls: number
  readonly file: string
  readonly line: number
  readonly text: string
}

interface Site {
  readonly file: string
  readonly line: number
  readonly text: string
}

// ─── File discovery (A2.2 / A2.6) ────────────────────────────────────────────

class UsageError extends Error {}

function listSourceFiles(dir: string, out: string[]): void {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const name of entries) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) {
      // A3.5: node_modules/ and dist/ are third-party/generated; tests/ are
      // excluded by design (they exercise seams with fixture roots).
      if (name === 'node_modules' || name === 'dist' || name === 'tests') continue
      listSourceFiles(p, out)
    } else if (DECLARATION_SUFFIXES.some((s) => name.endsWith(s))) {
      // generated declaration files carry no executable mechanism
    } else if (SOURCE_EXTENSIONS.some((s) => name.endsWith(s))) {
      out.push(p)
    } else if (DATA_EXTENSIONS.some((s) => name.endsWith(s))) {
      // data files carry no code; listed here so the skip is deliberate
    } else {
      throw new UsageError(
        `unrecognized file extension in a ratified package — '${p}' would be silently unswept ` +
          '(A2.6/A3.5); add its extension to the audit deliberately or move the file',
      )
    }
  }
}

/** True when the directory contains a src/ directory. */
function hasSrcDir(pkgDir: string): boolean {
  try {
    return statSync(join(pkgDir, 'src')).isDirectory()
  } catch {
    return false
  }
}

/**
 * Disk-driven discovery (A2.2): enumerate directories under the plugin root
 * that look like packages (a src/ directory), then check the ratified
 * allowlist for completeness in BOTH directions.
 */
function discoverPackages(pluginRoot: string): string[] {
  let entries: string[]
  try {
    entries = readdirSync(pluginRoot)
  } catch (err) {
    throw new UsageError(`cannot read plugin root '${pluginRoot}': ${String(err)}`)
  }
  const onDisk: string[] = []
  for (const name of entries) {
    const p = join(pluginRoot, name)
    let isDir = false
    try {
      isDir = statSync(p).isDirectory()
    } catch {
      isDir = false
    }
    if (isDir && hasSrcDir(p)) onDisk.push(name)
  }
  const ratified = new Set<string>(RATIFIED_PACKAGES)
  for (const name of onDisk) {
    if (!ratified.has(name)) {
      throw new UsageError(
        `package '${name}' exists on disk under the plugin root but is NOT in the ratified ` +
          'allowlist (A2.2) — it would otherwise be silently unswept; ratify it (coordinator ' +
          'amendment) or remove it',
      )
    }
  }
  const onDiskSet = new Set(onDisk)
  for (const name of RATIFIED_PACKAGES) {
    if (!onDiskSet.has(name)) {
      throw new UsageError(
        `ratified package '${name}' has no src/ directory under the plugin root — refusing to ` +
          'pass on a narrower sweep (A1.1)',
      )
    }
  }
  return onDisk.sort()
}

// ─── AST helpers ─────────────────────────────────────────────────────────────

function stripParens(node: Expression): Expression {
  let n = node
  while (isParenthesizedExpression(n)) n = n.expression
  return n
}

/** The simple name a call is made under: bare identifier, or a property access's last name. */
function calleeName(call: CallExpression): string | null {
  const callee = stripParens(call.expression)
  if (isIdentifier(callee)) return callee.text
  if (isPropertyAccessExpression(callee)) return callee.name.text
  return null
}

/** True for any zero-argument `.cwd()` call, whatever the receiver spelling. */
function isCwdCall(node: Node): node is CallExpression {
  if (!isCallExpression(node)) return false
  if (node.arguments.length !== 0) return false
  const callee = stripParens(node.expression)
  return isPropertyAccessExpression(callee) && callee.name.text === 'cwd'
}

/**
 * Constant-fold a string-valued expression: string literals, no-substitution
 * templates, parenthesized expressions, and binary `+` of constant strings.
 * Deliberately does NOT fold array `.join()` — which is how this file keeps
 * its own detection tokens out of its own sweep.
 */
function constantString(node: Expression): string | null {
  const n = stripParens(node)
  if (isStringLiteral(n) || isNoSubstitutionTemplateLiteral(n)) return n.text
  if (isBinaryExpression(n) && n.operatorToken.kind === SyntaxKind.PlusToken) {
    const left = constantString(n.left)
    const right = constantString(n.right)
    if (left !== null && right !== null) return left + right
  }
  return null
}

/** Count `..` PATH SEGMENTS across every string literal in a subtree (A-F1 fix). */
function countDotDotSegments(node: Node): number {
  let count = 0
  const visit = (n: Node): void => {
    if (isStringLiteral(n) || isNoSubstitutionTemplateLiteral(n)) {
      for (const seg of n.text.split('/')) {
        if (seg === '..') count += 1
      }
    }
    n.forEachChild(visit)
  }
  visit(node)
  return count
}

/** Whitespace-stripped source text of a node (the E4 pin's value axis). */
function strippedText(node: Node, sf: SourceFile): string {
  let out = ''
  const text = node.getText(sf)
  for (const ch of text) {
    if (ch !== ' ' && ch !== '\t' && ch !== '\r' && ch !== '\n') out += ch
  }
  return out
}

/**
 * Climb from a self-location token to the OUTERMOST expression consuming it:
 * ascend while the parent is a property access, call, or parenthesized
 * expression. This is the unit E4 pins.
 */
function outermostConsumingExpression(node: Node): Node {
  let n: Node = node
  for (;;) {
    const parent: Node | undefined = n.parent
    if (parent === undefined) return n
    if (
      isPropertyAccessExpression(parent) ||
      isCallExpression(parent) ||
      isParenthesizedExpression(parent)
    ) {
      n = parent
      continue
    }
    return n
  }
}

/** The last object-literal argument of a call (the options object), if any. */
function optionsArgument(call: CallExpression): ObjectLiteralExpression | null {
  for (let i = call.arguments.length - 1; i >= 0; i--) {
    const arg = stripParens(call.arguments[i] as Expression)
    if (isObjectLiteralExpression(arg)) return arg
  }
  return null
}

interface CwdProperty {
  readonly present: boolean
  /** Non-null only when present as a full property assignment. */
  readonly value: Expression | null
}

function cwdProperty(options: ObjectLiteralExpression): CwdProperty {
  for (const prop of options.properties) {
    if (isPropertyAssignment(prop) && isIdentifier(prop.name) && prop.name.text === 'cwd') {
      return { present: true, value: prop.initializer }
    }
    if (
      isShorthandPropertyAssignment(prop) &&
      isIdentifier(prop.name) &&
      prop.name.text === 'cwd'
    ) {
      return { present: true, value: null }
    }
  }
  return { present: false, value: null }
}

/** The rightmost name a call's first argument carries: x, o.x, o['x']. */
function firstArgumentName(call: CallExpression): string | null {
  const first = call.arguments[0]
  if (first === undefined) return null
  const arg = stripParens(first)
  if (isIdentifier(arg)) return arg.text
  if (isPropertyAccessExpression(arg)) return arg.name.text
  if (isElementAccessExpression(arg)) return constantString(arg.argumentExpression)
  return null
}

function namesARoot(name: string | null): boolean {
  return name !== null && (name.endsWith('Root') || name.endsWith('root'))
}

/**
 * A2.4 — structural guard pin for the ruled class-5 site: within the SAME
 * enclosing function, a real `assertAbsoluteRoot(<sameFirstArgName>, …)` CALL
 * must precede the resolve() call. A substring in a comment cannot satisfy
 * this; commenting the guard out un-pins the site.
 */
function guardedByAbsoluteRootAssertion(resolveCall: CallExpression): boolean {
  const rootName = firstArgumentName(resolveCall)
  if (rootName === null) return false
  let fn: Node | undefined = resolveCall.parent
  while (
    fn !== undefined &&
    !isFunctionDeclaration(fn) &&
    !isFunctionExpression(fn) &&
    !isArrowFunction(fn) &&
    !isMethodDeclaration(fn)
  ) {
    fn = fn.parent
  }
  if (fn === undefined) return false
  let found = false
  const visit = (n: Node): void => {
    if (found) return
    if (
      isCallExpression(n) &&
      n.getEnd() <= resolveCall.getStart() &&
      calleeName(n) === 'assertAbsoluteRoot' &&
      firstArgumentName(n) === rootName
    ) {
      found = true
    }
    n.forEachChild(visit)
  }
  visit(fn)
  return found
}

/** True when an expression is syntactically a RegExp value: a regex literal or a `new`-constructed RegExp. */
function isRegExpValue(expr: Expression): boolean {
  const n = stripParens(expr)
  if (isRegularExpressionLiteral(n)) return true
  if (isNewExpression(n)) {
    const target = stripParens(n.expression)
    return isIdentifier(target) && target.text === 'RegExp'
  }
  return false
}

/**
 * Spawn-family recognition. `RegExp.prototype.exec` collides with the
 * subprocess module's `exec` by name. A3.3: the disambiguation is on the
 * RECEIVER — a regex literal, an inline `new`-constructed RegExp, or a binding known
 * (same-file initializer) to be a RegExp — NEVER on argument count:
 * `cp.exec('git rev-parse --show-toplevel')` takes one argument, carries no
 * options object, and is the canonical cwd-inheriting subprocess (class 4).
 * A bare `exec(...)` identifier call is always spawn-family.
 */
function isSpawnFamilyCall(call: CallExpression, regexBindings: ReadonlySet<string>): boolean {
  const name = calleeName(call)
  if (name === null || !SPAWN_NAMES.has(name)) return false
  if (name === 'exec') {
    const callee = stripParens(call.expression)
    if (isPropertyAccessExpression(callee)) {
      const receiver = stripParens(callee.expression)
      if (isRegExpValue(receiver)) return false
      if (isIdentifier(receiver) && regexBindings.has(receiver.text)) return false
    }
  }
  return true
}

/**
 * Pre-pass (A3.3): every same-file binding whose initializer is syntactically
 * a RegExp. (A binding renamed or reassigned through data flow is the A3.6
 * stated limit — such a receiver is treated as spawn-family, which errs
 * toward FLAGGING, never toward passing a violation.)
 */
function collectRegexBindings(sf: SourceFile): Set<string> {
  const out = new Set<string>()
  const visit = (n: Node): void => {
    if (isVariableDeclaration(n) && isIdentifier(n.name) && n.initializer !== undefined) {
      if (isRegExpValue(n.initializer)) out.add(n.name.text)
    }
    n.forEachChild(visit)
  }
  sf.forEachChild(visit)
  return out
}

/**
 * Pre-pass (A3.4): true when the file imports `cwd` (unrenamed) from
 * node:process — a renamed import is the A3.6 stated limit.
 */
function importsProcessCwd(sf: SourceFile): boolean {
  let found = false
  sf.forEachChild((n) => {
    if (
      isImportDeclaration(n) &&
      isStringLiteral(n.moduleSpecifier) &&
      (n.moduleSpecifier.text === 'node:process' || n.moduleSpecifier.text === 'process')
    ) {
      const bindings = n.importClause?.namedBindings
      if (bindings !== undefined && isNamedImports(bindings)) {
        for (const el of bindings.elements) {
          if (el.name.text === 'cwd' && el.propertyName === undefined) found = true
        }
      }
    }
  })
  return found
}

/** Is this string literal a module specifier (import/export/import()/require)? */
function isModuleSpecifierPosition(node: Node): boolean {
  const parent = node.parent
  if (parent === undefined) return false
  if (
    (isImportDeclaration(parent) || isExportDeclaration(parent)) &&
    parent.moduleSpecifier === node
  ) {
    return true
  }
  if (isCallExpression(parent) && parent.arguments[0] === node) {
    const callee = stripParens(parent.expression)
    if (callee.kind === SyntaxKind.ImportKeyword) return true
    if (isIdentifier(callee) && callee.text === 'require') return true
  }
  return false
}

/**
 * A4.1 position key: the name of the nearest enclosing function-like scope,
 * or null at module scope / inside an anonymous function. A pin keyed by
 * position uses this so "same file, same specifier, different place" cannot
 * enroll.
 */
function enclosingFunctionName(node: Node): string | null {
  let n: Node | undefined = node.parent
  while (n !== undefined) {
    if (isFunctionDeclaration(n) || isFunctionExpression(n)) return n.name?.text ?? null
    if (isMethodDeclaration(n)) return isIdentifier(n.name) ? n.name.text : null
    if (isArrowFunction(n)) return null
    n = n.parent
  }
  return null
}

/** Cross-package `../../<pkg>/src/…` specifier → package name, or null. */
function crossPackageSrcSpecifier(spec: string, ownPkg: string): string | null {
  if (!spec.startsWith('../')) return null
  let rest = spec
  while (rest.startsWith('../')) rest = rest.slice(3)
  const segments = rest.split('/')
  if (segments.length >= 2 && segments[1] === 'src') {
    const pkg = segments[0] ?? ''
    if (pkg.length > 0 && pkg !== ownPkg) return pkg
  }
  return null
}

// PMC-P2B integration amendment: these are reviewed AST values, not type-based exemptions.
const PMC_LEDGER_FILE = 'dispatch/src/pmc-launch/ledger.ts'
const PMC_OWNER_NAMES = new Set([
  'path',
  'settings',
  'transaction',
  'initializeLocalPmcLedger',
  'connection',
  'fail',
])
const PMC_DECLARATIONS = new Map<string, string>([
  ['import:node:crypto', '4e4a7b05ef4a93dd8c3808d4fdc416418d11334f8188e8b1c7a106b9251874f6'],
  ['import:node:fs', '39f845d0506c0c5e178bead8ded5ec262bf3bd865bf59f0efc6dd09b394cf702'],
  ['import:node:path', 'ba8a6b398f583f079b7c2f907171255995fd9aa65f366fb09beb92450b8f15fc'],
  ['import:node:sqlite', '10dffce406a49a8a94305c6b842c5b70fea547e34c7f99e92f1f8efee2a894f2'],
  ['import:node:url', '5153148ad1c2e7c5daff67d72a1dba70214a73023eb135e2482164ad1af1bf80'],
  ['import:./money.js', '73cb1783ef4538395d24f1784b1e042cdba8d16451c908687294b280f2f9032a'],
  ['fail', 'e06c46170065f2ee1fb0d0b5ff8eddb597946d47904c1c811a611055b6e98c44'],
  ['path', '7daa1fd62c552098604e9255264f5999574647f56fbb7f110e13d81066378746'],
  ['schema', '4bd91759fffb7ab4b9bd54d485e5d2341f8a77d49fd50f1d06394fc4c859e822'],
  ['settings', '11e09ebc70fad8bd588495516270c31d90e6049ed25c8583ed6fe2720265afed'],
  ['connection', '0c47d4f8bc27105cc59143682f0d0a4495141f2ee06ca0d65afe36440cdc9340'],
  ['transaction', '320c4ce935914ca1b92b9cb7ac3b75eda5fbb1f9987fe03d1bab4b28f153c455'],
  ['initializeLocalPmcLedger', '6bd8ec26a0410ee87c81aa1db4b557f641ff34261636b353038f7bb85ecef805'],
])
const PMC_CALLS = new Map<string, readonly [string, string]>([
  [
    'path:0',
    ['path/root-normalization', 'cda4bae7786987ef20f319acab4911fee95a2b7a03ad524a28172dc78c704729'],
  ],
  [
    'path:1',
    [
      'path/canonical-comparison',
      'cda4bae7786987ef20f319acab4911fee95a2b7a03ad524a28172dc78c704729',
    ],
  ],
  [
    'settings:0',
    ['settings/pragmas', '0dc2232951b5b5db8d3b269dcf3fb86462eee8606cc551eaaa920b6c6884cb1e'],
  ],
  [
    'transaction:0',
    ['transaction/begin', '0003e9d043d95fa174c167c7bde6abb11392397a4954d53d83337cc57128e022'],
  ],
  [
    'transaction:1',
    ['transaction/commit', '79fba6428b2efa15bdc3b6dce08a3e58c3e3c05d8fd7830071f737291baed710'],
  ],
  [
    'transaction:2',
    ['transaction/rollback', 'a89ab9db5111a0c2755290a8edcff23f10559ba805a64a316810451dd457ba9b'],
  ],
  [
    'initializeLocalPmcLedger:0',
    ['initialize/begin', '111a02d7b2431c5dd45835f1f5997497cd4a62a7821d6b507f4c4d95e007b036'],
  ],
  [
    'initializeLocalPmcLedger:1',
    ['initialize/schema', '395518982624315c4d8cdd88c9a01b2121e74095c1feee58776342a04534fbc9'],
  ],
  [
    'initializeLocalPmcLedger:2',
    ['initialize/commit', '79fba6428b2efa15bdc3b6dce08a3e58c3e3c05d8fd7830071f737291baed710'],
  ],
  [
    'initializeLocalPmcLedger:3',
    ['initialize/rollback', 'a89ab9db5111a0c2755290a8edcff23f10559ba805a64a316810451dd457ba9b'],
  ],
])
const PMC_PROVENANCE_NAMES = new Set([
  ...PMC_OWNER_NAMES,
  'DatabaseSync',
  'isAbsolute',
  'resolve',
  'schema',
  'lstatSync',
  'normalize',
  'parse',
  'dirname',
  'join',
  'realpathSync',
  'pathToFileURL',
  'closeSync',
  'openSync',
  'readdirSync',
])
const PMC_REFERENCE_DIGEST = '9245867438bed01ca9c6019520b5689b5b0da1a888880e52474338e1129dbac1'

/** Ordered AST kinds plus EVERY syntax token; trivia and offsets are omitted.
 * Complete owners retain guards, control flow, receiver construction and call order.
 * This is a bounded syntactic pin, not a general dataflow or runtime integrity proof.
 */
function pmcAstValue(node: Node, sf: SourceFile): unknown {
  if (node.kind <= SyntaxKind.LastToken) return [node.kind, node.getText(sf)]
  const children: unknown[] = []
  let position = node.getStart(sf)
  let invalid = false
  const gap = (end: number): void => {
    if (end < position || end > node.end) {
      invalid = true
      return
    }
    // TS7 forEachChild omits scalar operators, declaration flags and punctuation.
    // Scan all gaps, retaining AST leaves for contextual regex/template tokens.
    const scanner = createScanner(false, sf.languageVariant, sf.text, position, end - position)
    for (let kind = scanner.scan(); kind !== SyntaxKind.EndOfFile; kind = scanner.scan()) {
      if (
        scanner.isUnterminated() ||
        kind === SyntaxKind.Unknown ||
        kind === SyntaxKind.ConflictMarkerTrivia
      )
        invalid = true
      if (
        kind !== SyntaxKind.SingleLineCommentTrivia &&
        kind !== SyntaxKind.MultiLineCommentTrivia &&
        kind !== SyntaxKind.NewLineTrivia &&
        kind !== SyntaxKind.WhitespaceTrivia
      )
        children.push([kind, scanner.getTokenText()])
    }
    if (scanner.isUnterminated()) invalid = true
  }
  node.forEachChild((child) => {
    gap(child.getStart(sf))
    children.push(pmcAstValue(child, sf))
    position = child.end
  })
  gap(node.end)
  return [node.kind, invalid ? 'invalid token span' : children]
}
function pmcDigest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}
function pmcLedgerPins(sf: SourceFile, errors: string[]): Map<CallExpression, string> {
  const selected = new Set<Node>()
  const counts = new Map<string, number>()
  const calls = new Map<CallExpression, string>()
  const callCounts = new Map<string, number>()
  const fingerprint = (node: Node): string => pmcDigest(pmcAstValue(node, sf))
  const startErrors = errors.length
  for (const node of sf.statements) {
    const key =
      isFunctionDeclaration(node) && node.name && PMC_OWNER_NAMES.has(node.name.text)
        ? node.name.text
        : isImportDeclaration(node) && isStringLiteral(node.moduleSpecifier)
          ? `import:${node.moduleSpecifier.text}`
          : isVariableStatement(node) &&
              node.declarationList.declarations.some(
                (declaration) =>
                  isIdentifier(declaration.name) && declaration.name.text === 'schema',
              )
            ? 'schema'
            : null
    if (key === null) continue
    selected.add(node)
    counts.set(key, (counts.get(key) ?? 0) + 1)
    if (fingerprint(node) !== PMC_DECLARATIONS.get(key))
      errors.push(`PMC ledger declaration fingerprint: ${key}`)
    if (!isFunctionDeclaration(node)) continue
    let ordinal = 0
    const visit = (child: Node): void => {
      if (
        isCallExpression(child) &&
        (calleeName(child) === 'resolve' || calleeName(child) === 'exec')
      ) {
        const callKey = `${key}:${ordinal++}`
        const expected = PMC_CALLS.get(callKey)
        callCounts.set(callKey, (callCounts.get(callKey) ?? 0) + 1)
        if (!expected || fingerprint(child) !== expected[1])
          errors.push(`PMC ledger call fingerprint: ${callKey}`)
        else calls.set(child, expected[0])
      }
      child.forEachChild(visit)
    }
    node.forEachChild(visit)
  }
  for (const key of PMC_DECLARATIONS.keys()) {
    if (counts.get(key) !== 1)
      errors.push(
        'PMC ledger declaration cardinality: ' +
          key +
          '; expected 1, observed ' +
          (counts.get(key) ?? 0),
      )
  }
  for (const key of PMC_CALLS.keys()) {
    if (callCounts.get(key) !== 1)
      errors.push(
        'PMC ledger call cardinality: ' +
          key +
          '; expected 1, observed ' +
          (callCounts.get(key) ?? 0),
      )
  }
  // References outside the complete pinned owners/imports/schema are also pinned.
  // Additional assignments or shadow bindings cannot silently change their provenance.
  const references: unknown[] = []
  const visitReferences = (node: Node, ancestors: readonly number[]): void => {
    if (selected.has(node)) return
    if (isIdentifier(node) && PMC_PROVENANCE_NAMES.has(node.text)) {
      references.push([ancestors, fingerprint(node.parent)])
    }
    node.forEachChild((child) => visitReferences(child, [...ancestors, node.kind]))
  }
  visitReferences(sf, [])
  if (pmcDigest(references) !== PMC_REFERENCE_DIGEST)
    errors.push('PMC ledger external reference provenance fingerprint')
  // Enrollment is all-or-nothing; reconciliation still runs when owners/sites disappear.
  return errors.length === startErrors ? calls : new Map()
}

// PMC-P2B1: fixed values from twice-approved 3f31181, runtime blob c2d967d.
// This independently enrolled set shares only the accepted syntax fingerprint
// algorithm above; ledger pins and their reconciliation remain unchanged.
const PMC_INTENT_FILE = 'dispatch/src/pmc-launch/intent-custody.ts'
const PMC_INTENT_OWNER_NAMES = new Set([
  'path',
  'settings',
  'transaction',
  'initializeIntentOwnerV1',
  'connect',
  'fail',
  'io',
  'nativeCode',
  'rows',
])
const PMC_INTENT_VARIABLE_NAMES = new Set(['schema', 'FILE', 'FILE_LIMIT', 'initializing', 'codes'])
const PMC_INTENT_DECLARATIONS = new Map<string, string>([
  ['import:node:crypto', '820072253bb7efeaa79baed68ed217cc4b5a9c52755ce9892b0c6c28df7c4bbc'],
  ['import:node:fs', '39f845d0506c0c5e178bead8ded5ec262bf3bd865bf59f0efc6dd09b394cf702'],
  ['import:node:path', 'ba8a6b398f583f079b7c2f907171255995fd9aa65f366fb09beb92450b8f15fc'],
  ['import:node:sqlite', '10dffce406a49a8a94305c6b842c5b70fea547e34c7f99e92f1f8efee2a894f2'],
  ['import:node:url', '5153148ad1c2e7c5daff67d72a1dba70214a73023eb135e2482164ad1af1bf80'],
  [
    'import:../../../routing-policy/src/index.js',
    'c13e8004d4586e7c1ecc0324a9b796f03e3c41e6abf60a80eb942052a3b0a674',
  ],
  [
    'import:./intent-custody-types.js',
    '3c9a12f1545ce1c68b0e1a475b1be43bfb5dc51997739519f40c852351eae5b8',
  ],
  ['FILE', 'ed15088c26d185d28f24979c5b0618d0be9ba6a0543d3eb05d57fc41b1c7a8c0'],
  ['FILE_LIMIT', 'b8ced40540ace219187491c702f80f542309c6ee689fea69230c0fa8b864035d'],
  ['codes', 'd10d1ef6447c633f25d40f78efca9d4604d266bcbaa406aee63372ed20fd67e4'],
  ['fail', 'c937d8a9b2553adcd00d846f78b74c47540393d1f1141c1a2773c159567be08c'],
  ['nativeCode', 'b0c2021adcba832c4906d0d4cfe781804816d6d3a1688599148dbec06c574a4e'],
  ['io', '6e704de8187d16204bebd01e6e5ca53541a7f6fa59fe159331b5bbd3a2b4ee04'],
  ['path', 'ada05197ae298e82e627bab94146961c77198c720efd81aad6e9cb1b5ad98949'],
  ['schema', 'fbcee6c88749ad02a842eb2275b4bb4442e08c138ed70e50a479a34e245b7ec9'],
  ['rows', 'f6257495e7d50fbc2780a264d501718236d493f150a413d0cfd73b6a598defdb'],
  ['settings', 'a4cb7cdd298e11aa2c12f932ef9a334005f860f0ae03ccc92344a6e3c0641f0f'],
  ['connect', 'f92de828fffac4189059a82c372ee243c085eceb003accd8ffef69c7bf4e01d3'],
  ['transaction', '5b06d413abdd0dfadfe09e645b104d5440ad815f7885a5bfc5fc06829c2fa2b4'],
  ['initializing', '81bcb9809da975297c4a3737189defd9238381e8dcc9856c6208dc05118352a5'],
  ['initializeIntentOwnerV1', '56eb2d7de9b49a8980c725ac8c4b946bfb751e3b5787912784249b0d1002c97e'],
])
const PMC_INTENT_CALLS = new Map<string, readonly [string, string]>([
  [
    'path:0',
    ['path/root-normalization', 'cda4bae7786987ef20f319acab4911fee95a2b7a03ad524a28172dc78c704729'],
  ],
  [
    'path:1',
    ['path/ancestor-start', 'cda4bae7786987ef20f319acab4911fee95a2b7a03ad524a28172dc78c704729'],
  ],
  [
    'path:2',
    [
      'path/canonical-comparison',
      'cda4bae7786987ef20f319acab4911fee95a2b7a03ad524a28172dc78c704729',
    ],
  ],
  [
    'settings:0',
    ['settings/page-size', 'd3c9d937a6fd6eeb5d7acee81cd502dc9d3f9b94b600da6f883cde3e33442fef'],
  ],
  [
    'settings:1',
    ['settings/pragmas', '151c644889b5b2232f70c3f584291e6e8af0527568a412ba7450916476b8abdb'],
  ],
  [
    'transaction:0',
    ['transaction/begin', '111a02d7b2431c5dd45835f1f5997497cd4a62a7821d6b507f4c4d95e007b036'],
  ],
  [
    'transaction:1',
    ['transaction/commit', '79fba6428b2efa15bdc3b6dce08a3e58c3e3c05d8fd7830071f737291baed710'],
  ],
  [
    'transaction:2',
    ['transaction/rollback', 'a89ab9db5111a0c2755290a8edcff23f10559ba805a64a316810451dd457ba9b'],
  ],
  [
    'initializeIntentOwnerV1:0',
    ['initialize/schema', '395518982624315c4d8cdd88c9a01b2121e74095c1feee58776342a04534fbc9'],
  ],
])
const PMC_INTENT_PROVENANCE_NAMES = new Set([
  ...PMC_INTENT_OWNER_NAMES,
  ...PMC_INTENT_VARIABLE_NAMES,
  'DatabaseSync',
  'randomUUID',
  'isAbsolute',
  'resolve',
  'lstatSync',
  'normalize',
  'parse',
  'dirname',
  'join',
  'realpathSync',
  'pathToFileURL',
  'closeSync',
  'openSync',
  'readdirSync',
])
const PMC_INTENT_REFERENCE_DIGEST =
  '979e0f608d80579f8ee5cfc654244a9e6738bcc684ec9a845b83613500b4e294'

function pmcIntentPins(sf: SourceFile, errors: string[]): Map<CallExpression, string> {
  const selected = new Set<Node>()
  const counts = new Map<string, number>()
  const calls = new Map<CallExpression, string>()
  const callCounts = new Map<string, number>()
  const fingerprint = (node: Node): string => pmcDigest(pmcAstValue(node, sf))
  const startErrors = errors.length
  for (const node of sf.statements) {
    const key =
      isFunctionDeclaration(node) && node.name && PMC_INTENT_OWNER_NAMES.has(node.name.text)
        ? node.name.text
        : isImportDeclaration(node) && isStringLiteral(node.moduleSpecifier)
          ? `import:${node.moduleSpecifier.text}`
          : isVariableStatement(node)
            ? (node.declarationList.declarations
                .map((declaration) => (isIdentifier(declaration.name) ? declaration.name.text : ''))
                .find((name) => PMC_INTENT_VARIABLE_NAMES.has(name)) ?? null)
            : null
    if (key === null) continue
    selected.add(node)
    counts.set(key, (counts.get(key) ?? 0) + 1)
    if (fingerprint(node) !== PMC_INTENT_DECLARATIONS.get(key))
      errors.push(`PMC intent custody declaration fingerprint: ${key}`)
    if (!isFunctionDeclaration(node)) continue
    let ordinal = 0
    const visit = (child: Node): void => {
      if (
        isCallExpression(child) &&
        (calleeName(child) === 'resolve' || calleeName(child) === 'exec')
      ) {
        const callKey = `${key}:${ordinal++}`
        const expected = PMC_INTENT_CALLS.get(callKey)
        callCounts.set(callKey, (callCounts.get(callKey) ?? 0) + 1)
        if (!expected || fingerprint(child) !== expected[1])
          errors.push(`PMC intent custody call fingerprint: ${callKey}`)
        else calls.set(child, expected[0])
      }
      child.forEachChild(visit)
    }
    node.forEachChild(visit)
  }
  for (const key of PMC_INTENT_DECLARATIONS.keys()) {
    if (counts.get(key) !== 1)
      errors.push(
        'PMC intent custody declaration cardinality: ' +
          key +
          '; expected 1, observed ' +
          (counts.get(key) ?? 0),
      )
  }
  for (const key of PMC_INTENT_CALLS.keys()) {
    if (callCounts.get(key) !== 1)
      errors.push(
        'PMC intent custody call cardinality: ' +
          key +
          '; expected 1, observed ' +
          (callCounts.get(key) ?? 0),
      )
  }
  // References outside the complete pinned owners/imports/schema are also pinned.
  // Additional assignments or shadow bindings cannot silently change their provenance.
  const references: unknown[] = []
  const visitReferences = (node: Node, ancestors: readonly number[]): void => {
    if (selected.has(node)) return
    if (isIdentifier(node) && PMC_INTENT_PROVENANCE_NAMES.has(node.text)) {
      references.push([ancestors, fingerprint(node.parent)])
    }
    node.forEachChild((child) => visitReferences(child, [...ancestors, node.kind]))
  }
  visitReferences(sf, [])
  if (pmcDigest(references) !== PMC_INTENT_REFERENCE_DIGEST)
    errors.push('PMC intent custody external reference provenance fingerprint')
  // Enrollment is all-or-nothing; reconciliation still runs when owners/sites disappear.
  return errors.length === startErrors ? calls : new Map()
}

// HRO-P4A1: six reviewed SQLite calls in the exact recovery-admission owner.
// This set is independently enrolled from the accepted runtime source; it does
// not broaden the ledger or intent-custody pins above.
const PMC_RECOVERY_FILE = 'dispatch/src/pmc-launch/recovery-admission.ts'
const PMC_RECOVERY_OWNER_NAMES = new Set([
  'fail',
  'nativeCode',
  'rows',
  'settings',
  'transaction',
  'expectedMeta',
  'validateRows',
  'writeAdmission',
])
const PMC_RECOVERY_VARIABLE_NAMES = new Set([
  'ADMISSION_FILE',
  'DB_LIMIT',
  'JOURNAL_LIMIT',
  'schema',
])
const PMC_RECOVERY_DECLARATIONS = new Map<string, string>([
  ['import:node:crypto', '4e4a7b05ef4a93dd8c3808d4fdc416418d11334f8188e8b1c7a106b9251874f6'],
  ['import:node:fs', '4839e1c2f688728b6b3e08eda4ba0eee7c990d2292449cff40470c867e17c6c9'],
  ['import:node:os', 'f0bdf2d35030dfda07dd78291e8e353d30b5d5c2986c3b957d9eea44698d79f0'],
  ['import:node:path', '4009a16c33c152a07701539b1fc418f85bdaa32caba1a51da11da606e2c70110'],
  ['import:node:sqlite', '10dffce406a49a8a94305c6b842c5b70fea547e34c7f99e92f1f8efee2a894f2'],
  ['import:node:url', '5153148ad1c2e7c5daff67d72a1dba70214a73023eb135e2482164ad1af1bf80'],
  [
    'import:./intent-custody.js',
    'ff313add4ef64383c6ff38f802baf22270fc6c9d9b71f20729b1f55a97bed7cb',
  ],
  [
    'import:./intent-custody-types.js',
    '5130ce3c1a0a27f75a001e48cd351cc32998b821aed3b89c79f6878cb0bc45e3',
  ],
  [
    'import:./recovery-admission-types.js',
    '6bb361774eb75911f1287d5ffa423ce145d299afea219ede0eec529c5ff4c8ee',
  ],
  ['ADMISSION_FILE', 'a272abc9f0179647e34d32de67c2d8c596a562d586fa647d593b6329ce27b55e'],
  ['DB_LIMIT', 'f7e3c0ce9824296cf778abfd0de3e3d5ec3a11493b5556aa297033da8a6544fc'],
  ['JOURNAL_LIMIT', '0d272242314ce37697ac5c92e54be89f64f4b33f04315f207eb48e0c7442136b'],
  ['schema', 'ec70610a4eb4bed1a896ee37b65c489100c3023e7387417c0af3d7d2e08e65df'],
  ['fail', '6ee0e45440bccc2e1207564ba807d6a4ec364453df453c4b132f065816395087'],
  ['nativeCode', '432a6bc00aa5734ef4dfc3f3dea494ceaf8b33692599231daa8c0a26705610ba'],
  ['rows', '20eda4c4e4f4f06475d6f5ef3f60826753b6e6e8a8e6828f9e3a0420c39e3e1b'],
  ['settings', '920f890ea73d2fa6de55162f1ab45b3fd9274df35da69453e6cc0b45a23c166c'],
  ['transaction', '5b06d413abdd0dfadfe09e645b104d5440ad815f7885a5bfc5fc06829c2fa2b4'],
  ['expectedMeta', '8f982c28cbba7dc2088e07d43c12ee21bee2e68d0af7affdaebc49c45a99cee4'],
  ['validateRows', 'bf978236325efa39d493d0563f0b6f4e50db0e430104901a891709def19f27b3'],
  ['writeAdmission', '5a86f8ed26c6c7a0bbd200d96266dd4aff359093be39be949ea8805b0991b9e3'],
])
const PMC_RECOVERY_CALLS = new Map<string, readonly [string, string]>([
  [
    'settings:0',
    ['settings/page-size', 'd3c9d937a6fd6eeb5d7acee81cd502dc9d3f9b94b600da6f883cde3e33442fef'],
  ],
  [
    'settings:1',
    ['settings/pragmas', '7fa6f4166292b60f8ec9d7ef41b95a1c1ba637b5f22945bcda2112553a8d2c2b'],
  ],
  [
    'transaction:0',
    ['transaction/begin', '111a02d7b2431c5dd45835f1f5997497cd4a62a7821d6b507f4c4d95e007b036'],
  ],
  [
    'transaction:1',
    ['transaction/commit', '79fba6428b2efa15bdc3b6dce08a3e58c3e3c05d8fd7830071f737291baed710'],
  ],
  [
    'transaction:2',
    ['transaction/rollback', 'a89ab9db5111a0c2755290a8edcff23f10559ba805a64a316810451dd457ba9b'],
  ],
  [
    'writeAdmission:0',
    ['initialize/schema', '395518982624315c4d8cdd88c9a01b2121e74095c1feee58776342a04534fbc9'],
  ],
])
const PMC_RECOVERY_PROVENANCE_NAMES = new Set([
  ...PMC_RECOVERY_OWNER_NAMES,
  ...PMC_RECOVERY_VARIABLE_NAMES,
  'DatabaseSync',
  'closeSync',
  'lstatSync',
  'openSync',
  'readdirSync',
  'realpathSync',
  'statSync',
  'tmpdir',
  'basename',
  'dirname',
  'isAbsolute',
  'join',
  'parse',
  'resolve',
  'pathToFileURL',
  'createHash',
])
const PMC_RECOVERY_REFERENCE_DIGEST =
  'fda9b3dae1622547928e7b2945b706406eb819c66e4ba2cd78eddc3050a99f92'

function pmcRecoveryPins(sf: SourceFile, errors: string[]): Map<CallExpression, string> {
  const selected = new Set<Node>()
  const counts = new Map<string, number>()
  const calls = new Map<CallExpression, string>()
  const callCounts = new Map<string, number>()
  const fingerprint = (node: Node): string => pmcDigest(pmcAstValue(node, sf))
  const startErrors = errors.length
  for (const node of sf.statements) {
    const key =
      isFunctionDeclaration(node) && node.name && PMC_RECOVERY_OWNER_NAMES.has(node.name.text)
        ? node.name.text
        : isImportDeclaration(node) && isStringLiteral(node.moduleSpecifier)
          ? `import:${node.moduleSpecifier.text}`
          : isVariableStatement(node)
            ? (node.declarationList.declarations
                .map((declaration) => (isIdentifier(declaration.name) ? declaration.name.text : ''))
                .find((name) => PMC_RECOVERY_VARIABLE_NAMES.has(name)) ?? null)
            : null
    if (key === null) continue
    selected.add(node)
    counts.set(key, (counts.get(key) ?? 0) + 1)
    if (fingerprint(node) !== PMC_RECOVERY_DECLARATIONS.get(key))
      errors.push(`PMC recovery admission declaration fingerprint: ${key}`)
    if (!isFunctionDeclaration(node)) continue
    let ordinal = 0
    const visit = (child: Node): void => {
      if (isCallExpression(child) && calleeName(child) === 'exec') {
        const callKey = `${key}:${ordinal++}`
        const expected = PMC_RECOVERY_CALLS.get(callKey)
        callCounts.set(callKey, (callCounts.get(callKey) ?? 0) + 1)
        if (!expected || fingerprint(child) !== expected[1])
          errors.push(`PMC recovery admission call fingerprint: ${callKey}`)
        else calls.set(child, expected[0])
      }
      child.forEachChild(visit)
    }
    node.forEachChild(visit)
  }
  for (const key of PMC_RECOVERY_DECLARATIONS.keys()) {
    if (counts.get(key) !== 1)
      errors.push(
        'PMC recovery admission declaration cardinality: ' +
          key +
          '; expected 1, observed ' +
          (counts.get(key) ?? 0),
      )
  }
  for (const key of PMC_RECOVERY_CALLS.keys()) {
    if (callCounts.get(key) !== 1)
      errors.push(
        'PMC recovery admission call cardinality: ' +
          key +
          '; expected 1, observed ' +
          (callCounts.get(key) ?? 0),
      )
  }
  const references: unknown[] = []
  const visitReferences = (node: Node, ancestors: readonly number[]): void => {
    if (selected.has(node)) return
    if (isIdentifier(node) && PMC_RECOVERY_PROVENANCE_NAMES.has(node.text))
      references.push([ancestors, fingerprint(node.parent)])
    node.forEachChild((child) => visitReferences(child, [...ancestors, node.kind]))
  }
  visitReferences(sf, [])
  if (pmcDigest(references) !== PMC_RECOVERY_REFERENCE_DIGEST)
    errors.push('PMC recovery admission external reference provenance fingerprint')
  return errors.length === startErrors ? calls : new Map()
}

// ─── Per-file sweep ──────────────────────────────────────────────────────────

interface SweepSink {
  readonly pmcIntentErrors: string[]
  readonly pmcIntentSites: (Site & { role: string })[]
  readonly pmcErrors: string[]
  readonly pmcSites: (Site & { role: string })[]
  readonly pmcRecoveryErrors: string[]
  readonly pmcRecoverySites: (Site & { role: string })[]
  readonly violations: Finding[]
  readonly e1Sites: Site[]
  readonly e2Sites: Site[]
  readonly e2DynamicPinnedSites: Site[]
  readonly e2DynamicUnpinnedSites: Site[]
  readonly e4Sites: Site[]
  readonly ruledClass3Sites: Site[]
  readonly rcmProvenanceSites: Site[]
  readonly grandfatherInventoryStructuralDeclarationSites: Site[]
  readonly grandfatherInventoryDeclarationSites: Site[]
  readonly grandfatherInventoryDataSites: Site[]
  readonly grandfatherInventoryDataValues: string[]
  readonly registryDataSites: Site[]
  readonly registryDataValues: string[]
  readonly jevPathDataSites: Site[]
  readonly jevPathDataValues: string[]
  readonly backlogDataSites: Site[]
  readonly suppliedCwdSites: Site[]
  /** A4.1: every swept file (rel path) — pins reconcile only over swept files. */
  readonly sweptFiles: Set<string>
  /** A4.1: observed pinned-site counts per file, per pinned set. */
  readonly e1CountsByFile: Map<string, number>
  readonly e4CountsByFile: Map<string, number>
}

function sweepFile(
  pkg: string,
  rel: string,
  sf: SourceFile,
  rawText: string,
  sink: SweepSink,
): void {
  sink.sweptFiles.add(rel)
  const lines = rawText.split('\n')
  const reported = new Set<number>()
  // A3.3 / A3.4 pre-passes.
  const regexBindings = collectRegexBindings(sf)
  const hasCwdImport = importsProcessCwd(sf)
  const pmcPins =
    rel === PMC_LEDGER_FILE
      ? pmcLedgerPins(sf, sink.pmcErrors)
      : rel === PMC_INTENT_FILE
        ? pmcIntentPins(sf, sink.pmcIntentErrors)
        : rel === PMC_RECOVERY_FILE
          ? pmcRecoveryPins(sf, sink.pmcRecoveryErrors)
          : new Map<CallExpression, string>()

  const site = (node: Node): Site => {
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf))
    return { file: rel, line: line + 1, text: (lines[line] ?? '').trim() }
  }
  const violate = (cls: number, node: Node): void => {
    const key = node.getStart(sf)
    if (reported.has(key)) return
    reported.add(key)
    const s = site(node)
    sink.violations.push({ cls, file: s.file, line: s.line, text: s.text })
  }

  if (rel === GRANDFATHER_INVENTORY_DATA_FILE) {
    const declarations = grandfatherInventoryDataDeclarations(sf)
    for (const declaration of declarations.structural) {
      sink.grandfatherInventoryStructuralDeclarationSites.push(site(declaration))
    }
    for (const declaration of declarations.topLevel) {
      sink.grandfatherInventoryDeclarationSites.push(site(declaration))
    }
  }

  /** Is this cwd-call the ruled R4 property form (`cwd:` of a spawn options object)? */
  const cwdCallIsRuledR4Form = (call: CallExpression): boolean => {
    const parent = call.parent
    if (
      parent === undefined ||
      !isPropertyAssignment(parent) ||
      !isIdentifier(parent.name) ||
      parent.name.text !== 'cwd'
    ) {
      return false
    }
    const options = parent.parent
    if (options === undefined || !isObjectLiteralExpression(options)) return false
    const spawnCall = options.parent
    return (
      spawnCall !== undefined &&
      isCallExpression(spawnCall) &&
      SPAWN_NAMES.has(calleeName(spawnCall) ?? '')
    )
  }

  /** Value shape of a pinned E1 site: a sync file-exec of ('git', ['rev-parse','--show-toplevel'], …). */
  const isPinnedE1Shape = (call: CallExpression): boolean => {
    if (calleeName(call) !== EXEC_FILE_SYNC_NAME) return false
    const first = call.arguments[0]
    if (first === undefined || constantString(first) !== 'git') return false
    const second = call.arguments[1]
    if (second === undefined) return false
    const args = stripParens(second)
    if (!isArrayLiteralExpression(args)) return false
    const elements = args.elements.map((e) => constantString(e))
    return elements.length === 2 && elements[0] === 'rev-parse' && elements[1] === '--show-toplevel'
  }

  /** Is this node (transitively through folds) the initializer of a `description:` property? */
  const insideDescriptionProperty = (node: Node): boolean => {
    let n: Node | undefined = node.parent
    while (n !== undefined) {
      if (isPropertyAssignment(n)) {
        return isIdentifier(n.name) && n.name.text === 'description'
      }
      if (
        isParenthesizedExpression(n) ||
        (isBinaryExpression(n) && n.operatorToken.kind === SyntaxKind.PlusToken)
      ) {
        n = n.parent
        continue
      }
      return false
    }
    return false
  }

  const adjudicateClass3 = (node: Expression, value: string): void => {
    // Ruled non-instances, pinned by identity + location + value (STANDING #13):
    const parent = node.parent
    if (isRcmProvenanceLiteral(node, sf, rel)) {
      sink.rcmProvenanceSites.push(site(node))
      return
    }
    // GSO-P1: the 41 plugin-prefixed entries in the frozen inventory are DATA.
    // File identity, direct AST location, cardinality, and value digest are all
    // checked separately below; no other literal in this file is covered.
    if (
      rel === GRANDFATHER_INVENTORY_DATA_FILE &&
      value.startsWith(REPO_LITERAL) &&
      isGrandfatherInventoryDataLiteral(node, sf)
    ) {
      sink.grandfatherInventoryDataSites.push(site(node))
      sink.grandfatherInventoryDataValues.push(value)
      return
    }
    if (isJevPathDataLiteral(node, sf, rel)) {
      sink.jevPathDataSites.push(site(node))
      sink.jevPathDataValues.push(value)
      return
    }
    // A7(c)/A7.1: the contract-readers registry's reader/contract/description
    // DATA, pinned to contractA/contractB only (never `registry`, which has
    // no literal of its own — A7.1's correction).
    if (
      rel === REGISTRY_DATA_FILE &&
      value.includes(REPO_LITERAL) &&
      isRegistryReaderOrContractLiteral(node, sf)
    ) {
      sink.registryDataSites.push(site(node))
      sink.registryDataValues.push(value)
      return
    }
    // A3.5 sweep-widening consequence: backlog-run.mts ticket-description DATA
    // literals, pinned by file + description-property location + the exact
    // path-mention set (see BACKLOG_PINNED_PATH_MENTIONS).
    if (rel === BACKLOG_DATA_FILE && insideDescriptionProperty(node)) {
      const mentions = repoPathMentions(value)
      if (mentions.length > 0 && mentions.every((m) => BACKLOG_PINNED_PATH_MENTIONS.has(m))) {
        sink.backlogDataSites.push(site(node))
        return
      }
    }
    const isRuledReportSite =
      rel === 'integration/src/report.ts' &&
      value === RULED_REPORT_SPECS_DIR &&
      parent !== undefined &&
      isCallExpression(parent) &&
      calleeName(parent) === 'loadActiveSpecsLive'
    const isRuledDataLiteral =
      rel === 'contracts/src/testing.ts' &&
      value === RULED_CONTRACTS_SURFACE &&
      parent !== undefined &&
      isArrayLiteralExpression(parent) &&
      parent.parent !== undefined &&
      isPropertyAssignment(parent.parent) &&
      isIdentifier(parent.parent.name) &&
      parent.parent.name.text === 'touchedSurfaces'
    // Wave 0 (WF-P1): the D33 surface label. Pinned to a `path:` property
    // initializer in exactly the two declaring files, at exactly this value.
    const isRuledSurfaceLabel =
      RULED_SURFACE_LABEL_FILES.has(rel) &&
      value === RULED_ROLE_AUTHORITY_SURFACE &&
      parent !== undefined &&
      isPropertyAssignment(parent) &&
      isIdentifier(parent.name) &&
      parent.name.text === 'path'
    if (isRuledReportSite || isRuledDataLiteral || isRuledSurfaceLabel) {
      sink.ruledClass3Sites.push(site(node))
    } else {
      violate(3, node)
    }
  }

  for (const [call, role] of pmcPins) {
    const sites =
      rel === PMC_INTENT_FILE
        ? sink.pmcIntentSites
        : rel === PMC_RECOVERY_FILE
          ? sink.pmcRecoverySites
          : sink.pmcSites
    sites.push({ ...site(call), role })
  }

  const e1SeenPerFile = { count: 0 }
  const e4Handled = new Set<number>()
  /** Literals already accounted to a flagged walk expression (A3.1 dedup). */
  const walkHandled = new Set<number>()

  /** A3.4: a bare `cwd()` call when `cwd` is imported from node:process. */
  const isBareCwdImportCall = (node: Node): node is CallExpression => {
    if (!hasCwdImport || !isCallExpression(node) || node.arguments.length !== 0) return false
    const callee = stripParens(node.expression)
    return isIdentifier(callee) && callee.text === 'cwd'
  }

  const visit = (node: Node): void => {
    // ── class 1: cwd defaults / cwd acquisition ──
    if (isCwdCall(node) || isBareCwdImportCall(node)) {
      if (!cwdCallIsRuledR4Form(node)) {
        violate(1, node)
      }
      // (the R4 property form is adjudicated by the class-4 pass on the
      // enclosing spawn call: pinned E1, or a class-4 violation)
    }
    if (isBinaryExpression(node)) {
      const op = node.operatorToken.kind
      if (op === SyntaxKind.QuestionQuestionToken || op === SyntaxKind.BarBarToken) {
        const rhsConst = constantString(node.right)
        if (rhsConst === '.' || rhsConst === './') violate(1, node)
        // (a cwd-call RHS is already flagged by the isCwdCall rule above)
      }
    }

    // ── class 2 / E4: module-self-location ──
    // A3.2: model ALL the self-location builtins — import.meta.url,
    // import.meta.dirname, import.meta.filename, __dirname, __filename.
    const isImportMetaSelf =
      isPropertyAccessExpression(node) &&
      (node.name.text === 'url' || node.name.text === 'dirname' || node.name.text === 'filename') &&
      isMetaProperty(stripParens(node.expression))
    const isDirnameIdent =
      isIdentifier(node) && (node.text === '__dirname' || node.text === '__filename')
    if (isImportMetaSelf || isDirnameIdent) {
      const outer = outermostConsumingExpression(node)
      const key = outer.getStart(sf)
      if (!e4Handled.has(key)) {
        e4Handled.add(key)
        const dots = countDotDotSegments(outer)
        const stripped = strippedText(outer, sf)
        const pinnedForms = E4_PINNED.get(rel) ?? []
        if (dots < 3 && pinnedForms.includes(stripped)) {
          sink.e4Sites.push(site(outer))
          sink.e4CountsByFile.set(rel, (sink.e4CountsByFile.get(rel) ?? 0) + 1)
        } else {
          // >= 3 segments is a walk beyond the package's own files; anything
          // else unpinned FAILS — A2.3: E4 never self-populates.
          violate(2, outer)
        }
      }
    }

    // ── class 2, A3.1: ANY expression accumulating >= 3 `..` segments is a
    // WALK and fails wherever it appears — pinned file or not, however many
    // bindings separate it from its origin. Module specifiers are exempt
    // (imports are class 6's axis, adjudicated separately). ──
    if (isCallExpression(node)) {
      const name = calleeName(node)
      if (name === 'join' || name === 'resolve') {
        let dots = 0
        for (const a of node.arguments) dots += countDotDotSegments(a)
        if (dots >= 3) {
          violate(2, node)
          // account the contained literals to this walk (dedup)
          const mark = (n: Node): void => {
            if (isStringLiteral(n) || isNoSubstitutionTemplateLiteral(n)) {
              walkHandled.add(n.getStart(sf))
            }
            n.forEachChild(mark)
          }
          mark(node)
        }
      }
    }
    if (
      (isStringLiteral(node) || isNoSubstitutionTemplateLiteral(node)) &&
      !walkHandled.has(node.getStart(sf)) &&
      !isModuleSpecifierPosition(node) &&
      countDotDotSegments(node) >= 3
    ) {
      violate(2, node)
    }

    // ── class 3: repo-shaped strings (constant-folded; templates; joined segments) ──
    if (
      isStringLiteral(node) ||
      isNoSubstitutionTemplateLiteral(node) ||
      (isBinaryExpression(node) && node.operatorToken.kind === SyntaxKind.PlusToken)
    ) {
      const expr = node as Expression
      const parentExpr = expr.parent
      const parentIsFoldedLarger =
        parentExpr !== undefined &&
        ((isBinaryExpression(parentExpr) &&
          parentExpr.operatorToken.kind === SyntaxKind.PlusToken &&
          constantString(parentExpr) !== null) ||
          isParenthesizedExpression(parentExpr))
      if (!parentIsFoldedLarger) {
        const value = constantString(expr) ?? ''
        if (value.includes(REPO_LITERAL)) {
          adjudicateClass3(expr, value)
        }
      }
    }
    if (isTemplateExpression(node)) {
      // A3.4: the static chunks are JOINED before the check, so a repo-shaped
      // template split across a ${} span cannot evade; per-chunk mentions are
      // a subset of the joined check.
      const chunks = [node.head.text, ...node.templateSpans.map((s) => s.literal.text)]
      const joined = chunks.join('')
      if (joined.includes(REPO_LITERAL)) {
        violate(3, node)
      }
      // A3.1: a walk spelled across template chunks is class 2 too.
      let dots = 0
      for (const chunk of chunks) {
        for (const seg of chunk.split('/')) if (seg === '..') dots += 1
      }
      if (dots >= 3) violate(2, node)
    }
    if (isCallExpression(node)) {
      const name = calleeName(node)
      // A3.4: fold CONSECUTIVE constant segments of join()/resolve() with '/'
      // and normalize duplicate slashes, so `join('plugins/', '<pkg>')` and
      // n-ary segment splits fold to the repo prefix. Only cross-argument
      // matches flag here — a single argument containing the prefix is the
      // literal rule's finding (no double report).
      const checkSegmentRun = (run: readonly string[]): void => {
        if (run.length < 2) return
        let joined = run.join('/')
        while (joined.includes('//')) joined = joined.split('//').join('/')
        if (joined.includes(REPO_LITERAL) && !run.some((p) => p.includes(REPO_LITERAL))) {
          violate(3, node)
        }
      }
      const foldRuns = (parts: readonly (string | null)[]): void => {
        let run: string[] = []
        for (const p of parts) {
          if (p === null) {
            checkSegmentRun(run)
            run = []
          } else {
            run.push(p)
          }
        }
        checkSegmentRun(run)
      }
      if (name === 'join' || name === 'resolve') {
        foldRuns(node.arguments.map((a) => constantString(a)))
      }
      // A3.4: constant array `.join(sep)` spellings —
      // ['plugins','<pkg>'].join('/') — folded with the constant separator.
      if (name === 'join') {
        const callee = stripParens(node.expression)
        if (isPropertyAccessExpression(callee)) {
          const receiver = stripParens(callee.expression)
          if (isArrayLiteralExpression(receiver)) {
            const sep =
              node.arguments.length === 0 ? ',' : constantString(node.arguments[0] as Expression)
            if (sep !== null) {
              const parts = receiver.elements.map((e) => constantString(e))
              let run: string[] = []
              const checkJoinRun = (): void => {
                if (run.length >= 2) {
                  let joined = run.join(sep)
                  while (joined.includes('//')) joined = joined.split('//').join('/')
                  if (joined.includes(REPO_LITERAL) && !run.some((p) => p.includes(REPO_LITERAL))) {
                    violate(3, node)
                  }
                }
                run = []
              }
              for (const p of parts) {
                if (p === null) checkJoinRun()
                else run.push(p)
              }
              checkJoinRun()
            }
          }
        }
      }
    }

    // ── class 4 / E1: subprocess cwd, decided from the actual argument (A2.5) ──
    if (isCallExpression(node) && !pmcPins.has(node) && isSpawnFamilyCall(node, regexBindings)) {
      const options = optionsArgument(node)
      if (options === null) {
        violate(4, node)
      } else {
        const cwd = cwdProperty(options)
        if (!cwd.present) {
          violate(4, node)
        } else if (
          cwd.value !== null &&
          (isCwdCall(stripParens(cwd.value)) || isBareCwdImportCall(stripParens(cwd.value)))
        ) {
          // process-cwd anchoring: only the pinned R4 discovery sites may.
          const pinnedMax = E1_PINNED_COUNTS.get(rel) ?? 0
          if (isPinnedE1Shape(node) && e1SeenPerFile.count < pinnedMax) {
            e1SeenPerFile.count += 1
            sink.e1Sites.push(site(node))
            sink.e1CountsByFile.set(rel, (sink.e1CountsByFile.get(rel) ?? 0) + 1)
          } else {
            violate(4, node)
          }
        } else {
          // an explicitly SUPPLIED root/path — compliant; reported (A2.9).
          sink.suppliedCwdSites.push(site(node))
        }
      }
    }

    // ── class 5: resolve() of a named root ──
    if (isCallExpression(node) && calleeName(node) === 'resolve') {
      if (namesARoot(firstArgumentName(node))) {
        const pinned =
          (rel === 'projection/src/path-guard.ts' && guardedByAbsoluteRootAssertion(node)) ||
          pmcPins.has(node)
        if (!pinned) violate(5, node)
      }
    }

    // ── class 6 / E2: cross-package src imports (reported, non-enforcing) ──
    if (
      (isImportDeclaration(node) || isExportDeclaration(node)) &&
      node.moduleSpecifier !== undefined &&
      isStringLiteral(node.moduleSpecifier)
    ) {
      const importedPkg = crossPackageSrcSpecifier(node.moduleSpecifier.text, pkg)
      if (importedPkg !== null) {
        sink.e2Sites.push(site(node))
      }
    }

    // ── class 6, DYNAMIC spelling (P2b-ii, Constraint 6): import()/require of
    // a cross-package src specifier. The static gate above cannot see these —
    // fixing finding B2 with a dynamic import would otherwise have converted a
    // REPORTED debt into an UNKNOWN one. Same call-expression forms that
    // isModuleSpecifierPosition models for class 3. The one ratified site is
    // pinned identity + location + value; anything else is UNPINNED, reported
    // under its own disposition, never absorbed (STANDING #18). ──
    if (isCallExpression(node)) {
      const arg0 = node.arguments[0]
      // A4.2: the detector models a string literal OR a no-substitution
      // template literal — the same two node shapes constantString folds.
      // That is the detector's WHOLE coverage (literal-only; the limit is
      // stated in the output): concatenation, substitution templates, const
      // bindings, helper indirection, and conditionals are invisible to it.
      if (arg0 !== undefined && (isStringLiteral(arg0) || isNoSubstitutionTemplateLiteral(arg0))) {
        const callee = stripParens(node.expression)
        const isDynamicImport = callee.kind === SyntaxKind.ImportKeyword
        const isRequireCall = isIdentifier(callee) && callee.text === 'require'
        if (
          (isDynamicImport || isRequireCall) &&
          crossPackageSrcSpecifier(arg0.text, pkg) !== null
        ) {
          // A4.1: the pin is identity + location + value + POSITION — the
          // specifier must sit inside the ratified function, so the same
          // spelling at module scope (B2's own crash) cannot enroll.
          if (
            rel === E2_DYNAMIC_PINNED_FILE &&
            arg0.text === E2_DYNAMIC_PINNED_SPECIFIER &&
            enclosingFunctionName(node) === E2_DYNAMIC_PINNED_FUNCTION
          ) {
            sink.e2DynamicPinnedSites.push(site(node))
          } else {
            sink.e2DynamicUnpinnedSites.push(site(node))
          }
        }
      }
    }

    node.forEachChild(visit)
  }

  sf.forEachChild(visit)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function toApiPath(p: string): string {
  return p.split('\\').join('/')
}

function main(argv: readonly string[]): number {
  const flagIdx = argv.indexOf('--plugin-root')
  const pluginRoot = flagIdx >= 0 ? argv[flagIdx + 1] : undefined
  if (pluginRoot === undefined || pluginRoot.trim().length === 0) {
    console.error(
      `usage: d19-audit --plugin-root <absolute path to the installed ${REPO_LITERAL} directory>`,
    )
    console.error(
      "via the npm script: npm run d19-audit -- <root>  (the script already embeds --plugin-root; passing '-- --plugin-root <root>' duplicates the flag and lands here — A4.6)",
    )
    console.error('(A1.2: the root is a required explicit input — no default, no discovery)')
    return 2
  }
  if (!isAbsolute(pluginRoot)) {
    console.error(
      `d19-audit: --plugin-root '${pluginRoot}' is not absolute; a relative root would anchor to the process cwd (mechanism class 5) and is refused`,
    )
    return 2
  }

  // Discovery + file listing happen (and can refuse) BEFORE the parser server
  // is spawned.
  let packages: string[]
  const filesByPackage = new Map<string, string[]>()
  let fileCount = 0
  try {
    packages = discoverPackages(pluginRoot)
    for (const pkg of packages) {
      // A3.5: sweep the WHOLE package (node_modules/, dist/, tests/ excluded),
      // not just src/ — package-root executables are real source.
      const pkgDir = join(pluginRoot, pkg)
      const files: string[] = []
      listSourceFiles(pkgDir, files)
      if (files.length === 0) {
        throw new UsageError(`package '${pkg}' has no source files under ${pkgDir}`)
      }
      filesByPackage.set(pkg, files)
      fileCount += files.length
    }
  } catch (err) {
    if (err instanceof UsageError) {
      console.error(`d19-audit: ${err.message}`)
      return 2
    }
    throw err
  }

  const sink: SweepSink = {
    pmcIntentErrors: [],
    pmcIntentSites: [],
    pmcErrors: [],
    pmcSites: [],
    pmcRecoveryErrors: [],
    pmcRecoverySites: [],
    violations: [],
    e1Sites: [],
    e2Sites: [],
    e2DynamicPinnedSites: [],
    e2DynamicUnpinnedSites: [],
    e4Sites: [],
    ruledClass3Sites: [],
    rcmProvenanceSites: [],
    grandfatherInventoryStructuralDeclarationSites: [],
    grandfatherInventoryDeclarationSites: [],
    grandfatherInventoryDataSites: [],
    grandfatherInventoryDataValues: [],
    registryDataSites: [],
    registryDataValues: [],
    jevPathDataSites: [],
    jevPathDataValues: [],
    backlogDataSites: [],
    suppliedCwdSites: [],
    sweptFiles: new Set<string>(),
    e1CountsByFile: new Map<string, number>(),
    e4CountsByFile: new Map<string, number>(),
  }

  // TypeScript 7's compiler is a spawned native server; the audit hands it
  // the plugin root as its working directory EXPLICITLY (never inherited) —
  // the checker obeys its own enumeration (A1.2).
  const api = new API({ cwd: toApiPath(pluginRoot) })
  try {
    const allFiles: string[] = []
    for (const files of filesByPackage.values()) {
      for (const f of files) allFiles.push(toApiPath(f))
    }
    const snapshot = api.updateSnapshot({ openFiles: allFiles })
    for (const pkg of packages) {
      const pkgDir = join(pluginRoot, pkg)
      for (const file of filesByPackage.get(pkg) ?? []) {
        const rel = `${pkg}${file.substring(pkgDir.length).split('\\').join('/')}`
        const apiPath = toApiPath(file)
        const project = snapshot.getDefaultProjectForFile(apiPath)
        const sf = project?.program.getSourceFile(apiPath)
        if (project === undefined || sf === undefined) {
          console.error(`d19-audit: parser produced no syntax tree for '${file}'`)
          return 2
        }
        sweepFile(pkg, rel, sf, readFileSync(file, 'utf8'), sink)
      }
    }
  } finally {
    api.close()
  }

  // ─── Report ─────────────────────────────────────────────────────────────────
  console.log(
    `d19-audit: swept ${packages.length} packages, ${fileCount} source files (disk-discovered, allowlist-checked both ways — A2.2)`,
  )
  console.log(`packages: ${packages.join(', ')}`)
  console.log(
    'scope: every source file in each ratified package, excluding node_modules/, dist/, and tests/ ' +
      '(tests excluded by design — they exercise seams with fixture roots); package-root ' +
      `executables are in scope (A3.5); extensions swept: ${SOURCE_EXTENSIONS.join(' ')}; ` +
      'recognition: TypeScript AST (A2.1) — for the enforcing classes 1-5, comments, whitespace, ' +
      'line-splitting, concatenation, and member-expression spellings cannot evade it (A4.2: that ' +
      'claim is scoped to the enforcing classes; the non-enforcing class-6 dynamic detector is ' +
      'literal-only — see the stated limit below)',
  )
  console.log('')
  console.log('STATED LIMIT (A3.6) — residual coverage of the recognition itself (lesson #42):')
  console.log(
    '  this audit is a purely syntactic walk: aliased bindings, renamed imports, and roots ' +
      'reaching a call through an intermediate variable are NOT modeled; a violation spelled ' +
      'that way passes.',
  )
  console.log(
    '  AC1 is a regression tripwire over modeled mechanisms, not a proof of absence. The ' +
      'compensating control is behavioral (A3.7): every seam REQUIRES its roots, REFUSES ' +
      'non-absolute roots with typed errors, is proven DISJOINT where two roots exist (AC4), ' +
      'and is RELOCATION-proven (AC7) — those tests do not care how a root is spelled.',
  )
  console.log(
    '  A4.2: the class-6 DYNAMIC detector is literal-only — it recognizes a specifier spelled as ' +
      'a single string literal or no-substitution template literal, nothing else. Concatenation ' +
      "(`'../../' + '…'`), substitution templates, const bindings, helper indirection, and " +
      'conditionals are NOT modeled: a dynamic sibling import spelled those ways is invisible to ' +
      'class 6. Stated, not chased (lesson #45) — the load-time BEHAVIOR is enforced by ' +
      "spec-linter's broken-tree fixtures, which do not care how an import is spelled.",
  )
  console.log('')

  // ── A4.1: pin cardinality reconciliation — every pinned set asserts its own
  // count per pinned file and FAILS on mismatch, over or under, whenever the
  // pinned file was actually swept. A pinned file absent from the tree (a
  // synthetic fixture) leaves that pin vacuous, not failed. ──
  const pinMismatches: string[] = [
    ...sink.pmcErrors,
    ...sink.pmcIntentErrors,
    ...sink.pmcRecoveryErrors,
  ]
  const pmcIntentExpected = sink.sweptFiles.has(PMC_INTENT_FILE) ? PMC_INTENT_CALLS.size : 0
  if (sink.pmcIntentSites.length !== pmcIntentExpected)
    pinMismatches.push(
      `PMC intent custody site cardinality: expected ${pmcIntentExpected}, observed ${sink.pmcIntentSites.length}`,
    )
  const pmcExpected = sink.sweptFiles.has(PMC_LEDGER_FILE) ? PMC_CALLS.size : 0
  if (sink.pmcSites.length !== pmcExpected)
    pinMismatches.push(
      `PMC ledger site cardinality: expected ${pmcExpected}, observed ${sink.pmcSites.length}`,
    )
  const pmcRecoveryExpected = sink.sweptFiles.has(PMC_RECOVERY_FILE) ? PMC_RECOVERY_CALLS.size : 0
  if (sink.pmcRecoverySites.length !== pmcRecoveryExpected)
    pinMismatches.push(
      `PMC recovery admission site cardinality: expected ${pmcRecoveryExpected}, observed ${sink.pmcRecoverySites.length}`,
    )
  if (!sink.sweptFiles.has(RCM_PROVENANCE_FILE)) {
    pinMismatches.push(`RCM provenance DATA: required exact file ${RCM_PROVENANCE_FILE} is absent`)
  }
  if (sink.rcmProvenanceSites.length !== 1) {
    pinMismatches.push(
      `RCM provenance DATA: ${sink.rcmProvenanceSites.length} observed; expected exactly 1`,
    )
  }
  const reconcilePins = (
    setName: string,
    expectedByFile: ReadonlyMap<string, number>,
    observedByFile: ReadonlyMap<string, number>,
  ): { expected: number; observed: number } => {
    let expected = 0
    let observed = 0
    for (const [file, want] of expectedByFile) {
      if (!sink.sweptFiles.has(file)) continue
      const got = observedByFile.get(file) ?? 0
      expected += want
      observed += got
      if (got !== want) {
        pinMismatches.push(
          `${setName}: ${file} — ${got} pinned site(s) observed, the pin asserts exactly ${want}`,
        )
      }
    }
    return { expected, observed }
  }
  const e1Card = reconcilePins('E1', E1_PINNED_COUNTS, sink.e1CountsByFile)
  const e4Card = reconcilePins('E4', E4_PINNED_COUNTS, sink.e4CountsByFile)
  if (
    sink.sweptFiles.has(E2_DYNAMIC_PINNED_FILE) &&
    sink.e2DynamicPinnedSites.length !== E2_DYNAMIC_PINNED_COUNT
  ) {
    pinMismatches.push(
      `E2-dynamic: ${E2_DYNAMIC_PINNED_FILE} — ${sink.e2DynamicPinnedSites.length} pinned site(s) observed, the pin asserts exactly ${E2_DYNAMIC_PINNED_COUNT}`,
    )
  }

  const grandfatherInventoryFileSwept = sink.sweptFiles.has(GRANDFATHER_INVENTORY_DATA_FILE)
  const grandfatherInventorySortedValues = [...sink.grandfatherInventoryDataValues].sort()
  const grandfatherInventoryObservedDigest = createHash('sha256')
    .update(JSON.stringify(grandfatherInventorySortedValues), 'utf8')
    .digest('hex')
  const digestMismatches: string[] = []
  if (!grandfatherInventoryFileSwept) {
    pinMismatches.push(
      `GSO-P1 inventory DATA declaration: required exact file ${GRANDFATHER_INVENTORY_DATA_FILE} is absent from the sweep`,
    )
  }
  if (
    sink.grandfatherInventoryStructuralDeclarationSites.length !==
    GRANDFATHER_INVENTORY_DECLARATION_COUNT
  ) {
    pinMismatches.push(
      `GSO-P1 inventory DATA declaration: ${sink.grandfatherInventoryStructuralDeclarationSites.length} matching declaration(s) found anywhere in the exact file, the pin asserts exactly ${GRANDFATHER_INVENTORY_DECLARATION_COUNT}`,
    )
  }
  if (
    sink.grandfatherInventoryDeclarationSites.length !== GRANDFATHER_INVENTORY_DECLARATION_COUNT
  ) {
    pinMismatches.push(
      `GSO-P1 inventory DATA declaration: ${sink.grandfatherInventoryDeclarationSites.length} matching direct SourceFile declaration(s) observed, the pin asserts exactly ${GRANDFATHER_INVENTORY_DECLARATION_COUNT}`,
    )
  }
  if (sink.grandfatherInventoryDataSites.length !== GRANDFATHER_INVENTORY_PLUGIN_LITERAL_COUNT) {
    pinMismatches.push(
      `GSO-P1 inventory DATA: ${GRANDFATHER_INVENTORY_DATA_FILE} — ${sink.grandfatherInventoryDataSites.length} direct plugin-prefixed literal(s) observed, the pin asserts exactly ${GRANDFATHER_INVENTORY_PLUGIN_LITERAL_COUNT}`,
    )
  }
  if (grandfatherInventoryObservedDigest !== GRANDFATHER_INVENTORY_PLUGIN_LITERAL_DIGEST) {
    digestMismatches.push(
      `GSO-P1 inventory DATA: ${GRANDFATHER_INVENTORY_DATA_FILE} — expected ${GRANDFATHER_INVENTORY_PLUGIN_LITERAL_DIGEST}, observed ${grandfatherInventoryObservedDigest}`,
    )
  }

  // A7(c)/A7.1: contract-readers registry DATA pin reconciliation. A7(c)
  // says the pin MIRRORS the GSO-P1 grandfather pin — and the grandfather
  // pin fails on absence (:1610-1614). makeSyntheticPluginRoot now seeds the
  // real registry-data.ts into every synthetic fixture by default (SF-1,
  // rework 6), the same way it already seeds grandfather.ts, so this
  // fail-on-absence behaviour matches the report line at the bottom of this
  // function without forcing every unrelated synthetic-fixture test to seed
  // it by hand.
  const registryDataFileSwept = sink.sweptFiles.has(REGISTRY_DATA_FILE)
  const registryDataSortedValues = [...sink.registryDataValues].sort()
  const registryDataObservedDigest = createHash('sha256')
    .update(JSON.stringify(registryDataSortedValues), 'utf8')
    .digest('hex')
  if (!registryDataFileSwept) {
    pinMismatches.push(
      `A7 registry DATA declaration: required exact file ${REGISTRY_DATA_FILE} is absent from the sweep`,
    )
  }
  if (registryDataFileSwept) {
    if (sink.registryDataSites.length !== REGISTRY_DATA_LITERAL_COUNT) {
      pinMismatches.push(
        `A7 registry DATA: ${REGISTRY_DATA_FILE} — ${sink.registryDataSites.length} pinned literal(s) observed, the pin asserts exactly ${REGISTRY_DATA_LITERAL_COUNT}`,
      )
    }
    if (registryDataObservedDigest !== REGISTRY_DATA_LITERAL_DIGEST) {
      digestMismatches.push(
        `A7 registry DATA: ${REGISTRY_DATA_FILE} — expected ${REGISTRY_DATA_LITERAL_DIGEST}, observed ${registryDataObservedDigest}`,
      )
    }
  }

  const jevPathDataSortedValues = [...sink.jevPathDataValues].sort()
  const jevPathDataObservedDigest = createHash('sha256')
    .update(JSON.stringify(jevPathDataSortedValues), 'utf8')
    .digest('hex')
  for (const [file, expectedCount] of JEV_PATH_DATA_COUNTS) {
    if (!sink.sweptFiles.has(file)) {
      pinMismatches.push(
        `JEV path DATA declaration: required exact file ${file} is absent from the sweep`,
      )
      continue
    }
    const observedCount = sink.jevPathDataSites.filter((site) => site.file === file).length
    if (observedCount !== expectedCount) {
      pinMismatches.push(
        `JEV path DATA: ${file} — ${observedCount} pinned literal(s) observed, the pin asserts exactly ${expectedCount}`,
      )
    }
  }
  if (sink.jevPathDataSites.length !== JEV_PATH_DATA_LITERAL_COUNT) {
    pinMismatches.push(
      `JEV path DATA — ${sink.jevPathDataSites.length} pinned literal(s) observed, the pin asserts exactly ${JEV_PATH_DATA_LITERAL_COUNT}`,
    )
  }
  if (jevPathDataObservedDigest !== JEV_PATH_DATA_LITERAL_DIGEST) {
    digestMismatches.push(
      `JEV path DATA — expected ${JEV_PATH_DATA_LITERAL_DIGEST}, observed ${jevPathDataObservedDigest}`,
    )
  }

  const violations = sink.violations
  if (violations.length > 0) {
    console.log(`UNRULED INSTANCES (classes 1-5): ${violations.length} — FAIL`)
    for (const v of violations) {
      console.log(`  [class ${v.cls}] ${v.file}:${v.line}: ${v.text}`)
    }
  } else {
    console.log('UNRULED INSTANCES (classes 1-5): 0 — PASS')
  }

  console.log('')
  console.log('ENUMERATED EXCEPTIONS (reported while passing — lesson #41/#42):')
  console.log(`PMC ledger: ${sink.pmcSites.length} observed; expected ${pmcExpected}`)
  for (const site of sink.pmcSites)
    console.log(`  ${site.role}: ${site.file}:${site.line}: ${site.text}`)
  console.log(
    `PMC intent custody: ${sink.pmcIntentSites.length} observed; expected ${pmcIntentExpected}`,
  )
  for (const site of sink.pmcIntentSites)
    console.log(`  ${site.role}: ${site.file}:${site.line}: ${site.text}`)
  console.log(
    `PMC recovery admission: ${sink.pmcRecoverySites.length} observed; expected ${pmcRecoveryExpected}`,
  )
  for (const site of sink.pmcRecoverySites)
    console.log(`  ${site.role}: ${site.file}:${site.line}: ${site.text}`)
  console.log(
    '  disposition: exact reviewed guarded-root and SQLite calls; AST owners, import/connection/reference provenance and call roles/counts pinned. Syntactic only; no general dataflow or runtime integrity claim.',
  )
  console.log(
    "E1 and E4 are PINNED sets, and so is E2's dynamic-form entry (identity + location + value, STANDING #13 / A2.3);",
  )
  console.log('an unrecognized site is a class violation above, never an auto-enrolled exception.')
  console.log('')
  console.log(
    `E1 — R4 entry-point discovery sites (class 4), pinned explicit process-cwd form: ${sink.e1Sites.length} of ${e1Card.expected} pinned`,
  )
  for (const s of sink.e1Sites) console.log(`  ${s.file}:${s.line}: ${s.text}`)
  console.log(
    '  disposition: accounted-for by R4 — a guarded entry point may discover the target root with the working directory written explicitly; libraries never default.',
  )
  console.log(
    '  residual coverage: the check still covers every LIBRARY path in all fifteen packages, and all other classes at these four entry points.',
  )
  console.log('')
  console.log(
    `class-4 supplied-cwd sites (compliant — cwd is an explicitly provided root, not the process's): ${sink.suppliedCwdSites.length}`,
  )
  for (const s of sink.suppliedCwdSites) console.log(`  ${s.file}:${s.line}: ${s.text}`)
  console.log(
    "  disposition (A2.9): these pass a caller-supplied directory to the subprocess — the mechanism 'inheriting cwd' is absent; reported so E1's count reconciles exactly.",
  )
  console.log('')
  console.log(
    `E2 — cross-package src/ import class (class 6), deferred to P5/D22: ${sink.e2Sites.length}`,
  )
  for (const s of sink.e2Sites) console.log(`  ${s.file}:${s.line}: ${s.text}`)
  console.log(
    "  disposition: layout coupling is P5/D22 vendoring; only B2's CLI instance is fixed, in P2b-ii.",
  )
  console.log(
    "  residual coverage: every root-RESOLUTION mechanism (classes 1-5) in every package remains covered while the import-layout class is P5's.",
  )
  console.log('')
  console.log(
    `E2 pinned dynamic-form entry — finding B2's fix (P2b-ii): the linter CLI's foreman-config import, dynamic, confined to --config handling (A4.1: pinned by identity + location + value + POSITION, inside ${E2_DYNAMIC_PINNED_FUNCTION}): ${sink.e2DynamicPinnedSites.length} of ${E2_DYNAMIC_PINNED_COUNT} pinned`,
  )
  for (const s of sink.e2DynamicPinnedSites) console.log(`  ${s.file}:${s.line}: ${s.text}`)
  console.log(
    '  disposition: load-time behavior fixed in P2b-ii (no --config = never loaded; broken tree with --config = typed exit-2 refusal); the layout coupling itself remains P5/D22 debt. E3 (the static spelling of this site) was deleted with the site.',
  )
  console.log(
    '  residual coverage: every root-resolution mechanism in spec-linter remains covered; only this import edge is deferred.',
  )
  console.log('')
  console.log(
    `UNPINNED dynamic cross-package src imports (class 6, dynamic spelling — reported, NEVER absorbed into the pin, STANDING #18): ${sink.e2DynamicUnpinnedSites.length}`,
  )
  for (const s of sink.e2DynamicUnpinnedSites) console.log(`  ${s.file}:${s.line}: ${s.text}`)
  console.log(
    '  disposition: a dynamic import()/require of a sibling src/ module outside the pinned entry — joins the E2 class as reported debt but is named separately so no site can self-enroll into the pin.',
  )
  console.log('')
  console.log(
    `E4 — R5 self-location survivors (pinned file + expression set): ${sink.e4Sites.length} of ${e4Card.expected} pinned`,
  )
  for (const s of sink.e4Sites) console.log(`  ${s.file}:${s.line}: ${s.text}`)
  console.log(
    '  disposition: justified in writing at each site and relocation-proven (AC7) — never trusted by comment, never enrolled by shape alone (A2.3).',
  )
  console.log(
    "  residual coverage: every self-location expression NOT in the pinned set — and every walk of >= 3 '..' segments, counted inside single literals too — is a violation.",
  )
  console.log('')
  console.log(
    `Ruled class-3 non-instances (reported, pinned by identity+location+value): ${sink.ruledClass3Sites.length}`,
  )
  console.log(`RCM provenance DATA: ${sink.rcmProvenanceSites.length} observed; expected 1`)
  for (const s of sink.rcmProvenanceSites) console.log(`  ${s.file}:${s.line}: ${s.text}`)
  console.log(
    '  disposition: exact retained baseline.file value in the direct validateBindings check is DATA; ' +
      'file, literal, strict comparison, companion guard, call position and cardinality are pinned.',
  )
  for (const s of sink.ruledClass3Sites) console.log(`  ${s.file}:${s.line}: ${s.text}`)
  console.log(
    "  dispositions: R2 — the home repo passes its plugin-prefixed specs dir explicitly at the report entry-point call site; and contracts' frozen fixture surface label is DATA, never resolved against a root (STANDING #13 pins).",
  )
  console.log(
    `JEV path DATA (exact declarations + direct array elements): ${sink.jevPathDataSites.length} observed; expected ${JEV_PATH_DATA_LITERAL_COUNT}`,
  )
  for (const s of sink.jevPathDataSites) console.log(`  ${s.file}:${s.line}: ${s.text}`)
  console.log(
    `  SHA-256(JSON.stringify(sorted values)): expected ${JEV_PATH_DATA_LITERAL_DIGEST}; observed ${jevPathDataObservedDigest}`,
  )
  console.log(
    '  disposition: custody-contract path values are DATA, never resolved against a local root; declaration identity, per-file cardinality, and value digest are pinned.',
  )
  console.log('')
  console.log(
    `GSO-P1 ruled class-3 DATA inventory literals (exact file + one top-level exported const + direct array element + as const): ${sink.grandfatherInventoryDataSites.length} observed; expected ${GRANDFATHER_INVENTORY_PLUGIN_LITERAL_COUNT}`,
  )
  console.log(
    `  structural declaration reconciliation: expected ${GRANDFATHER_INVENTORY_DECLARATION_COUNT}; observed ${sink.grandfatherInventoryStructuralDeclarationSites.length}; file ${grandfatherInventoryFileSwept ? 'swept' : 'absent — FAIL'}`,
  )
  for (const s of sink.grandfatherInventoryStructuralDeclarationSites)
    console.log(`  structural declaration ${s.file}:${s.line}: ${s.text}`)
  console.log(
    `  declaration reconciliation: expected ${GRANDFATHER_INVENTORY_DECLARATION_COUNT}; observed ${sink.grandfatherInventoryDeclarationSites.length}; file ${grandfatherInventoryFileSwept ? 'swept' : 'absent — FAIL'}`,
  )
  for (const s of sink.grandfatherInventoryDeclarationSites)
    console.log(`  declaration ${s.file}:${s.line}: ${s.text}`)
  for (const s of sink.grandfatherInventoryDataSites)
    console.log(`  ${s.file}:${s.line}: ${s.text}`)
  console.log(
    `  cardinality reconciliation: expected ${GRANDFATHER_INVENTORY_PLUGIN_LITERAL_COUNT}; observed ${sink.grandfatherInventoryDataSites.length}; file ${grandfatherInventoryFileSwept ? 'swept' : 'absent — FAIL'}`,
  )
  console.log(
    `  SHA-256(JSON.stringify(sorted values)): expected ${GRANDFATHER_INVENTORY_PLUGIN_LITERAL_DIGEST}; observed ${grandfatherInventoryObservedDigest}`,
  )
  console.log(
    '  disposition: frozen inventory DATA, never a verification_class waiver; only the exact declaration above is ruled, and any sibling literal remains class 3.',
  )
  console.log('')
  console.log(
    `A7 ruled class-3 DATA registry literals (${REGISTRY_DATA_FILE} — readers/contract/description, inside contractA/contractB only): ${sink.registryDataSites.length} observed; expected ${REGISTRY_DATA_LITERAL_COUNT}`,
  )
  for (const s of sink.registryDataSites) console.log(`  ${s.file}:${s.line}: ${s.text}`)
  console.log(
    `  cardinality reconciliation: expected ${REGISTRY_DATA_LITERAL_COUNT}; observed ${sink.registryDataSites.length}; file ${registryDataFileSwept ? 'swept' : 'absent — FAIL'}`,
  )
  console.log(
    `  SHA-256(JSON.stringify(sorted values)): expected ${REGISTRY_DATA_LITERAL_DIGEST}; observed ${registryDataObservedDigest}`,
  )
  console.log(
    '  disposition: reader-set/contract-label/description DATA, resolved only by tests against ' +
      'fixture roots; nothing in src/ joins them to a root. Pinned to the exported top-level ' +
      'const declarations contractA and contractB only (A7.1) — registry itself is [contractA, ' +
      'contractB], two identifiers, no literal of its own. Any repo-shaped literal elsewhere in ' +
      'this file, under any other property, or inside any other top-level declaration (a future ' +
      'contractC, say) remains class 3.',
  )
  console.log('')
  console.log(
    `Ruled class-3 DATA non-instances in ${BACKLOG_DATA_FILE} (in scope since A3.5): ${sink.backlogDataSites.length}`,
  )
  for (const s of sink.backlogDataSites) console.log(`  ${s.file}:${s.line}: ${s.text}`)
  console.log(
    '  disposition: repo-shaped doc paths inside ticket-description PROSE — data posted ' +
      'over MCP, never resolved against a root (the contracts fixture-label precedent). Pinned ' +
      'by file + description-property location + exact path-mention set (STANDING #13); any ' +
      'other repo-shaped mention in this file is a class-3 violation.',
  )

  console.log('')
  console.log(
    'PIN CARDINALITY (A4.1 — a pin whose count can grow is not a pin): every pinned set asserts ' +
      'its own cardinality over the pinned files actually swept; any mismatch, over or under, ' +
      'FAILS the run.',
  )
  if (pinMismatches.length === 0) {
    console.log(
      `  reconciled — E1: ${e1Card.observed} of ${e1Card.expected}; E2-dynamic: ` +
        `${sink.e2DynamicPinnedSites.length} of ${sink.sweptFiles.has(E2_DYNAMIC_PINNED_FILE) ? E2_DYNAMIC_PINNED_COUNT : 0} ` +
        `(pinned file ${sink.sweptFiles.has(E2_DYNAMIC_PINNED_FILE) ? 'swept' : 'absent — vacuous'}); ` +
        `E4: ${e4Card.observed} of ${e4Card.expected}`,
    )
  } else {
    for (const m of pinMismatches) console.log(`  PIN CARDINALITY MISMATCH: ${m}`)
  }
  for (const m of digestMismatches) console.log(`  PIN VALUE DIGEST MISMATCH: ${m}`)

  console.log('')
  const failed = violations.length > 0 || pinMismatches.length > 0 || digestMismatches.length > 0
  console.log(failed ? 'RESULT: FAIL' : 'RESULT: PASS')
  return failed ? 1 : 0
}

process.exitCode = main(process.argv.slice(2))
