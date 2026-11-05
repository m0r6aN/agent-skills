#!/usr/bin/env python3
"""Resolve and profile /melt-faces targets.

Usage:
    python profile_targets.py [target ...] [--out profile.json] [--cache DIR]

Each target is a local path or a remote git URL. With no targets, the git root
of the current directory is used. Remote URLs are shallow-cloned into the cache
directory (default: ~/.agents/melt-faces/cache). Nothing from a target is
executed: this script only reads files.

Prints a JSON profile per target: stack, frameworks, UI signals, run scripts,
tests, CI, enterprise-relevant libraries, docs, and size. The lead agent uses it
to size the review team and pick lenses.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

SKIP_DIRS = {
    ".git", "node_modules", "dist", "build", "out", ".next", ".nuxt", ".svelte-kit",
    "coverage", ".turbo", ".cache", "__pycache__", ".venv", "venv", "bin", "obj",
    "target", ".idea", ".vscode", "vendor", ".remember", "melt-faces-reports", "worktrees",
}
SOURCE_EXT = {
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".vue", ".svelte", ".astro",
    ".py", ".cs", ".go", ".rs", ".java", ".kt", ".rb", ".php", ".swift",
    ".css", ".scss", ".sass", ".less", ".html", ".razor", ".cshtml",
}
UI_EXT = {".tsx", ".jsx", ".vue", ".svelte", ".astro", ".html", ".razor", ".cshtml"}

# dependency name (or prefix ending in '/') -> signal label
DEP_SIGNALS = {
    "framework": {
        "next": "Next.js", "react": "React", "vue": "Vue", "nuxt": "Nuxt",
        "svelte": "Svelte", "@sveltejs/kit": "SvelteKit", "@angular/core": "Angular",
        "astro": "Astro", "solid-js": "Solid", "@remix-run/react": "Remix",
        "vite": "Vite", "express": "Express", "fastify": "Fastify", "hono": "Hono",
        "electron": "Electron", "@tauri-apps/api": "Tauri",
    },
    "ui_kit": {
        "tailwindcss": "Tailwind", "@radix-ui/": "Radix", "@mui/material": "MUI",
        "antd": "Ant Design", "@chakra-ui/react": "Chakra", "@mantine/core": "Mantine",
        "styled-components": "styled-components", "@emotion/react": "Emotion",
        "framer-motion": "Framer Motion", "motion": "Motion", "lucide-react": "Lucide",
        "class-variance-authority": "CVA (shadcn-style)", "@headlessui/react": "Headless UI",
        "@kaseya/": "Kaseya packages",
    },
    "data_viz": {
        "recharts": "Recharts", "d3": "D3", "chart.js": "Chart.js", "echarts": "ECharts",
        "@nivo/": "Nivo", "plotly.js": "Plotly", "@visx/": "visx", "@tremor/react": "Tremor",
    },
    "auth": {
        "next-auth": "NextAuth", "@auth/core": "Auth.js", "@auth0/": "Auth0",
        "@azure/msal-browser": "MSAL", "@azure/msal-node": "MSAL", "@okta/": "Okta",
        "@clerk/": "Clerk", "passport": "Passport", "@supabase/supabase-js": "Supabase",
        "firebase": "Firebase", "lucia": "Lucia", "better-auth": "Better Auth",
    },
    "observability": {
        "@sentry/": "Sentry", "@opentelemetry/": "OpenTelemetry", "dd-trace": "Datadog",
        "@datadog/": "Datadog", "pino": "pino", "winston": "winston",
        "langfuse": "Langfuse", "@langfuse/": "Langfuse", "posthog-js": "PostHog",
        "@vercel/analytics": "Vercel Analytics", "@segment/": "Segment",
    },
    "ai": {
        "openai": "OpenAI SDK", "@anthropic-ai/sdk": "Anthropic SDK", "ai": "Vercel AI SDK",
        "@ai-sdk/": "Vercel AI SDK", "langchain": "LangChain", "@langchain/": "LangChain",
        "llamaindex": "LlamaIndex", "@modelcontextprotocol/sdk": "MCP SDK",
    },
    "i18n": {
        "i18next": "i18next", "react-i18next": "i18next", "next-intl": "next-intl",
        "react-intl": "react-intl", "@lingui/": "Lingui", "vue-i18n": "vue-i18n",
    },
    "testing": {
        "vitest": "Vitest", "jest": "Jest", "@playwright/test": "Playwright",
        "cypress": "Cypress", "@testing-library/": "Testing Library",
        "@axe-core/": "axe", "axe-core": "axe", "storybook": "Storybook", "@storybook/": "Storybook",
    },
    "validation": {"zod": "zod", "yup": "yup", "valibot": "valibot", "joi": "joi"},
}

MARKER_FILES = {
    "readme": ["README.md", "README", "readme.md"],
    "agents_md": ["AGENTS.md", "CLAUDE.md"],
    "env_example": [".env.example", ".env.sample"],
    "dockerfile": ["Dockerfile", "docker-compose.yml", "compose.yaml", "docker-compose.yaml"],
    "tailwind_config": ["tailwind.config.js", "tailwind.config.ts", "tailwind.config.mjs"],
    "playwright_config": ["playwright.config.ts", "playwright.config.js"],
    "storybook": [".storybook"],
    "claude_plugin": [".claude-plugin/plugin.json"],
    "codex_plugin": [".codex-plugin/plugin.json"],
    "changelog": ["CHANGELOG.md"],
    "security_md": ["SECURITY.md"],
    "license": ["LICENSE", "LICENSE.md"],
}


def is_url(s: str) -> bool:
    return bool(re.match(r"^(https?://|git@|ssh://)", s))


def slug_for(s: str) -> str:
    s = re.sub(r"\.git$", "", s.rstrip("/\\"))
    parts = re.split(r"[/:\\]", s)
    return "-".join(p for p in parts[-2:] if p) or "target"


def git(args: list[str], cwd: Path) -> str | None:
    try:
        r = subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True, timeout=30)
        return r.stdout.strip() if r.returncode == 0 else None
    except (OSError, subprocess.TimeoutExpired):
        return None


def is_git_remote(url: str) -> bool:
    """True if the URL answers as a git remote. Never prompts for credentials."""
    if url.startswith(("git@", "ssh://")) or url.endswith(".git"):
        return True
    env = {**os.environ, "GIT_TERMINAL_PROMPT": "0", "GCM_INTERACTIVE": "never"}
    try:
        r = subprocess.run(["git", "ls-remote", "--heads", url], capture_output=True,
                           text=True, timeout=20, env=env)
        return r.returncode == 0
    except (OSError, subprocess.TimeoutExpired):
        return False


def resolve(target: str | None, cache: Path) -> tuple[Path | None, dict]:
    meta: dict = {"input": target or "(current repo)", "remote_clone": False, "reach": "code"}
    if target is None:
        root = git(["rev-parse", "--show-toplevel"], Path.cwd())
        return (Path(root) if root else Path.cwd()), meta
    if is_url(target) and not is_git_remote(target):
        # A website, not a repo (or a private repo we can't read). Reach is
        # whatever a browser can see; the lead must not make code claims.
        meta["reach"] = "live-only"
        meta["note"] = ("Not a readable git remote: review as a live site (visual, UX, "
                        "content, performance, headers). Ask the user for repo access "
                        "if they want code-level findings.")
        return None, meta
    if is_url(target):
        dest = cache / slug_for(target)
        meta["remote_clone"] = True
        meta["untrusted"] = True
        if dest.exists():
            git(["pull", "--ff-only", "--depth", "1"], dest)
        else:
            cache.mkdir(parents=True, exist_ok=True)
            try:
                r = subprocess.run(["git", "clone", "--depth", "1", target, str(dest)],
                                   capture_output=True, text=True, timeout=300)
            except (OSError, subprocess.TimeoutExpired) as e:
                meta["error"] = f"clone failed: {e}"
                return None, meta
            if r.returncode != 0:
                meta["error"] = f"clone failed: {r.stderr.strip()[:300]}"
                return None, meta
        return dest, meta
    p = Path(target).expanduser().resolve()
    if not p.exists():
        meta["error"] = "path does not exist"
        return None, meta
    return p, meta


def walk(root: Path, limit: int = 60000):
    n = 0
    for dirpath, dirnames, filenames in os.walk(root):
        keep_dot = (".github", ".claude-plugin", ".codex-plugin", ".storybook")
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and (not d.startswith(".") or d in keep_dot)]
        for f in filenames:
            n += 1
            if n > limit:
                return
            yield Path(dirpath) / f


def match_deps(deps: set[str]) -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    for group, table in DEP_SIGNALS.items():
        hits = set()
        for key, label in table.items():
            if key.endswith("/"):
                if any(d.startswith(key) for d in deps):
                    hits.add(label)
            elif key in deps:
                hits.add(label)
        if hits:
            out[group] = sorted(hits)
    return out


def profile(root: Path) -> dict:
    ext_counts: Counter = Counter()
    ui_files = 0
    loc = 0
    package_jsons: list[Path] = []
    route_dirs: set[str] = set()
    workflows = 0
    test_files = 0
    docs_files = 0
    skills = 0
    commands = 0
    py_reqs = False
    csproj = 0

    for f in walk(root):
        rel = f.relative_to(root)
        parts = rel.parts
        ext = f.suffix.lower()
        name = f.name
        if name == "package.json":
            package_jsons.append(f)
        if name in ("pyproject.toml", "requirements.txt"):
            py_reqs = True
        if ext == ".csproj":
            csproj += 1
        if len(parts) >= 3 and parts[0] == ".github" and parts[1] == "workflows":
            workflows += 1
        if re.search(r"(\.|_)(test|spec)\.|(^|/)test_|(^|/)tests?/", rel.as_posix()):
            test_files += 1
        if parts and parts[0] == "docs" or ext == ".md":
            docs_files += 1
        if name == "SKILL.md":
            skills += 1
        if len(parts) >= 2 and parts[-2] == "commands" and ext == ".md":
            commands += 1
        for marker in ("app", "pages", "routes", "views", "screens"):
            if marker in parts[:-1]:
                idx = parts.index(marker)
                route_dirs.add("/".join(parts[: idx + 1]))
        if ext in SOURCE_EXT:
            ext_counts[ext] += 1
            if ext in UI_EXT:
                ui_files += 1
            try:
                if f.stat().st_size < 1_000_000:
                    with open(f, "rb") as fh:
                        loc += sum(1 for _ in fh)
            except OSError:
                pass

    deps: set[str] = set()
    scripts: dict[str, dict[str, str]] = {}
    for pj in sorted(package_jsons, key=lambda x: len(x.parts))[:40]:
        try:
            data = json.loads(pj.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        for k in ("dependencies", "devDependencies", "peerDependencies"):
            deps.update((data.get(k) or {}).keys())
        s = data.get("scripts") or {}
        keep = {k: v for k, v in s.items() if k in ("dev", "start", "build", "preview", "test", "e2e", "storybook", "lint", "typecheck")}
        if keep and len(scripts) < 12:
            scripts[pj.parent.relative_to(root).as_posix() or "."] = keep

    markers = {k: any((root / c).exists() for c in v) for k, v in MARKER_FILES.items()}
    signals = match_deps(deps)
    has_ui = ui_files >= 3 or "framework" in signals and any(
        x in signals["framework"] for x in ("Next.js", "React", "Vue", "Svelte", "Angular", "Astro", "Solid", "Nuxt", "SvelteKit", "Remix")
    )
    kind = []
    if has_ui:
        kind.append("web-ui")
    if markers["claude_plugin"] or markers["codex_plugin"] or skills:
        kind.append("agent-plugin")
    if any("Express" in x or "Fastify" in x or "Hono" in x for x in signals.get("framework", [])):
        kind.append("api-server")
    if not kind:
        kind.append("library-or-cli")

    total_src = sum(ext_counts.values())
    if total_src < 150:
        team = "--quick"
    elif total_src < 1500:
        team = "--team"
    else:
        team = "--max"

    return {
        "root": str(root),
        "git": {
            "remote": git(["config", "--get", "remote.origin.url"], root),
            "branch": git(["rev-parse", "--abbrev-ref", "HEAD"], root),
            "commit": git(["rev-parse", "--short", "HEAD"], root),
        },
        "kind": kind,
        "size": {"source_files": total_src, "ui_files": ui_files, "approx_loc": loc,
                 "top_extensions": dict(ext_counts.most_common(8))},
        "signals": signals,
        "run_scripts": scripts,
        "route_dirs": sorted(route_dirs)[:20],
        "tests": {"test_files": test_files, "ci_workflows": workflows,
                  "playwright": markers["playwright_config"], "storybook": markers["storybook"]},
        "docs": {"markdown_files": docs_files, "readme": markers["readme"],
                 "agents_md": markers["agents_md"], "changelog": markers["changelog"],
                 "security_md": markers["security_md"], "license": markers["license"]},
        "plugin": {"claude": markers["claude_plugin"], "codex": markers["codex_plugin"],
                   "skills": skills, "commands": commands},
        "other_stacks": {"python": py_reqs, "dotnet_projects": csproj,
                         "dockerfile": markers["dockerfile"], "env_example": markers["env_example"]},
        "kaseya_product": "Kaseya packages" in signals.get("ui_kit", []),
        "suggested_team_size": team,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("targets", nargs="*")
    ap.add_argument("--out", help="write JSON here as well as stdout")
    ap.add_argument("--cache", default=str(Path.home() / ".agents" / "melt-faces" / "cache"))
    a = ap.parse_args()

    cache = Path(a.cache)
    results = []
    for t in (a.targets or [None]):
        root, meta = resolve(t, cache)
        entry = {"tag": slug_for(t) if t else (root.name if root else "current"), **meta}
        if root:
            entry["tag"] = root.name
            entry.update(profile(root))
            readme = root / "README.md"
            if readme.exists() and not entry.get("kaseya_product"):
                try:
                    entry["kaseya_product"] = "kaseya" in readme.read_text(encoding="utf-8", errors="ignore").lower()
                except OSError:
                    pass
        results.append(entry)

    sizes = [r.get("size", {}).get("source_files", 0) for r in results]
    reaches = {r.get("reach") for r in results if "error" not in r}
    overall = {"targets": results, "total_source_files": sum(sizes),
               "reach": "code" if reaches == {"code"} else ("live-only" if reaches == {"live-only"}
                        else ("mixed" if reaches else "none"))}
    if len(results) > 1 and overall["total_source_files"] >= 150:
        overall["suggested_team_size"] = "--max" if overall["total_source_files"] >= 800 else "--team"
    else:
        overall["suggested_team_size"] = results[0].get("suggested_team_size", "--quick") if results else "--quick"

    text = json.dumps(overall, indent=2)
    if a.out:
        Path(a.out).parent.mkdir(parents=True, exist_ok=True)
        Path(a.out).write_text(text, encoding="utf-8")
    print(text)
    return 0 if all("error" not in r for r in results) else 1


if __name__ == "__main__":
    sys.exit(main())
