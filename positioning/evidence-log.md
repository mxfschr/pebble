# Evidence Log — Pebble

_Single source of truth for every positioning claim. Generated 2026-05-20._

## Direct evidence about Pebble (E)

Pebble has no public users yet (only Max, in dogfooding). No reviews, no testimonials.

### U1 — User self-statement (Max)
- **Stated by:** Max
- **Date:** 2026-05-20
- **Verbatim:**
  > "das ziel muss eben sein, dass du ständig selbständig dazulernst und in jeder neuen sitzung weißt was sache ist und was wir gemacht, besprochen, entschieden und so weiter haben. du setzt auch oft was um und verbesserst dich dann selber weil du feststellst, dass es eben nicht so funktioniert hat wie du dir das im ersten gedanken vorgestellt hast. und das automatisch. und im besten fall noch maschinen übergreifend. das problem habe ich ja gerade mit meinem laptop, dass er nicht auf dem gleichen stand ist wie mein desktop und sich alles neu anschauen muss und wir alles 'neu entdecken müssen'. ich möchte ein system das zuverlässig ist und auf das ich mich 100% verlassen kann."
- **Tags:** core-value-statement, problem-language, target-outcome
- **Confidence:** LOW (user-stated, but valuable as primary-user vocabulary)

### U2 — Pebble's own dogfooded learning
- **Source:** `.pebble/memory.md` (id:2, learning, 2026-03-11)
- **Verbatim:**
  > "Pebble dogfooding started 2026-03-11. Auto-init works but Claude Code doesn't automatically use pebble tools — Max had to remind the agent. Likely cause: .pebble/memory.md isn't auto-loaded like CLAUDE.md, and the CLAUDE.md pointer instruction isn't strong enough."
- **Tags:** product-history, problem-discovery
- **Confidence:** HIGH (codebase-anchored)

## Competitor-proxy evidence (EC)

### EC001 — claude-mem GitHub trajectory
- **Source:** GitHub
- **URL:** https://github.com/thedotmack/claude-mem
- **Date:** 2026-05-13
- **Data:** 77.1k stars, 1.9k commits, 6.6k forks, v13.2.0 (12 May 2026), Apache 2.0, npx-install
- **Interpretation:** Direct competitor with massive mindshare. Same lift, same audience (Claude Code users). 14-month growth curve.
- **Tags:** competitive-alternative, market-size-signal
- **Confidence:** HIGH

### EC002 — claude-mem security audit
- **Source:** GitHub Issue #1251
- **URL:** https://github.com/thedotmack/claude-mem/issues/1251
- **Verbatim concern:**
  > "unauthenticated HTTP API on port 37777, cleartext API keys, path-traversal vulnerabilities in MCP tools"
- **Interpretation:** Opening for Pebble — security-conscious users will avoid claude-mem.
- **Tags:** opening, differentiation-opportunity
- **Confidence:** HIGH

### EC003 — HN "Stop Claude Code from forgetting everything"
- **URL:** https://news.ycombinator.com/item?id=46426624
- **Type:** Show HN thread with substantive engagement
- **Top critical comment paraphrased:**
  > "there's never any evidence or even attempt at measuring any metric of performance improved by it"
  > "A claude.md file will give you 90% of what you need. Consider more when you're 50+ hours in"
- **Interpretation:** The pain is real but skeptics exist. Power-user problem, not mass-market.
- **Tags:** problem-validation, market-skepticism, segment-signal
- **Confidence:** HIGH

### EC004 — Cursor removed Memories feature in 2025
- **Interpretation:** Anti-validation: Cursor tried built-in memory, retracted. Users had to migrate to Rules. The space is volatile and Cursor's exec team concluded native memory wasn't worth maintaining.
- **Tags:** market-signal, competitive-history
- **Confidence:** HIGH

