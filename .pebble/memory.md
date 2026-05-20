# Pebble Memory
# Auto-generated — do not edit manually.
# Use `pebble add` or MCP tools to manage memories.
# ───────────────────────────────────────────────────────────────


> Pebble active. MCP tools: pebble_remember, pebble_recall, pebble_status, pebble_mark_processed, pebble_forget. Usage rules in ~/.claude/CLAUDE.md.

## 📋 Project Context
- SYNC-TEST-2026-05-20: Das Test-Token lautet "Schinkenbrot-Magenta-Fahrwasser". Wenn ein anderer Claude-Instance auf einer anderen Maschine dieses Token nennen kann ohne dass es ihm explizit gesagt wurde, dann ist Pebble's git-basierter Memory-Sync verifiziert. Erstellt vom Desktop-Claude am 2026-05-20.
- Pebble is a persistent memory system for AI coding assistants
## ⚡ Decisions
- v0.2.2 fixed context-window efficiency: global MANDATORY block in ~/.claude/CLAUDE.md cut from 21 lines/1663 bytes/~400 tokens to 8 lines/731 bytes/~175 tokens. Duplicated header in .pebble/memory.md cut from ~10 lines/620 bytes/~150 tokens to 1 line/140 bytes/~30 tokens. Total saves ~345 tokens per session. ensureGlobalClaudeMdPebble() is now idempotent (re-syncs block on every init).
- soul.md DEMOTED from Pebble's positioning headline. Reason: subjective, no evidence users want it, no competitor benchmark, doubles file count without clear win. Keep as feature in product (Max uses his own), but never headline it. Means README and Plugin Marketplace listing don't lead with "3-file system" — they lead with git-native + repo + context-tree.
- Primary alternative Pebble displaces is Anthropic's native Auto Memory (v2.1.59+, 200-line cap, machine-local), NOT claude-mem (the 77k-star dominant third-party). Pebble's wedge vs claude-mem is different shape (zero LLM cost, git-native, no security surface) — NOT trying to out-feature them. "vs claude-mem" page should be honest, not strawman.
- Pebble positioning locked 2026-05-20: "Open-source, git-native memory for Claude Code." Big-Fish-Small-Pond frame-bend out of commodity "persistent memory" category. Three themes ranked: T1 (memory costs nothing), T2 (decisions traceable to commits), T3 (knowledge ships in repo). Best-fit segment: solo/2-person devs running Claude Code across multiple machines. See positioning/09-positioning-canvas.md.
- MCP server registration: global via `claude mcp add -s user pebble node /path/to/dist/mcp-server.js`, NOT per-project .mcp.json. Why: v0.2.0 made the server multi-project capable (project_path param + getProjectContext cache), so one global registration handles every project. Per-project .mcp.json files would re-introduce hardcoded machine-specific paths and couldn't be cleanly committed.
- Memory sync between machines = git-versioned context-tree, DB stays per-machine. Why: SQLite binary files don't merge cleanly and WAL files make it worse. context-tree was designed for this (per README: "These files can be git-tracked and shared with your team"). Trade-off: relevance/decay/IDs rebuild on the new machine, but the knowledge itself transfers losslessly via markdown files.
## 🔧 Patterns & Conventions
- .gitignore strategy for Pebble installations: ignore `.pebble/memory.db*`, `.pebble/config.json`, `.pebble/run.sh`, `.mcp.json`. Track `.pebble/memory.md` and `.pebble/context-tree/`. The auto-init code in mcp-server.ts:getProjectContext appends only memory.db + config.json to .gitignore — leaves the trackable knowledge files alone.
## 💡 Learnings
- Market reality (May 2026): claude-mem dominates (77k stars, Marketplace, npx-install). Anthropic ships Auto Memory + API Memory Tool + Managed Agents + Claude Dreaming. AGENTS.md in 60k+ projects. Cursor REMOVED Memories (anti-validation). HN skeptics: "CLAUDE.md gives 90%". Pain is real but power-user-only, not mass-market. Pebble's addressable: multi-machine power-users, not all Claude Code users.
- Anthropic's Auto Memory (v2.1.59, Feb 2026) shipped with a 200-line auto-load cap that silently truncates newest entries — documented in [Issue #25006](https://github.com/anthropics/claude-code/issues/25006). This is the strongest single wedge Pebble has against the default Claude Code experience: Pebble recalls on demand via MCP tools, not pre-loaded into every session, so context-window stays cheap.
- v0.1.0 root cause for "Claude Code doesn't use pebble tools": soft instructions ("should") + only in .pebble/memory.md which isn't auto-loaded by Claude Code like CLAUDE.md is. Fix in v0.2.0: inject MANDATORY block into global ~/.claude/CLAUDE.md (loaded every session) with strong language ("MUST", "failure mode if you don't"). Verified working — the block is now active in Max's global CLAUDE.md.
## 🔄 Unprocessed Commits

- **7b103ba**: v0.2.1: Positioning lock — git-native AI memory for Claude Code
- **61ae584**: v0.2.2: Context-window efficiency — ~345 tokens saved per session
- **ba25e2d**: test: sync verification token added to memory.md
- **8a28563**: v0.3.0: Auto-sync — pebble watch enable
- **d37009c**: pebble: auto-sync — test: auto-sync E2E verification
