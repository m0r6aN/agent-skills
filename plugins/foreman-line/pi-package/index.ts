/**
 * Foreman Line — Pi extension
 *
 * Runs the Foreman Line plugin from a Pi prompt via namespaced slash
 * commands, one per skill in `../skills/`:
 *
 *   /foreman-line:goal resume <goal-slug>
 *   /foreman-line:goal <concept>
 *   /foreman-line:parcel-driven-development ...
 *   /foreman-line:ai-council ...
 *   /foreman-line:foreman-shaping ...
 *
 * Each command expands exactly like Pi's built-in `/skill:<name>`: the
 * SKILL.md body (frontmatter stripped) is wrapped in a `<skill>` block and
 * the typed arguments are appended as the user request. `${CLAUDE_PLUGIN_ROOT}`
 * placeholders inside skill text are resolved to the plugin root so the
 * referenced repo paths work outside Claude Code.
 *
 * `foreman-line:probe` writes a small diagnostics file and shuts down —
 * use it to self-test the install without starting an agent run.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const COMMAND_NS = "foreman-line";

// --- locate the plugin root (…/plugins/foreman-line) --------------------------

function moduleDir(): string | null {
  try {
    if (typeof __dirname !== "undefined") return __dirname;
  } catch {
    // ESM: __dirname is not defined — fall through
  }
  try {
    // @ts-expect-error import.meta is valid under Pi's jiti loader and ESM
    const url: string | undefined = import.meta.url;
    if (typeof url === "string" && url.startsWith("file:")) return dirname(fileURLToPath(url));
  } catch {
    // fall through
  }
  return null;
}

function resolvePluginRoot(): string {
  const candidates = [
    process.env.FOREMAN_LINE_ROOT,
    moduleDir() ? join(moduleDir() as string, "..") : null,
    join(process.env.HOME ?? "", "Repos/agent-skills/plugins/foreman-line"),
  ];
  for (const candidate of candidates) {
    if (candidate && existsSync(join(candidate, "skills")) && existsSync(join(candidate, "docs"))) {
      return candidate;
    }
  }
  return candidates[1] ?? candidates[2] ?? process.cwd();
}

const PLUGIN_ROOT = resolvePluginRoot();
const SKILLS_DIR = join(PLUGIN_ROOT, "skills");
const GOALS_DIR = join(PLUGIN_ROOT, "docs", "goals");

// --- skill loading -----------------------------------------------------------

type Skill = {
  name: string;
  description: string;
  filePath: string;
  baseDir: string;
  body: string;
};

function stripFrontmatter(markdown: string): string {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
}

function frontmatterField(markdown: string, field: string): string {
  const match = markdown.match(
    new RegExp(`^---\\r?\\n[\\s\\S]*?\\r?\\n${field}:\\s*["']?([^"'\\n]+)["']?\\r?\\n[\\s\\S]*?\\r?\\n---`),
  );
  return match ? match[1].trim() : "";
}

function loadSkills(): Skill[] {
  if (!existsSync(SKILLS_DIR)) return [];
  const skills: Skill[] = [];
  for (const entry of readdirSync(SKILLS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const filePath = join(SKILLS_DIR, entry.name, "SKILL.md");
    if (!existsSync(filePath)) continue;
    const raw = readFileSync(filePath, "utf-8");
    const body = stripFrontmatter(raw).replaceAll("${CLAUDE_PLUGIN_ROOT}", PLUGIN_ROOT);
    if (!body) continue;
    skills.push({
      name: frontmatterField(raw, "name") || entry.name,
      description: frontmatterField(raw, "description"),
      filePath,
      baseDir: join(SKILLS_DIR, entry.name),
      body,
    });
  }
  return skills;
}

/** Same shape Pi's built-in `/skill:<name>` expansion produces. */
function expandSkill(skill: Skill, args: string): string {
  const block = `<skill name="${skill.name}" location="${skill.filePath}">
References are relative to ${skill.baseDir}.

${skill.body}
</skill>`;
  return args.trim() ? `${block}\n\n${args.trim()}` : block;
}

// --- goal-slug completion ("resume <goal-slug>") ------------------------------

function goalSlugs(): string[] {
  if (!existsSync(GOALS_DIR)) return [];
  return readdirSync(GOALS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function completeGoalArgs(argumentText: string): Array<{ value: string; label: string }> | null {
  const words = argumentText.split(/\s+/).filter(Boolean);
  const fragment = /\s$/.test(argumentText) ? "" : (words[words.length - 1] ?? "");
  const afterResume = words[0] === "resume" ? words.slice(1) : [];
  const slugFragment = words[0] === "resume" ? afterResume.join(" ") : fragment;
  const matches = goalSlugs().filter((slug) => slug.startsWith(slugFragment));
  if (matches.length === 0) return null;
  return matches.map((slug) => ({
    value: words[0] === "resume" ? `resume ${slug}` : `resume ${slug}`,
    label: `resume ${slug}`,
  }));
}

// --- extension --------------------------------------------------------------

export default function foremanLine(pi: ExtensionAPI) {
  const skills = loadSkills();

  for (const skill of skills) {
    pi.registerCommand(`${COMMAND_NS}:${skill.name}`, {
      description: `Foreman Line: ${skill.description}`,
      getArgumentCompletions:
        skill.name === "goal"
          ? (argumentText: string) => completeGoalArgs(argumentText)
          : undefined,
      handler: async (args: string, ctx) => {
        await pi.sendUserMessage(expandSkill(skill, args ?? ""));
        void ctx;
      },
    });
  }

  pi.registerCommand(`${COMMAND_NS}:probe`, {
    description: "Foreman Line: self-test — report the resolved plugin root and discovered skills",
    handler: async (_args: string, ctx) => {
      const report = {
        pluginRoot: PLUGIN_ROOT,
        skillsDir: SKILLS_DIR,
        skills: skills.map((skill) => skill.name),
        goalSlugs: goalSlugs().length,
      };
      const out = join(process.env.TMPDIR ?? "/tmp", "foreman-line-pi-probe.json");
      try {
        writeFileSync(out, JSON.stringify(report, null, 2));
        ctx.ui.notify(`foreman-line ok — ${skills.length} skills from ${PLUGIN_ROOT} (${out})`, "info");
      } catch (err) {
        ctx.ui.notify(`foreman-line probe failed: ${err instanceof Error ? err.message : String(err)}`, "error");
      }
      ctx.shutdown();
    },
  });
}