### EC005 — Anthropic Claude Code Auto Memory (v2.1.59, Feb 2026)
- **URL:** https://code.claude.com/docs/en/memory
- **Mechanism:** Writes MEMORY.md + topic-files in `~/.claude/projects/<project>/memory/`, loads first 200 lines / 25KB automatically
- **Known limit:** 200-line cap on auto-load — issue [#25006](https://github.com/anthropics/claude-code/issues/25006), [#39811](https://github.com/anthropics/claude-code/issues/39811) document "newest entries silently dropped"
- **Interpretation:** Anthropic is building the 80% solution natively. Free, integrated. But has hard caps and is machine-local.
- **Tags:** primary-alternative, native-baseline
- **Confidence:** HIGH

### EC006 — Anthropic API Memory Tool
- **URL:** https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool
- **Identifier:** `memory_20250818`, beta header `context-management-2025-06-27`
- **Mechanism:** File-based operations (view/create/str_replace/insert/delete/rename) in `/memories` directory
- **Released:** Sept 2025
- **Interpretation:** API-level building block. Not a finished product, requires app developer to build UX. Not directly Pebble's market.
- **Tags:** related-but-different
- **Confidence:** HIGH

### EC007 — Mem0 cross-tool memory layer
- **URL:** https://github.com/mem0ai/mem0
- **Data:** 56.3k stars, hybrid retrieval (vector + graph + keyword), cross-tool via OpenMemory MCP
- **Interpretation:** Cross-tool, cross-app generic memory layer. Bigger ambition than Pebble. Cloud-leaning.
- **Tags:** competitive-alternative
- **Confidence:** HIGH

### EC008 — AGENTS.md de-facto standard
- **URL:** https://github.com/agentsmd/agents.md
- **Data:** Linux Foundation shepherded, used by Claude Code, OpenAI Codex CLI, Cursor, Aider, Devin, Copilot, Gemini CLI, Windsurf, Amazon Q. 60k+ projects.
- **Interpretation:** The market is converging on agent-agnostic file standards rather than tool-specific memory databases. Strategic opportunity for Pebble to be a generator/feeder.
- **Tags:** trend-signal, distribution-opportunity
- **Confidence:** HIGH

### EC009 — Anthropic's own positioning guidance
- **URL:** https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- **Date:** 29 September 2025
- **Verbatim summary:**
  > "structured note-taking during the session" as best practice + file-based memory recommended
- **Interpretation:** Validates Pebble's file-based markdown approach. But also: Anthropic owns the narrative on this — they're shaping how people think about it.
- **Tags:** category-frame, trend-signal
- **Confidence:** HIGH

### EC010 — Dev.to "Claude Code Forgets Everything Between Sessions"
- **URL:** https://dev.to/hw20200214/claude-code-forgets-everything-between-sessions-i-tested-5-fixes-199p
- **Verbatim quotes from the article:**
  > "It's a goldfish"
  > "Architectural reasoning evaporated"
  > "six active sessions...all context...lost"
- **Interpretation:** Documents the felt experience in user vocabulary. "Goldfish memory" is the customer-language metaphor.
- **Tags:** problem-language, vocabulary
- **Confidence:** HIGH

### EC011 — Letta Code (formerly MemGPT)
- **URL:** https://www.letta.com/blog/letta-code
- **Released:** April 2026
- **Mechanism:** "Memory-first coding agent" — purpose-built rather than memory bolted on
- **Interpretation:** Different category entirely — an alternative agent. Not direct competition for Pebble but proof the "memory-first" framing is being claimed.
- **Tags:** adjacent-product
- **Confidence:** HIGH

### EC012 — Anthropic Claude Dreaming (Research Preview)
- **Date:** 6 May 2026
- **Mechanism:** Scheduled background process that reorganizes memory
- **Interpretation:** Anthropic is investing in memory infrastructure long-term. The category will only get more contested.
- **Tags:** competitive-roadmap
- **Confidence:** HIGH

## Search-intent evidence (S)

(DataForSEO not yet queried for Pebble specifically — relying on web search signals from the broader research)

### S001 — Category language patterns observed
- **From search results across competitor research:**
  - "persistent memory" — used by claude-mem, MemPalace, MemNexus, Mem0 (commodity term)
  - "memory bank" — used by Cline (community convention)
  - "context engineering" — Anthropic's preferred frame
  - "agent memory" — Letta, Zep
  - "decision log" — rare, mostly engineering-blog usage
  - "structured note-taking" — Anthropic's recommended pattern
- **Interpretation:** "Persistent memory" is saturated language. Differentiated language opportunities: "decision log", "git-grained provenance", "structured note-taking".
- **Confidence:** MEDIUM

## Codebase / product-fact evidence (A)

### A1 — Pebble queues git commits with zero LLM calls
- **Source:** `src/extractor.ts:46-76`
- **Verbatim excerpt:**
  ```
  export function queueLastCommit(...) {
    const hash = getLastCommitHash(projectPath);
    ...
    const diffPatch = getDiffPatch(projectPath, hash, 6000);
    ...
  }
  ```
- **Claim:** Captures commits via post-commit hook + execSync git, stores raw in SQLite. No external API calls anywhere.
- **Confidence:** HIGH

### A2 — Pebble's MCP server tools require Claude Code to do the thinking
- **Source:** `src/mcp-server.ts` (entire file)
- **Claim:** Pebble provides 5 tools (remember, recall, forget, status, mark_processed). The LLM (Claude Code, on the user's existing subscription) makes the decisions about what's worth remembering. No separate inference, no separate API.
- **Confidence:** HIGH

### A3 — Multi-project architecture (v0.2.0)
- **Source:** `src/mcp-server.ts:71-128` (`getProjectContext`)
- **Claim:** Single registered MCP server handles unlimited projects. Auto-initializes `.pebble/` in unfamiliar paths.
- **Confidence:** HIGH

### A4 — Global CLAUDE.md MANDATORY injection
- **Source:** `src/generator.ts:240-302` (`ensureGlobalClaudeMdPebble`)
- **Claim:** Writes rules into `~/.claude/CLAUDE.md` so every Claude Code session loads them regardless of project.
- **Confidence:** HIGH

### A5 — Markdown context-tree is git-trackable by default
- **Source:** `.gitignore` (commit 7130b36) + `src/context-tree.ts`
- **Claim:** `.pebble/memory.md` and `.pebble/context-tree/` are designed to be committed. SQLite DB stays per-machine.
- **Confidence:** HIGH

### A6 — Five canonical categories with rationale enforcement
- **Source:** `src/types.ts:6-11`
- **Claim:** decision / pattern / context / learning / todo — every memory is one of these. Schema-enforced.
- **Confidence:** HIGH

### A7 — Local-only, no API keys, no cloud
- **Source:** `package.json` (no http/fetch deps beyond MCP SDK), `src/extractor.ts` (only `execSync git`)
- **Claim:** Pebble cannot phone home. There is no telemetry, no auth, no cloud component.
- **Confidence:** HIGH

### A8 — README claim that doesn't yet hold
- **Source:** `README.md:34-36`
- **Verbatim:** `npm install -g pebble-memory`
- **Status:** Package not yet published to npm. Misleading on first-run for users.
- **Confidence:** HIGH
- **Tag:** marketing-baggage

## Calculated evidence (C)

### C1 — Token-cost differential vs. LLM-based competitors
- **Inputs:**
  - claude-mem & claude-memory-compiler use Claude Agent SDK for extraction (subscription tokens)
  - Pebble uses zero LLM calls at capture time
- **Claim:** A user who already has Claude Code Pro/Max subscription pays zero incremental cost for Pebble's capture. Competitors burn user-budget tokens on every commit/session.
- **Confidence:** HIGH (architectural fact)

### C2 — Cross-machine sync via git, not cloud
- **Inputs:**
  - `.pebble/context-tree/` committable
  - SQLite DB regenerable
- **Claim:** Two-machine sync requires zero infrastructure: git push on machine A, git pull on machine B. Knowledge propagates losslessly. No SaaS, no API.
- **Confidence:** HIGH

## NEEDS-PROOF tracker

| Claim wanted on page | Why no proof yet | What would constitute proof |
|---|---|---|
| "X hours/week saved" | No user studies | Survey of 20+ users after 4 weeks |
| "N% better context retention" | No benchmark | Reproducible benchmark comparing session-N outputs with/without Pebble |
| "Used by N teams" | Pre-launch, only Max | Public adoption metric (GitHub stars + active project count) |
