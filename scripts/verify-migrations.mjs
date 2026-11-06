#!/usr/bin/env node
// Checks that every table/column a committed migration claims to add
// actually exists on the LIVE Supabase project — catching the exact gap
// that bit this project repeatedly: a migration committed and marked
// "done" that was never actually pasted into the SQL Editor and run.
//
// How it works: for each `create table` / `alter table ... add column`
// in supabase/migrations/*.sql, it asks PostgREST to select exactly those
// columns with limit=0. PostgREST's response tells us precisely what's
// live, no admin credentials needed:
//   200            -> table + every selected column exist
//   400 (42703)    -> table exists but a column is missing
//   404 (PGRST205) -> table doesn't exist at all
//
// Usage: node scripts/verify-migrations.mjs
// Reads EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY from .env.

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations');

function loadEnv() {
  const env = {};
  for (const name of ['.env', '.env.local']) {
    try {
      const raw = readFileSync(join(ROOT, name), 'utf8');
      for (const line of raw.split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    } catch {
      // file may not exist
    }
  }
  return env;
}

const CONSTRAINT_KEYWORDS = new Set([
  'unique', 'primary', 'check', 'foreign', 'constraint', 'exclude', 'like',
]);

// Splits the inside of a `create table (...)` body on top-level commas
// only (so commas inside nested parens, e.g. `check (rating between 1 and 5)`
// or `check (status in ('open','reviewed'))`, don't cause a false split).
function splitTopLevel(body) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const ch of body) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current);
  return parts;
}

// Finds the `(...)` body of a `create table` statement starting right
// after the opening paren at `startIdx`, respecting nested parens.
function extractParenBody(text, openParenIdx) {
  let depth = 0;
  for (let i = openParenIdx; i < text.length; i++) {
    if (text[i] === '(') depth++;
    if (text[i] === ')') {
      depth--;
      if (depth === 0) return text.slice(openParenIdx + 1, i);
    }
  }
  return null;
}

// Strips `-- ...` line comments and `/* ... */` block comments so neither
// can be mistaken for a column definition (e.g. `from_id text, -- note`).
function stripComments(sql) {
  return sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

// Applies one migration file's statements to the running per-table state,
// IN FILE ORDER. A `create table` (re)establishes that table's expected
// column set from scratch — this matters because this codebase has at
// least one case (`check_ins`) where a table name was redefined with an
// unrelated schema in a later migration, superseding the first; unioning
// both would permanently (and wrongly) flag the superseded columns as
// missing. `alter table ... add column` only ever adds to the current set.
function applyMigration(sql, tables) {
  const clean = stripComments(sql);

  const createRe = /create\s+table\s+(?:if\s+not\s+exists\s+)?public\.(\w+)\s*\(/gi;
  let m;
  while ((m = createRe.exec(clean))) {
    const table = m[1];
    const openIdx = createRe.lastIndex - 1;
    const body = extractParenBody(clean, openIdx);
    if (!body) continue;
    const cols = new Set();
    for (const rawPart of splitTopLevel(body)) {
      const part = rawPart.trim();
      if (!part) continue;
      const firstWord = part.split(/\s+/)[0].toLowerCase();
      if (CONSTRAINT_KEYWORDS.has(firstWord)) continue;
      const colName = firstWord.replace(/^"|"$/g, '');
      if (colName) cols.add(colName);
    }
    tables.set(table, cols);
  }

  const alterRe = /alter\s+table\s+(?:if\s+exists\s+)?public\.(\w+)\s+add\s+column\s+(?:if\s+not\s+exists\s+)?(\w+)/gi;
  while ((m = alterRe.exec(clean))) {
    const [, table, col] = m;
    const cols = tables.get(table) ?? new Set();
    cols.add(col.toLowerCase());
    tables.set(table, cols);
  }
}

async function checkTable(baseUrl, anonKey, table, columns) {
  const cols = [...columns];
  const url = `${baseUrl}/rest/v1/${table}?select=${cols.join(',')}&limit=0`;
  const res = await fetch(url, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 404 || body?.code === 'PGRST205') {
    return { status: 'missing-table' };
  }
  if (res.status === 400 && body?.code === '42703') {
    // message looks like: column visited_stamps.user_id does not exist
    const colMatch = /column\s+\S+\.(\w+)\s+does not exist/.exec(body.message ?? '');
    return { status: 'missing-column', column: colMatch?.[1] ?? '?' };
  }
  if (res.ok) return { status: 'ok' };
  return { status: 'unknown', detail: `HTTP ${res.status}: ${JSON.stringify(body)}` };
}

async function main() {
  const env = loadEnv();
  const baseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
    process.exit(1);
  }

  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();

  // Replay every migration file in order into one running per-table state.
  const allTables = new Map();
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    applyMigration(sql, allTables);
  }

  if (allTables.size === 0) {
    console.log('No create table / add column statements found to verify.');
    return;
  }

  console.log(`Checking ${allTables.size} table(s) referenced across ${files.length} migration files against the live DB...\n`);

  let okCount = 0;
  let failCount = 0;
  const tableNames = [...allTables.keys()].sort();
  for (const table of tableNames) {
    const cols = allTables.get(table);
    const result = await checkTable(baseUrl, anonKey, table, cols);
    if (result.status === 'ok') {
      okCount++;
      console.log(`  OK    ${table}  (${cols.size} column${cols.size === 1 ? '' : 's'} checked)`);
    } else if (result.status === 'missing-table') {
      failCount++;
      console.log(`  MISSING TABLE   ${table}  <- a migration was never run`);
    } else if (result.status === 'missing-column') {
      failCount++;
      console.log(`  MISSING COLUMN  ${table}.${result.column}  <- table exists but a migration was never (fully) run`);
    } else {
      failCount++;
      console.log(`  UNKNOWN  ${table}  (${result.detail})`);
    }
  }

  console.log(`\n${okCount} OK, ${failCount} problem(s).`);
  if (failCount > 0) {
    console.log('\nFix: find the migration file(s) that define the table/column(s) above and run them in the Supabase SQL Editor.');
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
