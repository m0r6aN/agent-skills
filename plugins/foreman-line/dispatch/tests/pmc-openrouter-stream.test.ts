import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  PmcChatStreamV1,
  parseAccountChargeV1,
  parseJsonV1,
} from '../src/pmc-launch/openrouter-chat-stream.js'

test('bounded JSON preserves numeric source lexemes without rounding account charge', () => {
  const parsed = parseJsonV1('{"usage":{"cost":0.0000010}}', 'event')
  assert.deepEqual(parsed.value, { usage: { cost: 0.000001 } })
  assert.equal(parsed.numbers.get('/usage/cost'), '0.0000010')
})

for (const [source, expected] of [
  ['0', 0],
  ['0.000001', 1],
  ['1e-6', 1],
  ['0.01', 10000],
  ['9007199254.740991', Number.MAX_SAFE_INTEGER],
] as const) {
  test(`exact account charge ${source} yields integer microUSD ${expected}`, () => {
    assert.deepEqual(parseAccountChargeV1(source), { kind: 'known', actualMicroUsd: expected })
  })
}

for (const source of [
  '0.0000001',
  '1e-7',
  '9007199254.740992',
  '1e19',
  '-1',
  '01',
  'NaN',
  ' 0',
  '',
  '1'.repeat(65),
]) {
  test(`account charge ${source} remains unknown rather than a rounded number`, () => {
    assert.equal(parseAccountChargeV1(source).kind, 'unknown')
  })
}

for (const source of [
  '{"a":1,"a":2}',
  '{"a":1,"\\u0061":2}',
  '{"a":{"b":1,"b":2}}',
  '[1,]',
  '{"a":01}',
  '{"a":1e999}',
  '{"a":"\\ud800"}',
  '{"a":"\\udc00"}',
  '{"a":"\ud800"}',
  '{} {}',
  '{"a":true false}',
  '{"a":undefined}',
  '[',
  '{',
  '"unfinished',
  '\ufeff{}',
]) {
  test(`hostile JSON refuses: ${JSON.stringify(source)}`, () => {
    assert.throws(() => parseJsonV1(source, 'event'))
  })
}

test('depth and visited-value limits are enforced before unbounded graph construction', () => {
  assert.throws(() => parseJsonV1('['.repeat(17) + '0' + ']'.repeat(17), 'event'))
  assert.throws(() => parseJsonV1(`[${'0,'.repeat(16384)}0]`, 'event'))
  assert.throws(() => parseJsonV1(JSON.stringify('x'.repeat(128 * 1024)), 'event'))
  assert.deepEqual(
    parseJsonV1('{"text":"a\\ud83d\\ude00z","array":[true,null,false]}', 'event').value,
    { text: 'a😀z', array: [true, null, false] },
  )
})

test('prototype-shaped JSON keys remain data without prototype mutation', () => {
  const parsed = parseJsonV1('{"__proto__":{"polluted":true}}', 'event')
  assert.equal(Object.hasOwn(parsed.value as object, '__proto__'), true)
  assert.equal(Object.hasOwn(Object.prototype, 'polluted'), false)
})

const profile = {
  responseModel: 'fixture/model',
  responseProvider: 'Fixture',
  maximumInputTokens: 100,
  maximumOutputTokens: 20,
  cacheAllowed: false,
}
const chunk = (choices: unknown[], usage?: unknown) =>
  JSON.stringify({
    id: 'response-1',
    object: 'chat.completion.chunk',
    model: 'fixture/model',
    choices,
    ...(usage ? { usage } : {}),
  })
const choice = (delta: unknown, finish_reason: unknown = null) => [
  { index: 0, delta, finish_reason },
]
const usage = { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5, cost: 0.000005 }
function body(reason = 'stop', cost = '0.000005') {
  return [
    chunk(choice({ role: 'assistant' })),
    chunk(choice({ content: 'hé😀' })),
    chunk(choice({}, reason)),
    chunk([], usage).replace('0.000005', cost),
    '[DONE]',
  ]
    .map((x) => `data: ${x}\r\n\r\n`)
    .join('')
}
test('every UTF-8/CRLF split yields the same complete bounded stop observation', () => {
  const bytes = Buffer.from(body())
  for (let split = 0; split <= bytes.length; split++) {
    const parser = new PmcChatStreamV1(profile)
    parser.push(bytes.subarray(0, split))
    parser.push(bytes.subarray(split))
    const result = parser.finish()
    assert.equal(result.text, 'hé😀')
    assert.deepEqual(result.observation, {
      kind: 'response',
      semantic: 'stop',
      charge: { kind: 'known', actualMicroUsd: 5 },
    })
    assert.equal(result.costLexeme, '0.000005')
  }
})
test('length and fractional charge retain independent semantic/accounting facts', () => {
  const parser = new PmcChatStreamV1(profile)
  parser.push(Buffer.from(body('length', '0.0000001')))
  assert.deepEqual(parser.finish().observation, {
    kind: 'response',
    semantic: 'length',
    charge: { kind: 'unknown', reason: 'precision' },
  })
})
for (const [name, transform] of [
  ['missing DONE', (s: string) => s.replace('data: [DONE]\r\n\r\n', '')],
  ['duplicate DONE', (s: string) => s + 'data: [DONE]\n\n'],
  ['post-DONE data', (s: string) => s + 'data: {}\n\n'],
  ['unknown SSE field', (s: string) => 'event: message\n\n' + s],
  ['wrong model', (s: string) => s.replaceAll('fixture/model', 'other/model')],
  [
    'duplicate usage',
    (s: string) => s.replace('data: [DONE]', `data: ${chunk([], usage)}\n\ndata: [DONE]`),
  ],
  ['reasoning delta', (s: string) => s.replace('"content":"hé😀"', '"reasoning":"secret"')],
  ['tool delta', (s: string) => s.replace('"content":"hé😀"', '"tool_calls":[]')],
  ['missing finish', (s: string) => s.replace('"finish_reason":"stop"', '"finish_reason":null')],
  [
    'unknown finish',
    (s: string) => s.replace('"finish_reason":"stop"', '"finish_reason":"tool_calls"'),
  ],
  ['wrong token sum', (s: string) => s.replace('"total_tokens":5', '"total_tokens":6')],
  [
    'extra key',
    (s: string) => s.replace('"id":"response-1"', '"id":"response-1","unexpected":true'),
  ],
] as const) {
  test(`stream refuses ${name}`, () => {
    const parser = new PmcChatStreamV1(profile)
    assert.throws(() => {
      parser.push(Buffer.from(transform(body())))
      parser.finish()
    })
  })
}
test('usage overrun is failed semantic but keeps independently exact account charge', () => {
  const parser = new PmcChatStreamV1({ ...profile, maximumOutputTokens: 2 })
  parser.push(Buffer.from(body()))
  assert.deepEqual(parser.finish().observation, {
    kind: 'response',
    semantic: 'failed',
    charge: { kind: 'known', actualMicroUsd: 5 },
  })
})
test('invalid/incomplete UTF-8, BOM and unbounded line/event/text refuse', () => {
  for (const bytes of [
    Buffer.from([0xc0, 0xaf]),
    Buffer.from([0xef, 0xbb, 0xbf]),
    Buffer.from('data: ' + 'x'.repeat(131073)),
  ]) {
    const parser = new PmcChatStreamV1(profile)
    assert.throws(() => {
      parser.push(bytes)
      parser.finish()
    })
  }
})
