#!/usr/bin/env node
// ============================================================================
// Pebble — MCP Server
// Gives Claude Code persistent memory via MCP tools.
// Project path is resolved per tool call via project_path parameter,
// so one MCP server instance works across all projects.
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
import { generateMemoryMd, writeMemoryMd, ensureClaudeMdPointer } from "./generator.js";
import {
  getUnprocessedCommits,
  markCommitProcessed,
  markAllProcessed,
} from "./extractor.js";
import { installGitHook } from "./hooks.js";
import { tryAutoSync, tryAutoPull, shouldPullOnceThisSession } from "./sync.js";
import { maybeImportFromMd, shouldImportOnceThisSession } from "./import.js";
import {
  appendUserNote,
  recallUserMemory,
  getUserStatus,
  readUserFile,
  writeUserFile,
  getNotesEntryCount,
  DEFAULT_CONSOLIDATE_THRESHOLD,
} from "./user.js";
import {
  type MemoryCategory,
  type Project,
  type PebbleConfig,
  DEFAULT_CONFIG,
  PEBBLE_DIR,
  PEBBLE_CONFIG,
} from "./types.js";
import type Database from "better-sqlite3";

// ---------------------------------------------------------------------------
// Per-project context cache — one DB connection per project path
// ---------------------------------------------------------------------------

interface ProjectContext {
  db: Database.Database;
  project: Project;
  config: PebbleConfig;
  projectPath: string;
}

const projectCache = new Map<string, ProjectContext>();

function loadConfig(projectPath: string): PebbleConfig {
  const configPath = path.join(projectPath, PEBBLE_DIR, PEBBLE_CONFIG);
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  }
  return DEFAULT_CONFIG;
}

function getProjectContext(projectPath?: string): ProjectContext {
  // Resolve: explicit param > env var > cwd
  const resolved = projectPath
    || process.env.PEBBLE_PROJECT_PATH
    || process.cwd();

  // Normalize path for cache key
  const normalized = path.resolve(resolved);

  // Return cached if available
  const cached = projectCache.get(normalized);
  if (cached) return cached;

  // Auto-initialize if .pebble/ doesn't exist
  const pebbleDir = path.join(normalized, PEBBLE_DIR);
  if (!fs.existsSync(pebbleDir)) {
    fs.mkdirSync(pebbleDir, { recursive: true });

    // Save default config
    const configPath = path.join(pebbleDir, PEBBLE_CONFIG);
    fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8");

    // Init DB (openDb creates tables)
    const db = openDb(normalized);
    const projectName = path.basename(normalized);
    const project = ensureProject(db, normalized, projectName);

    // Install git hook (best-effort)
    try { installGitHook(normalized); } catch {}

    // Add .pebble entries to .gitignore
    const gitignorePath = path.join(normalized, ".gitignore");
    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, "utf-8");
      if (!gitignore.includes(".pebble")) {
        fs.appendFileSync(gitignorePath, "\n# Pebble memory (DB is private, context-tree can be shared)\n.pebble/memory.db\n.pebble/config.json\n");
      }
    }

    // Add pointer to project CLAUDE.md
    ensureClaudeMdPointer(normalized);

    // Generate initial memory.md
    const config = loadConfig(normalized);
    const memoryMd = generateMemoryMd(db, project.id, config, normalized);
    writeMemoryMd(normalized, memoryMd);

    const ctx: ProjectContext = { db, project, config, projectPath: normalized };
    projectCache.set(normalized, ctx);
    return ctx;
  }

  // Open DB and cache
  const config = loadConfig(normalized);
  const db = openDb(normalized);
  const projectName = path.basename(normalized);
  const project = ensureProject(db, normalized, projectName);
  decayRelevance(db, project.id, config.relevance_decay_days);

  // DB auto-import: on a fresh machine after `git pull`, memory.md has
  // content but the local DB is empty. Without this, pebble_recall returns
  // nothing until the user manually writes new memories. With this, the
  // markdown is rehydrated into the DB on first context creation per
  // project per server run, so recall works immediately.
  //
  // Skipped silently if DB already has memories or memory.md doesn't exist.
  // Only runs once per project per server lifetime (tracked in import.ts).
  if (shouldImportOnceThisSession(normalized)) {
    try {
      const result = maybeImportFromMd(db, project.id, normalized);
      if (result && result.imported > 0) {
        process.stderr.write(
          `[pebble] imported ${result.imported} memories from .pebble/memory.md into local DB\n`
        );
      }
    } catch (err) {
      // Defensive — import is best-effort, never break a session over it.
      process.stderr.write(`[pebble] import skipped: ${(err as Error).message}\n`);
    }
  }

  const ctx: ProjectContext = { db, project, config, projectPath: normalized };
  projectCache.set(normalized, ctx);

  // Auto-pull at start of session if enabled and this is the first time
  // we're seeing this project in this MCP-server lifetime. Non-blocking.
  if (config.auto_sync && shouldPullOnceThisSession(normalized)) {
    void tryAutoPull(normalized);
  }

  return ctx;
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "pebble-mcp-server",
  version: "0.1.0",
});

