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
## 🎯 Active Work
- Pre-launch P0 distribution checklist (positioning/12-marketing-outputs.md §7): (1) npm publish pebble-memory, (2) GitHub repo description + topics via `gh repo edit`, (3) Plugin Marketplace PR to anthropics/claude-plugins-official, (4) Show HN, (5) r/ClaudeAI post, (6) Dev.to article. Steps 4-6 only AFTER 1-3.
- README quickstart says `npm install -g pebble-memory` but package isn't on npm yet. Either publish to npm or rewrite quickstart to git-clone instructions. Blocker for any non-Max install.
- v0.2.1: drop duplicated MANDATORY block from .pebble/memory.md — global CLAUDE.md already has it (token waste). Add CLI `pebble status` (currently MCP-only). Add PEBBLE_AUTO_INIT=false escape hatch for getProjectContext auto-init.
- Set up GitHub remote for Pebble (currently no `git remote` configured). Needed for: (1) Laptop clone to get v0.2.0 stand, (2) public open-source launch per README TODO P1. Decision pending: push to public github.com/mxfschr/pebble or keep private until polished.
## 🔄 Unprocessed Commits

Review these commits. Call `pebble_remember` for insights, then `pebble_mark_processed`.

### 7b103ba: v0.2.1: Positioning lock — git-native AI memory for Claude Code
```
.pebble/context-tree/README.md             |  25 ++-
 .pebble/context-tree/active-work/README.md |  31 +++
 .pebble/context-tree/context/README.md     |   2 +-
 .pebble/context-tree/decisions/README.md   |  38 ++++
 .pebble/context-tree/learnings/README.md   |  25 ++-
 .pebble/context-tree/patterns/README.md    |  10 +
 .pebble/memory.md                          | 138 ++------------
 README.md                                  | 295 +++++++++++++++++------------
 package.json                               |   2 +-
 positioning/00-project-brief.md            | 115 +++++++++++
 positioning/02-vocabulary-baggage.md       | 104 ++++++++++
 positioning/03-competitive-alternatives.md | 161 ++++++++++++++++
 positioning/04-unique-attributes.md        | 110 +++++++++++
 positioning/05-value-themes.md             |  98 ++++++++++
 positioning/06-target-segments.md          | 111 +++++++++++
 positioning/07-market-category.md          | 125 ++++++++++++
 positioning/09-positioning-canvas.md       | 126 ++++++++++++
 positioning/10-sales-story.md              |  79 ++++++++
 positioning/12-marketing-outputs.md        | 174 +++++++++++++++++
 positioning/evidence-log.md                | 214 +++++++++++++++++++++
 20 files changed, 1743 insertions(+), 240 deletions(-)
```
<details><summary>Diff</summary>

```diff
diff --git a/.pebble/context-tree/README.md b/.pebble/context-tree/README.md
index 1b76421..e2dcfdd 100644
--- a/.pebble/context-tree/README.md
+++ b/.pebble/context-tree/README.md
@@ -3,10 +3,31 @@
 > Your project's accumulated knowledge. Auto-generated by Pebble.
 > These files are human-readable, git-trackable, and can be read by any AI tool.
 
+## ⚡ [Decisions](./decisions/README.md) (5)
+
+- soul.md DEMOTED from Pebble's positioning headline. Reason: subjective, no evidence users want it, no competitor benchmark, doubles file count without clear win. Keep as feature in product (Max uses his own), but never headline it. Means README and Plugin Marketplace listing don't lead with "3-file system" — they lead with git-native + repo + context-tree.
+- Primary alternative Pebble displaces is Anthropic's native Auto Memory (v2.1.59+, 200-line cap, machine-local), NOT claude-mem (the 77k-star dominant third-party). Pebble's wedge vs claude-mem is different shape (zero LLM cost, git-native, no security surface) — NOT trying to out-feature them. "vs claude-mem" page should be honest, not strawman.
+- Pebble positioning locked 2026-05-20: "Open-source, git-native memory for Claude Code." Big-Fish-Small-Pond frame-bend out of commodity "persistent memory" category. Three themes ranked: T1 (memory costs nothing), T2 (decisions traceable to commits), T3 (knowledge ships in repo). Best-fit segment: solo/2-person devs running Claude Code across multiple machines. See positioning/09-positioning-canvas.md.
+- _...and 2 more_
+
+## 🔧 [Patterns & Conventions](./patterns/README.md) (1)
+
+- .gitignore strategy for Pebble installations: ignore `.pebble/memory.db*`, `.pebble/config.json`, `.pebble/run.sh`, `.mcp.json`. Track `.pebble/memory.md` and `.pebble/context-tree/`. The auto-init code in mcp-server.ts:getProjectContext appends only memory.db + config.json to .gitignore — leaves the trackable knowledge files alone.
+
 ## 📋 [Project Context](./context/README.md) (1)
 
 - Pebble is a persistent memory system for AI coding assistants
 
-## 💡 [Learnings](./learnings/README.md) (1)
+## 💡 [Learnings](./learnings/README.md) (4)
+
+- Market reality (May 2026): claude-mem dominates (77k stars, Marketplace, npx-install). Anthropic ships Auto Memory + API Memory Tool + Managed Agents + Claude Dreaming. AGENTS.md in 60k+ projects. Cursor REMOVED Memories (anti-validation). HN skeptics: "CLAUDE.md gives 90%". Pain is real but power-user-only, not mass-market. Pebble's addressable: multi-machine power-users, not all Claude Code users.
+- Anthropic's Auto Memory (v2.1.59, Feb 2026) shipped with a 200-line auto-load cap that silently truncates newest entries — documented in [Issue #25006](https://github.com/anthropics/claude-code/issues/25006). This is the strongest single wedge Pebble has against the default Claude Code experience: Pebble recalls on demand via MCP tools, not pre-loaded into every session, so context-window stays cheap.
+- v0.1.0 root cause for "Claude 
... [truncated]
```
</details>

