<p align="center">
  <h1 align="center">🪨 Pebble</h1>
  <p align="center"><strong>Open-source, git-native memory for Claude Code.</strong></p>
  <p align="center">Your AI's accumulated knowledge lives in your repo. Synced via <code>git pull</code>. Recalled on demand. Costs nothing.</p>
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

| Tool | What it does |
|---|---|
| `pebble_remember` | Store a memory with category + tags |
| `pebble_recall` | Search memories by keyword |
| `pebble_forget` | Remove an outdated memory |
| `pebble_status` | Show memory stats + unprocessed commit count |
| `pebble_mark_processed` | Clear commits after review |

Every call takes a `project_path` parameter — one global MCP server handles all your projects.

## CLI

```bash
pebble init               # Initialize Pebble in this repo
pebble capture            # Queue latest commit (git hook does this automatically)
pebble add <cat> <text>   # Manually add a memory
pebble search <query>     # Search memories
pebble forget <id>        # Remove a memory
pebble status             # Show memory stats
pebble generate           # Regenerate memory.md + context-tree
pebble hooks install      # Install git hook (done by `init`)
pebble hooks uninstall    # Remove git hook
```

## Files Pebble touches

```
your-project/
├── CLAUDE.md                     ← yours; Pebble adds one pointer line on init, never touched after
├── .gitignore                    ← Pebble appends the right ignore patterns
├── soul.md                       ← optional; created by init if it doesn't exist
└── .pebble/
    ├── memory.md                 ← AUTO — committable, Claude reads this
    ├── memory.db                 ← per-machine cache, gitignored
    ├── config.json               ← per-machine, gitignored
    └── context-tree/
        ├── README.md             ← AUTO — committable
        ├── decisions/README.md
        ├── patterns/README.md
        ├── context/README.md
        ├── learnings/README.md
        └── active-work/README.md
```

```
~/.claude/CLAUDE.md               ← Pebble injects a mandatory-usage block here on init,
                                    so Claude Code uses Pebble's tools in every session
```

## Requirements

- Node.js 18+
- Git
- Claude Code (or any MCP-capable client — Claude Code first-supported)

## Roadmap

P0 (before 1.0):
- Publish to npm so `npm install -g pebble-memory` actually works
- Submit to the official [Claude Code Plugin Marketplace](https://github.com/anthropics/claude-plugins-official)
- FTS5 search in `pebble_recall` (today: pattern match)
- AGENTS.md export — generate `.pebble/AGENTS.md` snapshot for cross-tool compatibility

P1:
- Optional MCP-tool gating — let users disable auto-init for unfamiliar paths
- Honest benchmark vs. claude-mem for token usage on identical workloads
- Drop the duplicated MANDATORY block from `.pebble/memory.md` once global injection is enough

P2:
- `pebble blame <decision>` — show the commit diff that triggered the memory
- Multi-project global memories (`~/.pebble/global/`)
- Cursor + other MCP-client first-class support

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