// Shared schema for project_path — every tool gets this
const projectPathSchema = z.string()
  .optional()
  .describe("Absolute path to the project root. Pass your current working directory here.");

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
      project_path: projectPathSchema,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  async ({ category, content, tags, project_path }) => {
    const ctx = getProjectContext(project_path);
    const memory = addMemory(ctx.db, ctx.project.id, category as MemoryCategory, content, "mcp", tags);

    const memoryMd = generateMemoryMd(ctx.db, ctx.project.id, ctx.config, ctx.projectPath);
    writeMemoryMd(ctx.projectPath, memoryMd);

    if (ctx.config.auto_sync) {
      void tryAutoSync(ctx.projectPath, `+${category}: ${content.slice(0, 60)}`);
    }

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
      project_path: projectPathSchema,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ query, category, project_path }) => {
    const ctx = getProjectContext(project_path);
    let memories;
    if (category) {
      memories = getActiveMemories(ctx.db, ctx.project.id, category as MemoryCategory)
        .filter((m) => m.content.toLowerCase().includes(query.toLowerCase()));
    } else {
      memories = searchMemories(ctx.db, ctx.project.id, query);
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
      project_path: projectPathSchema,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ memory_id, project_path }) => {
    const ctx = getProjectContext(project_path);
    const removed = removeMemory(ctx.db, memory_id);

    if (!removed) {
      return {
        content: [{ type: "text", text: `No memory found with id:${memory_id}` }],
      };
    }

    const memoryMd = generateMemoryMd(ctx.db, ctx.project.id, ctx.config, ctx.projectPath);
    writeMemoryMd(ctx.projectPath, memoryMd);

    if (ctx.config.auto_sync) {
      void tryAutoSync(ctx.projectPath, `forget id:${memory_id}`);
    }

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
    inputSchema: {
      project_path: projectPathSchema,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ project_path }) => {
    const ctx = getProjectContext(project_path);
    const stats = getMemoryStats(ctx.db, ctx.project.id);
    const unprocessed = getUnprocessedCommits(ctx.db, ctx.project.id);
    const catConfig = ctx.config.categories;

    const lines = [
      `Pebble Memory: ${ctx.project.name}`,
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
      project_path: projectPathSchema,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ commit_id, project_path }) => {
    const ctx = getProjectContext(project_path);
    if (commit_id) {
      markCommitProcessed(ctx.db, commit_id);
    } else {
      markAllProcessed(ctx.db, ctx.project.id);
    }

    const memoryMd = generateMemoryMd(ctx.db, ctx.project.id, ctx.config, ctx.projectPath);
    writeMemoryMd(ctx.projectPath, memoryMd);

    if (ctx.config.auto_sync) {
      void tryAutoSync(ctx.projectPath, commit_id ? `mark commit #${commit_id} processed` : "mark all commits processed");
    }

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
// Tool: pebble_user_note
// Append an observation about the user to ~/.pebble/user/notes.md
// ---------------------------------------------------------------------------

server.registerTool(
  "pebble_user_note",
  {
    title: "Note Something About the User",
    description: `Append an observation about the user to global user memory (~/.pebble/user/notes.md).

Use this when you learn something durable about how the user thinks, communicates, what they're working on broadly, or any cross-project context that would be useful to remember in future sessions across any project.

Do NOT use this for:
- Project-specific decisions (use pebble_remember instead)
- Session-specific state that won't matter next week
- Things the user already wrote in their own voice.md or about.md

Examples of good notes:
- "User switched primary editor from X to Y"
- "User prefers async communication on weekday mornings"
- "User uses 'we' when describing collaborative work — treats Claude as teammate, not tool"

Examples of what NOT to note:
- "User asked about implementing feature X today" (project-specific, ephemeral)
- "User said hi" (no durable signal)`,
    inputSchema: {
      content: z.string()
        .min(5, "Note must be at least 5 characters")
        .max(500, "Keep notes concise — max 500 characters")
        .describe("What you observed about the user. One sentence, durable across sessions."),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  async ({ content }) => {
    const note = appendUserNote(content);
    return {
      content: [{
        type: "text",
        text: `Noted: "${note.content}"\n(appended to ~/.pebble/user/notes.md at ${note.timestamp})`,
      }],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: pebble_user_recall
// Search across voice.md, about.md, notes.md
// ---------------------------------------------------------------------------

server.registerTool(
  "pebble_user_recall",
  {
    title: "Recall User Memory",
    description: `Search user-level memory (voice.md, about.md, notes.md) by keyword. Use when you need to remember something about the user that isn't in your current context — communication preferences, identity, past observations.`,
    inputSchema: {
      query: z.string()
        .min(2, "Search query must be at least 2 characters")
        .describe("Keywords to search for across all three user memory files."),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ query }) => {
    const matches = recallUserMemory(query);

    if (matches.length === 0) {
      return {
        content: [{ type: "text", text: `No user memory found matching "${query}".` }],
      };
    }

    const formatted = matches.map((m) =>
      `[${m.source}.md]\n${m.matches.map((line) => `  ${line}`).join("\n")}`
    ).join("\n\n");

    return {
      content: [{
        type: "text",
        text: `Found in user memory:\n\n${formatted}`,
      }],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: pebble_user_status
// Show what user memory exists
// ---------------------------------------------------------------------------

server.registerTool(
  "pebble_user_status",
  {
    title: "User Memory Status",
    description: `Show whether user memory files exist and their size. Useful to verify setup or check if voice.md / about.md have been customized yet.`,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async () => {
    const status = getUserStatus();
    if (!status.exists) {
      return {
        content: [{
          type: "text",
          text: `No user memory initialized.\nRun \`pebble user init\` to create ~/.pebble/user/ with starter templates.`,
        }],
      };
    }

    const entries = status.files.notes.entries;
    const consolidateHint = entries >= DEFAULT_CONSOLIDATE_THRESHOLD
      ? `\n\n⚠ notes.md has ${entries} entries (threshold: ${DEFAULT_CONSOLIDATE_THRESHOLD}). Consolidation recommended: read notes, integrate durable observations into about.md/voice.md via pebble_user_write, then clear or archive processed notes.`
      : "";

    const lines = [
      `User memory: ${status.root}`,
      "─".repeat(40),
      `voice.md:  ${status.files.voice.exists ? `${status.files.voice.lines} lines, ${status.files.voice.bytes} bytes` : "missing"}`,
      `about.md:  ${status.files.about.exists ? `${status.files.about.lines} lines, ${status.files.about.bytes} bytes` : "missing"}`,
      `notes.md:  ${status.files.notes.exists ? `${entries} entries, ${status.files.notes.bytes} bytes` : "missing"}`,
    ];

    return {
      content: [{ type: "text", text: lines.join("\n") + consolidateHint }],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: pebble_user_read
// Read a specific user memory file (voice / about / notes)
// ---------------------------------------------------------------------------

server.registerTool(
  "pebble_user_read",
  {
    title: "Read a User Memory File",
    description: `Read the full content of one of the three user memory files. Use at session start (or when context is missing) to learn the user's voice preferences, identity, and past observations.`,
    inputSchema: {
      which: z.enum(["voice", "about", "notes"])
        .describe("Which file to read: voice (communication style), about (identity), or notes (Claude's past observations)."),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ which }) => {
    const content = readUserFile(which);
    if (content === null) {
      return {
        content: [{
          type: "text",
          text: `${which}.md does not exist yet. Run \`pebble user init\` to create starter templates.`,
        }],
      };
    }
    return {
      content: [{ type: "text", text: content }],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: pebble_user_write
// Overwrite voice.md, about.md, or notes.md. Used for consolidation:
// you read notes.md + about.md, decide what's durable, and write a
// refreshed about.md. Then clear or archive the processed notes.
// ---------------------------------------------------------------------------

server.registerTool(
  "pebble_user_write",
  {
    title: "Write a User Memory File",
    description: `Overwrite voice.md, about.md, or notes.md with new content. Use this for consolidation: read notes.md (durable observations Claude has accumulated), integrate the stable ones into about.md or voice.md, then rewrite notes.md to clear the processed entries.

This is a FULL OVERWRITE, not an append. You are responsible for preserving any content you want to keep.

Typical consolidation flow at session start when notes.md is large:
1. pebble_user_read("notes") — get current observations
2. pebble_user_read("about") — get current durable profile
3. Decide which observations have become durable patterns vs. one-offs
4. pebble_user_write("about", <updated profile>) — promote durable ones
5. pebble_user_write("notes", <header only or short tail>) — clear processed

No approval dialog. Git is the safety net — auto-sync (if enabled on a project that contains the user-dir) will commit the changes, and the user can git diff / revert if you got it wrong. Be deliberate but don't be paralyzed.`,
    inputSchema: {
      which: z.enum(["voice", "about", "notes"])
        .describe("Which file to overwrite: voice, about, or notes."),
      content: z.string()
        .min(1, "Content cannot be empty")
        .describe("Full new content of the file. Markdown."),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  async ({ which, content }) => {
    const result = writeUserFile(which, content);
    return {
      content: [{
        type: "text",
        text: `Wrote ${result.bytesWritten} bytes to ${result.filePath}.\n(Full overwrite — review with \`git diff\` if the user-dir is git-tracked.)`,
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
