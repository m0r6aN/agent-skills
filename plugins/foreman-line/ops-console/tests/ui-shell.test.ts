import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { fileLink, shellHtml, VIEWS } from '../ui/views/shell.js'

test('operator shell has four explained primary destinations, named tools and no permanent spawn rail', () => {
  const doc = new JSDOM(shellHtml()).window.document
  assert.deepEqual(
    [...doc.querySelectorAll('[data-primary]')].map((el) => el.textContent?.trim()),
    ['Work queue', 'Goals & parcels', 'Sessions', 'Repositories'],
  )
  assert.ok(doc.querySelector('a[href="#main"]'), 'skip to content')
  assert.equal(doc.querySelector('aside.spawn'), null, 'no empty permanent rail')
  assert.ok(doc.querySelector('dialog#launch-dialog'))
  assert.match(doc.body.textContent ?? '', /Flow tools/)
  assert.match(doc.body.textContent ?? '', /Routing policy/)
  for (const [id] of VIEWS) assert.ok(doc.querySelector(`section[data-view="${id}"]`))
  for (const el of doc.querySelectorAll('button, input, select')) {
    assert.ok(
      el.getAttribute('aria-label') || el.textContent?.trim() || el.closest('label'),
      `named: ${el.outerHTML}`,
    )
  }
})

test('disk evidence links preserve absolute POSIX/Windows/UNC roots and never invent a missing root', () => {
  for (const [root, expected] of [
    ['/repos/x', 'file:///repos/x/docs/a.md'],
    ['C:\\repos\\x', 'file:///C:/repos/x/docs/a.md'],
    ['\\\\server\\repo', 'file://server/repo/docs/a.md'],
  ]) {
    const doc = new JSDOM(fileLink(root ?? '', 'docs/a.md')).window.document
    assert.equal(doc.querySelector('a')?.getAttribute('href'), expected)
  }
  const unknown = new JSDOM(fileLink('', '<img onerror="alert(1)">')).window.document
  assert.equal(unknown.querySelector('a'), null)
  assert.equal(unknown.querySelector('img'), null)
})

test('responsive styling includes mobile reflow, visible focus, hidden semantics and scrollable dialogs', () => {
  const html = readFileSync(new URL('../ui/index.html', import.meta.url), 'utf8')
  assert.match(html, /@media/)
  assert.match(html, /focus-visible/)
  assert.match(html, /\[hidden\]/)
  assert.match(html, /dialog/)
  assert.ok(!/repeat\(5,\s*1fr\)/.test(html), 'not forced into five narrow columns')
})
