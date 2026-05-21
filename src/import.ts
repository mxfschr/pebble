// ============================================================================
// Pebble — Markdown → DB import
// Solves the cross-machine UX gap: after `git pull` on a fresh machine,
// .pebble/memory.md has content but the local SQLite DB is empty.
// Without this import, pebble_recall finds nothing until the user starts
// writing new memories — even though the knowledge is sitting right there
// in the markdown file Claude can see.
//
// On first MCP tool call per project per server lifetime, if the DB has
// 0 memories AND memory.md exists with parseable content, this module
// parses the markdown sections and rehydrates the DB. Result: pebble_recall
// works immediately after `git pull`.
// ============================================================================

import fs from "fs";
import path from "path";
import type Database from "better-sqlite3";
import { addMemory, getMemoryStats } from "./db.js";
import { type MemoryCategory, PEBBLE_DIR } from "./types.js";

// Map markdown section labels to internal category values. We accept the
// default labels from DEFAULT_CONFIG.categories — if a user has customized
// labels in their config, the import will skip those sections (not an error,
// just nothing to import from). Custom-label support is a possible v0.7.x feature.
const LABEL_TO_CATEGORY: Record<string, MemoryCategory> = {
  "Project Context": "context",
  "Decisions": "decision",
  "Patterns & Conventions": "pattern",
  "Patterns": "pattern",
  "Learnings": "learning",
  "Active Work": "todo",
};

export interface ImportResult {
  imported: number;                              // total memories added to DB
  byCategory: Partial<Record<MemoryCategory, number>>;
  skipped: number;                               // bullets we couldn't categorize
}

// In-memory tracking — only attempt import once per project per server run.
const _importedThisSession = new Set<string>();

export function shouldImportOnceThisSession(projectPath: string): boolean {
  const normalized = path.resolve(projectPath);
  if (_importedThisSession.has(normalized)) return false;
  _importedThisSession.add(normalized);
  return true;
}

/**
 * Parse a memory.md file into category-grouped bullet contents.
 *
 * The format we read:
 *
 *     ## 📋 Project Context
 *     - First memory text
 *     - Second memory text
 *
 *     ## ⚡ Decisions
 *     - A decision
 *
 * Lines that don't match a recognized section header are skipped (including
 * the MANDATORY block at the top, the unprocessed-commits section, footers).
 * Within a recognized section, only lines starting with `- ` are taken.
 */
export function parseMemoryMd(content: string): Map<MemoryCategory, string[]> {
  const result = new Map<MemoryCategory, string[]>();
  const lines = content.split("\n");

  let currentCategory: MemoryCategory | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Section header detection: line starts with "## " (heading-2).
    // We strip any leading emoji and whitespace, then look up the label.
    const headerMatch = line.match(/^##\s+(.+)$/);
    if (headerMatch) {
      const headerText = headerMatch[1]?.trim() ?? "";
      // Strip leading emoji + whitespace. Emoji characters are typically
      // multi-byte; we match by removing everything before the first ASCII letter.
      const labelStart = headerText.search(/[A-Za-z]/);
      const label = labelStart >= 0 ? headerText.slice(labelStart).trim() : "";
      const category = LABEL_TO_CATEGORY[label];
      currentCategory = category ?? null;
      continue;
    }

    // Skip everything outside a recognized memory section
    if (!currentCategory) continue;

    // Bullet detection: line starts with "- " followed by content
    const bulletMatch = line.match(/^-\s+(.+)$/);
    if (!bulletMatch) continue;
    const memoryText = bulletMatch[1]?.trim() ?? "";
    if (!memoryText) continue;

    const bucket = result.get(currentCategory) ?? [];
    bucket.push(memoryText);
    result.set(currentCategory, bucket);
  }

  return result;
}

/**
 * Decide whether to attempt an import for this project, and run it if so.
 * Returns null if nothing was attempted (e.g. DB already has memories, or
 * memory.md doesn't exist). Returns ImportResult on attempt.
 */
export function maybeImportFromMd(
  db: Database.Database,
  projectId: number,
  projectPath: string
): ImportResult | null {
  const memoryMdPath = path.join(projectPath, PEBBLE_DIR, "memory.md");
  if (!fs.existsSync(memoryMdPath)) return null;

  const stats = getMemoryStats(db, projectId);
  if ((stats.total ?? 0) > 0) {
    // DB already has memories — never overwrite. The user can wipe the DB
    // and re-run if they want a re-import, but the safe default is hands-off.
    return null;
  }

  const content = fs.readFileSync(memoryMdPath, "utf-8");
  const parsed = parseMemoryMd(content);

  let imported = 0;
  const byCategory: Partial<Record<MemoryCategory, number>> = {};
  let skipped = 0;

  for (const [category, items] of parsed.entries()) {
    for (const text of items) {
      try {
        addMemory(db, projectId, category, text, "imported:memory.md", []);
        imported += 1;
        byCategory[category] = (byCategory[category] ?? 0) + 1;
      } catch {
        // Defensive — should not happen with valid text, but skip rather
        // than crash a session over one bad import.
        skipped += 1;
      }
    }
  }

  return { imported, byCategory, skipped };
}
