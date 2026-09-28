import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  evaluateCatalogEligibility,
  projectProviderBindingsV1,
} from '../../routing-policy/src/index.js'
import { planPmcPiConfigurationV1 } from '../src/pmc-launch/config-plan.js'

const policy = () =>
  JSON.parse(
    readFileSync(
      new URL(
        '../../routing-policy/tests/fixtures/pmc-provider-binding-policy-v1.json',
        import.meta.url,
      ),
      'utf8',
    ),
  )
const missing = [
  'ORIGIN_AUTHORITY',
  'ACCEPTED_RUNTIME',
  'ENDPOINT_TARIFF_BOUND',
  'LIVE_AVAILABILITY',
  'LANE_QUALITY',
  'PRIVACY_AUTHORITY',
  'BUDGET_AUTHORITY',
  'CONFIG_APPLY_AUTHORITY',
]
const emptyMap = {
  off: null,
  minimal: null,
  low: null,
  medium: null,
  high: null,
  xhigh: null,
  max: null,
}
function catalog(map?: Record<string, string | null>, reasoning = true) {
  const document = {
    formatVersion: 'rcm-catalog-snapshot/v1',
    sourceRef: 'synthetic-plan-evidence',
    providers: [{ providerKey: 'openrouter', checkedAtUtc: '2026-09-26T12:00:00.000Z' }],
    models: [
      {
        provider: 'openrouter',
        id: 'openai/gpt-6-astra',
        baseUrl: 'https://example.test/v1',
        api: 'fixture',
        input: ['text'],
        reasoning,
        contextWindow: 100,
        maxTokens: 10,
        cost: {
          input: { unit: 'USD per 1M tokens', value: 1 },
          output: { unit: 'USD per 1M tokens', value: 2 },
        },
        ...(map === undefined ? {} : { thinkingLevelMap: map }),
      },
    ],
  }
  const canonicalBytes = new TextEncoder().encode(`${JSON.stringify(document, null, 2)}\n`)
  const expectedSha256 = createHash('sha256').update(canonicalBytes).digest('hex')
  const identities = [{ provider: 'openrouter', id: 'openai/gpt-6-astra' }]
  return {
    canonicalBytes,
    expectedSha256,
    approvedConfig: {
      authorityRef: 'fixture-only',
      endpoints: [{ provider: 'openrouter', baseUrl: 'https://example.test/v1' }],
    },
    evaluationTimeUtc: '2026-09-26T13:00:00.000Z',
    identities,
    acceptedSource: {
      profileId: 'fixture',
      profileVersion: '1',
      canonicalSha256: expectedSha256,
      sourceEvidenceRef: document.sourceRef,
      sourceEvidenceSha256: 'a'.repeat(64),
      requestedIdentities: identities,
    },
  }
}
function frozen(value: unknown): void {
  if (value !== null && typeof value === 'object') {
    assert(Object.isFrozen(value))
    for (const child of Object.values(value)) frozen(child)
  }
}
test('real owners preserve evidence, order, exact identity and disabled closed output', () => {
  const p = policy(),
    c = catalog({ off: 'NONE', high: 'HIGH', max: null, unknown: 'OTHER' })
  const r = planPmcPiConfigurationV1(p, c)
  assert.deepEqual(r.policyResult, projectProviderBindingsV1(p))
  assert.deepEqual(r.catalogResult, evaluateCatalogEligibility(c))
  assert.deepEqual(
    Object.keys(r).sort(),
    [
      'version',
      'evidenceOnly',
      'applyAllowed',
      'policyResult',
      'catalogResult',
      'entries',
      'missingClaims',
      'applyPatch',
      'rollbackPatch',
    ].sort(),
  )
  assert.equal(r.version, 'pmc-config-plan/v1')
  assert.equal(r.evidenceOnly, true)
  assert.equal(r.applyAllowed, false)
  assert.deepEqual(r.missingClaims, missing)
  assert.deepEqual(r.applyPatch, [])
  assert.deepEqual(r.rollbackPatch, [])
  assert.deepEqual(
    r.entries.map((e) => e.bindingId),
    p.bindings.map((b: { bindingId: string }) => b.bindingId),
  )
  const found = r.entries.find((e) => e.bindingId === '9')
  assert(found)
  assert.equal(found.identityState, 'facts')
  assert.deepEqual(found.thinkingLevelMap, { ...emptyMap, high: 'HIGH' })
  assert.equal(r.entries.find((e) => e.bindingId === '2')?.identityState, 'absent')
  for (const e of r.entries) {
    assert.equal(e.enabled, false)
    assert.deepEqual(
      Object.keys(e).sort(),
      [
        'bindingId',
        'provider',
        'providerModelId',
        'piHostModelId',
        'identityState',
        'sourceFacts',
        'thinkingLevelMap',
        'enabled',
      ].sort(),
    )
  }
  const before = JSON.stringify(r)
  p.bindings[0].bindingId = 'changed'
  c.canonicalBytes.fill(0)
  assert.equal(JSON.stringify(r), before)
  frozen(r)
})
test('actual sparse, null, unknown and reasoning evidence never invent levels or clamp', () => {
  const declared = {
    off: 'NONE',
    minimal: 'tiny',
    low: 'l',
    medium: 'm',
    high: 'h',
    xhigh: 'x',
    max: 'largest',
  }
  const complete = planPmcPiConfigurationV1(policy(), catalog(declared)).entries.find(
    (e) => e.bindingId === '9',
  )
  assert(complete)
  assert.deepEqual(complete.thinkingLevelMap, { ...declared, off: null })
  for (const map of [undefined, {}, { minimal: null, low: 'tiny', xhigh: 'EXACT', max: null }] as (
    | Record<string, string | null>
    | undefined
  )[]) {
    const r = planPmcPiConfigurationV1(policy(), catalog(map))
    const e = r.entries.find((e) => e.bindingId === '9')
    assert(e)
    assert.equal(e.identityState, 'facts')
    assert.deepEqual(
      e.thinkingLevelMap,
      map?.low ? { ...emptyMap, low: 'tiny', xhigh: 'EXACT' } : emptyMap,
    )
  }
  for (const reasoning of [true, false]) {
    const e = planPmcPiConfigurationV1(
      policy(),
      catalog({ off: 'disabled', high: 'native-high' }, reasoning),
    ).entries.find((e) => e.bindingId === '9')
    assert(e)
    assert.equal(e.thinkingLevelMap.off, null)
  }
})
test('real per-identity refusal and all owner failure stages remain exact', () => {
  const c = catalog()
  const endpoint = c.approvedConfig.endpoints[0]
  assert(endpoint)
  endpoint.baseUrl = 'https://wrong.test/v1'
  const r = planPmcPiConfigurationV1(policy(), c)
  assert.equal(r.entries.find((e) => e.bindingId === '9')?.identityState, 'refused')
  assert.equal(r.entries.find((e) => e.bindingId === '9')?.sourceFacts, null)
  for (const input of [
    null,
    { ...catalog(), expectedSha256: '0'.repeat(64) },
    { ...catalog(), evaluationTimeUtc: '2026-09-29T13:00:00.000Z' },
  ]) {
    const out = planPmcPiConfigurationV1(policy(), input)
    assert.deepEqual(out.catalogResult, evaluateCatalogEligibility(input))
    assert.deepEqual(out.entries, [])
  }
  const out = planPmcPiConfigurationV1(null, catalog())
  assert.deepEqual(out.policyResult, projectProviderBindingsV1(null))
  assert.deepEqual(out.catalogResult, evaluateCatalogEligibility(catalog()))
  assert.deepEqual(out.entries, [])
})
test('real owner hostile and bound refusals are preserved without getters', () => {
  let calls = 0
  const p = policy()
  Object.defineProperty(p, 'bindings', {
    enumerable: true,
    get() {
      calls++
      throw 0
    },
  })
  const c = catalog()
  Object.defineProperty(c, 'canonicalBytes', {
    enumerable: true,
    get() {
      calls++
      throw 0
    },
  })
  const out = planPmcPiConfigurationV1(p, c)
  assert.equal(calls, 0)
  assert.deepEqual(out.entries, [])
  for (const count of [256, 257]) {
    const q = policy()
    while (q.bindings.length < count) {
      const i = q.bindings.length
      q.bindings.push({
        ...q.bindings[0],
        bindingId: `extra-${i}`,
        providerModelId: `extra-${i}`,
        piHostModelId: `opencode/extra-${i}`,
      })
    }
    const r = planPmcPiConfigurationV1(q, catalog())
    assert.deepEqual(r.policyResult, projectProviderBindingsV1(q))
    assert.equal(r.policyResult.ok, count === 256)
    assert.equal(r.entries.length, count === 256 ? 256 : 0)
  }
  for (const length of [2048, 2049]) {
    const q = policy()
    q.provenance.sourceRef = 'x'.repeat(length)
    const result = planPmcPiConfigurationV1(q, catalog())
    assert.deepEqual(result.policyResult, projectProviderBindingsV1(q))
    assert.equal(result.policyResult.ok, length === 2048)
  }
  const tooBig = { ...catalog(), canonicalBytes: new Uint8Array(8 * 1024 * 1024 + 1) }
  assert.deepEqual(
    planPmcPiConfigurationV1(policy(), tooBig).catalogResult,
    evaluateCatalogEligibility(tooBig),
  )
})
test('isolated defensive-unit module substitution covers ambiguous rows, duplicates and owner call counts', () => {
  const projection = new URL(
    '../../routing-policy/src/provider-binding-projection.ts',
    import.meta.url,
  ).href
  const adapter = new URL(
    '../../routing-policy/src/catalog-eligibility-adapter.ts',
    import.meta.url,
  ).href
  const planner = new URL('../src/pmc-launch/config-plan.ts', import.meta.url).href
  const script = `import assert from 'node:assert/strict';import {mock} from 'node:test';
    let pc=0,cc=0;let rows=[];let valid=true;
    const binding={bindingId:'b',provider:'openrouter',providerModelId:'exact',piHostModelId:'openrouter/exact'};
    const requested={provider:'openrouter',id:'exact'};
    const facts={provider:'openrouter',id:'exact',baseUrl:'https://fixture.test',api:'fixture',reasoning:true,contextWindow:10,maxTokens:1,inputModalities:['text'],rates:{input:{value:1,unit:'USD per 1M tokens'},output:{value:1,unit:'USD per 1M tokens'}},thinkingLevels:{status:'declared',levels:[{level:'high',providerValue:'A'},{level:'high',providerValue:'B'}]}};
    mock.module(${JSON.stringify(projection)},{exports:{projectProviderBindingsV1:()=>{pc++;return valid?{ok:true,projection:{policy:{bindings:[binding]}}}:{ok:false,errors:[]}}}});
    mock.module(${JSON.stringify(adapter)},{exports:{evaluateCatalogEligibility:()=>{cc++;return {stage:'projector',result:{ok:true,provenance:{},results:rows}}}}});
    const {planPmcPiConfigurationV1:plan}=await import(${JSON.stringify(planner)});
    rows=[{requested,outcome:'facts',facts},{requested,outcome:'refused',codes:['fixture']}];
    let r=plan(null,null);assert.equal(r.entries[0].identityState,'ambiguous');assert.equal(r.entries[0].sourceFacts,null);
    rows=[{requested,outcome:'facts',facts}];r=plan(null,null);assert.deepEqual(Object.values(r.entries[0].thinkingLevelMap),Array(7).fill(null));
    valid=false;plan(null,null);assert.equal(pc,3);assert.equal(cc,3);console.log('DEFENSIVE_OK');`
  const child = spawnSync(
    process.execPath,
    ['--experimental-test-module-mocks', '--import', 'tsx', '--input-type=module', '-'],
    { input: script, encoding: 'utf8', timeout: 20000, maxBuffer: 1024 * 1024 },
  )
  assert.equal(child.status, 0, child.stderr)
  assert.match(child.stdout, /DEFENSIVE_OK/)
})

