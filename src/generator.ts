// ============================================================================
// Pebble — Memory File Generator
// Generates .pebble/memory.md — NEVER touches CLAUDE.md.
// CLAUDE.md is the user's manually maintained file.
// ============================================================================

import type Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { getActiveMemories, getMemoryStats } from "./db.js";
import { getUnprocessedCommits } from "./extractor.js";
import { generateContextTree } from "./context-tree.js";
import { type Memory, type PebbleConfig, DEFAULT_CONFIG, PEBBLE_DIR } from "./types.js";

const HEADER = `# Pebble Memory
# Auto-generated — do not edit manually.
# Use \`pebble add\` or MCP tools to manage memories.
# ───────────────────────────────────────────────────────────────`;

const PEBBLE_INSTRUCTIONS = `
## 🪨 Pebble Memory — MANDATORY

You MUST use Pebble MCP tools to persist knowledge across sessions. This is a core rule, not a suggestion.
**IMPORTANT**: Always pass \`project_path\` (your current working directory) with every \`pebble_*\` tool call.

**Session start**: Process any unprocessed commits below — call \`pebble_remember\` for insights, then \`pebble_mark_processed\`.
**During work**: Call \`pebble_remember\` IMMEDIATELY when you make decisions, find bugs, discover patterns, or learn something non-obvious.
**Before session ends**: Persist every important decision and learning. If you don't, the next session starts from zero.
**Need context?**: Call \`pebble_recall\` before making assumptions.`;

export function generateMemoryMd(
  db: Database.Database,
  projectId: number,
  config: PebbleConfig = DEFAULT_CONFIG,
  projectPath?: string
): string {
  const stats = getMemoryStats(db, projectId);
  const sections: string[] = [HEADER, ""];

  sections.push(PEBBLE_INSTRUCTIONS);
  sections.push("");

  // --- Project Context ---
  const contextMemories = getActiveMemories(db, projectId, "context");
  if (contextMemories.length > 0) {
    sections.push(formatSection("context", contextMemories, config));
  }

  // --- Decisions ---
  const decisionMemories = getActiveMemories(db, projectId, "decision");
  if (decisionMemories.length > 0) {
    sections.push(formatSection("decision", decisionMemories, config));
  }

  // --- Patterns ---
  const patternMemories = getActiveMemories(db, projectId, "pattern");
  if (patternMemories.length > 0) {
    sections.push(formatSection("pattern", patternMemories, config));
  }

  // --- Learnings ---
  const learningMemories = getActiveMemories(db, projectId, "learning", 0.2);
  if (learningMemories.length > 0) {
    sections.push(formatSection("learning", learningMemories, config));
  }

  // --- Active Work ---
  const todoMemories = getActiveMemories(db, projectId, "todo", 0.3);
  if (todoMemories.length > 0) {
    sections.push(formatSection("todo", todoMemories, config));
  }

  // --- Unprocessed Commits ---
  const unprocessed = getUnprocessedCommits(db, projectId);
  if (unprocessed.length > 0) {
    sections.push("## 🔄 Unprocessed Commits");
    sections.push("");
    sections.push("Review these commits. Call `pebble_remember` for insights, then `pebble_mark_processed`.");
    sections.push("");

    // Show last 5 with full diff, older ones as one-liners
    const MAX_DETAILED = 5;
    const detailed = unprocessed.slice(-MAX_DETAILED);
    const older = unprocessed.slice(0, -MAX_DETAILED);

    if (older.length > 0) {
      sections.push(`**${older.length} older commits** (review commit messages, mark processed if not relevant):`);
      for (const commit of older) {
        sections.push(`- ${commit.hash.slice(0, 7)}: ${commit.message}`);
      }
      sections.push("");
    }

    for (const commit of detailed) {
      sections.push(`### ${commit.hash.slice(0, 7)}: ${commit.message}`);
      if (commit.diff_summary) {
        sections.push("```");
        sections.push(commit.diff_summary);
        sections.push("```");
      }
      if (commit.diff_patch) {
        const patch = commit.diff_patch.length > 3000
          ? commit.diff_patch.slice(0, 3000) + "\n... [truncated]"
          : commit.diff_patch;
        sections.push("<details><summary>Diff</summary>");
        sections.push("");
        sections.push("```diff");
        sections.push(patch);
        sections.push("```");
        sections.push("</details>");
      }
      sections.push("");
    }
  }

  // --- Footer ---
  sections.push(`# ─── Pebble: ${stats.total || 0} memories | ${unprocessed.length} unprocessed commits ───`);

  let output = sections.join("\n");

  const lines = output.split("\n");
  if (lines.length > config.max_claude_md_lines + (unprocessed.length * 20)) {
    output = trimToFit(db, projectId, config);
  }

  // Also generate context tree
  if (projectPath) {
    generateContextTree(db, projectId, projectPath, config);
  }

  return output;
}

