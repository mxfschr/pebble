# Competitive Alternatives — Pebble

_Ranked from best-fit user's perspective: what they would actually use if Pebble didn't exist._

## Best-fit user assumption (carried forward, refined in Phase 6)

A solo or small-team developer who:
- Runs long Claude Code sessions across days/weeks
- Works on multiple projects (or one large one with many subsystems)
- Owns 2+ machines (e.g., desktop + laptop) and switches between them
- Cares about cost (subscription-conscious) and privacy (local-first preference)
- Is technically capable enough to install a CLI tool and configure an MCP server

This is who Max is, and the segment HN/Reddit evidence (EC003) points to: power-users who notice the limits of Claude Code's defaults.

## Cluster 1: Native Anthropic memory (the baseline)

**One-sentence description:** What Claude Code does out of the box — CLAUDE.md files + the new Auto Memory feature in v2.1.59+.

**Frequency in evidence:** Universal — every Claude Code user starts here. Many never leave (per HN skeptics in EC003).

### Alternatives in this cluster
- **Anthropic Claude Code Auto Memory** (EC005) — v2.1.59+, writes to `~/.claude/projects/<project>/memory/MEMORY.md`, auto-loads first 200 lines
- **Manual CLAUDE.md files** — the original mechanism, manually maintained
- **`@`-import system** — referencing other markdown files from CLAUDE.md

### Why users currently choose this cluster (steel-manned)
It's free, built-in, requires no setup, doesn't require trusting a third party. The HN top comment captures it: *"A claude.md file will give you 90% of what you need."* For most users, especially under 50 hours of usage, this is genuinely enough.