test('real-owner pure invocation performs no ambient config, clock, network or process access', () => {
  const planner = new URL('../src/pmc-launch/config-plan.ts', import.meta.url).href
  const script = `import assert from 'node:assert/strict';import fs from 'node:fs';import https from 'node:https';import http from 'node:http';import cp from 'node:child_process';import {syncBuiltinESMExports} from 'node:module';
    const {planPmcPiConfigurationV1:plan}=await import(${JSON.stringify(planner)});
    const p=${JSON.stringify(policy())};const c=${JSON.stringify({ ...catalog(), canonicalBytes: [] })};c.canonicalBytes=new Uint8Array(${JSON.stringify(Array.from(catalog().canonicalBytes))});
    let calls=0;const deny=()=>{calls++;throw Error('forbidden')};
    fs.readFileSync=deny;fs.writeFileSync=deny;http.request=deny;https.request=deny;cp.spawn=deny;cp.execFile=deny;globalThis.fetch=deny;Date.now=deny;syncBuiltinESMExports();
    const r=plan(p,c);assert.equal(r.applyAllowed,false);assert.equal(r.entries.length,15);assert.equal(calls,0);console.log('PURITY_OK');`
  const child = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-'], {
    input: script,
    encoding: 'utf8',
    timeout: 20000,
    maxBuffer: 1024 * 1024,
  })
  assert.equal(child.status, 0, child.stderr)
  assert.match(child.stdout, /PURITY_OK/)
})
