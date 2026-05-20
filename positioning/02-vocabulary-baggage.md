# Vocabulary & Baggage — Pebble

_Phase 1 evidence is thin (no public users yet). Phase 1 substituted with competitor-proxy + Max's own vocabulary. See evidence-log.md._

## "Let go" agreement

For the duration of phases 3-9, the following positioning assumptions are bracketed (open for revision):

- That Pebble is a "memory system" in the same category as claude-mem, Mem0, Letta
- That Pebble's headline value is "persistent memory across sessions"
- That the primary user is identical to claude-mem's user base
- That the README's current taglines (Small stones / Automatic persistent memory) are the right ones

**Hard-locked constraints (cannot change):**
- Name: Pebble
- License: MIT, open-source
- No paid tier, no SaaS component
- Local-first architecture (cannot pivot to cloud)
- Windows-first dev environment for Max (but cross-platform support)

## 1. Origin baggage

| Claim | Source | Evidence status | Reversibility |
|---|---|---|---|
| Pebble is "memory for AI coding assistants" | README, CLAUDE.md | EC005, EC007 confirm category exists; "memory" is commodity language (S001) | soft |
| Built specifically for Claude Code first | README + .mcp.json structure | Code supports any MCP client (A2) — Claude Code is launch target, not lock-in | open |
| Tagline "Small stones, big picture" | README | No evidence customers use this metaphor | soft |

## 2. Audience baggage

| Claim | Source | Evidence status | Reversibility |
|---|---|---|---|
| "for AI coding assistants" (the AI is the user) | README | True at the tool level — but the *buyer/installer* is the developer. Conflation. | open |
| Power-user developer is the user | implied | EC003 HN comments confirm power-user fit; EC010 confirms problem felt by Claude users | open (but evidence-aligned) |

## 3. Category baggage

| Claim | Source | Evidence status | Reversibility |
|---|---|---|---|
| Category = "persistent memory for AI coding assistants" | README | S001: saturated language. EC001, EC005, EC007 all use this frame. | soft — should re-evaluate in Phase 7 |
| Compared against ByteRover in README | README comparison table | ByteRover is one of many alternatives; the table is outdated relative to claude-mem dominance | soft |

## 4. Comparison baggage

| Claim | Source | Evidence status | Reversibility |
|---|---|---|---|
| "Vs ByteRover" framing | README | ByteRover is not the strongest alternative anymore (EC001 claude-mem is) | open |
| "Vs Manual CLAUDE.md" framing | README | Valid baseline but EC005 shows Anthropic now ships AUTO Memory natively — this is the new baseline | open |

## 5. Pricing baggage

| Claim | Source | Evidence status | Reversibility |
|---|---|---|---|
| Free, no API keys | README, A7 | Confirmed by code | locked (positive) |

## 6. Existing marketing baggage

| Artifact | Positioning it implies | Evidence status |
|---|---|---|
| README hero "Automatic persistent memory" | Pebble = persistent memory tool | matches commodity category language — fine but undifferentiated |
| README quickstart `npm install -g pebble-memory` | Polished, packaged, npm-ready product | **contradicts code** (A8) — package not published |
| Tagline "Small stones, big picture" | Pebble is incremental knowledge accumulation | doesn't communicate value or category |

## 7. Positioning tensions (gaps between stated and evidence)

- **T1.** Stated positioning: "persistent memory for AI coding assistants." Evidence: that exact phrase is the saturated commodity language (claude-mem, MemPalace, MemNexus, Mem0 all use it). Tension: pitching at the commodity category dilutes Pebble's actual differentiation (zero LLM cost, git-grained provenance, sync-via-git).

- **T2.** Stated audience: AI coding assistants. Reality: the *AI* doesn't choose tools, the *developer* does. Tension: copy needs to address the human developer's decision criteria.

- **T3.** Stated value: "memory across sessions." Evidence (Max's own words U1): the deeper value is *autonomous learning + self-correction + cross-machine reliability*. Tension: "memory" is the mechanism; trust + cross-machine reliability is the felt outcome.

- **T4.** Anthropic now ships Auto Memory natively (EC005). Existing README compares only to ByteRover and Manual CLAUDE.md — missing the most important reference point.

- **T5.** "Open source, no API keys" is mentioned but not headlined. Meanwhile, claude-mem's security audit (EC002) is a real distinguishing point that Pebble doesn't currently exploit.

## 8. Locked vocabulary (project-specific definitions)

| Term | Project-specific definition | Example |
|---|---|---|
| Product | The Pebble system: CLI + MCP server + git hook + markdown context-tree, as a single deliverable | Not the Pebble npm package alone, not the .pebble/ dir alone |
| User | The human developer who installs and configures Pebble. (The AI agent is a *consumer of Pebble's output*, not the user.) | Max, or any other Claude Code user |
| Best-fit user | Power-user developer who runs long-context, multi-session work in Claude Code | TBD in Phase 6 |
| Competitive alternative | What the user would actually do if Pebble didn't exist (not what Pebble is "like") | claude-mem (most likely), Anthropic Auto Memory (baseline), manual CLAUDE.md (default), do nothing |
| Unique attribute | Capability Pebble has that the strongest alternative lacks AND that we can prove from code | Zero LLM cost; commit-as-trigger; git-trackable knowledge |
| Value | What the user can do or trust because of the attribute | Trust the system 100%; sync without infrastructure |
| Segment | Group of users defined by behavior + context, not demographics | Solo / small-team devs running long Claude Code sessions across multiple machines |
| Market category | The shelf customers slot Pebble onto | TBD in Phase 7 — multiple candidates exist |

## 9. Decision log

**Open for revisiting:**
- Category framing ("persistent memory" vs alternatives)
- Tagline
- Comparison table (who Pebble is "vs")
- Audience framing (AI vs developer)
- Headline value (memory vs trust/sync)

**Off-limits:**
- Name (Pebble)
- License (MIT)
- Architecture (local-first, no cloud)
- Pricing (free, no paid tier)
- 3-file system (CLAUDE.md + soul.md + .pebble/memory.md)
- Zero-LLM-call extraction
