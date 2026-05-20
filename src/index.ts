#!/usr/bin/env node
// ============================================================================
// Pebble — CLI
// Small stones, big picture.
// No API keys needed — Claude Code IS the intelligence layer.
// Pebble NEVER touches CLAUDE.md. It writes to .pebble/memory.md.
// ============================================================================

import { Command } from "commander";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import {
  openDb,
  closeDb,
  ensureProject,
  addMemory,
  getMemoryStats,
  decayRelevance,
  searchMemories,
  removeMemory,
} from "./db.js";
import { generateMemoryMd, writeMemoryMd, ensureClaudeMdPointer, ensureGlobalClaudeMdPebble } from "./generator.js";
import { queueLastCommit, getUnprocessedCommits } from "./extractor.js";
import { installGitHook, uninstallGitHook } from "./hooks.js";
import {
  type MemoryCategory,
  type PebbleConfig,
  DEFAULT_CONFIG,
  PEBBLE_DIR,
  PEBBLE_CONFIG,
} from "./types.js";

const VERSION = "0.3.0";

const SOUL_TEMPLATE = `# soul.md
# Define how Claude Code should feel when working with you.
# This is not about rules — CLAUDE.md handles that.
# This is about personality, voice, and mindset.

## Voice
- Deutsch für Diskussionen, Englisch für Code und Kommentare
- Direkt, kein Gelaber. Sag was du denkst.
- Wenn ich eine Frage stelle will ich deine echte Meinung, nicht 3 Optionen
- Wenn ich einen Imperativ gebe, mach es einfach
- Du darfst pushback geben wenn ich Mist baue. Kurz und klar.

## Mindset
- Wir sind ein Team: ich entscheide, du baust
- Denk mit. Wenn dir was auffällt das ich übersehe, sag es
- Kein "I'd be happy to help" — wir arbeiten zusammen, du hilfst nicht
- Behandle meine Projekte als wären es auch deine
- Revenue > Perfektion. Shipping > Planning.

## Was du NICHT machen sollst
- Mir ungefragt Alternativen vorschlagen wenn ich entschieden hab
- Jede Antwort mit einer Zusammenfassung starten
- "Great question!" oder ähnlichen Filler
- Mich fragen ob ich sicher bin — wenn ich sage "mach das", mach das
`;

function loadConfig(projectPath: string): PebbleConfig {
  const configPath = path.join(projectPath, PEBBLE_DIR, PEBBLE_CONFIG);
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  }
  return DEFAULT_CONFIG;
}

function saveConfig(projectPath: string, config: PebbleConfig): void {
  const configPath = path.join(projectPath, PEBBLE_DIR, PEBBLE_CONFIG);
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}

function regenerate(projectPath: string, config: PebbleConfig): void {
  const db = openDb(projectPath);
  const project = ensureProject(db, projectPath, path.basename(projectPath));
  const memoryMd = generateMemoryMd(db, project.id, config, projectPath);
  writeMemoryMd(projectPath, memoryMd);
  closeDb();
}

const program = new Command();

program
  .name("pebble")
  .description("Automatic persistent memory for AI coding assistants")
  .version(VERSION);

// ─────────────────────────────────────────────────────────────────────────────
// pebble init
// ─────────────────────────────────────────────────────────────────────────────

