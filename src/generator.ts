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

// Minimal pointer — the MANDATORY rules live in global ~/.claude/CLAUDE.md
// (injected by ensureGlobalClaudeMdPebble) to avoid duplicating ~150 tokens
// of instructions in every project's memory.md.
const PEBBLE_INSTRUCTIONS = `
> Pebble active. MCP tools: pebble_remember, pebble_recall, pebble_status, pebble_mark_processed, pebble_forget. Usage rules in ~/.claude/CLAUDE.md.`;

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
  // Compact: header + bullets, no surrounding blank lines.
  // sections.join("\n") in the caller still gives newline separation,
  // and Markdown renders this fine. Saves ~2 lines × 5 sections per regen.
  const cat = config.categories[category];
  const lines: string[] = [`## ${cat.emoji} ${cat.label}`];
  for (const mem of memories) {
    lines.push(`- ${mem.content}`);
  }
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

Pebble manages two layers of memory: **project memory** (per-repo) and **user memory** (global, cross-project).

**Project memory** — for any project with a \`.pebble/\` directory:
- Always pass \`project_path\` (current working directory) to every \`pebble_*\` call.
- **Session start**: Read \`.pebble/memory.md\`. Process unprocessed commits via \`pebble_remember\` then \`pebble_mark_processed\`.
- **During work**: Call \`pebble_remember\` immediately for decisions, patterns, learnings, bugs, or todos. Don't batch. Categories: decision, pattern, context, learning, todo.
- **Before session ends**: Persist every important insight — conversations that never become code are the most valuable.
- **Need context**: Call \`pebble_recall\` before assuming.

**User memory** — global, in \`~/.pebble/user/\` (machine-local):
- **Session start**: If \`~/.pebble/user/\` exists, read \`voice.md\` (how to communicate with this user) and \`about.md\` (who they are). Apply what you read to your tone and assumptions.
- **During work**: Call \`pebble_user_note\` when you observe something durable about the user — communication style, preferences, cross-project context, life situation that affects work. Do not log session-specific or project-specific things here (those go in project memory).
- **Need context**: Call \`pebble_user_recall\` to search past observations, or \`pebble_user_read\` to load a specific file.
- **Consolidation**: Also at session start, call \`pebble_user_status\`. If notes.md has 15+ entries, consolidate before continuing: read notes.md + about.md/voice.md, integrate durable observations into about.md/voice.md via \`pebble_user_write\`, then clear processed entries from notes.md (also via \`pebble_user_write\`). No approval dialog — git is the safety net. Be deliberate but don't be paralyzed. This is how the user-profile grows over time.
- If \`~/.pebble/user/\` does not exist, do not nag — only suggest \`pebble user init\` if communication style or identity is directly relevant to the current task.
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
      // Block exists — keep it in sync with the current code-source-of-truth.
      // Accept both `## ` and `### ` heading levels (early Pebble versions
      // used ##; current GLOBAL_PEBBLE_BLOCK uses ###).
      const startIdx = Math.max(
        content.indexOf("## Pebble Memory — MANDATORY"),
        content.indexOf("### Pebble Memory — MANDATORY")
      );
      if (startIdx >= 0) {
        // Find end of block — next heading of same or lower depth, or end of file
        const afterStart = content.search(/\n(##?#?) [^\n]/g);
        // More robust: scan forward for next heading after our block
        const blockStartLineEnd = content.indexOf("\n", startIdx);
        const remaining = content.slice(blockStartLineEnd + 1);
        const nextHeadingMatch = remaining.match(/\n(#{2,3}) [^\n]/);
        const blockEnd = nextHeadingMatch
          ? blockStartLineEnd + 1 + (nextHeadingMatch.index ?? 0)
          : content.length;
        const before = content.slice(0, startIdx).trimEnd();
        const after = content.slice(blockEnd);
        const updated = before + "\n\n" + GLOBAL_PEBBLE_BLOCK.trim() + "\n" + after;
        if (updated !== content) {
          fs.writeFileSync(claudeMdPath, updated, "utf-8");
        }
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
