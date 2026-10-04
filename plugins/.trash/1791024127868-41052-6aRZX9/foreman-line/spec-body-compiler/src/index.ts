/**
 * @foreman-line/spec-body-compiler — FK-P2 public surface.
 *
 * The compiler parses the pinned SPEC-CONVENTION spec sections and compiles
 * the exact non-glob `Allowed Files` mutation authority plus the
 * frozen/forbidden surface lists into a deterministic, digest-bound
 * compiled-scope artifact. D10: mutation authority is NEVER derived from
 * `surfaces:` or any frontmatter field.
 */
export {
  API_VERSION,
  CanonicalEncodeError,
  COMPILED_SCOPE_DOMAIN,
  canonicalBytes,
  canonicalEncode,
  compiledScopeDigestFor,
  digestBytes,
  digestDocument,
  isDigestLiteral,
} from './canonical-output.js'
export {
  assertDispatchable,
  type CompiledScopeArtifact,
  type CompileResult,
  compileScope,
  reverifyOpenedTarget,
  type VerifiedTarget,
  verifyCompiledPaths,
} from './compile-scope.js'
export {
  type EntryList,
  SCOPE_COMPILE_ERROR_CODES,
  ScopeCompileError,
  type ScopeCompileErrorCode,
  type ScopeCompileErrorDetails,
  ScopeIoError,
} from './errors.js'
export {
  assertGrammarPin,
  BODY_BYTE_CAP,
  classifyGrammarState,
  ENTRY_BYTE_CAP,
  GRAMMAR_PIN,
  type GrammarPinState,
  KNOWN_BASE_GRAMMAR,
  MAX_BYTES_PER_INPUT_BYTE,
  MAX_ENTRIES,
  MAX_SEGMENTS,
  type ParsedSpec,
  type ParseStats,
  parseSpec,
  SEGMENT_BYTE_CAP,
} from './parse-spec.js'