program
  .command("init")
  .description("Initialize Pebble in the current project")
  .option("--no-hooks", "Skip git hook installation")
  .option("--no-soul", "Skip soul.md creation")
  .action(async (opts) => {
    const projectPath = process.cwd();
    const projectName = path.basename(projectPath);

    console.log(chalk.bold("\n🪨 Pebble — initializing...\n"));

    // Create .pebble directory
    const pebbleDir = path.join(projectPath, PEBBLE_DIR);
    if (!fs.existsSync(pebbleDir)) {
      fs.mkdirSync(pebbleDir, { recursive: true });
    }

    // Save config
    const config = { ...DEFAULT_CONFIG };
    saveConfig(projectPath, config);
    console.log(chalk.green("  ✓  Created .pebble/config.json"));

    // Initialize DB
    const db = openDb(projectPath);
    ensureProject(db, projectPath, projectName);
    closeDb();
    console.log(chalk.green("  ✓  Initialized memory database"));

    // Install git hook
    if (opts.hooks !== false) {
      const hookResult = installGitHook(projectPath);
      if (hookResult.success) {
        console.log(chalk.green(`  ✓  ${hookResult.message}`));
      } else {
        console.log(chalk.yellow(`  ⚠  ${hookResult.message}`));
      }
    }

    // Add .pebble to .gitignore (but NOT context-tree)
    const gitignorePath = path.join(projectPath, ".gitignore");
    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, "utf-8");
      if (!gitignore.includes(".pebble")) {
        fs.appendFileSync(gitignorePath, "\n# Pebble memory (DB is private, context-tree can be shared)\n.pebble/memory.db\n.pebble/config.json\n");
        console.log(chalk.green("  ✓  Added .pebble DB to .gitignore"));
      }
    }

    // Generate .pebble/memory.md
    regenerate(projectPath, config);
    console.log(chalk.green("  ✓  Generated .pebble/memory.md"));

    // Add pointer to project CLAUDE.md (one line, non-destructive)
    ensureClaudeMdPointer(projectPath);
    console.log(chalk.green("  ✓  Added Pebble pointer to project CLAUDE.md"));

    // Inject MANDATORY instructions into global ~/.claude/CLAUDE.md
    ensureGlobalClaudeMdPebble();
    console.log(chalk.green("  ✓  Added Pebble rules to global ~/.claude/CLAUDE.md"));

    // Create soul.md template if it doesn't exist
    if (opts.soul !== false) {
      const soulPath = path.join(projectPath, "soul.md");
      if (!fs.existsSync(soulPath)) {
        fs.writeFileSync(soulPath, SOUL_TEMPLATE, "utf-8");
        console.log(chalk.green("  ✓  Created soul.md template — customize it!"));
      } else {
        console.log(chalk.gray("  ·  soul.md already exists, skipped"));
      }
    }

    console.log(chalk.bold("\n🪨 Pebble ready.\n"));
    console.log(chalk.gray("  Your files:"));
    console.log(chalk.gray("  • CLAUDE.md          → your rules (untouched by Pebble)"));
    console.log(chalk.gray("  • soul.md            → Claude's personality"));
    console.log(chalk.gray("  • .pebble/memory.md  → accumulated knowledge (auto-generated)"));
    console.log(chalk.gray("  • .pebble/context-tree/  → detailed memories as markdown\n"));
  });

// ─────────────────────────────────────────────────────────────────────────────
// pebble capture — called by git hook
// ─────────────────────────────────────────────────────────────────────────────

program
  .command("capture")
  .description("Queue the latest commit for Claude Code to review (called by git hook)")
  .option("--auto", "Running from git hook (suppress output)")
  .action(async (opts) => {
    const projectPath = process.cwd();
    const config = loadConfig(projectPath);
    const db = openDb(projectPath);
    const projectName = path.basename(projectPath);
    const project = ensureProject(db, projectPath, projectName);

    const queued = queueLastCommit(db, project.id, projectPath);

    if (queued && !opts.auto) {
      console.log(chalk.green(`\n  🪨 Queued: ${queued.hash.slice(0, 7)} "${queued.message}"\n`));
    }

    // Regenerate memory.md
    const memoryMd = generateMemoryMd(db, project.id, config, projectPath);
    writeMemoryMd(projectPath, memoryMd);

    closeDb();
  });

// ─────────────────────────────────────────────────────────────────────────────
// pebble add
// ─────────────────────────────────────────────────────────────────────────────

