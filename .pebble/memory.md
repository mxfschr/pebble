# Pebble Memory
# Auto-generated — do not edit manually.
# Use `pebble add` or MCP tools to manage memories.
# ───────────────────────────────────────────────────────────────


> Pebble active. MCP tools: pebble_remember, pebble_recall, pebble_status, pebble_mark_processed, pebble_forget. Usage rules in ~/.claude/CLAUDE.md.

## 📋 Project Context
- CROSS-MACHINE-SYNC-TEST 2026-05-21 mittags: blind verification token = "Hodensack". Desktop-Claude speichert dies via pebble_remember, auto-sync (v0.3.0+) pusht zu GitHub. Laptop-Claude pullt beim nächsten Session-Start automatisch und sollte das Token in der project memory.md finden ohne dass es ihm im Chat gesagt wurde. Max chose this word — it's the actual blind test.
- "Claude Code" hat 2 Surfaces Mai 2026: CLI (claude.exe) UND Code-Tab in Claude Desktop App (GUI, April 2026 redesigned). Beide teilen Engine, ~/.claude/CLAUDE.md, MCP-Config, Auto-Memory in ~/.claude/projects/. Max nutzt Code-Tab als primäre Surface. Pebble's Architektur funktioniert in beiden 1:1.
- GitHub repo went live 2026-05-20 at https://github.com/mxfschr/pebble (public, MIT). Description: "Git-native AI memory for Claude Code. Open source, local-first, zero LLM API calls." 12 topics set. Auto-sync enabled on Pebble's own repo (dogfooding). Two machines in active use: Max's desktop and laptop. Laptop sync-test token leaked through conversation channel (was meant to be blind) — UX lesson: test tokens must travel only via Pebble itself, never through chat to Max.
- SYNC-TEST-2026-05-20: Das Test-Token lautet "Schinkenbrot-Magenta-Fahrwasser". Wenn ein anderer Claude-Instance auf einer anderen Maschine dieses Token nennen kann ohne dass es ihm explizit gesagt wurde, dann ist Pebble's git-basierter Memory-Sync verifiziert. Erstellt vom Desktop-Claude am 2026-05-20.
- Pebble is a persistent memory system for AI coding assistants
## ⚡ Decisions
- v0.4.0 baut Global User Memory: ~/.pebble/user/{voice.md, about.md, notes.md} machine-local. voice.md + about.md sind user-edited (templates generisch). notes.md ist append-only von Claude via neuem MCP tool pebble_user_note. CRITICAL: Code/Templates/Docs sind 100% generisch — keine Personennamen, keine Projekt-Beispiele, keine "Max"/"ThemenFlow"/etc. Open-source standard.
- v0.3.0 launched 2026-05-20: `pebble watch enable/disable/status` CLI plus opt-in auto-sync via .pebble/config.json (auto_sync: true). After every pebble_remember/forget/mark_processed: silent git add+commit+push of .pebble/. On first getProjectContext per MCP session: silent git pull --rebase. Both best-effort, errors swallowed. Closes "manual push/pull" UX gap without abandoning git-native positioning. See src/sync.ts + README Cross-machine workflow section.
- v0.2.2 fixed context-window efficiency: global MANDATORY block in ~/.claude/CLAUDE.md cut from 21 lines/1663 bytes/~400 tokens to 8 lines/731 bytes/~175 tokens. Duplicated header in .pebble/memory.md cut from ~10 lines/620 bytes/~150 tokens to 1 line/140 bytes/~30 tokens. Total saves ~345 tokens per session. ensureGlobalClaudeMdPebble() is now idempotent (re-syncs block on every init).
- soul.md DEMOTED from Pebble's positioning headline. Reason: subjective, no evidence users want it, no competitor benchmark, doubles file count without clear win. Keep as feature in product (Max uses his own), but never headline it. Means README and Plugin Marketplace listing don't lead with "3-file system" — they lead with git-native + repo + context-tree.
- Primary alternative Pebble displaces is Anthropic's native Auto Memory (v2.1.59+, 200-line cap, machine-local), NOT claude-mem (the 77k-star dominant third-party). Pebble's wedge vs claude-mem is different shape (zero LLM cost, git-native, no security surface) — NOT trying to out-feature them. "vs claude-mem" page should be honest, not strawman.
- Pebble positioning locked 2026-05-20: "Open-source, git-native memory for Claude Code." Big-Fish-Small-Pond frame-bend out of commodity "persistent memory" category. Three themes ranked: T1 (memory costs nothing), T2 (decisions traceable to commits), T3 (knowledge ships in repo). Best-fit segment: solo/2-person devs running Claude Code across multiple machines. See positioning/09-positioning-canvas.md.
- MCP server registration: global via `claude mcp add -s user pebble node /path/to/dist/mcp-server.js`, NOT per-project .mcp.json. Why: v0.2.0 made the server multi-project capable (project_path param + getProjectContext cache), so one global registration handles every project. Per-project .mcp.json files would re-introduce hardcoded machine-specific paths and couldn't be cleanly committed.
- Memory sync between machines = git-versioned context-tree, DB stays per-machine. Why: SQLite binary files don't merge cleanly and WAL files make it worse. context-tree was designed for this (per README: "These files can be git-tracked and shared with your team"). Trade-off: relevance/decay/IDs rebuild on the new machine, but the knowledge itself transfers losslessly via markdown files.
## 🔧 Patterns & Conventions
- Generic open-source rule for Pebble: No hardcoded user-specific strings in src/, README, templates, or default configs. Templates use [placeholders] or {{variables}}. Examples in docs are abstract ("when the user says X"). Personal content lives only in ~/.pebble/user/ which is machine-local and never committed to the open-source repo.
- .gitignore strategy for Pebble installations: ignore `.pebble/memory.db*`, `.pebble/config.json`, `.pebble/run.sh`, `.mcp.json`. Track `.pebble/memory.md` and `.pebble/context-tree/`. The auto-init code in mcp-server.ts:getProjectContext appends only memory.db + config.json to .gitignore — leaves the trackable knowledge files alone.
## 💡 Learnings
- Race condition in tryAutoSync E2E test: `git commit --only file` reads file at commit-time from disk, not staging. If a concurrent writer (e.g. old MCP server still in memory) overwrites memory.md between stage and commit, the commit captures wrong state. Commit d37009c truncated memory.md 162→5 lines this way; fix e06ee9f regenerated. Practical rule: only the MCP server writes memory.md.
- Market reality (May 2026): claude-mem dominates (77k stars, Marketplace, npx-install). Anthropic ships Auto Memory + API Memory Tool + Managed Agents + Claude Dreaming. AGENTS.md in 60k+ projects. Cursor REMOVED Memories (anti-validation). HN skeptics: "CLAUDE.md gives 90%". Pain is real but power-user-only, not mass-market. Pebble's addressable: multi-machine power-users, not all Claude Code users.
- Anthropic's Auto Memory (v2.1.59, Feb 2026) shipped with a 200-line auto-load cap that silently truncates newest entries — documented in [Issue #25006](https://github.com/anthropics/claude-code/issues/25006). This is the strongest single wedge Pebble has against the default Claude Code experience: Pebble recalls on demand via MCP tools, not pre-loaded into every session, so context-window stays cheap.
- v0.1.0 root cause for "Claude Code doesn't use pebble tools": soft instructions ("should") + only in .pebble/memory.md which isn't auto-loaded by Claude Code like CLAUDE.md is. Fix in v0.2.0: inject MANDATORY block into global ~/.claude/CLAUDE.md (loaded every session) with strong language ("MUST", "failure mode if you don't"). Verified working — the block is now active in Max's global CLAUDE.md.
## 🎯 Active Work
- Handoff 2026-05-21 nachts: v0.4.0 live, positioning/ raus aus public (commit 3e05711, lokal noch da). Offen Desktop: voice.md+about.md customizen (noch generic templates). Offen Laptop: git pull + npm run build + pebble user init. Offen: cross-machine sync test stufe 3, P0s (npm publish, Marketplace PR, FTS5, AGENTS.md).
- Open question: should positioning/ directory stay in public GitHub repo? Pro: transparency, contributor-onboarding, dogfooding. Contra: competitive intel leak (vs claude-mem analysis, roadmap gaps), market-narrowing in public, U1 contains user's verbatim motivations. Recommendation: Option A — add positioning/ to .gitignore, `git rm -r --cached positioning/`, keep locally. Reversible, low effort. Decision pending — user wants to think with fresh head.
- P2 Roadmap-Eintrag: Cross-Tab Memory Bridge in Claude Desktop App. Memory ist heute in 3 isolierten Welten: Chat (Cloud), Cowork (Project), Code (Auto-Memory + CLAUDE.md). Pebble könnte als MCP-basierte Bridge fungieren — eine .pebble/ DB die in allen Tabs erreichbar ist. Aktuell blockiert durch Windows-Bug #42453 (lokale stdio MCP tools "disabled" in Cowork/Code, nur Chat zuverlässig). Wenn Anthropic den Bug fixt, ist das Pebble's interessanteste neue Opportunity.
- Open P0 items unchanged since v0.2.1: (1) npm publish pebble-memory (still claims to be installable via npm in README, isn't), (2) Plugin Marketplace PR to anthropics/claude-plugins-official, (3) FTS5 in pebble_recall, (4) AGENTS.md export. New P0 from v0.3.0 session: verify auto-sync works in a real day-of-use workflow (not just E2E test) before recommending it broadly. New P1: improve test workflow — strictly blind tokens, never paste into chat with Max.
- Pre-launch P0 distribution checklist (positioning/12-marketing-outputs.md §7): (1) npm publish pebble-memory, (2) GitHub repo description + topics via `gh repo edit`, (3) Plugin Marketplace PR to anthropics/claude-plugins-official, (4) Show HN, (5) r/ClaudeAI post, (6) Dev.to article. Steps 4-6 only AFTER 1-3.
- README quickstart says `npm install -g pebble-memory` but package isn't on npm yet. Either publish to npm or rewrite quickstart to git-clone instructions. Blocker for any non-Max install.
- v0.2.1: drop duplicated MANDATORY block from .pebble/memory.md — global CLAUDE.md already has it (token waste). Add CLI `pebble status` (currently MCP-only). Add PEBBLE_AUTO_INIT=false escape hatch for getProjectContext auto-init.
- Set up GitHub remote for Pebble (currently no `git remote` configured). Needed for: (1) Laptop clone to get v0.2.0 stand, (2) public open-source launch per README TODO P1. Decision pending: push to public github.com/mxfschr/pebble or keep private until polished.
## 🔄 Unprocessed Commits

Review these commits. Call `pebble_remember` for insights, then `pebble_mark_processed`.

**12 older commits** (review commit messages, mark processed if not relevant):
- 7b103ba: v0.2.1: Positioning lock — git-native AI memory for Claude Code
- 61ae584: v0.2.2: Context-window efficiency — ~345 tokens saved per session
- ba25e2d: test: sync verification token added to memory.md
- 8a28563: v0.3.0: Auto-sync — pebble watch enable
- d37009c: pebble: auto-sync — test: auto-sync E2E verification
- e06ee9f: fix: regenerate memory.md after auto-sync test race
- 8260069: memory: session-end snapshot (v0.3.0 launch, race-learning, repo-live, todos)
- 511ae10: docs: clarify Pebble works with both Claude Code CLI and Desktop App Code-tab
- a0ea19d: pebble: auto-sync — +decision: v0.4.0 baut Global User Memory: ~/.pebble/user/{voice.md, ab
- 462e1d4: pebble: auto-sync — +pattern: Generic open-source rule for Pebble: No hardcoded user-speci
- dcaac96: v0.4.0: User memory — voice.md, about.md, notes.md in ~/.pebble/user/
- fd607e8: pebble: auto-sync — +todo: Open question: should positioning/ directory stay in public

### 3e05711: chore: move positioning/ out of public repo
```
.gitignore                                 |   5 +
 .pebble/memory.md                          |  90 ++++++------
 positioning/00-project-brief.md            | 115 ----------------
 positioning/02-vocabulary-baggage.md       | 104 --------------
 positioning/03-competitive-alternatives.md | 161 ----------------------
 positioning/04-unique-attributes.md        | 110 ---------------
 positioning/05-value-themes.md             |  98 -------------
 positioning/06-target-segments.md          | 111 ---------------
 positioning/07-market-category.md          | 125 -----------------
 positioning/09-positioning-canvas.md       | 126 -----------------
 positioning/10-sales-story.md              |  79 -----------
 positioning/12-marketing-outputs.md        | 174 -----------------------
 positioning/evidence-log.md                | 214 -----------------------------
 13 files changed, 50 insertions(+), 1462 deletions(-)
```
<details><summary>Diff</summary>

```diff
diff --git a/.gitignore b/.gitignore
index a31eff5..2975067 100644
--- a/.gitignore
+++ b/.gitignore
@@ -12,3 +12,8 @@ dist/
 
 *.db
 .claude/settings.local.json
+
+# Positioning work — internal strategy docs (competitive analysis,
+# evidence log, roadmap). Kept private to avoid leaking competitive
+# intel + maintainer voice notes. Lives only on the maintainer's machine.
+positioning/
diff --git a/.pebble/memory.md b/.pebble/memory.md
index e9b5499..2544518 100644
--- a/.pebble/memory.md
+++ b/.pebble/memory.md
@@ -40,56 +40,14 @@
 
 Review these commits. Call `pebble_remember` for insights, then `pebble_mark_processed`.
 
-**6 older commits** (review commit messages, mark processed if not relevant):
+**7 older commits** (review commit messages, mark processed if not relevant):
 - 7b103ba: v0.2.1: Positioning lock — git-native AI memory for Claude Code
 - 61ae584: v0.2.2: Context-window efficiency — ~345 tokens saved per session
 - ba25e2d: test: sync verification token added to memory.md
 - 8a28563: v0.3.0: Auto-sync — pebble watch enable
 - d37009c: pebble: auto-sync — test: auto-sync E2E verification
 - e06ee9f: fix: regenerate memory.md after auto-sync test race
-
-### 8260069: memory: session-end snapshot (v0.3.0 launch, race-learning, repo-live, todos)
-```
-.pebble/context-tree/README.md             |  21 +--
- .pebble/context-tree/active-work/README.md |   9 +-
- .pebble/context-tree/context/README.md     |   9 +-
- .pebble/context-tree/decisions/README.md   |   9 +-
- .pebble/context-tree/learnings/README.md   |   9 +-
- .pebble/memory.md                          | 242 ++++++++++++++++++++++++++++-
- 6 files changed, 278 insertions(+), 21 deletions(-)
-```
-<details><summary>Diff</summary>
-
-```diff
-diff --git a/.pebble/context-tree/README.md b/.pebble/context-tree/README.md
-index fd7dfb0..057b4b1 100644
---- a/.pebble/context-tree/README.md
-+++ b/.pebble/context-tree/README.md
-@@ -3,32 +3,33 @@
- > Your project's accumulated knowledge. Auto-generated by Pebble.
- > These files are human-readable, git-trackable, and can be read by any AI tool.
- 
--## ⚡ [Decisions](./decisions/README.md) (6)
-+## ⚡ [Decisions](./decisions/README.md) (7)
- 
-+- v0.3.0 launched 2026-05-20: `pebble watch enable/disable/status` CLI plus opt-in auto-sync via .pebble/config.json (auto_sync: true). After every pebble_remember/forget/mark_processed: silent git add+commit+push of .pebble/. On first getProjectContext per MCP session: silent git pull --rebase. Both best-effort, errors swallowed. Closes "manual push/pull" UX gap without abandoning git-native positioning. See src/sync.ts + README Cross-machine workflow section.
- - v0.2.2 fixed context-window efficiency: global MANDATORY block in ~/.claude/CLAUDE.md cut from 21 lines/1663 bytes/~400 tokens to 8 lines/731 bytes/~175 tokens. Duplicated header in .pebble/memory.md cut from ~10 lines/620 bytes/~150 tokens to 1 line/140 bytes/~30 tokens. Total saves ~345 tokens per session. ensureGlobalClaudeMdPebb
... [truncated]
```
</details>

### adbe994: pebble: auto-sync — +todo: Handoff 2026-05-21 nachts: v0.4.0 live, positioning/ raus au
```
.pebble/context-tree/README.md             |   6 +-
 .pebble/context-tree/active-work/README.md |   9 +-
 .pebble/memory.md                          | 130 +++++++++++++++++++----------
 3 files changed, 95 insertions(+), 50 deletions(-)
```
<details><summary>Diff</summary>

```diff
diff --git a/.pebble/context-tree/README.md b/.pebble/context-tree/README.md
index 2b6a15f..cc7859f 100644
--- a/.pebble/context-tree/README.md
+++ b/.pebble/context-tree/README.md
@@ -29,9 +29,9 @@
 - Anthropic's Auto Memory (v2.1.59, Feb 2026) shipped with a 200-line auto-load cap that silently truncates newest entries — documented in [Issue #25006](https://github.com/anthropics/claude-code/issues/25006). This is the strongest single wedge Pebble has against the default Claude Code experience: Pebble recalls on demand via MCP tools, not pre-loaded into every session, so context-window stays cheap.
 - _...and 2 more_
 
-## 🎯 [Active Work](./active-work/README.md) (7)
+## 🎯 [Active Work](./active-work/README.md) (8)
 
+- Handoff 2026-05-21 nachts: v0.4.0 live, positioning/ raus aus public (commit 3e05711, lokal noch da). Offen Desktop: voice.md+about.md customizen (noch generic templates). Offen Laptop: git pull + npm run build + pebble user init. Offen: cross-machine sync test stufe 3, P0s (npm publish, Marketplace PR, FTS5, AGENTS.md).
 - Open question: should positioning/ directory stay in public GitHub repo? Pro: transparency, contributor-onboarding, dogfooding. Contra: competitive intel leak (vs claude-mem analysis, roadmap gaps), market-narrowing in public, U1 contains user's verbatim motivations. Recommendation: Option A — add positioning/ to .gitignore, `git rm -r --cached positioning/`, keep locally. Reversible, low effort. Decision pending — user wants to think with fresh head.
 - P2 Roadmap-Eintrag: Cross-Tab Memory Bridge in Claude Desktop App. Memory ist heute in 3 isolierten Welten: Chat (Cloud), Cowork (Project), Code (Auto-Memory + CLAUDE.md). Pebble könnte als MCP-basierte Bridge fungieren — eine .pebble/ DB die in allen Tabs erreichbar ist. Aktuell blockiert durch Windows-Bug #42453 (lokale stdio MCP tools "disabled" in Cowork/Code, nur Chat zuverlässig). Wenn Anthropic den Bug fixt, ist das Pebble's interessanteste neue Opportunity.
-- Open P0 items unchanged since v0.2.1: (1) npm publish pebble-memory (still claims to be installable via npm in README, isn't), (2) Plugin Marketplace PR to anthropics/claude-plugins-official, (3) FTS5 in pebble_recall, (4) AGENTS.md export. New P0 from v0.3.0 session: verify auto-sync works in a real day-of-use workflow (not just E2E test) before recommending it broadly. New P1: improve test workflow — strictly blind tokens, never paste into chat with Max.
-- _...and 4 more_
+- _...and 5 more_
diff --git a/.pebble/context-tree/active-work/README.md b/.pebble/context-tree/active-work/README.md
index e1eb3a1..9c87d5c 100644
--- a/.pebble/context-tree/active-work/README.md
+++ b/.pebble/context-tree/active-work/README.md
@@ -1,6 +1,13 @@
 # 🎯 Active Work
 
-> Auto-generated by Pebble. 7 active memories.
+> Auto-generated by Pebble. 8 active memories.
+
+## Handoff 2026-05-21 nachts: v0.4.0 live, positioning/ raus aus public (commit 3e05711, lokal noch da). Offen Desktop: voice.md+about.md customi
... [truncated]
```
</details>

### 0e39a99: memory: end-of-session handoff note
```
.pebble/memory.md | 99 +++++++++++++++++++++++++------------------------------
 1 file changed, 45 insertions(+), 54 deletions(-)
```
<details><summary>Diff</summary>

```diff
diff --git a/.pebble/memory.md b/.pebble/memory.md
index 97b561a..bc6813e 100644
--- a/.pebble/memory.md
+++ b/.pebble/memory.md
@@ -41,7 +41,7 @@
 
 Review these commits. Call `pebble_remember` for insights, then `pebble_mark_processed`.
 
-**8 older commits** (review commit messages, mark processed if not relevant):
+**9 older commits** (review commit messages, mark processed if not relevant):
 - 7b103ba: v0.2.1: Positioning lock — git-native AI memory for Claude Code
 - 61ae584: v0.2.2: Context-window efficiency — ~345 tokens saved per session
 - ba25e2d: test: sync verification token added to memory.md
@@ -50,58 +50,7 @@ Review these commits. Call `pebble_remember` for insights, then `pebble_mark_pro
 - e06ee9f: fix: regenerate memory.md after auto-sync test race
 - 8260069: memory: session-end snapshot (v0.3.0 launch, race-learning, repo-live, todos)
 - 511ae10: docs: clarify Pebble works with both Claude Code CLI and Desktop App Code-tab
-
-### a0ea19d: pebble: auto-sync — +decision: v0.4.0 baut Global User Memory: ~/.pebble/user/{voice.md, ab
-```
-.pebble/context-tree/README.md           |   6 +-
- .pebble/context-tree/decisions/README.md |   9 ++-
- .pebble/memory.md                        | 117 +++++++++++++------------------
- 3 files changed, 61 insertions(+), 71 deletions(-)
-```
-<details><summary>Diff</summary>
-
-```diff
-diff --git a/.pebble/context-tree/README.md b/.pebble/context-tree/README.md
-index 0497e71..46684d0 100644
---- a/.pebble/context-tree/README.md
-+++ b/.pebble/context-tree/README.md
-@@ -3,12 +3,12 @@
- > Your project's accumulated knowledge. Auto-generated by Pebble.
- > These files are human-readable, git-trackable, and can be read by any AI tool.
- 
--## ⚡ [Decisions](./decisions/README.md) (7)
-+## ⚡ [Decisions](./decisions/README.md) (8)
- 
-+- v0.4.0 baut Global User Memory: ~/.pebble/user/{voice.md, about.md, notes.md} machine-local. voice.md + about.md sind user-edited (templates generisch). notes.md ist append-only von Claude via neuem MCP tool pebble_user_note. CRITICAL: Code/Templates/Docs sind 100% generisch — keine Personennamen, keine Projekt-Beispiele, keine "Max"/"ThemenFlow"/etc. Open-source standard.
- - v0.3.0 launched 2026-05-20: `pebble watch enable/disable/status` CLI plus opt-in auto-sync via .pebble/config.json (auto_sync: true). After every pebble_remember/forget/mark_processed: silent git add+commit+push of .pebble/. On first getProjectContext per MCP session: silent git pull --rebase. Both best-effort, errors swallowed. Closes "manual push/pull" UX gap without abandoning git-native positioning. See src/sync.ts + README Cross-machine workflow section.
- - v0.2.2 fixed context-window efficiency: global MANDATORY block in ~/.claude/CLAUDE.md cut from 21 lines/1663 bytes/~400 tokens to 8 lines/731 bytes/~175 tokens. Duplicated header in .pebble/memory.md cut from ~10 lines/620 bytes/~150 tokens to 1 line/140 bytes/~30 tokens. Total saves ~345 tokens per session. ensureGlobalClaudeMdPebble
... [truncated]
```
</details>

### 980cca2: v0.5.0: Auto-consolidation — voice.md and about.md grow over time
```
.pebble/memory.md | 113 +++++++++++++++++++++++++++---------------------------
 README.md         |  11 +++++-
 package.json      |   2 +-
 src/generator.ts  |   1 +
 src/index.ts      |  10 ++++-
 src/mcp-server.ts |  60 ++++++++++++++++++++++++++++-
 src/user.ts       |  43 +++++++++++++++++++++
 7 files changed, 178 insertions(+), 62 deletions(-)
```
<details><summary>Diff</summary>

```diff
diff --git a/.pebble/memory.md b/.pebble/memory.md
index bc6813e..0ddea7c 100644
--- a/.pebble/memory.md
+++ b/.pebble/memory.md
@@ -41,7 +41,7 @@
 
 Review these commits. Call `pebble_remember` for insights, then `pebble_mark_processed`.
 
-**9 older commits** (review commit messages, mark processed if not relevant):
+**10 older commits** (review commit messages, mark processed if not relevant):
 - 7b103ba: v0.2.1: Positioning lock — git-native AI memory for Claude Code
 - 61ae584: v0.2.2: Context-window efficiency — ~345 tokens saved per session
 - ba25e2d: test: sync verification token added to memory.md
@@ -51,60 +51,7 @@ Review these commits. Call `pebble_remember` for insights, then `pebble_mark_pro
 - 8260069: memory: session-end snapshot (v0.3.0 launch, race-learning, repo-live, todos)
 - 511ae10: docs: clarify Pebble works with both Claude Code CLI and Desktop App Code-tab
 - a0ea19d: pebble: auto-sync — +decision: v0.4.0 baut Global User Memory: ~/.pebble/user/{voice.md, ab
-
-### 462e1d4: pebble: auto-sync — +pattern: Generic open-source rule for Pebble: No hardcoded user-speci
-```
-.pebble/context-tree/README.md          |   3 +-
- .pebble/context-tree/patterns/README.md |   9 ++-
- .pebble/memory.md                       | 107 +++++++++++++++++---------------
- 3 files changed, 66 insertions(+), 53 deletions(-)
-```
-<details><summary>Diff</summary>
-
-```diff
-diff --git a/.pebble/context-tree/README.md b/.pebble/context-tree/README.md
-index 46684d0..39c2c9e 100644
---- a/.pebble/context-tree/README.md
-+++ b/.pebble/context-tree/README.md
-@@ -10,8 +10,9 @@
- - v0.2.2 fixed context-window efficiency: global MANDATORY block in ~/.claude/CLAUDE.md cut from 21 lines/1663 bytes/~400 tokens to 8 lines/731 bytes/~175 tokens. Duplicated header in .pebble/memory.md cut from ~10 lines/620 bytes/~150 tokens to 1 line/140 bytes/~30 tokens. Total saves ~345 tokens per session. ensureGlobalClaudeMdPebble() is now idempotent (re-syncs block on every init).
- - _...and 5 more_
- 
--## 🔧 [Patterns & Conventions](./patterns/README.md) (1)
-+## 🔧 [Patterns & Conventions](./patterns/README.md) (2)
- 
-+- Generic open-source rule for Pebble: No hardcoded user-specific strings in src/, README, templates, or default configs. Templates use [placeholders] or {{variables}}. Examples in docs are abstract ("when the user says X"). Personal content lives only in ~/.pebble/user/ which is machine-local and never committed to the open-source repo.
- - .gitignore strategy for Pebble installations: ignore `.pebble/memory.db*`, `.pebble/config.json`, `.pebble/run.sh`, `.mcp.json`. Track `.pebble/memory.md` and `.pebble/context-tree/`. The auto-init code in mcp-server.ts:getProjectContext appends only memory.db + config.json to .gitignore — leaves the trackable knowledge files alone.
- 
- ## 📋 [Project Context](./context/README.md) (4)
-diff --git a/.pebble/context-tree/patterns/README.md b/.pebble/context-tree/patterns/README.md
-index 2ea0829..ded330b 100644

... [truncated]
```
</details>

### 7da5f6f: pebble: auto-sync — +context: CROSS-MACHINE-SYNC-TEST 2026-05-21 mittags: blind verificati
```
.pebble/context-tree/README.md         |   6 +-
 .pebble/context-tree/context/README.md |   9 ++-
 .pebble/memory.md                      | 123 ++++++++++++++++++---------------
 3 files changed, 79 insertions(+), 59 deletions(-)
```
<details><summary>Diff</summary>

```diff
diff --git a/.pebble/context-tree/README.md b/.pebble/context-tree/README.md
index cc7859f..427407e 100644
--- a/.pebble/context-tree/README.md
+++ b/.pebble/context-tree/README.md
@@ -15,12 +15,12 @@
 - Generic open-source rule for Pebble: No hardcoded user-specific strings in src/, README, templates, or default configs. Templates use [placeholders] or {{variables}}. Examples in docs are abstract ("when the user says X"). Personal content lives only in ~/.pebble/user/ which is machine-local and never committed to the open-source repo.
 - .gitignore strategy for Pebble installations: ignore `.pebble/memory.db*`, `.pebble/config.json`, `.pebble/run.sh`, `.mcp.json`. Track `.pebble/memory.md` and `.pebble/context-tree/`. The auto-init code in mcp-server.ts:getProjectContext appends only memory.db + config.json to .gitignore — leaves the trackable knowledge files alone.
 
-## 📋 [Project Context](./context/README.md) (4)
+## 📋 [Project Context](./context/README.md) (5)
 
+- CROSS-MACHINE-SYNC-TEST 2026-05-21 mittags: blind verification token = "Hodensack". Desktop-Claude speichert dies via pebble_remember, auto-sync (v0.3.0+) pusht zu GitHub. Laptop-Claude pullt beim nächsten Session-Start automatisch und sollte das Token in der project memory.md finden ohne dass es ihm im Chat gesagt wurde. Max chose this word — it's the actual blind test.
 - "Claude Code" hat 2 Surfaces Mai 2026: CLI (claude.exe) UND Code-Tab in Claude Desktop App (GUI, April 2026 redesigned). Beide teilen Engine, ~/.claude/CLAUDE.md, MCP-Config, Auto-Memory in ~/.claude/projects/. Max nutzt Code-Tab als primäre Surface. Pebble's Architektur funktioniert in beiden 1:1.
 - GitHub repo went live 2026-05-20 at https://github.com/mxfschr/pebble (public, MIT). Description: "Git-native AI memory for Claude Code. Open source, local-first, zero LLM API calls." 12 topics set. Auto-sync enabled on Pebble's own repo (dogfooding). Two machines in active use: Max's desktop and laptop. Laptop sync-test token leaked through conversation channel (was meant to be blind) — UX lesson: test tokens must travel only via Pebble itself, never through chat to Max.
-- SYNC-TEST-2026-05-20: Das Test-Token lautet "Schinkenbrot-Magenta-Fahrwasser". Wenn ein anderer Claude-Instance auf einer anderen Maschine dieses Token nennen kann ohne dass es ihm explizit gesagt wurde, dann ist Pebble's git-basierter Memory-Sync verifiziert. Erstellt vom Desktop-Claude am 2026-05-20.
-- _...and 1 more_
+- _...and 2 more_
 
 ## 💡 [Learnings](./learnings/README.md) (5)
 
diff --git a/.pebble/context-tree/context/README.md b/.pebble/context-tree/context/README.md
index e97b7cf..05572fa 100644
--- a/.pebble/context-tree/context/README.md
+++ b/.pebble/context-tree/context/README.md
@@ -1,6 +1,13 @@
 # 📋 Project Context
 
-> Auto-generated by Pebble. 4 active memories.
+> Auto-generated by Pebble. 5 active memories.
+
+## CROSS-MACHINE-SYNC-TEST 2026-05-21 mittags: blind verification token = "Hodensack". Desktop-Claude speich
... [truncated]
```
</details>

# ─── Pebble: 28 memories | 17 unprocessed commits ───