// ============================================================================
// Pebble — Git Hook Installer
// Sets up post-commit hook for automatic memory extraction
// ============================================================================

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const POST_COMMIT_HOOK = `#!/bin/sh
# Pebble — queue commit for Claude Code to review
# No API calls — just captures the diff and regenerates CLAUDE.md

if command -v pebble >/dev/null 2>&1; then
  pebble capture --auto &
elif [ -f "./node_modules/.bin/pebble" ]; then
  ./node_modules/.bin/pebble capture --auto &
elif [ -f "./.pebble/run.sh" ]; then
  sh ./.pebble/run.sh capture --auto &
fi
`;

const RUN_SCRIPT = `#!/bin/sh
# Pebble runner — fallback for when pebble is not in PATH
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
node "$SCRIPT_DIR/../node_modules/pebble-memory/dist/index.js" "$@"
`;

export function installGitHook(projectPath: string): { success: boolean; message: string } {
  const gitDir = getGitDir(projectPath);
  if (!gitDir) {
    return { success: false, message: "Not a git repository. Run 'git init' first." };
  }

  const hooksDir = path.join(gitDir, "hooks");
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  const hookPath = path.join(hooksDir, "post-commit");

  // Check if hook already exists
  if (fs.existsSync(hookPath)) {
    const existing = fs.readFileSync(hookPath, "utf-8");
    if (existing.includes("pebble")) {
      return { success: true, message: "Pebble hook already installed." };
    }
    // Append to existing hook
    fs.appendFileSync(hookPath, "\n" + POST_COMMIT_HOOK);
    return { success: true, message: "Pebble hook appended to existing post-commit hook." };
  }

  // Create new hook
  fs.writeFileSync(hookPath, POST_COMMIT_HOOK, { mode: 0o755 });

  // Also create fallback run script
  const pebbleDir = path.join(projectPath, ".pebble");
  if (!fs.existsSync(pebbleDir)) {
    fs.mkdirSync(pebbleDir, { recursive: true });
  }
  fs.writeFileSync(path.join(pebbleDir, "run.sh"), RUN_SCRIPT, { mode: 0o755 });

  return { success: true, message: "Post-commit hook installed." };
}

export function uninstallGitHook(projectPath: string): { success: boolean; message: string } {
  const gitDir = getGitDir(projectPath);
  if (!gitDir) {
    return { success: false, message: "Not a git repository." };
  }

  const hookPath = path.join(gitDir, "hooks", "post-commit");
  if (!fs.existsSync(hookPath)) {
    return { success: true, message: "No hook to remove." };
  }

  const content = fs.readFileSync(hookPath, "utf-8");
  if (!content.includes("pebble")) {
    return { success: true, message: "Hook exists but is not from Pebble." };
  }

  // If the entire hook is pebble's, remove it
  if (content.trim() === POST_COMMIT_HOOK.trim()) {
    fs.unlinkSync(hookPath);
    return { success: true, message: "Post-commit hook removed." };
  }

  // Otherwise, remove just the pebble part
  const cleaned = content.replace(POST_COMMIT_HOOK, "").trim();
  if (cleaned) {
    fs.writeFileSync(hookPath, cleaned, { mode: 0o755 });
  } else {
    fs.unlinkSync(hookPath);
  }
  return { success: true, message: "Pebble section removed from post-commit hook." };
}

function getGitDir(projectPath: string): string | null {
  try {
    const result = execSync(`git -C "${projectPath}" rev-parse --git-dir`, {
      encoding: "utf-8",
    }).trim();
    // Could be absolute or relative
    if (path.isAbsolute(result)) return result;
    return path.join(projectPath, result);
  } catch {
    return null;
  }
}