program
  .command("add <category> <content>")
  .description("Manually add a memory (categories: decision, pattern, context, learning, todo)")
  .option("-t, --tags <tags>", "Comma-separated tags", "")
  .action(async (category: string, content: string, opts) => {
    const validCategories: MemoryCategory[] = ["decision", "pattern", "context", "learning", "todo"];
    if (!validCategories.includes(category as MemoryCategory)) {
      console.error(chalk.red(`Invalid category: ${category}. Use: ${validCategories.join(", ")}`));
      process.exit(1);
    }

    const projectPath = process.cwd();
    const config = loadConfig(projectPath);
    const db = openDb(projectPath);
    const projectName = path.basename(projectPath);
    const project = ensureProject(db, projectPath, projectName);

    const tags = opts.tags ? opts.tags.split(",").map((t: string) => t.trim()) : [];
    const memory = addMemory(db, project.id, category as MemoryCategory, content, "manual", tags);

    const memoryMd = generateMemoryMd(db, project.id, config, projectPath);
    writeMemoryMd(projectPath, memoryMd);

    const cat = config.categories[category as MemoryCategory];
    console.log(chalk.green(`\n  ${cat.emoji} Remembered: ${content} [id:${memory.id}]\n`));

    closeDb();
  });

// ─────────────────────────────────────────────────────────────────────────────
// pebble search
// ─────────────────────────────────────────────────────────────────────────────

program
  .command("search <query>")
  .description("Search memories by keyword")
  .action(async (query: string) => {
    const projectPath = process.cwd();
    const config = loadConfig(projectPath);
    const db = openDb(projectPath);
    const projectName = path.basename(projectPath);
    const project = ensureProject(db, projectPath, projectName);

    const memories = searchMemories(db, project.id, query);

    if (memories.length === 0) {
      console.log(chalk.yellow(`\n  No memories found for "${query}"\n`));
    } else {
      console.log(chalk.bold(`\n  Found ${memories.length} memories:\n`));
      for (const mem of memories) {
        const cat = config.categories[mem.category];
        const dot = mem.relevance >= 0.8 ? chalk.green("●") : mem.relevance >= 0.5 ? chalk.yellow("●") : chalk.red("●");
        console.log(`  ${dot} ${cat.emoji} [id:${mem.id}] ${mem.content}`);
      }
      console.log();
    }

    closeDb();
  });

// ─────────────────────────────────────────────────────────────────────────────
// pebble forget
// ─────────────────────────────────────────────────────────────────────────────

program
  .command("forget <id>")
  .description("Remove a memory by ID")
  .action(async (id: string) => {
    const projectPath = process.cwd();
    const config = loadConfig(projectPath);
    const db = openDb(projectPath);
    const projectName = path.basename(projectPath);
    const project = ensureProject(db, projectPath, projectName);

    const removed = removeMemory(db, parseInt(id, 10));
    if (removed) {
      const memoryMd = generateMemoryMd(db, project.id, config, projectPath);
      writeMemoryMd(projectPath, memoryMd);
      console.log(chalk.green(`\n  Memory id:${id} removed.\n`));
    } else {
      console.log(chalk.yellow(`\n  No memory found with id:${id}\n`));
    }

    closeDb();
  });

// ─────────────────────────────────────────────────────────────────────────────
// pebble status
// ─────────────────────────────────────────────────────────────────────────────

program
  .command("status")
  .description("Show memory statistics")
  .action(async () => {
    const projectPath = process.cwd();
    const config = loadConfig(projectPath);
    const db = openDb(projectPath);
    const projectName = path.basename(projectPath);
    const project = ensureProject(db, projectPath, projectName);

    const stats = getMemoryStats(db, project.id);
    const unprocessed = getUnprocessedCommits(db, project.id);

    console.log(chalk.bold(`\n  🪨 Pebble — ${project.name}\n`));
    console.log(`  ${"─".repeat(35)}`);

    for (const [cat, info] of Object.entries(config.categories)) {
      const count = stats[cat] || 0;
      const bar = "█".repeat(Math.min(count, 20)) + chalk.gray("░".repeat(Math.max(0, 20 - count)));
      console.log(`  ${info.emoji} ${info.label.padEnd(22)} ${String(count).padStart(3)} ${bar}`);
    }

    console.log(`  ${"─".repeat(35)}`);
    console.log(chalk.bold(`  Total: ${stats.total || 0} active memories`));

    if (unprocessed.length > 0) {
      console.log(chalk.yellow(`  📬 ${unprocessed.length} unprocessed commits waiting for Claude Code`));
    }

    console.log();
    closeDb();
  });

