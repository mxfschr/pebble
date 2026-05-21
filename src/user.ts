// ============================================================================
// Pebble — User Memory
// Global, machine-local memory about the user (not project-scoped).
// Three files under ~/.pebble/user/:
//   - voice.md   — how Claude should communicate with this user (user-edited)
//   - about.md   — who the user is, context (user-edited)
//   - notes.md   — observations Claude has made over time (auto-appended)
// All three are plain markdown. Templates are generic by design — no hardcoded
// names, projects, or personal examples. Open-source standard.
// ============================================================================

import fs from "fs";
import path from "path";
import os from "os";

const USER_DIR_NAME = ".pebble";
const USER_SUBDIR = "user";

export interface UserPaths {
  root: string;       // ~/.pebble/user/
  voice: string;      // ~/.pebble/user/voice.md
  about: string;      // ~/.pebble/user/about.md
  notes: string;      // ~/.pebble/user/notes.md
}

export function getUserPaths(homeDir?: string): UserPaths {
  const home = homeDir
    || process.env.HOME
    || process.env.USERPROFILE
    || os.homedir();
  const root = path.join(home, USER_DIR_NAME, USER_SUBDIR);
  return {
    root,
    voice: path.join(root, "voice.md"),
    about: path.join(root, "about.md"),
    notes: path.join(root, "notes.md"),
  };
}

// ---------------------------------------------------------------------------
// Templates — INTENTIONALLY GENERIC. No hardcoded personal references.
// These are starting points for any user; they fill them in themselves.
// ---------------------------------------------------------------------------

const VOICE_TEMPLATE = `# Voice

How should Claude communicate with you? This file is read at the start of
every Claude Code session. Replace the placeholders below with your actual
preferences, or delete sections that don't apply.

## Tone
- [e.g., direct and concise / detailed and explanatory / casual / formal]
- [e.g., push back when you think I'm wrong]

## Language
- [e.g., English for everything / your-language for discussions, English for code]
- [e.g., comments in English regardless of conversation language]

## Pet peeves
- [e.g., avoid bullet lists where prose works]
- [e.g., don't recap what I just said at the start of every reply]
- [e.g., skip phrases like "I'd be happy to help"]

## Mindset
- [e.g., we're a team — I decide, you build]
- [e.g., flag things I might be missing]
- [e.g., shipping beats perfection]

## What NOT to do
- [e.g., don't suggest alternatives when I've already decided]
- [e.g., don't ask if I'm sure when I gave an imperative]
`;

const ABOUT_TEMPLATE = `# About

Who you are. Claude reads this at the start of every session to understand
your context across all projects. Fill in what's useful for Claude to know
durably — not session-specific stuff (that goes in notes.md or project memory).

## Identity
- Name: [your name or handle]
- Location: [where you are / time zone if relevant]
- Role: [what you do, current situation]

## Current focus
- [projects or themes that span sessions]
- [what's on your mind broadly]

## Communication preferences
- [availability patterns, time zones, async vs. sync]
- [any constraints Claude should respect]

## Things Claude should know that affect work
- [tools you prefer, infra constraints, habits that matter]
`;

const NOTES_TEMPLATE = `# Notes

Observations Claude has made about the user over time. Appended to by
\`pebble_user_note\` — do not edit manually unless you want to consolidate
or trim entries. Newer entries at the bottom.

`;

// ---------------------------------------------------------------------------
// Init — create the user directory and templates if missing
// ---------------------------------------------------------------------------

export interface UserInitResult {
  created: string[];   // file paths that were created
  existed: string[];   // file paths that already existed (untouched)
  root: string;
}

export function initUserMemory(homeDir?: string): UserInitResult {
  const paths = getUserPaths(homeDir);
  const created: string[] = [];
  const existed: string[] = [];

  if (!fs.existsSync(paths.root)) {
    fs.mkdirSync(paths.root, { recursive: true });
  }

  const files: Array<[string, string]> = [
    [paths.voice, VOICE_TEMPLATE],
    [paths.about, ABOUT_TEMPLATE],
    [paths.notes, NOTES_TEMPLATE],
  ];

  for (const [filePath, template] of files) {
    if (fs.existsSync(filePath)) {
      existed.push(filePath);
    } else {
      fs.writeFileSync(filePath, template, "utf-8");
      created.push(filePath);
    }
  }

  return { created, existed, root: paths.root };
}

// ---------------------------------------------------------------------------
// Note append — Claude calls this via pebble_user_note
// ---------------------------------------------------------------------------

export interface UserNote {
  content: string;
  timestamp: string;
}

