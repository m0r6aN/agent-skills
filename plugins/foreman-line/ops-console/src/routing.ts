import { readFileSync } from 'node:fs'

/**
 * Read-only models view (charter D5): routing-policy output (role × class ×
 * ceiling + the chosen model). Never an editor — the console writes nothing to
 * `routing-policy/`; policy is policy-as-code under its own review.
 *
 * This is a targeted reader for the two policy sections the view renders
 * (`classes:`, `roles:`), not a YAML implementation.
 */
export interface PolicyClass {
  readonly name: string
  readonly allowlist: readonly string[]
  readonly ceilingUsd: number | null
}

export interface PolicyRole {
  readonly role: string
  readonly tier: string
}

export interface RoutingPolicyView {
  readonly classes: readonly PolicyClass[]
  readonly roles: readonly PolicyRole[]
}

const CLASS_NAME_PATTERN = /^ {2}([^ \s][^:]*):\s*$/
const ALLOWLIST_PATTERN = /^ {4}allowlist:\s*\[([^\]]*)\]/
const CEILING_PATTERN = /^ {4}ceiling_usd:\s*([0-9.]+)/
const ROLE_PATTERN = /^ {2}([A-Za-z0-9_-]+):\s*(\S+)/

export function parseRoutingPolicy(yamlText: string): RoutingPolicyView {
  const classes: PolicyClass[] = []
  const roles: PolicyRole[] = []
  let section: 'none' | 'classes' | 'roles' = 'none'
  for (const line of yamlText.split(/\r?\n/)) {
    if (/^[A-Za-z_][A-Za-z0-9_]*:/.test(line)) {
      section = line.startsWith('classes:')
        ? 'classes'
        : line.startsWith('roles:')
          ? 'roles'
          : 'none'
      continue
    }
    if (section === 'classes') {
      const nameMatch = CLASS_NAME_PATTERN.exec(line)
      if (nameMatch !== null) {
        classes.push({ name: (nameMatch[1] ?? '').trim(), allowlist: [], ceilingUsd: null })
        continue
      }
      const current = classes[classes.length - 1]
      if (current === undefined) continue
      const allowlistMatch = ALLOWLIST_PATTERN.exec(line)
      if (allowlistMatch !== null) {
        const allowlist = (allowlistMatch[1] ?? '')
          .split(',')
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0)
        classes[classes.length - 1] = { ...current, allowlist }
        continue
      }
      const ceilingMatch = CEILING_PATTERN.exec(line)
      if (ceilingMatch !== null) {
        classes[classes.length - 1] = {
          ...current,
          ceilingUsd: Number(ceilingMatch[1] ?? ''),
        }
      }
      continue
    }
    if (section === 'roles') {
      const roleMatch = ROLE_PATTERN.exec(line)
      if (roleMatch !== null) {
        roles.push({ role: (roleMatch[1] ?? '').trim(), tier: (roleMatch[2] ?? '').trim() })
      }
    }
  }
  return { classes, roles }
}

export function loadRoutingPolicy(policyPath: string): RoutingPolicyView {
  try {
    return parseRoutingPolicy(readFileSync(policyPath, 'utf8'))
  } catch {
    return { classes: [], roles: [] }
  }
}
