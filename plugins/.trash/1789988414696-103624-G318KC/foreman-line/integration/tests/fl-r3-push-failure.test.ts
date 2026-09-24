import assert from 'node:assert/strict'
import { test } from 'node:test'
import { IntegrationError } from '../src/errors.js'
import { buildPrAutomationPlan, planPrAutomation } from '../src/pr-plan.js'

const input = {
  branch: 'feat/fl-r3',
  base: 'main',
  title: 'FL-R3 fixture',
  prBody: 'Hermetic fixture',
  repoRoot: '/nonexistent/fl-r3-repo',
}
const hostileDiagnostic = `fixture\r\n::error::\u001b[31m${'x'.repeat(100_000)}`

for (const code of [1, 128, -1]) {
  test(`AC-1: push code ${code} throws PUSH_FAILED with zero PR-create calls`, (t) => {
    const gitPushFn = t.mock.fn(() => ({
      code,
      stdout: hostileDiagnostic,
      stderr: hostileDiagnostic,
    }))
    const ghPrCreateFn = t.mock.fn(() => ({ code: 0, stdout: 'not called', stderr: '' }))

    try {
      assert.throws(
        () => planPrAutomation(input, { gitPushFn, ghPrCreateFn }),
        (err: unknown) => {
          assert.ok(err instanceof IntegrationError)
          assert.equal(err.code, 'PUSH_FAILED')
          assert.equal(err.message, 'git push failed; PR creation was not attempted')
          assert.equal(err.cause, undefined)
          return true
        },
      )
    } finally {
      assert.equal(gitPushFn.mock.callCount(), 1)
      assert.equal(ghPrCreateFn.mock.callCount(), 0)
    }
  })
}

for (const [label, thrown] of [
  ['Error', new Error(hostileDiagnostic)],
  ['string', hostileDiagnostic],
  ['null', null],
  [
    'unstringifiable object',
    {
      toString() {
        throw new Error('must not stringify external data')
      },
    },
  ],
] as const) {
  test(`AC-2: thrown ${label} becomes PUSH_FAILED with zero PR-create calls`, (t) => {
    const gitPushFn = t.mock.fn(() => {
      throw thrown
    })
    const ghPrCreateFn = t.mock.fn(() => ({ code: 0, stdout: 'not called', stderr: '' }))

    try {
      assert.throws(
        () => planPrAutomation(input, { gitPushFn, ghPrCreateFn }),
        (err: unknown) => {
          assert.ok(err instanceof IntegrationError)
          assert.equal(err.code, 'PUSH_FAILED')
          assert.equal(err.message, 'git push threw; PR creation was not attempted')
          assert.equal(err.cause, undefined)
          return true
        },
      )
    } finally {
      assert.equal(gitPushFn.mock.callCount(), 1)
      assert.equal(ghPrCreateFn.mock.callCount(), 0)
    }
  })
}

for (const code of [0, 1]) {
  test(`AC-3: successful push then PR-create code ${code} preserves the result`, () => {
    const calls: string[] = []
    const gitPushResult = { code: 0, stdout: 'pushed', stderr: '' }
    const ghPrCreateResult = { code, stdout: 'PR output', stderr: code ? 'PR failed' : '' }

    const result = planPrAutomation(input, {
      gitPushFn: (args) => {
        calls.push('push')
        assert.deepEqual(args, { branch: input.branch, repoRoot: input.repoRoot })
        return gitPushResult
      },
      ghPrCreateFn: (args) => {
        calls.push('PR-create')
        assert.deepEqual(args, input)
        return ghPrCreateResult
      },
    })

    assert.deepEqual(calls, ['push', 'PR-create'])
    assert.deepEqual(result, {
      plan: buildPrAutomationPlan(input),
      gitPushResult,
      ghPrCreateResult,
    })
    assert.equal(result.gitPushResult, gitPushResult)
    assert.equal(result.ghPrCreateResult, ghPrCreateResult)
  })
}
