# CLAUDE.md — Pebble

> Project-level instructions for working on the Pebble codebase itself.
> If you're a user of Pebble (not a contributor), see README.md.

## What Pebble Is

Open-source persistent memory for AI coding assistants (Claude Code first). Two layers:
- **Project memory** (per-repo, in `.pebble/`): captures decisions, patterns, learnings, context, todos.
- **User memory** (global, in `~/.pebble/user/`): captures who the user is + how Claude should communicate with them.

Both are plain markdown + SQLite. Zero LLM API calls for capture — Claude (already running in the user's session) is the intelligence layer; Pebble is the bookkeeping. Local-first, no cloud, no auth.

**Tagline:** Git-native AI memory for Claude Code.

## Critical Architecture Rules

1. **Pebble NEVER overwrites the user's CLAUDE.md content.** It only injects a one-line pointer into the project CLAUDE.md on init, and a MANDATORY-block into the global `~/.claude/CLAUDE.md`. Existing content is preserved.

2. **`pebble init` is idempotent and non-destructive.** Specifically, init must NEVER overwrite an existing `.pebble/memory.md` — that file might have been pulled from another machine via git and overwriting it from a local-empty DB destroys synced content. (See v0.5.1 fix in `src/index.ts`.)

3. **Templates are GENERIC.** No hardcoded user names, projects, locations, or personal examples anywhere in `src/`, README, or default configs. `voice.md` and `about.md` templates use `[placeholders]` only. Each user fills them in themselves. The maintainer's personal content lives only in their local `~/.pebble/user/`, never in the repo.

4. **Memory files are the cross-machine source of truth.** `.pebble/memory.md` and `.pebble/context-tree/` are designed to be git-tracked by downstream users. The SQLite DB (`memory.db`) is per-machine and gitignored. Knowledge syncs via markdown; recall infrastructure rebuilds per machine.

## Architecture

```
commit → post-commit hook → `pebble capture` → queues diff in SQLite
                                              → regenerates .pebble/memory.md
                                              → regenerates .pebble/context-tree/
                                              → (if auto_sync) git add + commit + push
→ next Claude Code session reads memory.md per MANDATORY block
→ Claude calls pebble_remember / pebble_user_note / etc. via MCP
```

No LLM calls in the capture path. The git hook does `execSync('git ...')` + a SQLite insert. That's it.

## Source Files

```
src/
├── index.ts          — CLI (commander, project + user subcommands, version, init/capture/add/search/forget/status/generate/hooks/watch/user)
├── mcp-server.ts     — MCP server (9 tools: 5 project + 4 user)
├── db.ts             — SQLite layer (better-sqlite3, WAL), per-project connection cache
├── extractor.ts      — Commit queue (captures diffs via execSync git, NO LLM)
├── generator.ts      — Generates .pebble/memory.md, ensureClaudeMdPointer (project),
│                       ensureGlobalClaudeMdPebble (global)
├── context-tree.ts   — Writes memories as markdown in .pebble/context-tree/
├── hooks.ts          — Git post-commit hook installer
├── sync.ts           — Opt-in auto-sync via git (commit + push on remember, pull on session start)
├── user.ts           — User memory: voice/about/notes management + consolidation
└── types.ts          — Types, 5 memory categories, config defaults including auto_sync flag
```

## MCP Tools (9 total)

**Project memory (5):**
- `pebble_remember` — store memory with category + tags
- `pebble_recall` — search by keyword (currently substring match; FTS5 on roadmap)
- `pebble_forget` — remove by ID
- `pebble_status` — stats + unprocessed commit count
- `pebble_mark_processed` — clear commits from review queue

**User memory (4):**
- `pebble_user_note` — append observation to ~/.pebble/user/notes.md
- `pebble_user_recall` — search across voice/about/notes
- `pebble_user_status` — show file state + consolidation hint at 15+ notes
- `pebble_user_read` — read full content of voice/about/notes
- `pebble_user_write` — overwrite voice/about/notes (used for auto-consolidation)

All project-memory tools take a `project_path` parameter (absolute path to the project root). User-memory tools take no path — they always read `~/.pebble/user/`.

## Tech Stack

TypeScript, Node.js (ESM), SQLite (better-sqlite3), MCP SDK, Commander, Zod, Chalk. No external API deps. No HTTP server. No telemetry.

## Conventions

- MCP tools prefixed with `pebble_` (project) or `pebble_user_` (user)
- Memory sources: `"mcp"`, `"manual"` (currently — could grow with imports)
- 5 memory categories (enforced via type union): `decision`, `pattern`, `context`, `learning`, `todo`
- `.pebble/config.json` per project (gitignored), `auto_sync: false` by default
- All writes that could clobber synced state (init, generate) must be conditional on local-empty vs. synced-content

## Key Decisions

- **Pebble's own `.pebble/memory.md` and `context-tree/` are gitignored in THIS repo.** Downstream users typically track theirs (that's the value). But the Pebble tool itself shouldn't ship its development memory to people cloning it. See `.gitignore`.
- **soul.md was removed in v0.4.0.** Replaced by the `~/.pebble/user/` layer (voice.md + about.md + notes.md), which is a cleaner separation of concerns and grows dynamically via consolidation. Legacy soul.md is no longer created by init.
- **No background daemon.** Auto-sync hooks into MCP tool calls. Auto-consolidation hooks into session-start via the MANDATORY block. Both rely on Claude actually being in a session — no separate process.
- **Git is the approval layer for auto-consolidation.** No dialog. If Claude consolidates wrong, `git diff` and revert. Approval dialogs get muted within a week; diff-then-revert is honest and fast.

## Open Roadmap

**P0 — before npm publish + Plugin Marketplace submission:**
- DB auto-import from memory.md when DB is empty but markdown has content (the cross-machine UX gap discovered while dogfooding v0.5.1).
- npm publish so `npm install -g pebble-memory` works.
- Plugin Marketplace PR to `anthropics/claude-plugins-official`.
- FTS5 in `pebble_recall` for real search.

**P1:**
- AGENTS.md export — generate cross-tool-readable `.pebble/AGENTS.md` snapshot.
- Cross-tab Pebble bridge (Chat / Cowork / Code) once Windows MCP bug #42453 is fixed upstream.
- Optional `~/.pebble/user/` git-sync via separate dotfiles repo.

**P2:**
- `pebble blame <decision>` — show the commit diff that triggered the memory.
- `~/.pebble/global/` — third memory layer for cross-project but non-personal context.
- Cursor + other MCP-client first-class support.

## What's Already Done (for context)

v0.2.0 — multi-project MCP, auto-init, global MANDATORY-block injection.
v0.2.1 — positioning locked, README rewrite.
v0.2.2 — context-window efficiency fixes (~345 tokens saved per session).
v0.3.0 — opt-in auto-sync via `pebble watch enable` (commit + push on remember, pull on session start).
v0.4.0 — user memory layer (`~/.pebble/user/` with voice + about + notes).
v0.5.0 — auto-consolidation (Claude rewrites about.md from notes.md at session start when notes hit threshold).
v0.5.1 — bug fix: pebble init no longer overwrites existing memory.md.
