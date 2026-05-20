# Sales Story — Pebble

_The narrative arc derived from the locked canvas. This is the structure for the README hero, the Plugin Marketplace listing, and any explainer of Pebble._

## 1. Problem framing

You start a new Claude Code session on your laptop. Yesterday on the desktop you spent two hours hammering out an architecture decision with Claude — a real one, with trade-offs you talked through. Today, none of that exists. You have to either re-explain it from memory, or paste in stale notes that may not match what you actually decided. The conversation that didn't end up in code — which is most of the value — is gone.

## 2. How customers solve it today (and where it falls short)

Most Claude Code users do one of three things. They maintain a CLAUDE.md by hand, which works until they forget to update it and it goes stale. They use Anthropic's new built-in Auto Memory (v2.1.59+), which writes to `~/.claude/projects/.../memory/MEMORY.md` — but caps the auto-load at 200 lines and lives on a single machine. Or they install claude-mem, which works well but uses your Claude subscription tokens for summarization at every session-hook and stores memory in a local SQLite blob that doesn't move between machines.

All three solve a piece of the problem. None of them solve it the way developers already solve every other knowledge-sharing problem: **git**.

## 3. Perfect world

Imagine your AI's accumulated knowledge — every decision it made with you, every pattern it learned, every bug it remembered for next time — lived as markdown files inside your repo. Committable. Diffable. Pullable on the next machine. Reviewable in PR. Free, because git is free. Out of your context window when you don't need it, recalled on demand when you do.

## 4. Product introduction

> **Pebble is open-source, git-native memory for Claude Code.**

**Themes:**

- **Memory that costs nothing.** Pebble's capture path makes zero LLM API calls. It queues commits via a post-commit hook, then lets your existing Claude Code session decide what's worth remembering — using the subscription you already pay for, not a separate API. No SaaS, no auth, no cloud bill.

- **Decisions you can trace back to the commit.** Every memory Pebble stores is anchored to the git commit that triggered it. `git log` becomes the timeline of *both* your code and your AI's reasoning. Future-you (or future-Claude) can ask "why this design?" and the answer is in the repo, not in your head.

- **Knowledge ships with the code.** Pebble writes its accumulated context-tree as markdown inside your repo — under `.pebble/context-tree/`. Commit it. Push it. Pull it on the next machine. Two-machine work just became `git pull`.

## 5. Proof

- **Code-anchored proof:** Pebble has no HTTP server, no API keys, no LLM SDK in the capture path. You can grep the package.json in 30 seconds and verify.
- **Concrete comparison:** Anthropic's Auto Memory caps at 200 lines auto-loaded per session, and you can't get past that without surgery. Pebble keeps memory structured and recalls on demand — your context window stays cheap.
- **Architectural difference vs claude-mem:** claude-mem is 77k stars of well-loved work, with vector search Pebble doesn't have. It also burns your subscription tokens at every hook fire and runs an unauthenticated HTTP server on port 37777 (documented [Issue #1251](https://github.com/thedotmack/claude-mem/issues/1251)). Pebble is a different shape: smaller surface, zero recurring cost, knowledge in your repo.

## 6. Dominant objection handled

**Q:** *Can a memory system really work without summarization at capture time?*

**A:** Pebble queues raw commits and lets Claude — which you're already running, in-context — decide what's worth keeping. The intelligence is your AI's, not a separate summarization model that might compress the wrong thing. Pebble is the bookkeeping, not a second AI.

## 7. Call to action

**Primary CTA:** *Install and run `pebble init` in your repo.*

Why this CTA for this segment: The best-fit segment (solo devs with multi-machine workflows) installs CLI tools as a default; they don't book demos. Install is the natural commitment-test. `pebble init` is also self-explanatory enough that the segment can verify trust quickly (it shows what files it creates, asks no permissions, runs locally).

**Secondary CTAs (lower in the README):**
- View the `.pebble/context-tree/` directory in this very repo (we dogfood) — concrete proof of what Pebble produces
- Read the architecture decisions: [link to `positioning/09-positioning-canvas.md`]
- Star on GitHub if it resonates (open source signal mechanism)

## 8. Full story (read-aloud version, ~240 words)

You start a new Claude Code session on your laptop. Yesterday on your desktop, you and Claude spent two hours hammering out an architecture decision — the kind with real trade-offs you talked through carefully. Today, none of that exists. You either re-explain it from memory, or paste stale notes. The conversation that didn't end up in code is gone.

Most Claude Code users solve this with hand-maintained CLAUDE.md files, or Anthropic's new built-in Auto Memory (which caps at 200 lines and stays on one machine), or claude-mem (which works but burns subscription tokens summarizing every session into a local SQLite blob that doesn't move between machines).

None of these solve the problem the way developers already solve every other knowledge problem: git.

**Pebble is open-source, git-native memory for Claude Code.** It queues every commit via a post-commit hook, then lets your existing Claude session decide what's worth keeping — using the subscription you already pay for. Memory ships in markdown inside your repo. Commit it, push it, pull it on the next machine. Two-machine work just became `git pull`.

No LLM API calls in the capture path. No cloud. No auth. No surface to attack. Just commits, markdown, and on-demand recall — knowledge that stays out of your context window until you need it.

If you've ever ended a Claude Code session and wished the next one knew what this one knew — `pebble init` in your repo.

## 9. Verification

- [x] Reads aloud as a story, not a feature list
- [x] Opens with the problem in Max's vocabulary ("alles neu entdecken müssen" → "none of that exists")
- [x] "Perfect world" describes the ideal without naming Pebble first
- [x] Each theme = one sentence, in priority order
- [x] Strongest proof is concrete + verifiable (grep package.json)
- [x] Honest about alternatives (no strawman of claude-mem)
- [x] Dominant objection = "why no LLM at capture?" — addressed
- [x] CTA matches segment behavior (install, not demo)
- [x] Under 300 words for read-aloud version
- [x] No invented quotes; no fabricated statistics
