<p align="center">
  <h1 align="center">🪨 Pebble</h1>
  <p align="center"><strong>Open-source, git-native memory for Claude Code.</strong></p>
  <p align="center">Per-project knowledge in your repo. Per-user voice and context machine-local. Both git-versionable. No cloud.</p>
</p>

<p align="center">
  <a href="#why-git-native">Why git-native</a> •
  <a href="#install">Install</a> •
  <a href="#how-it-works">How it works</a> •
  <a href="#vs-the-alternatives">Vs alternatives</a> •
  <a href="#mcp-tools">MCP tools</a>
</p>

---

## The problem

You start a new Claude Code session on your laptop. Yesterday on the desktop, you and Claude spent two hours hammering out an architecture decision — the kind with real trade-offs you talked through carefully.

Today, none of that exists. You either re-explain it from memory, or paste stale notes. The conversation that didn't end up in code is gone.

## How Claude Code users solve this today

- **Hand-maintained `CLAUDE.md`** — works until you forget to update it. Goes stale.
- **Anthropic's built-in Auto Memory** (v2.1.59+) — writes to `~/.claude/projects/.../memory/MEMORY.md`. But caps auto-load at 200 lines, lives on one machine, [silently truncates the newest entries](https://github.com/anthropics/claude-code/issues/25006).
- **[claude-mem](https://github.com/thedotmack/claude-mem)** — works well, has vector search. But burns Claude subscription tokens summarizing every session, stores in local SQLite that doesn't move between machines, runs [an unauthenticated HTTP server on port 37777](https://github.com/thedotmack/claude-mem/issues/1251).

None of these solve the problem the way developers already solve every other knowledge problem: **git**.

## Why git-native

Pebble queues every commit via a post-commit hook, then lets your existing Claude Code session decide what's worth remembering. The intelligence is your AI's. The bookkeeping is Pebble's.

Memory lives as markdown inside your repo:

```
your-project/
├── src/
├── package.json
└── .pebble/
    ├── memory.md                  ← auto-generated index (Claude reads this)
    ├── context-tree/              ← human-readable knowledge, git-committable
    │   ├── decisions/README.md
    │   ├── patterns/README.md
    │   ├── learnings/README.md
    │   └── ...
    └── memory.db                  ← per-machine cache (gitignored)
```

Commit `.pebble/context-tree/` and `.pebble/memory.md`. Pull on the next machine. Pebble rehydrates.

**Two-machine work just became `git pull`.**

## What's different about Pebble

| | Manual CLAUDE.md | Anthropic Auto Memory | claude-mem | **Pebble** |
|---|---|---|---|---|
| **LLM cost to capture** | Free | Free | Burns subscription tokens | **Zero — uses your session** |
| **Auto-load cap** | n/a | 200 lines | n/a | **Recall on demand** |
| **Lives in** | One file | `~/.claude/` per machine | Local SQLite | **Your repo, as markdown** |
| **Cross-machine sync** | Manual | None | None | **`git pull`** |
| **Decision provenance** | None | Session-based | Session-based | **Commit-grained** |
| **Network surface** | None | Anthropic's | Local HTTP :37777 | **None** |
| **API keys needed** | None | None | None | **None** |
| **License** | n/a | Proprietary | Apache 2.0 | **MIT** |

## What Pebble is NOT

- **Not a vector-search memory store.** [claude-mem](https://github.com/thedotmack/claude-mem) does that better — use it if vector recall is what you need.
- **Not a cross-tool memory layer (yet).** [Mem0](https://github.com/mem0ai/mem0) covers Cursor + Claude + Windsurf. Pebble is Claude Code first; AGENTS.md export is on the roadmap.
- **Not an AI agent.** Pebble runs no AI of its own. The AI you already pay for (Claude Code) does the thinking. Pebble is the bookkeeping.
- **Not for casual users.** If you don't run long Claude Code sessions across multiple machines, `CLAUDE.md` is probably enough — and that's fine.

## Install

> ⚠️ npm package not yet published — install from source for now:

```bash
git clone https://github.com/mxfschr/pebble.git
cd pebble
npm install
npm run build

# Register globally so every project works:
claude mcp add -s user pebble node "$(pwd)/dist/mcp-server.js"

# Initialize in any project:
cd your-project
node /path/to/pebble/dist/index.js init
```

Once npm-published (P0):

```bash
npm install -g pebble-memory
cd your-project
pebble init
```

`pebble init` will:
- ✅ Install a git post-commit hook
- ✅ Create `.pebble/memory.md` with bootstrapping instructions
- ✅ Add a one-line pointer to your project's `CLAUDE.md` (non-destructive)
- ✅ Update `.gitignore` to keep the DB private but track the knowledge files
- ✅ Inject mandatory usage rules into your global `~/.claude/CLAUDE.md` so Claude Code uses the tools in every session

## How it works

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌────────────────────┐
│  You    │ ──> │ git hook │ ──> │ SQLite   │ ──> │ .pebble/memory.md  │
│ commit  │     │ captures │     │ queue    │     │ + context-tree/    │
└─────────┘     └──────────┘     └──────────┘     └─────────┬──────────┘
                                                            │
                                                            ▼
                                                   ┌────────────────┐
                                                   │ Claude Code    │
                                                   │ next session   │
                                                   └───────┬────────┘
                                                           │
                                          ┌────────────────┴────────────────┐
                                          │ pebble_remember (insights)      │
                                          │ pebble_mark_processed (queue)   │
                                          │ pebble_recall (when needed)     │
                                          └────────────────┬────────────────┘
                                                           │
                                                           ▼
                                                   ┌────────────────┐
                                                   │ Memory persists│
                                                   │ across sessions│
                                                   │ + machines     │
                                                   └────────────────┘
```

### Five memory categories

| Category | Emoji | What it captures |
|---|---|---|
| **Decision** | ⚡ | Architectural choices with rationale |
| **Pattern** | 🔧 | Code conventions, naming rules |
| **Context** | 📋 | Project domain knowledge |
| **Learning** | 💡 | Bugs, pitfalls, gotchas |
| **Todo** | 🎯 | Active work items |

## MCP tools

**Project memory** (per-repo, in `.pebble/`):

| Tool | What it does |
|---|---|
| `pebble_remember` | Store a memory with category + tags |
| `pebble_recall` | Search memories by keyword |
| `pebble_forget` | Remove an outdated memory |
| `pebble_status` | Show memory stats + unprocessed commit count |
| `pebble_mark_processed` | Clear commits after review |

Every project-memory call takes a `project_path` parameter — one global MCP server handles all your projects.

**User memory** (global, in `~/.pebble/user/`):

| Tool | What it does |
|---|---|
| `pebble_user_note` | Record a durable observation about the user |
| `pebble_user_recall` | Search across voice.md, about.md, notes.md |
| `pebble_user_status` | Show file sizes + consolidation hint |
| `pebble_user_read` | Read one of the three user memory files |
| `pebble_user_write` | Overwrite voice / about / notes (used for consolidation) |

User memory has no `project_path` — it spans every project.

## User memory: voice, about, notes

Project memory captures decisions about code. User memory captures who *you* are and how Claude should communicate with you — across every project, every session.

```bash
pebble user init
```

This creates `~/.pebble/user/` with three files:

```
~/.pebble/user/
├── voice.md     # how Claude should communicate (you edit)
├── about.md     # who you are, context (you edit)
└── notes.md     # observations Claude appends over time
```

`voice.md` and `about.md` ship as **generic templates with placeholders**. Fill them in yourself — they're machine-local and never committed to this repo.

`notes.md` grows over time as Claude calls `pebble_user_note` when it learns something durable about you (e.g. "user prefers async over sync", "user switched primary editor from X to Y"). You can edit or trim it any time.

At session start, Claude reads `voice.md` and `about.md` and applies them to tone and assumptions. The MANDATORY block in `~/.claude/CLAUDE.md` (auto-injected on `pebble init`) instructs it to do so.

### Auto-consolidation (the profile grows with you)

Static `voice.md` and `about.md` would go stale. The fix: at session start Claude checks `pebble_user_status`. If `notes.md` has accumulated 15+ entries (configurable), Claude consolidates — reads the notes, decides which observations have become durable patterns vs. one-off events, and rewrites `about.md` and/or `voice.md` to integrate the durable ones. Then it clears or archives the processed notes via `pebble_user_write`.

**No approval dialog.** This is the same pattern Anthropic uses for `claude.ai` memory (silent background synthesis) — except in Pebble it happens at session-boundaries, locally, and **git is the safety net**. If Claude consolidates wrong, you `git diff` and revert in two seconds. Approval dialogs sound safer but in practice get muted within a week; the diff-then-revert workflow is honest, fast, and aligns with how developers already review changes.

If your `~/.pebble/user/` lives inside a git repo (e.g. your dotfiles), every consolidation produces a normal commit you can review, edit, or roll back like any code change.

### Why this is separate from `~/.claude/CLAUDE.md`

You can already put personal context in your global `CLAUDE.md`. That works — but:
- It mixes user identity with global *rules and workflows* (which is what CLAUDE.md is meant for)
- It doesn't grow automatically — you have to remember to update it
- It's one undifferentiated blob — voice + context + rules + product list

Pebble's user memory separates three concerns cleanly: how Claude *speaks* (voice), who you *are* (about), and what Claude has *noticed* (notes). All three are plain markdown — you can still edit them by hand, or let Claude grow `notes.md` as you work.

### CLI for user memory

```bash
pebble user init             # Create ~/.pebble/user/ with templates
pebble user show             # Show file sizes / entry counts
pebble user note "<text>"    # Append a note manually
pebble user read voice       # Print contents of voice.md
pebble user read about       # Print about.md
pebble user read notes       # Print notes.md
```

## CLI

```bash
# Project memory (run inside a project's working directory)
pebble init               # Initialize Pebble in this repo
pebble capture            # Queue latest commit (git hook does this automatically)
pebble add <cat> <text>   # Manually add a memory
pebble search <query>     # Search memories
pebble forget <id>        # Remove a memory
pebble status             # Show memory stats
pebble generate           # Regenerate memory.md + context-tree
pebble hooks install      # Install git hook (done by `init`)
pebble hooks uninstall    # Remove git hook
pebble watch enable       # Auto-sync: commit + push on remember, pull on session start
pebble watch disable      # Back to manual git workflow
pebble watch status       # Check if auto-sync is on for this project

# User memory (global, machine-local)
pebble user init          # Create ~/.pebble/user/ with starter templates
pebble user show          # Show file sizes / entry counts
pebble user note "<text>" # Append observation to notes.md
pebble user read <which>  # Print voice / about / notes
```

## Cross-machine workflow

Pebble's accumulated knowledge is markdown inside your repo, so any machine with the repo cloned has the knowledge. Two workflows:

**Manual (default):**
```
desktop:  pebble_remember → git add .pebble/ && git commit && git push
laptop:   git pull → memory ready, Claude reads .pebble/memory.md on session start
```

**Auto-sync (opt-in, requires git remote):**
```bash
cd your-project
pebble watch enable
```

After enabling, Pebble silently `git add .pebble/ && git commit && git push` after every `pebble_remember`, and `git pull --rebase` at the start of each MCP session per project. Failures are best-effort and never break Claude's response — if the network drops or auth fails, the local commit still stands and the push retries on the next memory event.

What auto-sync does NOT do:
- Sync the SQLite DB (it's per-machine; only the markdown files are versioned)
- Handle messy merge conflicts (it aborts the rebase and leaves you to resolve manually)
- Work in projects without a git remote (silently no-ops)
- Push at high frequency if you have a rapid-fire commit hook (rate limit yourself in that case)

## Files Pebble touches

```
your-project/
├── CLAUDE.md                     ← yours; Pebble adds one pointer line on init, never touched after
├── .gitignore                    ← Pebble appends the right ignore patterns
└── .pebble/
    ├── memory.md                 ← AUTO — committable, Claude reads this on session start
    ├── memory.db                 ← per-machine SQLite cache, gitignored
    ├── config.json               ← per-machine, gitignored
    └── context-tree/             ← AUTO — committable, one markdown per category
        ├── README.md
        ├── decisions/README.md
        ├── patterns/README.md
        ├── context/README.md
        ├── learnings/README.md
        └── active-work/README.md
```

```
~/.claude/CLAUDE.md               ← Pebble injects a MANDATORY-usage block here on init,
                                    so Claude Code uses Pebble's tools in every session

~/.pebble/user/                   ← global, machine-local (NOT in any repo)
├── voice.md                      ← how Claude should communicate with you (you edit)
├── about.md                      ← who you are, cross-project context (you edit)
└── notes.md                      ← observations Claude appends; auto-consolidated into voice/about over time
```

## Requirements

- Node.js 18+
- Git
- Claude Code (or any MCP-capable client — Claude Code first-supported)

> Pebble works with **Claude Code** — whether you use the CLI (`claude.exe` / `claude` in your terminal) or the **Code tab in Claude Desktop App** (the GUI re-released April 2026). Both share the same engine, the same `~/.claude/CLAUDE.md`, the same MCP config, the same auto-memory in `~/.claude/projects/`. Pebble installs identically for both.
>
> Pebble does **not** yet bridge memory across the Chat, Cowork, and Code tabs of Claude Desktop App — each tab has its own isolated memory system today (Chat: cloud-synced; Cowork: project-local; Code: `~/.claude/projects/.../memory/MEMORY.md`). Cross-tab Pebble bridging is on the P2 roadmap, currently blocked by [Windows MCP bug #42453](https://github.com/anthropics/claude-code/issues/42453).

## Roadmap

**P0 — before 1.0:**
- DB auto-import from `memory.md` on a fresh machine — currently after `git pull` the markdown has content but the local DB is empty, so `pebble_recall` finds nothing until you start writing new memories. Auto-import will parse `memory.md` and populate the DB on first tool call.
- Publish to npm so `npm install -g pebble-memory` actually works.
- Submit to the official [Claude Code Plugin Marketplace](https://github.com/anthropics/claude-plugins-official).
- FTS5 search in `pebble_recall` (today: substring match).

**P1:**
- AGENTS.md export — generate `.pebble/AGENTS.md` snapshot for cross-tool compatibility (Cursor, Codex, Aider, Copilot).
- Cross-tab bridge for Claude Desktop App (Chat / Cowork / Code) once Windows MCP [bug #42453](https://github.com/anthropics/claude-code/issues/42453) is fixed upstream.
- Optional `~/.pebble/user/` sync via a separate dotfiles repo.
- Honest benchmark vs. claude-mem for token usage on identical workloads.

**P2:**
- `pebble blame <decision>` — show the commit diff that triggered a given memory.
- `~/.pebble/global/` — third memory layer for cross-project but non-personal context.
- Cursor + other MCP-client first-class support.

## Architecture

**Zero LLM calls in the capture path.** The git hook calls `pebble capture` which calls `execSync('git diff')` and a SQLite insert. That's it. No HTTP, no API keys, no inference.

The intelligence layer is Claude Code itself — running on your subscription, in your session, with the full context already loaded. Pebble's MCP tools let Claude write structured memory to the local DB, regenerate the markdown context-tree, and recall on demand.

This is the architectural inversion that makes Pebble cheap: instead of summarizing-on-capture with a separate model (and paying for it), we capture raw and decide-at-leisure inside the session that's already running.

## License

MIT

## Acknowledgments

Pebble exists because Anthropic's own engineering blog ([Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)) is right: file-based, structured note-taking is the architecturally correct pattern for AI memory. Pebble takes that pattern and adds the trigger (git commits), the substrate (your repo), and the recall interface (MCP).

claude-mem walked so Pebble could run — their hooks-based session capture proved the category was real. Pebble takes a different architectural shape, but the prior art is theirs.

---

<p align="center">
  <strong>🪨 Memory that lives in your repo. Synced by git. Costs nothing.</strong>
</p>
