// ============================================================================
// Pebble — Auto-sync via git
// Opt-in feature (.pebble/config.json: auto_sync: true). When enabled:
//   - After pebble_remember / forget / mark_processed → silent commit + push
//   - At first MCP-tool call per session → silent pull --rebase
// All operations are best-effort, non-blocking, and swallow errors so a broken
// git setup never breaks the user's session.
// ============================================================================

import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const TIMEOUT_MS = 30000;

function isGitRepo(projectPath: string): boolean {
  return fs.existsSync(path.join(projectPath, ".git"));
}

function hasGitRemote(projectPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn("git", ["-C", projectPath, "remote"], {
      stdio: ["ignore", "pipe", "ignore"],
      shell: false,
    });
    let out = "";
    proc.stdout.on("data", (d) => { out += d.toString(); });
    proc.on("close", () => resolve(out.trim().length > 0));
    proc.on("error", () => resolve(false));
    setTimeout(() => { try { proc.kill(); } catch {} resolve(false); }, 5000);
  });
}

function runGit(projectPath: string, args: string[]): Promise<{ ok: boolean; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn("git", ["-C", projectPath, ...args], {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    });
    let stderr = "";
    proc.stderr.on("data", (d) => { stderr += d.toString(); });
    proc.on("close", (code) => resolve({ ok: code === 0, stderr }));
    proc.on("error", () => resolve({ ok: false, stderr: "spawn failed" }));
    setTimeout(() => { try { proc.kill(); } catch {} resolve({ ok: false, stderr: "timeout" }); }, TIMEOUT_MS);
  });
}

/**
 * Auto-commit + push pebble files. Background, non-blocking, errors swallowed.
 * Only commits files inside .pebble/ — does not touch other staged changes.
 */
export async function tryAutoSync(projectPath: string, summary: string): Promise<void> {
  if (!isGitRepo(projectPath)) return;
  if (!(await hasGitRemote(projectPath))) return;

  // Stage only pebble's tracked files. memory.md is always present after a remember,
  // context-tree is regenerated alongside.
  const stage = await runGit(projectPath, [
    "add",
    ".pebble/memory.md",
    ".pebble/context-tree",
  ]);
  if (!stage.ok) return; // staging failed — nothing to do

  // Check if anything is actually staged for pebble (vs. memory.md being unchanged)
  const status = await runGit(projectPath, ["diff", "--cached", "--quiet", "--", ".pebble/"]);
  // diff --cached --quiet exits 0 if NO changes, 1 if there ARE changes
  if (status.ok) return; // no pebble changes staged → nothing to commit

  const message = `pebble: auto-sync — ${summary}`;
  const commit = await runGit(projectPath, ["commit", "-m", message, "--only", ".pebble/memory.md", ".pebble/context-tree"]);
  if (!commit.ok) {
    // commit failed (e.g. hooks failing, identity not set) — bail silently
    return;
  }

  // Push in background (don't await — network is slow, MCP response is faster without)
  void runGit(projectPath, ["push"]).then((r) => {
    if (!r.ok) {
      // Push failed (offline, auth, etc). Local commit still exists.
      // We don't surface to the MCP caller — but log to stderr for debug.
      process.stderr.write(`[pebble] auto-push failed: ${r.stderr.split("\n")[0]}\n`);
    }
  });
}

/**
 * Auto-pull --rebase. Called once per MCP session at first context creation.
 * Background, non-blocking, errors swallowed.
 */
export async function tryAutoPull(projectPath: string): Promise<void> {
  if (!isGitRepo(projectPath)) return;
  if (!(await hasGitRemote(projectPath))) return;

  // Only attempt pull if working tree is clean for .pebble/ — otherwise rebase
  // would conflict with uncommitted local changes we just made.
  const dirty = await runGit(projectPath, ["diff", "--quiet", "--", ".pebble/"]);
  if (!dirty.ok) {
    // .pebble/ has uncommitted changes — skip pull to avoid conflicts.
    // The auto-commit on next remember will catch up.
    return;
  }

  const pull = await runGit(projectPath, ["pull", "--rebase", "--no-edit"]);
  if (!pull.ok) {
    process.stderr.write(`[pebble] auto-pull failed: ${pull.stderr.split("\n")[0]}\n`);
    // If rebase failed, try to abort cleanly so we don't leave the repo in
    // a half-rebased state.
    await runGit(projectPath, ["rebase", "--abort"]).catch(() => {});
  }
}

// In-memory per-MCP-session tracking — pull only once per project per server run
const _pulledThisSession = new Set<string>();

export function shouldPullOnceThisSession(projectPath: string): boolean {
  const normalized = path.resolve(projectPath);
  if (_pulledThisSession.has(normalized)) return false;
  _pulledThisSession.add(normalized);
  return true;
}
