// ============================================================================
// Pebble — Commit Queue
// Captures git commit data for Claude Code to process via MCP
// No API keys needed — Claude Code IS the intelligence layer.
// ============================================================================

import { execSync } from "child_process";
import type Database from "better-sqlite3";

export interface QueuedCommit {
  id: number;
  project_id: number;
  hash: string;
  message: string;
  diff_summary: string;  // --stat output (compact)
  diff_patch: string;    // actual patch (truncated)
  created_at: string;
  processed: boolean;
}

// ---------------------------------------------------------------------------
// Schema extension — call once on DB init
// ---------------------------------------------------------------------------

export function initQueueSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS commit_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id),
      hash TEXT NOT NULL,
      message TEXT NOT NULL,
      diff_summary TEXT NOT NULL DEFAULT '',
      diff_patch TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      processed INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_queue_unprocessed
      ON commit_queue(project_id, processed) WHERE processed = 0;
  `);
}

// ---------------------------------------------------------------------------
// Queue a commit (called by git hook via CLI)
// ---------------------------------------------------------------------------

export function queueLastCommit(db: Database.Database, projectId: number, projectPath: string): QueuedCommit | null {
  const hash = getLastCommitHash(projectPath);
  if (!hash) return null;

  // Check if already queued
  const existing = db.prepare(
    "SELECT id FROM commit_queue WHERE project_id = ? AND hash = ?"
  ).get(projectId, hash);
  if (existing) return null;

  const message = getCommitMessage(projectPath, hash);
  const diffSummary = getDiffStat(projectPath, hash);
  const diffPatch = getDiffPatch(projectPath, hash, 6000); // cap at ~6k chars

  const stmt = db.prepare(`
    INSERT INTO commit_queue (project_id, hash, message, diff_summary, diff_patch)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(projectId, hash, message, diffSummary, diffPatch);

  return {
    id: result.lastInsertRowid as number,
    project_id: projectId,
    hash,
    message,
    diff_summary: diffSummary,
    diff_patch: diffPatch,
    created_at: new Date().toISOString(),
    processed: false,
  };
}

// ---------------------------------------------------------------------------
// Get unprocessed commits (for CLAUDE.md and MCP)
// ---------------------------------------------------------------------------

export function getUnprocessedCommits(db: Database.Database, projectId: number): QueuedCommit[] {
  return db.prepare(
    "SELECT * FROM commit_queue WHERE project_id = ? AND processed = 0 ORDER BY created_at ASC"
  ).all(projectId) as QueuedCommit[];
}

export function markCommitProcessed(db: Database.Database, commitId: number): void {
  db.prepare("UPDATE commit_queue SET processed = 1 WHERE id = ?").run(commitId);
}

export function markAllProcessed(db: Database.Database, projectId: number): void {
  db.prepare("UPDATE commit_queue SET processed = 1 WHERE project_id = ? AND processed = 0").run(projectId);
}

// ---------------------------------------------------------------------------
// Git helpers
// ---------------------------------------------------------------------------

export function getLastCommitHash(projectPath: string): string | null {
  try {
    return execSync(`git -C "${projectPath}" rev-parse HEAD`, { encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}

function getCommitMessage(projectPath: string, hash: string): string {
  try {
    return execSync(`git -C "${projectPath}" log -1 --pretty=format:"%s" ${hash}`, {
      encoding: "utf-8",
    }).trim();
  } catch {
    return "";
  }
}

function getDiffStat(projectPath: string, hash: string): string {
  try {
    return execSync(`git -C "${projectPath}" diff ${hash}~1..${hash} --stat`, {
      encoding: "utf-8",
      maxBuffer: 1024 * 1024,
    }).trim();
  } catch {
    // First commit or error
    try {
      return execSync(`git -C "${projectPath}" show ${hash} --stat --format=""`, {
        encoding: "utf-8",
        maxBuffer: 1024 * 1024,
      }).trim();
    } catch {
      return "";
    }
  }
}

function getDiffPatch(projectPath: string, hash: string, maxChars: number): string {
  try {
    let patch = execSync(`git -C "${projectPath}" diff ${hash}~1..${hash}`, {
      encoding: "utf-8",
      maxBuffer: 1024 * 1024 * 5,
    });

    if (patch.length > maxChars) {
      patch = patch.slice(0, maxChars) + "\n\n... [truncated by pebble] ...";
    }
    return patch;
  } catch {
    try {
      let patch = execSync(`git -C "${projectPath}" show ${hash} --format=""`, {
        encoding: "utf-8",
        maxBuffer: 1024 * 1024 * 5,
      });
      if (patch.length > maxChars) {
        patch = patch.slice(0, maxChars) + "\n\n... [truncated by pebble] ...";
      }
      return patch;
    } catch {
      return "";
    }
  }
}
