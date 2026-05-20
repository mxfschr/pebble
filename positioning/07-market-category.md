# Market Category & Style — Pebble

_This is the most consequential phase. Reading it well determines whether downstream copy lands or drifts._

## 1. Category candidates considered

| # | Candidate | Source method | SERP density | Trajectory | Pebble's fit (Q1 strengths-at-center) |
|---|---|---|---|---|---|
| C1 | "Persistent memory for AI coding assistants" | baggage / commodity language (S001) | saturated (claude-mem 77k, MemPalace, MemNexus, Mem0 56k) | growing but crowded | LOW — Pebble looks like a less-featured claude-mem in this frame |
| C2 | "Git-grained decision log" / "Decisions you can trace" | abductive from A2; aligned with U1 vocabulary | empty (no existing category) | n/a — would create the frame | HIGH — uniquely Pebble's mechanism |
| C3 | "Zero-cost memory for Claude Code" | abductive from A1, C1 | low — exists in passing language only | n/a | HIGH but "free" alone isn't a category, it's a feature |
| C4 | "AI memory that lives in your git repo" / "Memory as code" | abductive from A3, A2 combined; aligned with AGENTS.md trend (EC008) | empty | trending — file-as-knowledge is the AGENTS.md trajectory | **HIGHEST — combines all three themes naturally** |
| C5 | "Cross-machine memory for Claude Code" | abductive from U1, T3 | empty | n/a | HIGH for segment, narrow for category |
| C6 | "Local-first memory for Claude Code" (subcategory of "memory for Claude Code") | Big-Fish-Small-Pond on top of C1 | moderate | growing | MEDIUM — local-first isn't unique enough (claude-mem is also local) |
| C7 | "AI context engine" / "AI context infrastructure" | Anthropic's own preferred framing (EC009) | low — Anthropic-owned narrative | growing | MEDIUM — too abstract for an OSS dev tool |

## 2. Candidate evaluation against the four critical questions

### C1: "Persistent memory for AI coding assistants" — DROPPED

- **Q1 (strengths at center?):** NO. claude-mem owns the vector-search dimension, Mem0 owns cross-tool, Anthropic Auto Memory owns native integration. Pebble's wedges (zero cost, git-trigger, repo-trackable) are present but not what the category is *about*.
- **Q2 (segment mental model?):** YES, this is what users search for first.
- **Q3 (pricing assumptions?):** N/A — open source.
- **Q4 (leader?):** Strong leader exists (claude-mem) + native Anthropic offering.
- **Verdict:** DROP. Even if we win on Q2 (visibility), we lose on Q1 (positioning) — the category puts our weakest dimensions front and center.

### C2: "Git-grained decision log" — STRONG CANDIDATE

- **Q1:** HIGH. A2 (commit trigger) directly defines this category.
- **Q2:** Mixed. The phrase "decision log" is engineering-blog language, not how power-users currently search. But it *describes* what U1 explicitly cares about ("was wir gemacht, besprochen, entschieden").
- **Q3:** N/A.
- **Q4:** No leader. Create-a-New-Game territory.
- **Verdict:** Keep — but Create-a-New-Game is brutal for OSS solo work. Best as a *secondary* frame within a broader category.

### C3: "Zero-cost memory for Claude Code" — DROPPED AS PRIMARY

- **Q1:** HIGH for headline; LOW for category. "Free" describes *how* something is priced, not what it is.
- **Q4:** Anthropic Auto Memory is also free.
- **Verdict:** DROP as primary category. Use as **primary headline value** (Theme 1) within whatever category is chosen.

### C4: "AI memory that lives in your git repo" — RECOMMENDED

- **Q1:** HIGHEST. Combines A2 (git-trigger), A3 (committable knowledge), A5 (no network/cloud) into one coherent frame. Theme T2 + T3 fold into it natively, and Theme T1 (zero cost) follows because git is free.
- **Q2:** Strong — developers already think of git as the substrate where their code's truth lives. Saying "your AI's memory lives there too" is a logical extension.
- **Q3:** N/A.
- **Q4:** No direct leader. AGENTS.md is the related standard (knowledge-in-repo) but it's a passive file convention, not a memory engine. Pebble can position as **"the engine that fills your repo's memory file"** — riding the AGENTS.md trend (EC008) without competing with it.
- **Verdict:** KEEP — primary candidate.

### C5: "Cross-machine memory for Claude Code" — KEEP AS SEGMENT-PAGE

- **Q1:** HIGH for the multi-machine segment (S1), narrow otherwise.
- **Q4:** No leader.
- **Verdict:** Keep as a **use-case page** ("Pebble for multi-machine workflows"), not as the master category.

### C6: "Local-first memory for Claude Code" — DROPPED

- Local-first is a property, not a category. And claude-mem is also local. Drop.

### C7: "AI context engine" — DROPPED

- Too abstract for an OSS dev tool. Sounds like enterprise product (matches Letta, Zep — different game). Drop.

## 3. Recommended style decision

