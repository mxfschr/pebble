# Target Segments — Pebble

## 1. Segment hypotheses considered

| # | Hypothesis | Evidence source |
|---|---|---|
| S1 | Solo dev / indie hacker running long Claude Code sessions across multiple machines | U1 (Max's own profile + pain), EC003 HN comments |
| S2 | Small dev team (2-5) using Claude Code as shared tooling on a shared repo | Latent — A3 supports this, no direct evidence |
| S3 | Power-user developer logging 50+ hours in Claude Code per month | EC003 (HN: "consider more when you're 50+ hours in") |
| S4 | Open-source maintainer wanting decision-log artifacts for contributors | Hypothesis — A2 supports this use case but no direct evidence |
| S5 | Security/privacy-conscious developer rejecting cloud-based memory tools | EC002 (claude-mem CVE issues create the opening) |
| S6 | Multi-machine developer (desktop + laptop + work computer) | U1 explicit |
| S7 | Build-in-public solo founder using Claude Code for product work | Max's own profile |
| S8 | Enterprise dev with compliance needs (no cloud) | Hypothesis — too far for Pebble's open-source positioning |

## 2. Detailed segment profiles (top 3 by evidence + fit)

### S1 (+ S6 merged): Solo dev / multi-machine power-user

| Field | Value |
|---|---|
| Segment name | Solo dev with multi-machine workflow |
| Identifying behaviors | Switches between 2+ machines (desktop, laptop, sometimes ipad); runs Claude Code sessions of 30+ minutes regularly; works on 2+ projects in parallel; commits frequently; tracks own context manually before Pebble |
| Tools they already use | Claude Code (heavy), git, VS Code, Linear/Notion for project tracking, often Tailscale/Syncthing for personal sync |
| Communities | r/ClaudeAI, r/LocalLLaMA, HN, IndieHackers, Twitter dev community |
| Pain signals from evidence | U1 ("alles neu entdecken müssen"), EC010 ("goldfish", "architectural reasoning evaporated") |
| Job titles | Solo dev, indie hacker, freelance dev, side-project builder |
| Company size | 1 |
| Decision maker | Themselves, no committee |
| Budget context | Personal subscription budget — already paying for Claude Pro/Max ($20-200/mo). NOT paying for tooling on top. Cost-sensitive. |

**Phase 1 evidence:** U1 (primary, but n=1), EC003 (HN power-user segment confirmed), EC010 (felt pain in this segment)

**Scores:**
- Cares-a-lot fit: **5/5** — themes T1 (cost), T2 (decisions traceable), T3 (cross-machine sync) all land here. Strongest theme-segment match.
- Findability: **4/5** — well-defined communities (r/ClaudeAI, HN, IndieHackers, dev Twitter). Lots of Claude Code users in these venues.
- Size: **4/5** — Claude Code has hundreds of thousands of devs; the "solo + multi-machine + power-user" subset is in the tens of thousands plausibly. Big enough to matter for OSS adoption. Hard data: Claude Code is in ~1M+ developer hands per Anthropic's enterprise / GitHub plugin metrics in 2025-2026; even 1% of that as the segment is 10k.

### S3: 50-hour+ Claude Code power-user (overlapping with S1)

| Field | Value |
|---|---|
| Segment name | Heavy Claude Code user (50+ hours/mo) |
| Identifying behaviors | Long-running projects in Claude Code; has hit the limits of CLAUDE.md; has tried claude-mem or considered it; has felt the 200-line cap |
| Tools they already use | Claude Code, possibly claude-mem already |
| Communities | Same as S1 + Claude Code Discord, GitHub discussions on anthropics/claude-code |
| Pain signals | EC003 HN: "consider more when you're 50+ hours in"; EC005 Issues #25006, #39811 |
| Budget | Higher likelihood of Pro+/Max subscription. Token-cost-sensitive (because they hit limits often). |

**Scores:**
- Cares-a-lot fit: **5/5** — they're the people who hit the actual limits
- Findability: **3/5** — harder to identify than S1; no single canonical channel
- Size: **3/5** — small subsegment of overall Claude Code user base

### S5: Privacy-conscious developer rejecting cloud-memory tools

| Field | Value |
|---|---|
| Segment name | Privacy/security-conscious developer |
| Identifying behaviors | Self-hosts where possible; reads security audits; avoids cloud tools for sensitive client work; has read claude-mem's security issue thread (EC002) |
| Tools they already use | Local-first tools (Obsidian, self-hosted DBs); avoids Mem0/cloud memory |
| Communities | r/selfhosted, r/privacy, HN |
| Pain signals | EC002 (claude-mem CVEs) — they will see this and want an alternative |
| Budget | Often higher — they pay for things to avoid surveillance/risk |

**Scores:**
- Cares-a-lot fit: **4/5** — themes T1 (no SaaS), T4 (no network surface) land hard; T2 (decisions traceable) less so
- Findability: **3/5** — they self-identify in specific communities (r/selfhosted, /r/privacytools)
- Size: **3/5** — smaller niche

## 3. Size math for top segment

**Goal:** Open source adoption — Max's stated implicit goal is "good enough for me to trust 100% AND enough adoption to validate the project as worthwhile". No revenue target.

**Reasonable adoption proxy:** GitHub stars + active project usage.

- claude-mem reached 77k stars in 14 months as the dominant offering
- claude-memory-compiler at 1.1k stars in roughly 7 months
- Realistic target for differentiated open-source project: 1-5k stars in first year if positioned well
- For Pebble's "Solo dev with multi-machine workflow" segment: estimated reachable population is 10-50k Claude Code power-users
- Conversion of trial-to-star is maybe 5-10% for an OSS dev tool → 500-5000 stars target plausible

**Verdict:** ✅ feasible. Segment is big enough to validate the project, narrow enough to write differentiated copy.

## 4. Best-fit segment (the one Pebble optimizes for)

**Segment:** Solo dev with multi-machine workflow (S1 + S6 merged)

**Tight definition (one sentence):**

> A solo or 2-person dev who runs Claude Code as their primary AI assistant across 2+ machines, has more than 50 hours of total Claude Code usage, commits to git regularly, and has felt the pain of starting a new session on a machine that doesn't know what their other machine knows.

**Why this beat the others:**
- **S1 beats S3** because S6's multi-machine pain (T3) is Pebble's most uniquely-solved problem, while S3's "50-hour user" overlaps with S1 anyway.
- **S1 beats S5** because S5 is real but smaller, and S5's pain is partially solved by *any* local-first tool (including the do-nothing/CLAUDE.md baseline). Pebble's wedge over privacy-leaning local tools is weak.
- **S1 beats S2** (small team) because team adoption requires social coordination Pebble doesn't yet enable. Solo→team-expansion is a later move.

**Confidence:** MEDIUM-HIGH. Primary evidence is U1 (Max himself, n=1) plus pattern-matching to HN power-user comments (EC003, EC010). Stronger validation will come from first 10-50 external users post-launch.

## 5. Pattern decision

**Pattern A: Single best-fit segment now, expand later.**

Reasoning: Pebble is pre-launch with one user. Spreading positioning across multiple segments dilutes the message. After 6 months of S1 adoption, S2 (small team) and S5 (privacy-conscious) become natural expansion segments because the architectural differentiators (T3 git-sync, T4 no-network) already serve them.

## 6. Notes for downstream phases

- **Phase 7 (category):** S1's mental model — "AI tool that helps Claude remember across sessions" is the baseline frame, BUT S1's defining behavior is cross-machine. So category must contain a sync/portability hook. "AI memory infrastructure" or "AI memory engine" plausible. "Persistent memory" alone is too generic.
- **Phase 9 (canvas):** "Who cares a lot" field = the tight definition above
- **Phase 10 (sales story):** Open with the multi-machine scenario specifically. Max's own "laptop doesn't know what desktop knows" line is gold customer-voice.
- **Phase 11 (future):** Use-case landing pages → "Pebble for multi-machine workflows", "Pebble for long Claude Code sessions", "Pebble for self-hosted dev environments". Alternatives pages: "vs claude-mem", "vs Anthropic Auto Memory".