### 61ae584: v0.2.2: Context-window efficiency — ~345 tokens saved per session
```
.pebble/memory.md | 86 ++++++++++++++++++++++++++++++++++++++++++-------------
 package.json      |  2 +-
 src/generator.ts  | 80 ++++++++++++++++++++++-----------------------------
 3 files changed, 101 insertions(+), 67 deletions(-)
```
<details><summary>Diff</summary>

```diff
diff --git a/.pebble/memory.md b/.pebble/memory.md
index b469b86..1381cc6 100644
--- a/.pebble/memory.md
+++ b/.pebble/memory.md
@@ -4,43 +4,89 @@
 # ───────────────────────────────────────────────────────────────
 
 
-## 🪨 Pebble Memory — MANDATORY
-
-You MUST use Pebble MCP tools to persist knowledge across sessions. This is a core rule, not a suggestion.
-**IMPORTANT**: Always pass `project_path` (your current working directory) with every `pebble_*` tool call.
-
-**Session start**: Process any unprocessed commits below — call `pebble_remember` for insights, then `pebble_mark_processed`.
-**During work**: Call `pebble_remember` IMMEDIATELY when you make decisions, find bugs, discover patterns, or learn something non-obvious.
-**Before session ends**: Persist every important decision and learning. If you don't, the next session starts from zero.
-**Need context?**: Call `pebble_recall` before making assumptions.
+> Pebble active. MCP tools: pebble_remember, pebble_recall, pebble_status, pebble_mark_processed, pebble_forget. Usage rules in ~/.claude/CLAUDE.md.
 
 ## 📋 Project Context
-
-- Pebble is a persistent memory system for AI coding assistants ⤵⤵
-
+- Pebble is a persistent memory system for AI coding assistants
 ## ⚡ Decisions
-
 - soul.md DEMOTED from Pebble's positioning headline. Reason: subjective, no evidence users want it, no competitor benchmark, doubles file count without clear win. Keep as feature in product (Max uses his own), but never headline it. Means README and Plugin Marketplace listing don't lead with "3-file system" — they lead with git-native + repo + context-tree.
 - Primary alternative Pebble displaces is Anthropic's native Auto Memory (v2.1.59+, 200-line cap, machine-local), NOT claude-mem (the 77k-star dominant third-party). Pebble's wedge vs claude-mem is different shape (zero LLM cost, git-native, no security surface) — NOT trying to out-feature them. "vs claude-mem" page should be honest, not strawman.
 - Pebble positioning locked 2026-05-20: "Open-source, git-native memory for Claude Code." Big-Fish-Small-Pond frame-bend out of commodity "persistent memory" category. Three themes ranked: T1 (memory costs nothing), T2 (decisions traceable to commits), T3 (knowledge ships in repo). Best-fit segment: solo/2-person devs running Claude Code across multiple machines. See positioning/09-positioning-canvas.md.
 - MCP server registration: global via `claude mcp add -s user pebble node /path/to/dist/mcp-server.js`, NOT per-project .mcp.json. Why: v0.2.0 made the server multi-project capable (project_path param + getProjectContext cache), so one global registration handles every project. Per-project .mcp.json files would re-introduce hardcoded machine-specific paths and couldn't be cleanly committed.
 - Memory sync between machines = git-versioned context-tree, DB stays per-machine. Why: SQLite binary files don't merge cleanly and WAL files make it worse. context-tree was designed for this (per README: "These files can b
... [truncated]
```
</details>

