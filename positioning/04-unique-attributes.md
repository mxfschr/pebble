# Unique Attributes — Pebble

_All attributes codebase-anchored (see evidence-log A-entries). All "unique" claims validated against Cluster 1 (Anthropic Auto Memory) and Cluster 2 strongest (claude-mem)._

## 1. Comparison matrix

| Attribute | Pebble | Claude Auto Memory | claude-mem | Manual CLAUDE.md | AGENTS.md | Validation |
|---|---|---|---|---|---|---|
| Zero LLM API calls for capture | ✅ A1, A2, C1 | ✅ (Anthropic's own infra) | ❌ uses Claude SDK = user tokens | ✅ | ✅ | STRONG (architectural) |
| Git commit as capture trigger | ✅ A1 | ❌ session-based | ❌ session-hook based | ❌ manual | ❌ manual | STRONG (Pebble unique) |
| Knowledge committable to git | ✅ A5 | ❌ machine-local in ~/.claude/ | ❌ local SQLite | ✅ (it IS git) | ✅ (it IS git) | STRONG (Pebble differentiates from auto tools) |
| No 200-line auto-load cap | ✅ structured + recall on demand | ❌ documented 200/25KB cap | ✅ | depends on file size | depends | STRONG (Anthropic gap) |
| Enforced 5-category schema | ✅ A6 | ❌ free-form | ✅ has categories | ❌ free-form | ❌ free-form | MEDIUM (others have some structure) |
| Auto-init in unfamiliar projects | ✅ A3 | ✅ session-creates | ✅ install per project | N/A | N/A | MEDIUM (table stakes for memory tools) |
| Cross-machine sync without infrastructure | ✅ C2 (via git) | ❌ machine-local | ❌ machine-local | ✅ (via git) | ✅ (via git) | STRONG (vs Auto Memory & claude-mem) |
| No network surface (security) | ✅ A7 | ✅ | ❌ port 37777 (EC002) | ✅ | ✅ | STRONG (vs claude-mem) |
| MANDATORY global CLAUDE.md injection | ✅ A4 | N/A (Anthropic-native) | ✅ via /init pattern | ❌ manual | ❌ manual | MEDIUM (tactic, not value) |
| Markdown context-tree (human readable) | ✅ A5 | ✅ MEMORY.md flat | ❌ SQLite + ChromaDB | ✅ (the file IS the tree) | ✅ | MEDIUM (table stakes for human readability) |
| Per-machine SQLite + git-synced markdown (hybrid) | ✅ unique combo | ❌ | ❌ | ❌ | ❌ | STRONG (Pebble unique) |
| Open source, MIT | ✅ | N/A (proprietary, free) | ✅ Apache 2.0 | N/A | ✅ | table stakes in OSS space |

## 2. Confirmed unique attributes

### A1: Zero LLM API calls during capture
- **Description:** Pebble's capture path uses only `execSync('git ...')` and a SQLite insert. No HTTP calls, no LLM calls, no token consumption. The intelligence layer (deciding what to remember) happens in-context inside the user's existing Claude Code session — using subscription tokens the user is already paying for.
- **Source:** [src/extractor.ts:46-76](../src/extractor.ts), [src/mcp-server.ts](../src/mcp-server.ts), package.json (no http/openai/anthropic SDK deps in capture path)
- **Type:** consideration (a cost-conscious user evaluating tools cares about this immediately)
- **Category-defining?** Partial — it suggests categories like "build-in-public memory", "free-tier memory", "no-API memory". Not enough alone to anchor a category.
- **Alternatives that lack this:** claude-mem (EC001 — uses Claude SDK), claude-memory-compiler (uses Claude SDK), Mem0 (cloud-hosted compute)
- **Validation strength:** STRONG (architectural fact, verifiable from package.json + source)
- **Customer-quote proof:** None yet — pre-launch

### A2: Git commit as the memory-capture trigger (commit-grained provenance)
- **Description:** Pebble queues every commit (hash + message + --stat + 6KB-truncated patch) as a candidate memory. This means every memory can be traced back to "the commit that caused this" — and conversely, every commit gets reviewed for what to extract. No other tool does this.
- **Source:** [src/hooks.ts](../src/hooks.ts), [src/extractor.ts:46-76](../src/extractor.ts)
- **Type:** consideration AND retention (developers immediately recognize this as architecturally clean; long-term they value the audit trail)
- **Category-defining?** YES — strongly suggests "decision log" or "git-grained memory" framing
- **Alternatives that lack this:** ALL competitors. Cluster 1 (Anthropic) uses session events; Cluster 2 uses lifecycle hooks; Cluster 3 is manual; Cluster 4 is different products.
- **Validation strength:** STRONG (architectural fact)
- **Customer-quote proof:** Max's vocabulary aligns — `U1` mentions "was wir gemacht, besprochen, entschieden" (what we did, discussed, decided)

### A3: Knowledge that ships in the git repo (context-tree as code)
- **Description:** Pebble's `.pebble/context-tree/` is markdown, committed alongside the codebase. Team members pulling the repo also pull the accumulated decisions/patterns/learnings. SQLite DB stays per-machine (not committed) but regenerates from the tree.
- **Source:** [.gitignore](../.gitignore) (post-commit 7130b36) — excludes `.pebble/memory.db*` and `.pebble/config.json` but tracks `.pebble/memory.md` and `.pebble/context-tree/`. README explicitly notes this design.
- **Type:** consideration (for team/multi-machine users) AND retention (long-term knowledge survives across team changes)
- **Category-defining?** YES — frames Pebble as "memory as code" / "knowledge artifact" rather than "SaaS storage"
- **Alternatives that lack this:** Anthropic Auto Memory (machine-local), claude-mem (SQLite blob), Mem0 (cloud)
- **Validation strength:** STRONG (config files demonstrate intent)
- **Customer-quote proof:** Max's pain — `U1` explicitly mentions cross-machine as core requirement

### A4: Hybrid storage — SQLite for queries, markdown for sharing
- **Description:** Per-machine SQLite gives fast structured queries (relevance decay, supersession, recall by tag). Per-repo markdown gives human-readable, git-trackable, team-shareable artifacts. Both auto-regenerate from the same source-of-truth.
- **Source:** [src/db.ts](../src/db.ts) + [src/context-tree.ts](../src/context-tree.ts)
- **Type:** retention
- **Category-defining?** No (architectural, not story-worthy)
- **Alternatives that lack this:** claude-mem has SQLite only; Anthropic has files only; Mem0 has cloud DB only
- **Validation strength:** STRONG (codebase fact)

### A5: No network surface, no auth, no cloud
- **Description:** Pebble has zero HTTP server, zero API keys, zero cloud dependency. Cannot leak data. Cannot be hijacked. Cannot phone home.
- **Source:** [package.json](../package.json) (no http server deps), code grep confirms no `listen()` or `createServer()` outside MCP stdio
- **Type:** consideration (privacy-leaning users) + retention (compliance)
- **Category-defining?** Partial — supports "local-first memory" framing
- **Alternatives that lack this:** claude-mem has port 37777 with documented security issues (EC002), Mem0 is cloud
- **Validation strength:** STRONG (architectural)

### A6: Five enforced memory categories with semantic intent
- **Description:** Every memory is one of: `decision`, `pattern`, `context`, `learning`, `todo`. The schema enforces it; the recall/decay/UI all use it. Forces the AI to think structurally about what's being remembered.
- **Source:** [src/types.ts:6-11](../src/types.ts)
- **Type:** retention (over time, structured beats unstructured for recall)
- **Category-defining?** No (mechanism, not story)
- **Alternatives that lack this:** Anthropic Auto Memory (flat), CLAUDE.md (flat), AGENTS.md (flat); claude-mem has some categorization but less rigid
- **Validation strength:** MEDIUM (structural choice, value is qualitative)

### A7: Global MANDATORY instruction injection
- **Description:** `pebble init` writes a rules block into `~/.claude/CLAUDE.md` (the user's global Claude Code memory) — so Pebble's tools get used in every session of every project, not just where `.pebble/` lives.
- **Source:** [src/generator.ts:240-302](../src/generator.ts)
- **Type:** mechanism, not user-facing value
- **Category-defining?** No
- **Alternatives that lack this:** None do this. But this is more "how Pebble enforces itself" than a user-facing value. Position it carefully — over-injection into global CLAUDE.md is a real concern (Anthropic warns about >200 line CLAUDE.md degrading adherence).
- **Validation strength:** STRONG (codebase fact)
- **Tag:** mechanism — supports trust but not a headline value

## 3. Demoted attributes (we thought were unique but aren't)

| Attribute | Why demoted | Where it goes instead |
|---|---|---|
| "Persistent memory across sessions" | Commodity — every Cluster 2 tool has this, Anthropic Auto Memory has this | Table stakes; mentioned but not headline |
| "Local-first" | Most Cluster 2 tools are also local; AGENTS.md is local by nature | Table stakes within Cluster 2; differentiator vs cloud tools |
| "Open source" | claude-mem is also Apache 2.0; Mem0 is open core | Table stakes in OSS space |
| "MCP-based" | All Cluster 2 tools use MCP now | Table stakes for the category |
| "Markdown human-readable" | AGENTS.md, CLAUDE.md, Cline Memory Bank are all markdown | Table stakes |
| "soul.md AI personality" | Subjective; no evidence customers want this; no competitor benchmark; doubles file count without clear win | DROP from positioning. Keep as feature in product, but not in headline messaging. (See vocab-baggage T-decisions.) |

## 4. Table-stakes attributes (we have, everyone has)

- Markdown file output
- MCP server interface
- Open source license
- Per-project initialization
- Some kind of tagging/categorization

These belong on a "features" page or feature comparison, but never as headline differentiators.

## 5. Notes for downstream phases

- **Phase 5 (value):** Strongest unique attributes for value mapping: A1 (zero cost), A2 (commit provenance), A3 (git-shipped knowledge), A5 (security).
- **Phase 7 (category):** A2 and A3 strongly suggest categories like "Git-grained decision log", "Memory-as-code", "Knowledge-as-commit-artifact". Default category "persistent memory" is too commodity given A1/A2/A3 differentiation.
- **Phase 10 (sales story):** Hero proof = A1 (zero LLM cost). Honest anti-claim = "we don't do vector search; claude-mem does that better."
- **Phase 12 (deferred):** Vs-claude-mem page should lead with A1, A2, A3, A5. Vs-Anthropic-Auto-Memory page should lead with A2, A3, the unbounded-recall vs. 200-line-cap angle.