export function appendUserNote(content: string, homeDir?: string): UserNote {
  const paths = getUserPaths(homeDir);

  if (!fs.existsSync(paths.root)) {
    fs.mkdirSync(paths.root, { recursive: true });
  }

  // If notes.md doesn't exist yet, create with template header
  if (!fs.existsSync(paths.notes)) {
    fs.writeFileSync(paths.notes, NOTES_TEMPLATE, "utf-8");
  }

  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 16);
  const entry = `- ${timestamp} — ${content.trim()}\n`;

  fs.appendFileSync(paths.notes, entry, "utf-8");

  return { content: content.trim(), timestamp };
}

// ---------------------------------------------------------------------------
// Recall — search across voice.md, about.md, notes.md
// ---------------------------------------------------------------------------

export interface UserMatch {
  source: "voice" | "about" | "notes";
  filePath: string;
  matches: string[];   // matching lines
}

export function recallUserMemory(query: string, homeDir?: string): UserMatch[] {
  const paths = getUserPaths(homeDir);
  const lowerQuery = query.toLowerCase();
  const results: UserMatch[] = [];

  const sources: Array<["voice" | "about" | "notes", string]> = [
    ["voice", paths.voice],
    ["about", paths.about],
    ["notes", paths.notes],
  ];

  for (const [source, filePath] of sources) {
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const matches = lines.filter((line) =>
      line.toLowerCase().includes(lowerQuery) && line.trim().length > 0
    );
    if (matches.length > 0) {
      results.push({ source, filePath, matches });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Status — read all three files (or report which exist)
// ---------------------------------------------------------------------------

export interface UserStatus {
  root: string;
  exists: boolean;
  files: {
    voice: { exists: boolean; lines: number; bytes: number };
    about: { exists: boolean; lines: number; bytes: number };
    notes: { exists: boolean; lines: number; bytes: number; entries: number };
  };
}

function fileStats(filePath: string): { exists: boolean; lines: number; bytes: number } {
  if (!fs.existsSync(filePath)) {
    return { exists: false, lines: 0, bytes: 0 };
  }
  const content = fs.readFileSync(filePath, "utf-8");
  return {
    exists: true,
    lines: content.split("\n").length,
    bytes: Buffer.byteLength(content, "utf-8"),
  };
}

export function getUserStatus(homeDir?: string): UserStatus {
  const paths = getUserPaths(homeDir);
  const voice = fileStats(paths.voice);
  const about = fileStats(paths.about);
  const notesStats = fileStats(paths.notes);

  // Count appended entries in notes.md (lines starting with "- ")
  let entries = 0;
  if (notesStats.exists) {
    const content = fs.readFileSync(paths.notes, "utf-8");
    entries = content.split("\n").filter((l) => l.startsWith("- ")).length;
  }

  return {
    root: paths.root,
    exists: fs.existsSync(paths.root),
    files: {
      voice,
      about,
      notes: { ...notesStats, entries },
    },
  };
}

// ---------------------------------------------------------------------------
// Get content of a single file (for MCP read tools)
// ---------------------------------------------------------------------------

export function readUserFile(which: "voice" | "about" | "notes", homeDir?: string): string | null {
  const paths = getUserPaths(homeDir);
  const filePath = paths[which];
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

// ---------------------------------------------------------------------------
// Write a user file — used by consolidation. Caller is responsible for
// preserving content they want to keep (this is a full overwrite).
// ---------------------------------------------------------------------------

export interface WriteResult {
  filePath: string;
  bytesWritten: number;
}

export function writeUserFile(
  which: "voice" | "about" | "notes",
  content: string,
  homeDir?: string
): WriteResult {
  const paths = getUserPaths(homeDir);
  const filePath = paths[which];

  if (!fs.existsSync(paths.root)) {
    fs.mkdirSync(paths.root, { recursive: true });
  }

  // Ensure trailing newline for clean diffs
  const normalized = content.endsWith("\n") ? content : content + "\n";
  fs.writeFileSync(filePath, normalized, "utf-8");

  return { filePath, bytesWritten: Buffer.byteLength(normalized, "utf-8") };
}

// ---------------------------------------------------------------------------
// Consolidation tracking — count notes entries to know when to consolidate
// ---------------------------------------------------------------------------

export function getNotesEntryCount(homeDir?: string): number {
  const paths = getUserPaths(homeDir);
  if (!fs.existsSync(paths.notes)) return 0;
  const content = fs.readFileSync(paths.notes, "utf-8");
  return content.split("\n").filter((l) => l.startsWith("- ")).length;
}

// Default threshold above which the MANDATORY block instructs consolidation
export const DEFAULT_CONSOLIDATE_THRESHOLD = 15;