**Recommended style: Big-Fish-Small-Pond inside a frame-bending move.**

The frame-bending move: don't position into the "persistent memory for Claude Code" category and try to win a subsegment of it. Instead, position into the **"git-native AI memory"** subcategory — adjacent to (but distinct from) the dominant category. Be the leader of that subcategory by default because it barely has competitors.

This is technically *adjacent* to Create-a-New-Game (the subcategory is mostly hypothetical right now) but stronger than full new-game because:
- AGENTS.md (EC008) has already opened the "knowledge-in-repo" frame
- The Anthropic engineering blog (EC009) endorses file-based, structured memory
- Git-as-substrate-for-knowledge is a frame developers immediately understand

**Pure Head-to-Head against claude-mem is wrong** — they have 77k stars, dominant install path, and budget for ongoing dev. We cannot out-feature them in their category.

**Pure Big-Fish-Small-Pond in "memory for Claude Code" subsegment is weak** — all the obvious subsegments (heavy users, privacy users) still place Pebble inside claude-mem's category, and the comparison drags us back to feature-vs-feature.

## 4. Final category statement

> **Pebble is open-source git-native memory for Claude Code.**
>
> **Targeting:** Solo or 2-person devs who run Claude Code across multiple machines and want their AI's accumulated context to live in the same git repo as the code it's about.
>
> **Style:** Big-Fish-Small-Pond in a frame-bending move — anchored in "AI memory" but positioning as the git-native subcategory.
>
> **Primary alternative we're displacing:** Anthropic's native Auto Memory (the baseline most users have) + claude-mem (the popular upgrade).

## 5. What this style requires of us (operational)

- **README rewrite leading with git-native, not "persistent memory".** Headline reframe.
- **Concrete proof first** — show the `.pebble/context-tree/` committable directory in the first scroll of the README.
- **"vs claude-mem" page** that's honest: claude-mem has more features (vector search, plugin marketplace, 77k stars), Pebble has different properties (zero cost, git-native, no security surface). Don't pretend Pebble is better-than — position as *different from*.
- **AGENTS.md export** as a P1 feature — riding the AGENTS.md trend cements the "git-native" positioning concretely.
- **Plugin Marketplace submission** anyway — even if differentiated, Pebble needs distribution. Position the marketplace listing as "git-native memory engine", not "another memory tool".
- **NPM publish** to make the README's claim true.
- **No SaaS, no premium tier, no upsell — clear from the headline onward.** Open-source-as-positioning, since revenue isn't the goal.

## 6. Risks of this choice

- **R1: "Git-native memory" might not be a frame users search for.** SERP volume probably low. Mitigation: subordinate it inside "memory for Claude Code" SEO-wise on the README (so users searching commodity terms still find it), but position it primarily as the *unique* angle in the hero copy.
- **R2: Anthropic could add git-trigger to Auto Memory.** They have the engineering capacity. Mitigation: be there first, build user habit, and the file-based artifact (context-tree in repo) is harder for Anthropic to replicate without breaking their per-user data isolation model.
- **R3: AGENTS.md could absorb the use case.** If AGENTS.md adds structured categorization, Pebble's "we generate AGENTS.md" loses its wedge. Mitigation: stay a *generator* / *engine*, not a competitor to the file standard. Lean into being the producer of the file the standard expects.
- **R4: "Git-native" might feel niche to non-power-users.** Mitigation: the segment (S1) is power-users by definition, who already think git-native. Not a problem for the chosen segment.

## 7. Confidence

| Element | Confidence | Bottleneck |
|---|---|---|
| Category | MEDIUM-HIGH | Pre-launch — no user-side validation that "git-native memory" is the frame users will adopt |
| Style choice (BFSP-frame-bend) | HIGH | The math is clear — Head-to-Head against claude-mem is unwinnable for an OSS solo project |
| Segment | MEDIUM-HIGH | n=1 (Max) for evidence, supported by pattern-matching to HN/Reddit power-user signals |

**Overall:** MEDIUM-HIGH. The strongest uncertainty is in user adoption signal — but the strength of the alternative (defaulting to commodity "persistent memory") is so weak that the recommended path dominates regardless of how Phase 1's confidence resolves.

## 8. Decision point for Max

This is where the canvas locks. Three real options on the table:

**Option A (RECOMMENDED): Git-native AI memory for Claude Code.** Frame-bending Big-Fish-Small-Pond. Anchored by themes T1 (free) + T2 (decisions traceable) + T3 (in your repo). README rewrite leads with `.pebble/context-tree/` as the headline artifact.

**Option B: Commodity ("Persistent memory for Claude Code") + sharpen the differentiators in the hero.** Stay in the saturated category, win on Theme 1 (zero cost) and security narrative. Lower positioning ceiling but easier discoverability.

**Option C: Decision-log-first.** "Git-grained decision log" as the hero. Create-a-New-Game style. Highest differentiation, smallest immediate market.

If Max agrees on **Option A**, we proceed to Phase 9 (canvas) and lock. If B or C, we revise above and re-lock.
