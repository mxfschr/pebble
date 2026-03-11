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
## 🪨 Pebble Memory System

You have MCP tools for persistent memory across sessions.
Detailed memories are in \`.pebble/context-tree/\` as markdown files.

**On session start:** Review any unprocessed commits below. For each one, decide
if it contains important decisions, patterns, learnings, or context. If so, call
\`pebble_remember\` to store them. Then call \`pebble_mark_processed\` to clear the queue.

**During work:** When you make an architectural decision, discover a pattern, or
learn something non-obvious, call \`pebble_remember\` to persist it.

**Before ending a long session:** If this session involved significant decisions or
changes, call \`pebble_remember\` for each important insight before the session ends.
Don't rely only on git hooks — discussions and reasoning that don't end up in code
are the most valuable things to remember.

**When you need context:** Call \`pebble_recall\` to search past memories, or read
files in \`.pebble/context-tree/\` for full details.`;

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
    sections.push("Review these commits. Extract important decisions, patterns, or learnings");
    sections.push("using `pebble_remember`, then call `pebble_mark_processed` to clear this list.");
    sections.push("");
    for (const commit of unprocessed) {
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
 * Inject a one-liner into CLAUDE.md pointing to pebble memory.
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