### ba25e2d: test: sync verification token added to memory.md
```
.pebble/context-tree/README.md           |  9 ++--
 .pebble/context-tree/context/README.md   |  9 +++-
 .pebble/context-tree/decisions/README.md |  9 +++-
 .pebble/memory.md                        | 71 ++++++++++++++++++++++++++++++--
 4 files changed, 89 insertions(+), 9 deletions(-)
```
<details><summary>Diff</summary>

```diff
diff --git a/.pebble/context-tree/README.md b/.pebble/context-tree/README.md
index e2dcfdd..fd7dfb0 100644
--- a/.pebble/context-tree/README.md
+++ b/.pebble/context-tree/README.md
@@ -3,19 +3,20 @@
 > Your project's accumulated knowledge. Auto-generated by Pebble.
 > These files are human-readable, git-trackable, and can be read by any AI tool.
 
-## ⚡ [Decisions](./decisions/README.md) (5)
+## ⚡ [Decisions](./decisions/README.md) (6)
 
+- v0.2.2 fixed context-window efficiency: global MANDATORY block in ~/.claude/CLAUDE.md cut from 21 lines/1663 bytes/~400 tokens to 8 lines/731 bytes/~175 tokens. Duplicated header in .pebble/memory.md cut from ~10 lines/620 bytes/~150 tokens to 1 line/140 bytes/~30 tokens. Total saves ~345 tokens per session. ensureGlobalClaudeMdPebble() is now idempotent (re-syncs block on every init).
 - soul.md DEMOTED from Pebble's positioning headline. Reason: subjective, no evidence users want it, no competitor benchmark, doubles file count without clear win. Keep as feature in product (Max uses his own), but never headline it. Means README and Plugin Marketplace listing don't lead with "3-file system" — they lead with git-native + repo + context-tree.
 - Primary alternative Pebble displaces is Anthropic's native Auto Memory (v2.1.59+, 200-line cap, machine-local), NOT claude-mem (the 77k-star dominant third-party). Pebble's wedge vs claude-mem is different shape (zero LLM cost, git-native, no security surface) — NOT trying to out-feature them. "vs claude-mem" page should be honest, not strawman.
-- Pebble positioning locked 2026-05-20: "Open-source, git-native memory for Claude Code." Big-Fish-Small-Pond frame-bend out of commodity "persistent memory" category. Three themes ranked: T1 (memory costs nothing), T2 (decisions traceable to commits), T3 (knowledge ships in repo). Best-fit segment: solo/2-person devs running Claude Code across multiple machines. See positioning/09-positioning-canvas.md.
-- _...and 2 more_
+- _...and 3 more_
 
 ## 🔧 [Patterns & Conventions](./patterns/README.md) (1)
 
 - .gitignore strategy for Pebble installations: ignore `.pebble/memory.db*`, `.pebble/config.json`, `.pebble/run.sh`, `.mcp.json`. Track `.pebble/memory.md` and `.pebble/context-tree/`. The auto-init code in mcp-server.ts:getProjectContext appends only memory.db + config.json to .gitignore — leaves the trackable knowledge files alone.
 
-## 📋 [Project Context](./context/README.md) (1)
+## 📋 [Project Context](./context/README.md) (2)
 
+- SYNC-TEST-2026-05-20: Das Test-Token lautet "Schinkenbrot-Magenta-Fahrwasser". Wenn ein anderer Claude-Instance auf einer anderen Maschine dieses Token nennen kann ohne dass es ihm explizit gesagt wurde, dann ist Pebble's git-basierter Memory-Sync verifiziert. Erstellt vom Desktop-Claude am 2026-05-20.
 - Pebble is a persistent memory system for AI coding assistants
 
 ## 💡 [Learnings](./learnings/README.md) (4)
diff --git a/.pebble/context-tree/context/README.md b/.pebble/context-tree/context
... [truncated]
```
</details>

# ─── Pebble: 17 memories | 3 unprocessed commits ───