// ─────────────────────────────────────────────────────────────────────────────
// pebble generate
// ─────────────────────────────────────────────────────────────────────────────

program
  .command("generate")
  .description("Regenerate .pebble/memory.md and context tree")
  .action(async () => {
    const projectPath = process.cwd();
    const config = loadConfig(projectPath);
    const db = openDb(projectPath);
    const projectName = path.basename(projectPath);
    const project = ensureProject(db, projectPath, projectName);

    decayRelevance(db, project.id, config.relevance_decay_days);

    const memoryMd = generateMemoryMd(db, project.id, config, projectPath);
    writeMemoryMd(projectPath, memoryMd);

    const lines = memoryMd.split("\n").length;
    console.log(chalk.green(`\n  .pebble/memory.md regenerated (${lines} lines)\n`));

    closeDb();
  });

// ─────────────────────────────────────────────────────────────────────────────
// pebble hooks
// ─────────────────────────────────────────────────────────────────────────────

program
  .command("hooks")
  .description("Manage git hooks")
  .addCommand(
    new Command("install").description("Install post-commit hook").action(() => {
      const result = installGitHook(process.cwd());
      console.log(result.success ? chalk.green(`\n  ✓ ${result.message}\n`) : chalk.red(`\n  ✗ ${result.message}\n`));
    })
  )
  .addCommand(
    new Command("uninstall").description("Remove post-commit hook").action(() => {
      const result = uninstallGitHook(process.cwd());
      console.log(result.success ? chalk.green(`\n  ✓ ${result.message}\n`) : chalk.red(`\n  ✗ ${result.message}\n`));
    })
  );

// ─────────────────────────────────────────────────────────────────────────────
// pebble watch — auto-sync via git
// ─────────────────────────────────────────────────────────────────────────────

function setAutoSync(projectPath: string, enabled: boolean): void {
  const configPath = path.join(projectPath, PEBBLE_DIR, PEBBLE_CONFIG);
  let cfg: PebbleConfig;
  if (fs.existsSync(configPath)) {
    cfg = { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(configPath, "utf-8")) };
  } else {
    // Create .pebble/ if missing — same as init does
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    cfg = { ...DEFAULT_CONFIG };
  }
  cfg.auto_sync = enabled;
  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), "utf-8");
}

program
  .command("watch")
  .description("Enable/disable git auto-sync (commit + push on remember, pull on session start)")
  .addCommand(
    new Command("enable").description("Turn on auto-sync for this project").action(() => {
      const cwd = process.cwd();
      const gitDir = path.join(cwd, ".git");
      if (!fs.existsSync(gitDir)) {
        console.log(chalk.red("\n  ✗ Not a git repository. Auto-sync needs git.\n"));
        return;
      }
      setAutoSync(cwd, true);
      console.log(chalk.green("\n  ✓ Auto-sync enabled for this project"));
      console.log(chalk.gray("    Pebble will now auto-commit + push after every pebble_remember,"));
      console.log(chalk.gray("    and auto-pull --rebase at the start of each MCP session."));
      console.log(chalk.gray("    Operations are best-effort and silent — failures don't break sessions.\n"));
    })
  )
  .addCommand(
    new Command("disable").description("Turn off auto-sync for this project").action(() => {
      setAutoSync(process.cwd(), false);
      console.log(chalk.yellow("\n  ✓ Auto-sync disabled. You're back to manual git push/pull.\n"));
    })
  )
  .addCommand(
    new Command("status").description("Show whether auto-sync is on").action(() => {
      const configPath = path.join(process.cwd(), PEBBLE_DIR, PEBBLE_CONFIG);
      if (!fs.existsSync(configPath)) {
        console.log(chalk.gray("\n  No .pebble/config.json — auto-sync off (default).\n"));
        return;
      }
      const cfg: PebbleConfig = { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(configPath, "utf-8")) };
      console.log(cfg.auto_sync
        ? chalk.green("\n  ✓ Auto-sync is ON for this project.\n")
        : chalk.gray("\n  Auto-sync is OFF for this project.\n"));
    })
  );

program.parse();
