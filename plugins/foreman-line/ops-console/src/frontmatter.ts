/**
 * Minimal frontmatter reader for SPEC-CONVENTION §4 spec files: flat scalar
 * `key: value` pairs between `---` fences. List values / indented continuation
 * lines are ignored (only `status:`, `updated:`, `routing_class:` feed the
 * projection). This is a reader for one consumer's needs, not a YAML library.
 */
export function parseFrontmatter(text: string): Record<string, string> {
  const lines = text.split(/\r?\n/)
  if (lines[0]?.trim() !== '---') return {}
  const data: Record<string, string> = {}
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i] ?? ''
    if (line.trim() === '---') break
    if (line.trim() === '' || line.trim().startsWith('#') || /^\s/.test(line)) continue
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
    if (match === null) continue
    const key = match[1] ?? ''
    let value = (match[2] ?? '').trim()
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
    ) {
      value = value.slice(1, -1)
    }
    data[key] = value
  }
  return data
}
