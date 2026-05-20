# Value Themes — Pebble

## 1. Feature → Benefit → Value chains

| Attr ID | Attribute | Benefit (immediate) | Value (customer goal) | Quantification | Quote | Theme |
|---|---|---|---|---|---|---|
| A1 | Zero LLM calls in capture | No tokens burned per commit/session | Memory cost is 0$, regardless of how heavy the user is | claude-mem burns ~thousands of summarization tokens for a 1000-commit project; Pebble burns 0 | None yet (pre-launch) | T1 — Free as in free |
| A2 | Git commit as trigger | Every memory is tied to a specific commit hash | Audit trail: "why did we decide X?" → answerable. Reasoning survives the commit. | n/a | U1 implicit | T2 — Decisions you can trace |
| A3 | Knowledge committable to git | Knowledge syncs via the dev workflow already in use | Two-machine work is the same as two-developer work: just `git pull` | Zero infrastructure cost vs. cloud sync alternatives | U1 ("maschinen übergreifend") | T3 — Sync that's free because it's git |
| A4 | Hybrid SQLite + markdown | Fast queries on one machine; portable knowledge across machines | Best of both: structured query + human-readable artifact | n/a | None yet | T3 (supports) |
| A5 | No network surface | No HTTP server, no auth, no cloud | Privacy by architecture, not by policy | claude-mem has documented CVE-class issues; Pebble has no surface to attack | EC002 (negative proof against claude-mem) | T4 — No surface to compromise |
| A6 | 5 enforced categories | Memory has shape: decisions vs. patterns vs. learnings | Recall is targeted, not a wall of text. AI surfaces the right kind of thing at the right time. | n/a | None yet | T2 (supports) |

## 2. Themes

### Theme 1 (PRIMARY): "Memory that costs nothing"

**One-sentence description:** Pebble doesn't charge for memory — not in dollars, not in your Claude subscription tokens, not in infrastructure.

**Value points feeding into this theme:**
- A1: Zero LLM calls at capture time
- A3: Sync via git, no SaaS needed
- A5: No cloud, no auth, no API keys
- Architectural framing: Pebble is the *thinking* layer; Claude (which you already pay for) is the *intelligence* layer

**Customer-language quotes:**
- (None yet — flagged as `unproven value` until launch)
- U1 supports "100% verlässlich" angle which connects to cost-of-failure

**Strongest single proof:** *Pebble has zero external API calls in the capture path. The intelligence is the Claude session you're already running.* (Codebase-anchored, verifiable in 30 seconds by any technical reader.)

**Distinguishing check:** claude-mem burns Claude SDK tokens at every session-hook firing. claude-memory-compiler does the same. Mem0 is a cloud service with its own infra cost. Anthropic Auto Memory is free but capped (200 lines). Pebble is the only solution that is both free AND uncapped.

**Confidence:** HIGH (architectural fact, verifiable)

---

### Theme 2 (SECONDARY): "Decisions you can trace back to the commit"

**One-sentence description:** Every memory is anchored to the git commit that caused it — so future-you (or your AI) can actually answer "why did we decide this?"

**Value points feeding into this theme:**
- A2: Git commit as trigger (commit-grained provenance)
- A6: Enforced categories (decisions are first-class, not buried)
- A3 (supports): the trail is committed to the same repo it explains

**Customer-language quotes:**
- U1: *"was wir gemacht, besprochen, entschieden"* — Max explicitly names decisions as something to preserve
- EC010: *"Architectural reasoning evaporated"* — the pain in customer voice

**Strongest single proof:** *Pebble is the only memory tool with `git log → memory` mapping. You can `git blame` a file, see the commit, then `pebble_recall` to see what was decided then and why.*

**Distinguishing check:** No competitor has commit-level granularity. Cluster 2 uses session events (lossy mapping to code). Cluster 1 has no link to code at all. AGENTS.md has no time dimension. Pebble has both: time-stamped via commits, and content-stamped via the diff that triggered the memory.

**Confidence:** HIGH (architectural, plus customer-vocabulary alignment in U1)

---

### Theme 3 (TERTIARY): "Knowledge ships with the code"

**One-sentence description:** Pebble's accumulated knowledge lives in markdown files inside your repo. Cross-machine sync, team sharing, future-AI-tool compatibility — all by default, because it's in git.

**Value points feeding into this theme:**
- A3: Context-tree committable to git
- A4: Hybrid SQLite (per-machine) + markdown (in-repo)
- Implicit cross-tool angle: AGENTS.md-compatible export potential (Phase 12 future feature)

**Customer-language quotes:**
- U1: *"maschinen übergreifend"* (cross-machine) — the felt pain
- U1: *"das problem habe ich ja gerade mit meinem laptop, dass er nicht auf dem gleichen stand ist wie mein desktop"* — concrete scenario

**Strongest single proof:** *Two machines, one git remote, zero new infrastructure: clone the repo, pebble re-hydrates, you're synced.* This is in contrast to every Cluster 2 tool (local SQLite, no sync) and every Cluster 1 tool (machine-local user directory).

**Distinguishing check:** Anthropic Auto Memory is per-machine in ~/.claude/. claude-mem is per-machine in SQLite. Mem0 syncs but only via their cloud. Pebble syncs via git — which the user is already running.

**Confidence:** HIGH (architectural + strong U1 vocabulary match)

## 3. Demoted value points

- **"Easier to use"** — subjective, unprovable, table stakes claim
- **"Better recall"** — needs benchmark, don't claim without one
- **"AI personality via soul.md"** — no evidence users want this; demoted from positioning
- **"Open source"** — table stakes among competitors (claude-mem is Apache, Mem0 is open core)
- **"Markdown human-readable"** — table stakes; AGENTS.md, Cline Memory Bank, CLAUDE.md all are too
- **"Local-first"** — true but most competitors are also local; not a wedge by itself

## 4. Theme ranking

1. **Primary:** T1 (Memory that costs nothing) — clearest wedge against the dominant Cluster 2 leader (claude-mem), and the most architecturally provable claim. Maps to "zero LLM" — uniquely Pebble's.
2. **Secondary:** T2 (Decisions you can trace) — unique mechanism (git-commit-as-trigger), supports the deeper value of self-correcting AI (U1).
3. **Tertiary:** T3 (Knowledge ships with code) — solves Max's exact cross-machine pain and the team-sharing latent demand.

## 5. Notes for downstream phases

- **Phase 6 (segments):** T1 attracts cost-conscious devs and indie/solo space. T2 attracts those who maintain code long-term. T3 attracts those with multi-machine or team workflows.
- **Phase 7 (category):** T1 + T2 together suggest categories beyond "persistent memory" — "AI memory infrastructure", "decision log", "AI context engine". Phase 7 has work to do.
- **Phase 9 (canvas):** Themes go in "Value" column.
- **Phase 10 (sales story):** Open with T2's problem ("you can't trace your AI's decisions back to commits"), perfect-world it, then introduce T1 as the surprising-cheap implementation.
