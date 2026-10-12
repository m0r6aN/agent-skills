# Foreman Line — Pi package

Runs the Foreman Line plugin from a Pi prompt. Install it once from this
directory (a local package — Pi loads it from this path, so it tracks the
checkout):

```bash
pi install /path/to/agent-skills/plugins/foreman-line/pi-package
```

## Slash commands

One command per skill in `../skills/`, namespaced `foreman-line:<skill>`:

| Command | Skill |
|---|---|
| `/foreman-line:goal [<concept>]` | `skills/goal` — Stage Zero on a new concept |
| `/foreman-line:goal resume <goal-slug>` | `skills/goal` — resume an existing goal |
| `/foreman-line:parcel-driven-development …` | `skills/parcel-driven-development` |
| `/foreman-line:ai-council …` | `skills/ai-council` |
| `/foreman-line:foreman-shaping …` | `skills/foreman-shaping` |

Each command expands like Pi's built-in `/skill:<name>`: the `SKILL.md` body
(frontmatter stripped) wrapped in a `<skill>` block, with the typed arguments
appended as the user request. `${CLAUDE_PLUGIN_ROOT}` placeholders resolve to
the plugin root so the skill's repo paths work outside Claude Code. The `goal`
command tab-completes goal slugs from `docs/goals/` after `resume `.

`/foreman-line:probe` writes a self-test report to
`$TMPDIR/foreman-line-pi-probe.json` (resolved root, discovered skills) and
shuts down without starting an agent run.

Set `FOREMAN_LINE_ROOT` to point at a different plugin root (defaults to this
package's parent, then `~/Repos/agent-skills/plugins/foreman-line`).
