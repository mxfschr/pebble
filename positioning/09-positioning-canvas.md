# Positioning Canvas: Pebble

_Locked: 2026-05-20. Any change requires re-running the upstream phase that originated the change._

## 1. The canvas (Dunford format)

### Product name and one-line description

**Pebble**

Pebble is open-source, git-native memory for Claude Code that keeps your AI's context out of the context window — recalled on demand, not pre-loaded every session.

### Market category

**Market category:** AI memory for Claude Code (the broader frame, for findability)
**Subcategory:** Git-native AI memory (the wedge — the frame we lead with)
**Style:** Big-Fish-Small-Pond — frame-bend out of commodity "persistent memory" into "memory that lives in your repo"

### Competitive alternatives

Ranked from best-fit user perspective:

1. **Anthropic Claude Code Auto Memory** (Cluster 1) — the new native baseline. 200-line auto-load cap; machine-local; can't be shared across machines.
2. **claude-mem** (Cluster 2) — dominant third-party (77k stars). Vector search + lifecycle hooks. But burns subscription tokens at every capture and has documented security issues.
3. **Manual CLAUDE.md** (Cluster 1) — the original. Free but manual, machine-local, no structure.
4. **AGENTS.md / Cline Memory Bank** (Cluster 3) — file-standard alternatives. Cross-tool but manual.
5. **Do nothing** (Cluster 5) — perfectly fine for sub-50-hour Claude Code users.

### Unique attributes

| Attr ID | Attribute | Validation strength |
|---|---|---|
| A1 | Zero LLM API calls during capture (uses your existing Claude session as the intelligence layer) | STRONG (architectural, package.json + extractor.ts) |
| A2 | Git commit as the memory-capture trigger (commit-grained provenance) | STRONG (no competitor does this) |
| A3 | Knowledge ships in the git repo via committable markdown context-tree | STRONG (gitignore + context-tree.ts) |
| A4 | Hybrid SQLite (per-machine, fast queries) + markdown (per-repo, portable) | STRONG (codebase) |
| A5 | No network surface, no HTTP server, no auth (security by architecture) | STRONG (vs claude-mem CVEs) |
| A6 | Five enforced semantic categories: decision / pattern / context / learning / todo | MEDIUM (structural choice) |
| A* | Recall-on-demand, not pre-load-every-session (context-window-efficient) | STRONG (MCP architecture vs Anthropic 200-line cap) |

### Value (mapped to themes)

| Theme | Strongest proof | Customer-language quote |
|---|---|---|
| **T1: Memory that costs nothing.** Zero tokens at capture; sync via git you already run; no SaaS, no API keys, no cloud bill. | Pebble's `package.json` has zero LLM-API dependencies in the capture path. (vs. claude-mem which uses Claude SDK = your subscription tokens) | None yet (pre-launch). Closest: U1 — "100% verlässlich" (which connects to no-third-party-failure) |
| **T2: Decisions you can trace back to the commit.** Every memory is anchored to a specific git commit — so you can answer "why did we decide X?" by reading both the diff and the reasoning. | Pebble queues every commit's hash + diff via post-commit hook. No competitor maps memory to commits. | U1: "was wir gemacht, besprochen, entschieden" / EC010: "Architectural reasoning evaporated" |
| **T3: Knowledge ships with the code.** Pebble writes markdown into `.pebble/context-tree/` — committable, team-shareable, cross-machine sync via `git pull`. | Two-machine setup needs zero infrastructure beyond your existing git remote. | U1: "maschinen übergreifend"; U1: "das problem habe ich ja gerade mit meinem laptop" |

### Who cares a lot

> Solo or 2-person devs who run Claude Code as their primary AI assistant across 2+ machines, have racked up 50+ hours of Claude Code time, commit to git regularly, and have felt the pain of starting a new session on a machine that doesn't know what the other one knows.

### Relevant trend

**Trend: "Knowledge-as-code" / AGENTS.md convergence.** EC008: 60k+ projects, 9+ tools reading AGENTS.md. The industry is moving toward agent-agnostic markdown files committed to repos as the canonical knowledge artifact. Pebble fits this trend natively — and can position as the *engine* that fills the file, not a competitor to the standard.

## 2. Short version (paragraph, 90 words)

> Pebble is open-source, git-native memory for Claude Code. Unlike Anthropic's built-in Auto Memory (which caps at 200 lines and lives on one machine) or third-party tools like claude-mem (which burns subscription tokens at every capture), Pebble queues commits via a git hook and lets Claude itself decide what to remember — using your existing session, not a separate API. Knowledge lives in committable markdown inside your repo, syncs across machines via `git pull`, and gets recalled on demand instead of pre-loaded into every session.

## 3. Anti-statement

