# Pebble Memory
# Auto-generated — do not edit manually.
# Use `pebble add` or MCP tools to manage memories.
# ───────────────────────────────────────────────────────────────


## 🪨 Pebble Memory — MANDATORY

You MUST use Pebble MCP tools to persist knowledge across sessions. This is a core rule, not a suggestion.
**IMPORTANT**: Always pass `project_path` (your current working directory) with every `pebble_*` tool call.

**Session start**: Process any unprocessed commits below — call `pebble_remember` for insights, then `pebble_mark_processed`.
**During work**: Call `pebble_remember` IMMEDIATELY when you make decisions, find bugs, discover patterns, or learn something non-obvious.
**Before session ends**: Persist every important decision and learning. If you don't, the next session starts from zero.
**Need context?**: Call `pebble_recall` before making assumptions.

## 📋 Project Context

- Pebble is a persistent memory system for AI coding assistants

## 💡 Learnings

- Pebble dogfooding started 2026-03-11. Auto-init works but Claude Code doesn't automatically use pebble tools — Max had to remind the agent. Likely cause: .pebble/memory.md isn't auto-loaded like CLAUDE.md, and the CLAUDE.md pointer instruction isn't strong enough. Running 1-week test to gather real usage data.

## 🔄 Unprocessed Commits

Review these commits. Call `pebble_remember` for insights, then `pebble_mark_processed`.

### 52cd5cc: Initial commit: Pebble v0.1.0
```
.claude/settings.local.json |    7 +
 .gitignore                  |    4 +
 CLAUDE.md                   |  105 +++
 LICENSE                     |   21 +
 README.md                   |  182 +++++
 package-lock.json           | 1641 +++++++++++++++++++++++++++++++++++++++++++
 package.json                |   29 +
 src/context-tree.ts         |  137 ++++
 src/db.ts                   |  274 ++++++++
 src/extractor.ts            |  162 +++++
 src/generator.ts            |  228 ++++++
 src/hooks.ts                |  110 +++
 src/index.ts                |  372 ++++++++++
 src/mcp-server.ts           |  323 +++++++++
 src/types.ts                |   67 ++
 tsconfig.json               |   20 +
 16 files changed, 3682 insertions(+)
```
<details><summary>Diff</summary>

```diff
diff --git a/.claude/settings.local.json b/.claude/settings.local.json
new file mode 100644
index 0000000..d4bdb5a
--- /dev/null
+++ b/.claude/settings.local.json
@@ -0,0 +1,7 @@
+{
+  "permissions": {
+    "allow": [
+      "Bash(npm run build)"
+    ]
+  }
+}
diff --git a/.gitignore b/.gitignore
new file mode 100644
index 0000000..1459bee
--- /dev/null
+++ b/.gitignore
@@ -0,0 +1,4 @@
+node_modules/
+dist/
+.pebble/
+*.db
diff --git a/CLAUDE.md b/CLAUDE.md
new file mode 100644
index 0000000..2f30414
--- /dev/null
+++ b/CLAUDE.md
@@ -0,0 +1,105 @@
+# CLAUDE.md — Pebble
+
+## What Pebble Is
+
+Open-source persistent memory for AI coding assistants (starting with Claude Code). Auto-captures git commits, queues them, lets Claude Code process them into structured memories via MCP tools. Zero API keys, zero cost, local-first.
+
+**Tagline:** Small stones, big picture.
+
+## Critical Architecture Rule
+
+**Pebble NEVER overwrites CLAUDE.md.** The user's CLAUDE.md is sacred — it contains their rules, workflow, identity. Pebble only:
+1. Adds a one-line pointer on first `init` (non-destructive, one time)
+2. Writes to `.pebble/memory.md` (auto-generated memories)
+3. Writes to `.pebble/context-tree/` (detailed markdown files)
+4. Creates `soul.md` template on init (only if it doesn't exist)
+
+**The 3-file system:**
+- `CLAUDE.md` — User's rules, identity, workflow (MANUAL, Pebble never touches after init)
+- `soul.md` — Claude's personality/voice for this user (MANUAL, user customizes)
+- `.pebble/memory.md` — Accumulated knowledge from commits + MCP (AUTO-GENERATED)
+
+## Architecture
+
+**Zero LLM calls.** Git hook queues raw commit data into SQLite. Claude Code reads `.pebble/memory.md` (which includes unprocessed commits), decides what's worth remembering, calls MCP tools.
+
+**The flow:**
+```
+commit → post-commit hook → `pebble capture` → queues diff in SQLite
+→ regenerates .pebble/memory.md + context tree
+→ next Claude Code session reads it
+→ Claude calls `pebble_remember` + `pebble_mark_processed`
+```
+
+## File Structure
+
+```
+src/
+├── index.ts          — CLI (commander, 8 commands, soul.md template)
+├── mcp-server.ts     — MCP server (6 tools)
+├── db.ts             — SQLite layer (better-sqlite3, WAL)
+├── extractor.ts      — Commit queue (captures diffs, NO LLM)
+├── generator.ts      — Generates .pebble/memory.md, triggers context tree, CLAUDE.md pointer
+├── context-tree.ts   — Writes memories as markdown in .pebble/context-tree/
+├── hooks.ts          — Git post-commit hook installer
+└── types.ts          — Types, 5 categories, config defaults
+```
+
+## Tech Stack
+
+TypeScript, Node.js (ESM), SQLite (better-sqlite3), MCP SDK, Commander, Zod, Chalk. No external API deps.
+
+## Key Decisions
+
+- Pebble NEVER touches CLAUDE.md content (only adds pointer once)
+- soul.md is a template users customize (personality, voice, mindset)
+- .pebble/memory.md is the only auto-generated file Claude reads
+- .pebble/context-tree/ has detai
... [truncated]
```
</details>

# ─── Pebble: 2 memories | 1 unprocessed commits ───