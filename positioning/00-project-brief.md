# Project Brief: Pebble

_Generated: 2026-05-20 | Source: codebase scan + conversation context with Max_

## 1. Product as built (from codebase)

**One-line description (Claude's words, from code):**
Pebble is a local-first MCP server + git post-commit hook + structured markdown system that gives any AI coding assistant (Claude Code first) persistent memory across sessions, without any LLM API calls of its own.

**Tech stack:**
- Language/Runtime: TypeScript, Node.js (ESM, Node 18+)
- Database/Storage: better-sqlite3 (WAL mode), local file
- Protocol: Model Context Protocol (MCP) via @modelcontextprotocol/sdk ^1.12.1
- CLI: commander + chalk
- Validation: zod
- Distribution model: Currently git clone + npm build. Intended: `npm install -g pebble-memory`
- No external API dependencies, no http/fetch usage in capture path

**Feature inventory (from code):**
- `src/extractor.ts:46` — Captures commit hash, message, --stat diff, and 6000-char-capped patch into SQLite via post-commit git hook
- `src/mcp-server.ts:135-374` — 5 MCP tools: pebble_remember, pebble_recall, pebble_forget, pebble_status, pebble_mark_processed
- `src/mcp-server.ts:71-128` — Auto-init in unfamiliar projects (creates .pebble/, gitignore entries, git hook, CLAUDE.md pointer)
- `src/generator.ts:204-228` — Pointer injection in project CLAUDE.md (non-destructive, single line)
- `src/generator.ts:240-302` — MANDATORY rules block injection into `~/.claude/CLAUDE.md` (global)
- `src/context-tree.ts` — Markdown file generation per category (decisions/, patterns/, context/, learnings/, active-work/) plus index README
- `src/types.ts:6-11` — 5 enforced categories: decision, pattern, context, learning, todo
- `src/db.ts:24-43` — Per-project connection cache, schema init, WAL mode
- `src/index.ts` — CLI with 8 commands: init, capture, add, search, forget, status, generate, hooks install/uninstall

**Integrations:**
- Git (via post-commit hook + execSync calls) — every modern dev environment has this
- Claude Code (via MCP) — primary target
- Any MCP-capable AI tool (Cursor MCP support, generic MCP clients) — latent capability

**Data/entity model:**
- Memory (id, project_id, category, content, source, created_at, updated_at, relevance 0-1 decaying, superseded_by, tags)
- Project (id, path, name, created_at)
- QueuedCommit (id, project_id, hash, message, diff_summary, diff_patch, created_at, processed)
- Session (designed but unused so far)

**Deployment model:**
Self-hosted, single binary per machine. Each project gets its own `.pebble/` directory.

**Maturity signals:**
- Currently v0.2.0 (just committed 7130b36)
- Initial commit Feb/Mar 2026 (dogfooded since 2026-03-11)
- Single dev (Max), open-source intended, no users yet
- Has its own .pebble/ memory (4 stored, 1 commit reviewed)

## 2. Existing marketing materials inventory

| File | What it claims | Backed by code? |
|---|---|---|
| README.md | "Automatic persistent memory for AI coding assistants. Small stones, big picture." | Partial — automatic is true; "small stones" is metaphor |
| README.md quickstart | `npm install -g pebble-memory` | **NO** — package not on npm |
| README.md tagline | "Zero Config. No API Keys. Your CLAUDE.md Is Sacred." | Yes — codebase enforces |
| README.md comparison table | Pebble vs ByteRover vs Manual CLAUDE.md | Yes |
| CLAUDE.md (project) | Architecture rules + 3-file system explanation | Yes |
| soul.md | Customized for Max (German voice, mindset, anti-patterns) | Self-described |

## 3. User's stated positioning (verbatim, baggage)

**On the value:**
> "das ziel muss eben sein, dass du ständig selbständig dazulernst und in jeder neuen sitzung weißt was sache ist und was wir gemacht, besprochen, entschieden und so weiter haben. du setzt auch oft was um und verbesserst dich dann selber weil du feststellst, dass es eben nicht so funktioniert hat wie du dir das im ersten gedanken vorgestellt hast. und das automatisch. und im besten fall noch maschinen übergreifend."

**On the immediate pain:**
> "das problem habe ich ja gerade mit meinem laptop, dass er nicht auf dem gleichen stand ist wie mein desktop und sich alles neu anschauen muss und wir alles 'neu entdecken müssen'."

**On the goal:**
> "ich möchte ein system das zuverlässig ist und auf das ich mich 100% verlassen kann."

**On the business model:**
> "wir wollen das open source machen also es gibt keinen finanziellen anreiz dafür. und natürlich nutze ich das ständig selber."

**On the core mechanism (re-stated):**
> "je weniger context window wir verschwenden um sachen zu übertragen desto besser sind wir oder? natürlich muss das so gut sein dass eben kein context verloren geht. das ist ja der marktwert."

**Business goal (12 months):** Not revenue. Implicit goal: an open-source project that is (a) good enough that Max uses it daily and trusts it 100%, (b) good enough that other Claude Code power-users adopt it, (c) survives the competitive landscape. **No paid tier.**

**Constraints:**
- Name committed: "Pebble" (locked)
- License model committed: MIT, open-source (locked)
- No revenue / no paywall (locked)
- Must run locally (Max's principle — no cloud for tooling)
- Must work on Windows (Max's primary OS) — but cross-machine is a feature, so Mac/Linux too

## 4. Gaps between code and pitch

- **README says `npm install -g pebble-memory`** — but package isn't on npm. First-run trust breaker.
- **README tagline "Zero Config"** — true after init, but init isn't installed easily yet
- **CLAUDE.md project pitch is feature-listy** ("git hook queues, MCP server, 6 tools, soul.md template") — no value framing
- **Tagline "Small stones, big picture"** — cute but doesn't communicate what Pebble does. Reader has to read further to find out.

## 5. Latent strengths (under-marketed)

- **Zero LLM cost** is the biggest architectural-differentiator-as-value, and the README barely mentions it. All competitors (claude-mem, claude-memory-compiler) burn user-subscription tokens. Pebble doesn't.
- **Git-commit as memory-trigger** is genuinely novel positioning — nobody else does this. README mentions the mechanism but doesn't make it a story.
- **Trackable context-tree** = team-sharable knowledge via git. This is the only solution where Pebble's output naturally syncs with normal dev workflow. README mentions it but doesn't headline it.
- **Anti-claude-mem security narrative** — Pebble is by-design more secure (no server, no API keys, no port). Currently un-positioned.

## 6. Tooling status

- web_search: ✅ (used in prior research)
- web_fetch: ✅ available
- DataForSEO MCP: ⚠️ available but NOT QUERIED yet — Max's open-source/no-revenue model lowers the SEO value of this. Decision: skip DataForSEO for category validation in Phase 7 since we don't need paid-keyword data; rely on the strong web-search/HN/GitHub evidence we already have.

## 7. Execution mode

Pragmatic accelerated path — Phases 0/1/2 consolidated using existing evidence, Phases 3-7 full depth, Phase 8 skipped (trend obvious — AI tooling explosion + post-subscription-fatigue), Phases 9-10 full depth as deliverables. Phases 11-12 deferred (not a marketing site, output target is README + GitHub repo description + plugin marketplace listing).

## 8. Open questions before Phase 7 / 9 final decision

- Does Max prioritize (a) Pebble for himself getting better, (b) Pebble as an open-source community thing, or (c) both equally? — Both equally per user statement. Carry forward.
- What is acceptable "trust" level? — "100% verlässlich" per user. This becomes a positioning requirement, not just a value claim.
- Should Pebble eventually integrate with Anthropic's native Auto Memory or stay parallel? — Open question for Phase 7.
