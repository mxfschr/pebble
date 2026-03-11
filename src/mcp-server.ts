#!/usr/bin/env node
// ============================================================================
// Pebble — MCP Server
// Gives Claude Code persistent memory via MCP tools.
// No API keys needed — Claude Code IS the intelligence layer.
// ============================================================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import path from "path";
import fs from "fs";
import {
  openDb,
  ensureProject,
  addMemory,
  searchMemories,
  getActiveMemories,
  removeMemory,
  getMemoryStats,
  decayRelevance,
} from "./db.js";
import { generateMemoryMd, writeMemoryMd } from "./generator.js";
import {
  getUnprocessedCommits,
  markCommitProcessed,
  markAllProcessed,
} from "./extractor.js";
import {
  type MemoryCategory,
  type PebbleConfig,
  DEFAULT_CONFIG,
  PEBBLE_DIR,
  PEBBLE_CONFIG,
} from "./types.js";

// ---------------------------------------------------------------------------
// Resolve project path and config
// ---------------------------------------------------------------------------

function resolveProjectPath(): string {
  if (process.env.PEBBLE_PROJECT_PATH) {
    return process.env.PEBBLE_PROJECT_PATH;
  }
  return process.cwd();
}

function loadConfig(projectPath: string): PebbleConfig {
  const configPath = path.join(projectPath, PEBBLE_DIR, PEBBLE_CONFIG);
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  }
  return DEFAULT_CONFIG;
}

// ---------------------------------------------------------------------------
// MCP Server setup
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "pebble-mcp-server",
  version: "0.1.0",
});

const projectPath = resolveProjectPath();
const config = loadConfig(projectPath);
const db = openDb(projectPath);
const projectName = path.basename(projectPath);
const project = ensureProject(db, projectPath, projectName);

// Run decay on startup
decayRelevance(db, project.id, config.relevance_decay_days);

// ---------------------------------------------------------------------------
// Tool: pebble_remember
// ---------------------------------------------------------------------------

server.registerTool(
  "pebble_remember",
  {
    title: "Remember Something",
    description: `Store a memory for this project. Use this to persist important information across sessions. Categories:
- decision: Architectural/design choices with rationale (WHY not just WHAT)
- pattern: Code conventions, naming rules, structural patterns
- context: Project domain knowledge, key entities, relationships
- learning: Bugs found, pitfalls, non-obvious behavior
- todo: Active work items, next steps

Call this when you make decisions, discover patterns, or learn something non-obvious.
Also call this after reviewing unprocessed commits in CLAUDE.md.`,
    inputSchema: {
      category: z.enum(["decision", "pattern", "context", "learning", "todo"])
        .describe("Memory category"),
      content: z.string()
        .min(5, "Memory content must be at least 5 characters")
        .max(500, "Keep memories concise — max 500 characters")
        .describe("What to remember. Be concise but include rationale for decisions."),
      tags: z.array(z.string())
        .max(5)
        .default([])
        .describe("Optional searchable tags (e.g. ['auth', 'api', 'postgres'])"),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  async ({ category, content, tags }) => {
    const memory = addMemory(db, project.id, category as MemoryCategory, content, "mcp", tags);

    // Regenerate CLAUDE.md
    const memoryMd = generateMemoryMd(db, project.id, config, projectPath);
    writeMemoryMd(projectPath, memoryMd);

    return {
      content: [{
        type: "text",
        text: `Remembered (${category}): "${content}" [id:${memory.id}]\nmemory.md updated.`,
      }],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: pebble_recall
// ---------------------------------------------------------------------------

server.registerTool(
  "pebble_recall",
  {
    title: "Search Memories",
    description: `Search project memories by keyword. Use when you need to recall past decisions, patterns, or context.`,
    inputSchema: {
      query: z.string()
        .min(2, "Search query must be at least 2 characters")
        .describe("Keywords to search for in memories"),
      category: z.enum(["decision", "pattern", "context", "learning", "todo"])
        .optional()
        .describe("Optional: filter by category"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ query, category }) => {
    let memories;
    if (category) {
      memories = getActiveMemories(db, project.id, category as MemoryCategory)
        .filter((m) => m.content.toLowerCase().includes(query.toLowerCase()));
    } else {
      memories = searchMemories(db, project.id, query);
    }

    if (memories.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No memories found for "${query}".`,
        }],
      };
    }

    const formatted = memories.map((m) =>
      `[${m.category}] (id:${m.id}, relevance:${m.relevance.toFixed(2)}) ${m.content}`
    ).join("\n");

    return {
      content: [{
        type: "text",
        text: `Found ${memories.length} memories:\n\n${formatted}`,
      }],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: pebble_forget
// ---------------------------------------------------------------------------

server.registerTool(
  "pebble_forget",
  {
    title: "Remove a Memory",
    description: `Remove a specific memory by its ID. Use when a memory is outdated or incorrect.`,
    inputSchema: {
      memory_id: z.number()
        .int()
        .positive()
        .describe("The ID of the memory to remove"),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ memory_id }) => {
    const removed = removeMemory(db, memory_id);

    if (!removed) {
      return {
        content: [{ type: "text", text: `No memory found with id:${memory_id}` }],
      };
    }

    const memoryMd = generateMemoryMd(db, project.id, config, projectPath);
    writeMemoryMd(projectPath, memoryMd);

    return {
      content: [{
        type: "text",
        text: `Memory id:${memory_id} removed. memory.md updated.`,
      }],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: pebble_status
// ---------------------------------------------------------------------------

server.registerTool(
  "pebble_status",
  {
    title: "Memory Status",
    description: `Show memory statistics and unprocessed commit count.`,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async () => {
    const stats = getMemoryStats(db, project.id);
    const unprocessed = getUnprocessedCommits(db, project.id);
    const catConfig = config.categories;

    const lines = [
      `Pebble Memory: ${project.name}`,
      "─".repeat(40),
    ];

    for (const [cat, info] of Object.entries(catConfig)) {
      lines.push(`${info.emoji} ${info.label}: ${stats[cat] || 0}`);
    }

    lines.push("─".repeat(40));
    lines.push(`Total: ${stats.total || 0} active memories`);
    lines.push(`Unprocessed commits: ${unprocessed.length}`);

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: pebble_mark_processed
// ---------------------------------------------------------------------------

server.registerTool(
  "pebble_mark_processed",
  {
    title: "Mark Commits as Processed",
    description: `Mark unprocessed commits as done after you've reviewed them and stored any relevant memories via pebble_remember. Call this after processing the "Unprocessed Commits" section in CLAUDE.md. Pass a specific commit queue ID, or leave empty to mark all as processed.`,
    inputSchema: {
      commit_id: z.number()
        .int()
        .positive()
        .optional()
        .describe("Specific commit queue ID to mark processed. Omit to mark ALL as processed."),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ commit_id }) => {
    if (commit_id) {
      markCommitProcessed(db, commit_id);
    } else {
      markAllProcessed(db, project.id);
    }

    // Regenerate CLAUDE.md (unprocessed section will shrink/disappear)
    const memoryMd = generateMemoryMd(db, project.id, config, projectPath);
    writeMemoryMd(projectPath, memoryMd);

    return {
      content: [{
        type: "text",
        text: commit_id
          ? `Commit #${commit_id} marked as processed. memory.md updated.`
          : `All commits marked as processed. memory.md updated.`,
      }],
    };
  }
);

// ---------------------------------------------------------------------------
// Start MCP server
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Pebble MCP server error:", error);
  process.exit(1);
});