function formatSection(
  category: Memory["category"],
  memories: Memory[],
  config: PebbleConfig
): string {
  const cat = config.categories[category];
  const lines: string[] = [];

  lines.push(`## ${cat.emoji} ${cat.label}`);
  lines.push("");

  for (const mem of memories) {
    const relevanceHint = mem.relevance >= 0.8 ? "" : mem.relevance >= 0.5 ? " ⤵" : " ⤵⤵";
    lines.push(`- ${mem.content}${relevanceHint}`);
  }

  lines.push("");
  return lines.join("\n");
}

function trimToFit(
  db: Database.Database,
  projectId: number,
  config: PebbleConfig
): string {
  const sections: string[] = [HEADER, "", PEBBLE_INSTRUCTIONS, ""];

  const contextMemories = getActiveMemories(db, projectId, "context", 0.3);
  if (contextMemories.length > 0) {
    sections.push(formatSection("context", contextMemories.slice(0, 10), config));
  }

  const decisionMemories = getActiveMemories(db, projectId, "decision", 0.4);
  if (decisionMemories.length > 0) {
    sections.push(formatSection("decision", decisionMemories.slice(0, 15), config));
  }

  const patternMemories = getActiveMemories(db, projectId, "pattern", 0.4);
  if (patternMemories.length > 0) {
    sections.push(formatSection("pattern", patternMemories.slice(0, 10), config));
  }

  const learningMemories = getActiveMemories(db, projectId, "learning", 0.5);
  if (learningMemories.length > 0) {
    sections.push(formatSection("learning", learningMemories.slice(0, 5), config));
  }

  const unprocessed = getUnprocessedCommits(db, projectId);
  if (unprocessed.length > 0) {
    sections.push("## 🔄 Unprocessed Commits");
    sections.push("");
    for (const commit of unprocessed) {
      sections.push(`- **${commit.hash.slice(0, 7)}**: ${commit.message}`);
    }
    sections.push("");
  }

  return sections.join("\n");
}

/**
 * Write memory.md inside .pebble/ — never touches CLAUDE.md
 */