### Pain points with this cluster (from evidence)
- **200-line hard cap, silent truncation.** [Issue #25006](https://github.com/anthropics/claude-code/issues/25006) and [#39811](https://github.com/anthropics/claude-code/issues/39811) — "newest entries silently dropped" — the most recent (and often most relevant) lessons get lost
- **Manual maintenance burden** — users have to remember to update CLAUDE.md, which is exactly the kind of meta-work that gets dropped
- **Machine-local** — no cross-machine sync
- **No structured categories** — everything is one flat file
- **No git provenance** — can't trace why a decision was made or when

### Where this cluster is weakest (Phase 4 setup)
- Memory grows but the 200-line auto-load doesn't grow with it
- No notion of "this learning came from commit X" or "this decision superseded that one"
- No cross-project knowledge

## Cluster 2: Dedicated memory tools (Pebble's direct competition)

**One-sentence description:** Third-party MCP servers / CLI tools that add persistent memory to Claude Code, typically by hooking into the session lifecycle and using an LLM to summarize.

**Frequency in evidence:** This is the active category. Multiple tools, growing fast.

### Alternatives in this cluster
- **[claude-mem](https://github.com/thedotmack/claude-mem)** (EC001) — 77.1k stars, SQLite + ChromaDB vector search, 5 lifecycle hooks, npx-install. **Dominant player.** Uses Claude SDK for summarization (subscription tokens).
- **[claude-memory-compiler](https://github.com/coleam00/claude-memory-compiler)** — 1.1k stars, markdown index, SessionEnd/PreCompact hooks, Claude SDK for extraction
- **[Mem0 + OpenMemory MCP](https://github.com/mem0ai/mem0)** (EC007) — 56.3k stars, cross-tool memory layer, hybrid retrieval, cloud-leaning
- **[mcp-memory-service (doobidoo)](https://github.com/doobidoo/mcp-memory-service)** — knowledge-graph + REST API
- **memory-mcp (yuvalsuede)** — newer entrant
- **MemPalace** / **MemNexus** — newer cloud-backed offerings
- **Anthropic reference [server-memory](https://github.com/modelcontextprotocol/servers/tree/main/src/memory)** — official MCP knowledge-graph reference

### Why users currently choose this cluster (steel-manned)
Solves the 200-line problem. Auto-summarization removes the manual-maintenance burden. claude-mem in particular is one-command install (`npx claude-mem install`) and lives in the official Plugin Marketplace, so discovery is solved.

### Pain points with this cluster (from evidence)
- **Burns subscription tokens.** claude-mem and compiler use Claude SDK for summarization → user pays per memory. C1 calculation: zero-LLM-cost Pebble vs. token-burning competitors is a real economic difference for heavy users.
- **claude-mem security issues** (EC002) — unauthenticated HTTP API, cleartext API keys, path traversal. Documented openly.
- **Lossy extraction.** LLM summarization at capture time can hallucinate or compress important detail. Pebble's "queue raw, extract later, in-context" pattern is architecturally superior on this axis.
- **Local SQLite only, no team sync.** Knowledge is per-machine, can't be committed to repo.
- **No commit provenance** — they capture session events, not git events. Can't answer "why did we make this decision in this commit?"

### Where this cluster is weakest (Phase 4 setup)
- Token cost (Pebble has zero)
- Security posture (Pebble has no network surface)
- Team/cross-machine knowledge sharing (Pebble's git-trackable context-tree)
- Commit-level provenance (Pebble's git-hook trigger)

## Cluster 3: File-based standards (the convergence trend)

**One-sentence description:** Agent-agnostic markdown file conventions that all major tools read.

**Frequency in evidence:** EC008 — AGENTS.md is in 60k+ projects, read by 9+ tools.

### Alternatives in this cluster
- **AGENTS.md** (EC008) — the de-facto standard, Linux Foundation shepherded
- **CLAUDE.md** — Claude Code's native, also imported by other tools
- **CONVENTIONS.md** (Aider's convention)
- **.cursorrules** (Cursor's convention; being deprecated in favor of Rules)
- **Cline Memory Bank** — community pattern, 4 markdown files (projectbrief.md, activeContext.md, systemPatterns.md, techContext.md)

### Why users currently choose this cluster (steel-manned)
Tool-agnostic. Works with every IDE. Survives tool churn. No special install. Team-shareable via git. It's the *correct* long-term answer to memory in a multi-tool world.

### Pain points with this cluster (from evidence)
- **Manually maintained.** Same problem as raw CLAUDE.md.
- **No structure beyond what the user writes.** No categories enforced, no decay, no superseding.
- **Doesn't capture session-level insights.** Only what the user remembers to write down.

### Where this cluster is weakest (Phase 4 setup)
- Capture automation (Pebble auto-captures from commits)
- Structured categories (Pebble enforces 5)
- Decay/relevance over time (Pebble has built-in decay)

### Strategic note for Phase 7
Pebble can **complement** this cluster rather than compete with it. Pebble could generate an AGENTS.md snapshot as one of its outputs — making Pebble the *engine* feeding the *standard*. This is a real positioning opportunity.

## Cluster 4: Adjacent agent platforms

**One-sentence description:** Different products entirely — memory-first agents rather than memory-for-existing-agent. Different category but worth knowing as alternatives some users might consider.

### Alternatives in this cluster
- **Letta Code** (EC011) — purpose-built memory-first coding agent
- **Cursor** — different IDE entirely (note: removed its Memories feature in 2025, EC004 — anti-validation)
- **Zep / Graphiti** — temporal knowledge graph, more enterprise-oriented

### Why users would choose this cluster
Sometimes the right answer is "use a different agent". If memory matters that much, switching agents may be the choice.

### Why this cluster is NOT direct competition for Pebble
Pebble is a Claude Code add-on. A user who switches agents abandons Pebble entirely. These tools aren't competing for the same install — they're competing for the same wallet/attention/time.

### Where this cluster is weakest
- Switching cost (high — entire workflow change)
- Forcing users to abandon a tool they otherwise like (Claude Code)

## Cluster 5: Do nothing / status quo

**One-sentence description:** Live with the limitation. Manually rebuild context each session. Tolerate the friction.

**Frequency in evidence:** Per HN skeptics in EC003: "A claude.md file will give you 90% of what you need" — many users genuinely do nothing more than this.

### Why users choose this
- It works well enough for shorter sessions
- Adding a memory tool is meta-work that doesn't feel productive
- Skepticism that tools actually improve outcomes (per top HN comment: *"there's never any evidence or even attempt at measuring any metric of performance improved"*)

### Where this is weakest
- Long sessions (50+ hours per HN comment threshold)
- Multi-project work
- Cross-machine work (Max's exact pain — U1)

## Master ranked list (flat, from best-fit user perspective)

1. **Anthropic Claude Code Auto Memory** (Cluster 1) — the new baseline as of Feb 2026
2. **claude-mem** (Cluster 2) — dominant third-party
3. **Manual CLAUDE.md** (Cluster 1) — pre-Auto-Memory default
4. **AGENTS.md / Cline Memory Bank** (Cluster 3) — for users who care about cross-tool
5. **claude-memory-compiler** (Cluster 2) — alternative third-party
6. **Mem0** (Cluster 2) — for users who want cross-tool memory infrastructure
7. **Do nothing** (Cluster 5) — for users under the 50-hour threshold

## Confidence

| Cluster | Evidence count | Confidence |
|---|---|---|
| 1 Native Anthropic | EC005, EC006, EC009, EC012 | HIGH |
| 2 Dedicated memory tools | EC001, EC002, EC007 | HIGH |
| 3 File-based standards | EC008 | HIGH |
| 4 Adjacent agents | EC004, EC011 | HIGH |
| 5 Do nothing | EC003 | MEDIUM (inferred from skeptic comments) |

## Notes for downstream phases

- **Phase 4:** Compare Pebble's attributes specifically against claude-mem (strongest in Cluster 2) and Anthropic Auto Memory (strongest in Cluster 1).
- **Phase 7:** Strong signals for **Big-Fish-Small-Pond** style. Cluster 2 has a dominant leader (claude-mem) which we can't out-feature-list. Pebble's wedge is the subsegment that values zero-LLM-cost + git-trackable + cross-machine — a real subsegment, but smaller than the whole "memory for Claude Code" market.
- **Phase 11 (deferred):** "vs claude-mem" comparison page would be the most-trafficked alternatives page based on alternatives search volume; "vs Anthropic Auto Memory" page is the must-have explainer.