- We are **not** a vector-search memory store. claude-mem does that better.
- We are **not** a cross-tool memory layer (yet). Mem0 covers Cursor + Claude + Windsurf; Pebble is Claude Code first.
- We are **not** an AI agent. Pebble doesn't run an AI. The AI you already pay for (Claude Code) does the thinking. Pebble is the bookkeeping.
- We are **not** for casual users who never hit the 50-hour Claude Code threshold. CLAUDE.md is enough for them, and that's fine.
- We do **not** optimize for "biggest possible memory store." We optimize for **what you can recall when you need it, while spending the least context window getting there**.
- We do **not** charge, upsell, or run a paid tier. Pebble is MIT, no SaaS, no premium — and that's locked.

## 4. Proof inventory

| Claim | Proof type | Source | Quote/Data | Confidence |
|---|---|---|---|---|
| Zero LLM calls at capture | Codebase | src/extractor.ts, package.json | No HTTP/LLM SDK in extractor path | HIGH |
| Git commit as trigger | Codebase | src/hooks.ts | Post-commit hook installs by default | HIGH |
| Committable markdown context-tree | Codebase | .gitignore + src/context-tree.ts | tree files outside ignore list | HIGH |
| Cross-machine sync via git | Architectural | C2 calculation | DB excluded from git, markdown included → `git pull` rehydrates | HIGH |
| No network surface | Codebase | package.json (no http server deps) | grep finds no `listen()` or `createServer()` | HIGH |
| claude-mem burns subscription tokens | Competitor evidence | EC001 docs | claude-mem uses Claude Agent SDK for summarization | HIGH |
| Anthropic Auto Memory 200-line cap | Competitor evidence | EC005, Issues #25006/#39811 | Documented by Anthropic + multiple user complaints | HIGH |
| claude-mem security issues | Competitor evidence | EC002 | Issue #1251 — unauth API, cleartext keys, path traversal | HIGH |
| Decisions traceable to commits | Architectural | A2 | Every memory has commit hash via queue table | HIGH |
| "Cross-machine pain is real" | User testimony | U1 (Max) | "alles neu entdecken müssen" | LOW (n=1 but high-signal) |
| "Goldfish memory" felt experience | Public evidence | EC010 | Dev.to article quote | MEDIUM |

## 5. Sanity check against failure modes

| Failure mode | Risk for Pebble | Mitigation |
|---|---|---|
| Prospects can't figure out what we sell | MEDIUM — "git-native memory" is novel, needs concrete visual | README screenshot of `.pebble/context-tree/` directory; hero shows the artifact, not the abstraction |
| Long sales cycles, low close rate | LOW — open source, install is `npm install` (once published) + `pebble init` | Make install actually one-command (P0 todo: npm publish) |
| High churn (users install, abandon) | MEDIUM — most likely failure mode for OSS dev tools | Mitigation: MANDATORY block in CLAUDE.md (A7) keeps Pebble used in every session, building habit |
| Price pressure | N/A — free OSS | No mitigation needed; "free" is positioning advantage vs. paid alternatives like Mem0 cloud |

Additional Pebble-specific failure modes:

| Failure mode | Risk | Mitigation |
|---|---|---|
| User installs claude-mem first by habit | HIGH — claude-mem owns the npm install path | Plugin Marketplace listing (P0 todo); honest "vs claude-mem" page that doesn't try to win on features |
| Anthropic copies the git-native angle | MEDIUM | Be there first; the markdown-in-repo artifact is harder to replicate without changing their data-isolation model |
| OSS abandonment by Max | HIGH — solo dev burnout is real | Mitigation: small surface area = low maintenance burden; v0.2.0 architecture should survive 1+ year of bugfix-only mode if Max steps back |

## 6. Locked elements (do not change without upstream re-run)

- **Category:** AI memory for Claude Code (broader frame); Git-native AI memory (lead subcategory)
- **Segment:** Solo/2-person devs running Claude Code across multiple machines
- **Value themes:** T1 (cost nothing), T2 (decisions traceable), T3 (knowledge in repo)
- **Unique attributes:** A1, A2, A3, A4, A5, A6 + recall-on-demand
- **Style:** Big-Fish-Small-Pond with frame-bend out of commodity "persistent memory"
- **Anti-position:** not a vector-search tool, not a cross-tool layer, not an AI agent

## 7. Confidence summary

| Element | Confidence | Bottleneck |
|---|---|---|
| Category | MEDIUM-HIGH | Pre-launch validation pending |
| Segment | MEDIUM-HIGH | n=1 direct (Max), pattern-matched to HN/Reddit |
| Value themes | HIGH | Architectural facts |
| Attributes | HIGH | Codebase-anchored |
| Alternatives ranking | HIGH | Strong competitive data from prior research |

**Overall positioning confidence:** MEDIUM-HIGH

**Key uncertainty:** Whether "git-native" resonates as a frame with users beyond Max. Will be tested in first 30 days post-launch via README A/B variations and feedback collection.

**Decision rule if user adoption tells a different story:** If 50%+ of early users describe Pebble as "persistent memory" not "git-native memory", drop the frame-bend and accept Option B (sharpened commodity). The wedge stays in the body copy as differentiators.
