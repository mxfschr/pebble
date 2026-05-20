# Phase 12: Marketing Outputs (Condensed)

_For open-source distribution, not a marketing site. README + GitHub + Plugin Marketplace + Distribution-channel one-liners._

---

## 1. GitHub repo description (50-char limit on the GitHub UI)

> **Git-native AI memory for Claude Code. Local. Free.**

Characters: 51 — trim if needed:
> **Git-native AI memory for Claude Code. Free.**

(46 chars — passes)

## 2. GitHub topics (tag the repo)

Required topics in order of priority:

- `claude-code`
- `mcp`
- `mcp-server`
- `ai-memory`
- `git-native`
- `developer-tools`
- `claude`
- `anthropic`
- `local-first`
- `open-source`

Optional but useful:
- `typescript`
- `nodejs`
- `sqlite`

## 3. Claude Code Plugin Marketplace listing draft

For submission to [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official):

**Title:** Pebble — Git-native AI memory

**Short description (200 chars):**

> Open-source persistent memory for Claude Code that lives in your git repo, costs zero subscription tokens at capture, and syncs across machines via `git pull`. Local-first. No cloud. No API keys.

**Long description:**

```markdown
Pebble is git-native memory for Claude Code.

Unlike Anthropic's built-in Auto Memory (200-line auto-load cap, machine-local) or third-party tools like claude-mem (burns subscription tokens, local SQLite blob), Pebble queues commits via a git post-commit hook and lets Claude itself decide what to remember — using your existing session, not a separate API.

Memory ships as markdown in `.pebble/context-tree/` inside your repo. Commit it, push it, pull it on the next machine. Two-machine work just became `git pull`.

**Five memory categories:** decision, pattern, context, learning, todo.

**Five MCP tools:** `pebble_remember`, `pebble_recall`, `pebble_forget`, `pebble_status`, `pebble_mark_processed`.

**Zero LLM API calls** in the capture path. Pebble runs no AI of its own — the AI you already pay for does the thinking.

**No network surface.** No HTTP server, no auth, no cloud, no telemetry.

MIT licensed. Built in TypeScript.
```

**Install command:**
```
npm install -g pebble-memory && cd your-project && pebble init
```

(P0 dependency: npm publish needed before this works)

**Tags:**
memory, persistence, git, decision-log, local-first, cross-machine

## 4. README hero variations (for A/B test post-launch)

Per the canvas: if early users don't latch onto "git-native", we have fallback frames pre-written.

### Variation A (current README — RECOMMENDED, locked frame)
> **Open-source, git-native memory for Claude Code.**
> Your AI's accumulated knowledge lives in your repo. Synced via `git pull`. Recalled on demand. Costs nothing.

### Variation B (fallback to sharpened commodity)
> **Persistent memory for Claude Code — without burning your subscription tokens.**
> Pebble queues git commits and lets Claude itself decide what's worth keeping. No second AI in the loop, no cloud, no API keys.

### Variation C (decision-log emphasis)
> **A git-grained decision log for Claude Code.**
> Every memory anchored to the commit that caused it. Ask "why did we decide this?" — and the answer is in your repo.

## 5. Pitch one-liners (for posts, comments, conference one-pagers)

**Twitter/X (280 chars):**

> Got tired of Claude Code forgetting what we decided yesterday. Built Pebble: git-native AI memory. Knowledge lives in your repo, syncs by `git pull`, capture costs zero LLM tokens. MIT, no cloud. github.com/mxfschr/pebble

(228 chars — fits)

**HN Show submission title:**

> Show HN: Pebble — Git-native memory for Claude Code, capture costs zero LLM tokens

**Reddit r/ClaudeAI post title:**

> I built a memory system for Claude Code that lives in your git repo (no token burn, syncs by git pull)

**Indie Hackers post title:**

> Pebble — Claude Code's memory, but it lives in your repo

**Dev.to article working title:**

> I Solved Claude Code's Cross-Machine Amnesia by Putting Memory in the Repo

## 6. Vocabulary discipline (for all copy)

**Always use:**
- "git-native" (the lead differentiator)
- "lives in your repo" / "ships with the code"
- "recall on demand" (not "loads automatically")
- "zero LLM API calls in the capture path" (specific, verifiable)
- "syncs via git pull" (concrete mechanism)
- "your existing session" (vs "a second AI")

**Avoid:**
- "persistent memory" alone (commodity)
- "AI agent" (we're not one)
- "small stones, big picture" (cute but doesn't communicate)
- "automatic memory" alone (Anthropic owns this phrase now)
- subjective claims: "better", "easier", "faster" without numbers

**Honest about:**
- claude-mem has vector search; we don't
- Mem0 is cross-tool; we're Claude Code first
- npm package isn't published yet (until it is)
- Pre-launch, n=1 user (Max), so adoption metrics will earn real claims later

## 7. Distribution checklist (post-1.0)

Order matters — don't skip steps:

1. ☐ `npm publish pebble-memory` (P0 dependency for everything else)
2. ☐ README hero rewrite (Variation A) — **DONE in this exercise**
3. ☐ GitHub repo description + topics (above) — TODO: apply via `gh repo edit`
4. ☐ Claude Plugin Marketplace submission (PR to anthropics/claude-plugins-official)
5. ☐ Show HN with title from §5 above
6. ☐ r/ClaudeAI post (organic, not promotional)
7. ☐ Dev.to article (cross-link to HN + repo)
8. ☐ Twitter/X announcement
9. ☐ Indie Hackers post
10. ☐ Then: 2-4 weeks of dogfooding feedback collection before any features
11. ☐ At 30 days: review which frame language sticks, fall back to Variation B/C if needed

## 8. Anti-actions

What NOT to do during launch:

- **Don't pitch to enterprise.** S8 was dropped for a reason. Stay in S1.
- **Don't add features before validating frame.** First 30 days: positioning + adoption signal only.
- **Don't compete on vector search or AI-summarization features.** That's claude-mem's game; we lose.
- **Don't trash claude-mem in copy.** Honest comparison wins; strawmanning loses credibility (especially with the segment we care about — they read the source).
- **Don't add a paid tier "just in case".** Locked-out per Phase 0 constraint.
- **Don't change the name or scope mid-launch.** Locked.

## 9. Success signals (for the 30-day check-in)

If positioning landed:
- ≥ 100 GitHub stars in first 30 days (signal of interest)
- ≥ 30% of issues / comments use "git-native" or "lives in repo" language unprompted (frame stickiness)
- Plugin Marketplace listing accepted
- 1+ blog post / tweet by a non-Max user explaining what Pebble is (mention quality, not vanity)

If signals don't fire, fall back to Variation B in week 5.
