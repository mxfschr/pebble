# CLAUDE.md — Pebble

## What Pebble Is

Open-source persistent memory for AI coding assistants (starting with Claude Code). Auto-captures git commits, queues them, lets Claude Code process them into structured memories via MCP tools. Zero API keys, zero cost, local-first.

**Tagline:** Small stones, big picture.

## Critical Architecture Rule

**Pebble NEVER overwrites CLAUDE.md.** The user's CLAUDE.md is sacred — it contains their rules, workflow, identity. Pebble only:
1. Adds a one-line pointer on first `init` (non-destructive, one time)
2. Writes to `.pebble/memory.md` (auto-generated memories)
3. Writes to `.pebble/context-tree/` (detailed markdown files)
4. Creates `soul.md` template on init (only if it doesn't exist)

**The 3-file system:**
- `CLAUDE.md` — User's rules, identity, workflow (MANUAL, Pebble never touches after init)
- `soul.md` — Claude's personality/voice for this user (MANUAL, user customizes)
- `.pebble/memory.md` — Accumulated knowledge from commits + MCP (AUTO-GENERATED)

## Architecture

**Zero LLM calls.** Git hook queues raw commit data into SQLite. Claude Code reads `.pebble/memory.md` (which includes unprocessed commits), decides what's worth remembering, calls MCP tools.

**The flow:**
```
commit → post-commit hook → `pebble capture` → queues diff in SQLite
→ regenerates .pebble/memory.md + context tree
→ next Claude Code session reads it
→ Claude calls `pebble_remember` + `pebble_mark_processed`
```

## File Structure

```
src/
├── index.ts          — CLI (commander, 8 commands, soul.md template)
├── mcp-server.ts     — MCP server (6 tools)
├── db.ts             — SQLite layer (better-sqlite3, WAL)
├── extractor.ts      — Commit queue (captures diffs, NO LLM)
├── generator.ts      — Generates .pebble/memory.md, triggers context tree, CLAUDE.md pointer
├── context-tree.ts   — Writes memories as markdown in .pebble/context-tree/
├── hooks.ts          — Git post-commit hook installer
└── types.ts          — Types, 5 categories, config defaults
```

## Tech Stack

TypeScript, Node.js (ESM), SQLite (better-sqlite3), MCP SDK, Commander, Zod, Chalk. No external API deps.

## Key Decisions

- Pebble NEVER touches CLAUDE.md content (only adds pointer once)
- soul.md is a template users customize (personality, voice, mindset)
- .pebble/memory.md is the only auto-generated file Claude reads
- .pebble/context-tree/ has detailed per-category markdown files
- .gitignore: DB + config are private, context-tree can be shared
- Git hook calls `pebble capture` (not `extract`) — no LLM, just queue
- "Before ending a long session" instruction in memory.md for memory flush

## Conventions

- MCP tools prefixed with `pebble_`
- Memory sources: "mcp", "manual"
- Config: `.pebble/config.json`, DB: `.pebble/memory.md`, tree: `.pebble/context-tree/`

---

## TODO for Claude Code

### P0 — Before Dogfooding

1. **Test MCP server end-to-end with Claude Code** — configure as MCP server, verify all 6 tools, test full commit→capture→remember→mark_processed flow
2. **Test soul.md actually works** — verify Claude Code reads soul.md and adjusts behavior. If it doesn't read it automatically, add pointer to CLAUDE.md
3. **Test with Max's real CLAUDE.md** — run `pebble init` in a project that has Max's existing 260-line CLAUDE.md, verify pointer is added correctly without breaking anything
4. **Handle the `session-log.md` migration** — Max currently manually maintains `~/.claude/session-log.md`. Pebble should eventually replace this. For now, add a note about coexistence.
5. **Windows compatibility** — git hooks use `#!/bin/sh`, better-sqlite3 needs compile, path separators

### P1 — Before GitHub Launch

6. **`npx pebble-memory init` zero-install** — publish to npm
7. **README polish** — demo GIF, architecture diagram, ByteRover comparison, badges
8. **Supersession in MCP** — optional `supersedes_id` param on `pebble_remember`
9. **Better search** — FTS5 (SQLite full-text search) in `pebble_recall`
10. **`pebble watch` daemon** — alternative to git hooks
11. **Config validation with Zod**
12. **soul.md templates** — multiple starting templates (solo dev, team lead, agency dev)

### P2 — v0.2

13. Multi-project global memories (`~/.pebble/global/`)
14. Memory export/import (JSON)
15. Cursor support (`.cursorrules` generation)
16. Web dashboard (localhost)
17. Semantic search (local embeddings, `@xenova/transformers`)
18. GitHub Action for CI memory
19. Stats + analytics (`pebble stats --detailed`)

### Quality

20. Error handling (no stack traces in CLI)
21. Tests (vitest — db, context-tree, generator)
22. CI pipeline (GitHub Actions, npm auto-publish)
23. CONTRIBUTING.md
