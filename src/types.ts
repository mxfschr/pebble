// ============================================================================
// Pebble — Type Definitions
// Small stones, big picture.
// ============================================================================

export type MemoryCategory =
  | "decision"   // Architectural/design choices with rationale
  | "pattern"    // Code conventions, naming rules, structure
  | "context"    // Project overview, key entities, domain knowledge
  | "learning"   // Bugs found, pitfalls, gotchas, debugging insights
  | "todo";      // Active work items, next steps

export interface Memory {
  id: number;
  project_id: number;
  category: MemoryCategory;
  content: string;
  source: string;           // "mcp", "manual", "imported:claude.md"
  created_at: string;
  updated_at: string;
  relevance: number;        // 0.0 - 1.0, decays over time
  superseded_by: number | null;
  tags: string[];
}

export interface Project {
  id: number;
  path: string;
  name: string;
  created_at: string;
}

export interface Session {
  id: number;
  project_id: number;
  started_at: string;
  ended_at: string | null;
  commit_count: number;
  memories_created: number;
  summary: string | null;
}

export interface PebbleConfig {
  model: string;             // kept for future use, not required now
  auto_extract: boolean;
  max_claude_md_lines: number;
  relevance_decay_days: number;
  categories: Record<MemoryCategory, { emoji: string; label: string }>;
}

export const DEFAULT_CONFIG: PebbleConfig = {
  model: "claude-sonnet-4-20250514",
  auto_extract: true,
  max_claude_md_lines: 150,
  relevance_decay_days: 30,
  categories: {
    decision: { emoji: "⚡", label: "Decisions" },
    pattern:  { emoji: "🔧", label: "Patterns & Conventions" },
    context:  { emoji: "📋", label: "Project Context" },
    learning: { emoji: "💡", label: "Learnings" },
    todo:     { emoji: "🎯", label: "Active Work" },
  },
};

export const PEBBLE_DIR = ".pebble";
export const PEBBLE_DB = "memory.db";
export const PEBBLE_CONFIG = "config.json";