export function writeMemoryMd(projectPath: string, content: string): void {
  const memoryMdPath = path.join(projectPath, PEBBLE_DIR, "memory.md");
  const dir = path.dirname(memoryMdPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(memoryMdPath, content, "utf-8");
}

/**
 * Inject a one-liner into project CLAUDE.md pointing to pebble memory.
 * Only adds it once, never modifies existing content.
 */
export function ensureClaudeMdPointer(projectPath: string): void {
  const claudeMdPath = path.join(projectPath, "CLAUDE.md");
  const pointer = `> **Pebble Memory**: Read \`.pebble/memory.md\` for accumulated project knowledge and unprocessed commits.`;

  if (fs.existsSync(claudeMdPath)) {
    const content = fs.readFileSync(claudeMdPath, "utf-8");
    if (content.includes(".pebble/memory.md")) return; // Already has pointer
    // Append pointer at the top, after first line
    const lines = content.split("\n");
    const firstHeading = lines.findIndex((l) => l.startsWith("#"));
    if (firstHeading >= 0) {
      lines.splice(firstHeading + 1, 0, "", pointer, "");
    } else {
      lines.unshift(pointer, "");
    }
    fs.writeFileSync(claudeMdPath, lines.join("\n"), "utf-8");
  } else {
    // No CLAUDE.md exists — create minimal one
    const minimal = `# CLAUDE.md\n\n${pointer}\n`;
    fs.writeFileSync(claudeMdPath, minimal, "utf-8");
  }
}

// ---------------------------------------------------------------------------
// The global CLAUDE.md instruction block — this is what makes Claude Code
// actually USE the pebble tools without being told.
// ---------------------------------------------------------------------------

const GLOBAL_PEBBLE_BLOCK = `
### Pebble Memory — MANDATORY

Every project with a \`.pebble/\` directory uses Pebble for persistent memory. This is not optional.

**CRITICAL**: Every \`pebble_*\` tool call MUST include \`project_path\` set to your current working directory. The MCP server needs this to find the right project's database.

**RULES — follow these like "No Placeholders" and "No Laziness":**

1. **Session start**: Read \`.pebble/memory.md\`. If there are unprocessed commits, review them, call \`pebble_remember\` for anything worth keeping, then call \`pebble_mark_processed\`.
2. **During work**: When you make a decision, discover a pattern, hit a bug, or learn something non-obvious — call \`pebble_remember\` immediately. Do not wait. Do not batch. One insight = one call.
3. **Before session ends**: Call \`pebble_remember\` for every important decision or learning from this session. Conversations and reasoning that never become code are the MOST valuable things to persist.
4. **When you need context**: Call \`pebble_recall\` to search past memories before making assumptions.

**What to remember** (use the right category):
- \`decision\`: WHY you chose an approach, not just what you did
- \`pattern\`: Code conventions, naming rules, file structure patterns
- \`context\`: Domain knowledge, key entities, how things connect
- \`learning\`: Bugs found, pitfalls, non-obvious behavior, debugging insights
- \`todo\`: Active work items, next steps, blockers

**Failure mode**: If you finish a session where you made architectural decisions, fixed bugs, or learned something — and you did NOT call \`pebble_remember\` — you failed. The next session starts from zero. That is unacceptable.
`;

/**
 * Inject Pebble instructions into the GLOBAL ~/.claude/CLAUDE.md.
 * This ensures Claude Code uses pebble tools in EVERY project that has .pebble/.
 * Only adds it once, never modifies existing content beyond the Pebble block.
 */
export function ensureGlobalClaudeMdPebble(homeDir?: string): void {
  const home = homeDir || process.env.HOME || process.env.USERPROFILE || "";
  if (!home) return;

  const claudeDir = path.join(home, ".claude");
  const claudeMdPath = path.join(claudeDir, "CLAUDE.md");

  // Ensure ~/.claude/ exists
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }

  if (fs.existsSync(claudeMdPath)) {
    const content = fs.readFileSync(claudeMdPath, "utf-8");
    if (content.includes("Pebble Memory — MANDATORY")) {
      // Already injected — check if it needs updating (e.g. project_path was added)
      if (content.includes("project_path")) return; // Up to date
      // Replace old block with new one
      const startMarker = "### Pebble Memory — MANDATORY";
      const startIdx = content.indexOf(startMarker);
      if (startIdx >= 0) {
        // Find end of block — next ### heading or end of file
        const afterStart = content.indexOf("\n###", startIdx + startMarker.length);
        const blockEnd = afterStart >= 0 ? afterStart : content.length;
        const before = content.slice(0, startIdx).trimEnd();
        const after = content.slice(blockEnd);
        const updated = before + "\n" + GLOBAL_PEBBLE_BLOCK + after;
        fs.writeFileSync(claudeMdPath, updated, "utf-8");
      }
      return;
    }
    // Append at end
    const updated = content.trimEnd() + "\n" + GLOBAL_PEBBLE_BLOCK;
    fs.writeFileSync(claudeMdPath, updated, "utf-8");
  } else {
    // No global CLAUDE.md — create with Pebble block
    const minimal = `# CLAUDE.md\n${GLOBAL_PEBBLE_BLOCK}`;
    fs.writeFileSync(claudeMdPath, minimal, "utf-8");
  }
}
