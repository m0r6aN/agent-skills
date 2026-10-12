import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import correlationSchema from '../../contracts/schemas/correlation-context.schema.json' with {
  type: 'json',
}
import { internalReviewLaunchSchema } from '../src/schemas.ts'

// Runtime reuse without bringing the shared package's unresolved dev type graph
// into this scope. The supplying package is neither edited nor typechecked here.
const { serialize } = (await import(
  new URL('../../schema-scaffold/src/generate.ts', import.meta.url).href
)) as {
  serialize(schema: object): string
}
const root = new URL('../', import.meta.url)
test('committed JSON is byte-identical to typed source via shared serializer', () => {
  const committed = readFileSync(
    new URL('schemas/internal-review-launch-v1.schema.json', root),
    'utf8',
  )
  assert.equal(committed, serialize(internalReviewLaunchSchema))
  assert.deepEqual(JSON.parse(committed), internalReviewLaunchSchema)
})
test('instance UUID schema reuses the frozen Foreman primitive', () => {
  assert.deepEqual(
    internalReviewLaunchSchema.properties.identity.properties.instanceId,
    correlationSchema.properties.runId,
  )
})
test('every object schema is closed with all properties required; no nullable shape', () => {
  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    if (!value || typeof value !== 'object') return
    const node = value as Record<string, unknown>
    if (node.type === 'object') {
      assert.equal(node.additionalProperties, false)
      assert.deepEqual(node.required, Object.keys(node.properties as object))
    }
    assert.notEqual(node.type, 'null')
    Object.values(node).forEach(visit)
  }
  visit(internalReviewLaunchSchema)
})
test('dependency scope is existing Ajv only, with no scripts that install or launch', () => {
  const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8')) as {
    dependencies: Record<string, string>
    scripts: Record<string, string>
    private: boolean
  }
  assert.equal(pkg.private, true)
  assert.deepEqual(pkg.dependencies, { ajv: '8.20.0' })
  assert.deepEqual(Object.keys(pkg.scripts).sort(), ['lint', 'schema:print', 'test', 'typecheck'])
})
test('offline production source has no SDK/auth/provider/network/filesystem integration imports', () => {
  for (const name of ['types.ts', 'schemas.ts', 'admission.ts', 'index.ts']) {
    const source = readFileSync(new URL(`src/${name}`, root), 'utf8')
    assert.doesNotMatch(
      source,
      /from ['"](?:node:(?:fs|child_process|http|https|net)|@earendil|@mariozechner|@anthropic)/,
    )
    assert.doesNotMatch(source, /\b(?:fetch|createAgentSession|AuthStorage|ModelRegistry)\s*\(/)
  }
})
