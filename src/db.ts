// ============================================================================
// Pebble — Database Layer
// SQLite-backed persistent memory store
// ============================================================================

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import {
  type Memory,
  type MemoryCategory,
  type Project,
  type Session,
  PEBBLE_DIR,
  PEBBLE_DB,
} from "./types.js";
import { initQueueSchema } from "./extractor.js";

const _dbCache = new Map<string, Database.Database>();

export function getDbPath(projectPath: string): string {
  return path.join(projectPath, PEBBLE_DIR, PEBBLE_DB);
}

export function openDb(projectPath: string): Database.Database {
  const dbPath = getDbPath(projectPath);

  // Return cached connection for this path
  const cached = _dbCache.get(dbPath);
  if (cached) return cached;

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  initSchema(db);
  initQueueSchema(db);
  _dbCache.set(dbPath, db);
  return db;
}

export function closeDb(): void {
  for (const db of _dbCache.values()) {
    db.close();
  }
  _dbCache.clear();
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id),
      category TEXT NOT NULL CHECK(category IN ('decision','pattern','context','learning','todo')),
      content TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'explicit',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      relevance REAL NOT NULL DEFAULT 1.0,
      superseded_by INTEGER REFERENCES memories(id),
      tags TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id),
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT,
      commit_count INTEGER NOT NULL DEFAULT 0,
      memories_created INTEGER NOT NULL DEFAULT 0,
      summary TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_memories_project ON memories(project_id);
    CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(project_id, category);
    CREATE INDEX IF NOT EXISTS idx_memories_relevance ON memories(project_id, relevance DESC);
    CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
  `);
}

// ---------------------------------------------------------------------------
// Project operations
// ---------------------------------------------------------------------------

export function ensureProject(db: Database.Database, projectPath: string, name: string): Project {
  const existing = db.prepare("SELECT * FROM projects WHERE path = ?").get(projectPath) as Project | undefined;
  if (existing) return existing;

  const stmt = db.prepare("INSERT INTO projects (path, name) VALUES (?, ?)");
  const result = stmt.run(projectPath, name);
  return {
    id: result.lastInsertRowid as number,
    path: projectPath,
    name,
    created_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Memory operations
// ---------------------------------------------------------------------------

export function addMemory(
  db: Database.Database,
  projectId: number,
  category: MemoryCategory,
  content: string,
  source: string,
  tags: string[] = []
): Memory {
  const stmt = db.prepare(`
    INSERT INTO memories (project_id, category, content, source, tags)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(projectId, category, content, source, JSON.stringify(tags));

  return {
    id: result.lastInsertRowid as number,
    project_id: projectId,
    category,
    content,
    source,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    relevance: 1.0,
    superseded_by: null,
    tags,
  };
}

export function supersedeMemory(db: Database.Database, oldId: number, newId: number): void {
  db.prepare("UPDATE memories SET superseded_by = ?, relevance = 0 WHERE id = ?").run(newId, oldId);
}

export function getActiveMemories(
  db: Database.Database,
  projectId: number,
  category?: MemoryCategory,
  minRelevance: number = 0.1
): Memory[] {
  let query = `
    SELECT * FROM memories
    WHERE project_id = ?
      AND superseded_by IS NULL
      AND relevance >= ?
  `;
  const params: (number | string)[] = [projectId, minRelevance];

  if (category) {
    query += " AND category = ?";
    params.push(category);
  }

  query += " ORDER BY relevance DESC, created_at DESC";

  const rows = db.prepare(query).all(...params) as Array<Memory & { tags: string }>;
  return rows.map((r) => ({ ...r, tags: JSON.parse(r.tags as string) as string[] }));
}

export function searchMemories(
  db: Database.Database,
  projectId: number,
  query: string
): Memory[] {
  // Simple keyword search — v1, semantic search comes later
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const conditions = words.map(() => "(LOWER(content) LIKE ? OR LOWER(tags) LIKE ?)").join(" AND ");
  const params: (number | string)[] = [projectId];
  for (const word of words) {
    params.push(`%${word}%`, `%${word}%`);
  }

  const sql = `
    SELECT * FROM memories
    WHERE project_id = ?
      AND superseded_by IS NULL
      AND relevance > 0
      AND (${conditions})
    ORDER BY relevance DESC, created_at DESC
    LIMIT 20
  `;

  const rows = db.prepare(sql).all(...params) as Array<Memory & { tags: string }>;
  return rows.map((r) => ({ ...r, tags: JSON.parse(r.tags as string) as string[] }));
}

export function removeMemory(db: Database.Database, id: number): boolean {
  const result = db.prepare("DELETE FROM memories WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getMemoryStats(db: Database.Database, projectId: number): Record<string, number> {
  const rows = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM memories
    WHERE project_id = ? AND superseded_by IS NULL AND relevance > 0
    GROUP BY category
  `).all(projectId) as Array<{ category: string; count: number }>;

  const stats: Record<string, number> = { total: 0 };
  for (const row of rows) {
    stats[row.category] = row.count;
    stats.total += row.count;
  }
  return stats;
}

// ---------------------------------------------------------------------------
// Relevance decay
// ---------------------------------------------------------------------------

export function decayRelevance(db: Database.Database, projectId: number, decayDays: number): number {
  // Decay formula: relevance *= 0.95 for each day past decayDays
  // Patterns and context decay slower than todos and learnings
  const result = db.prepare(`
    UPDATE memories
    SET relevance = CASE
      WHEN category IN ('pattern', 'context', 'decision') THEN
        MAX(0.1, relevance * POWER(0.98, MAX(0, julianday('now') - julianday(updated_at) - ?)))
      ELSE
        MAX(0.05, relevance * POWER(0.95, MAX(0, julianday('now') - julianday(updated_at) - ?)))
    END,
    updated_at = datetime('now')
    WHERE project_id = ?
      AND superseded_by IS NULL
      AND julianday('now') - julianday(updated_at) > ?
  `).run(decayDays, decayDays, projectId, decayDays);

  return result.changes;
}

// ---------------------------------------------------------------------------
// Session operations
// ---------------------------------------------------------------------------

export function startSession(db: Database.Database, projectId: number): Session {
  const stmt = db.prepare("INSERT INTO sessions (project_id) VALUES (?)");
  const result = stmt.run(projectId);
  return {
    id: result.lastInsertRowid as number,
    project_id: projectId,
    started_at: new Date().toISOString(),
    ended_at: null,
    commit_count: 0,
    memories_created: 0,
    summary: null,
  };
}

export function endSession(
  db: Database.Database,
  sessionId: number,
  commitCount: number,
  memoriesCreated: number,
  summary: string | null
): void {
  db.prepare(`
    UPDATE sessions
    SET ended_at = datetime('now'),
        commit_count = ?,
        memories_created = ?,
        summary = ?
    WHERE id = ?
  `).run(commitCount, memoriesCreated, summary, sessionId);
}
