import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { TestWorld, ScanHit } from '../support/world.js';

Given('the source tree at {string} is present', function (this: TestWorld, path: string) {
  const st = statSync(path);
  if (!st.isDirectory()) throw new Error(`${path} is not a directory`);
});

Given('the allowlist of approved scopes', function (this: TestWorld) {
  const raw = readFileSync('features/support/allowed_scopes.json', 'utf8');
  this.allowedScopes = JSON.parse(raw).allowed;
});

When('I scan {string} for {string}', function (this: TestWorld, glob: string, needle: string) {
  this.hits = scan([glob], needle);
});

When('I scan {string} {string} {string} for {string}', function (this: TestWorld, a: string, b: string, c: string, needle: string) {
  this.hits = scan([a, b, c], needle);
});

When('I read appsscript.json scopes', function (this: TestWorld) {
  const cfg = JSON.parse(readFileSync('src/appsscript.json', 'utf8'));
  this.scopes = cfg.oauthScopes ?? [];
});

Then('no occurrences are found', function (this: TestWorld) {
  if (this.hits.length === 0) return;
  const sample = this.hits.slice(0, 5)
    .map(h => `  ${h.file}:${h.line}: ${h.text.trim()}`)
    .join('\n');
  throw new Error(`expected 0 hits, found ${this.hits.length}:\n${sample}`);
});

Then('every scope is on the allowlist', function (this: TestWorld) {
  const extra = this.scopes.filter(s => !this.allowedScopes.includes(s));
  assert.deepStrictEqual(extra, [], `unapproved scopes: ${extra.join(', ')}`);
});

Then('the scope set exactly matches the allowlist', function (this: TestWorld) {
  const have = [...this.scopes].sort();
  const want = [...this.allowedScopes].sort();
  assert.deepStrictEqual(have, want, `scope set drift: have=${have.join(',')} want=${want.join(',')}`);
});

Then('{string} exists and is non-empty', function (path: string) {
  const st = statSync(path);
  assert.ok(st.isFile(), `${path} is not a file`);
  assert.ok(st.size > 0, `${path} is empty`);
});

Then('VERSION in {string} equals version in {string}', function (tsPath: string, jsonPath: string) {
  const tsVer = extractVersionConst(readFileSync(tsPath, 'utf8'));
  const jsonVer = JSON.parse(readFileSync(jsonPath, 'utf8')).version;
  assert.strictEqual(tsVer, jsonVer, `${tsPath} VERSION=${tsVer} vs ${jsonPath} version=${jsonVer}`);
});

Then('appsscript.json has key {string}', function (dottedKey: string) {
  const cfg = JSON.parse(readFileSync('src/appsscript.json', 'utf8'));
  let cur: unknown = cfg;
  for (const part of dottedKey.split('.')) {
    if (cur === null || typeof cur !== 'object' || !(part in (cur as Record<string, unknown>))) {
      throw new Error(`appsscript.json missing key "${dottedKey}" at "${part}"`);
    }
    cur = (cur as Record<string, unknown>)[part];
  }
  assert.ok(cur, `appsscript.json key "${dottedKey}" is falsy`);
});

Then('appsscript.json has no key {string}', function (dottedKey: string) {
  const cfg = JSON.parse(readFileSync('src/appsscript.json', 'utf8'));
  let cur: unknown = cfg;
  for (const part of dottedKey.split('.')) {
    if (cur === null || typeof cur !== 'object' || !(part in (cur as Record<string, unknown>))) return;
    cur = (cur as Record<string, unknown>)[part];
  }
  throw new Error(`appsscript.json should not have key "${dottedKey}"`);
});

function scan(roots: string[], needle: string): ScanHit[] {
  const hits: ScanHit[] = [];
  for (const root of roots) {
    for (const file of walk(root)) {
      const lines = readFileSync(file, 'utf8').split(/\r?\n/);
      lines.forEach((text, i) => {
        if (text.includes(needle)) hits.push({ file, line: i + 1, text });
      });
    }
  }
  return hits;
}

function walk(rootSpec: string): string[] {
  const out: string[] = [];
  const trimmed = rootSpec.replace(/\/+$/, '');
  const globMatch = trimmed.match(/^(.+)\/\*\.(\w+)$/);
  if (globMatch) {
    const [, dir, ext] = globMatch;
    walkDir(dir, out, (f) => f.endsWith('.' + ext));
  } else {
    walkDir(trimmed, out, () => true);
  }
  return out;
}

const SKIP_DIRS = new Set(['plans', 'node_modules', 'dist-test', 'out', 'zzz_archives', '.git']);

function walkDir(dir: string, out: string[], filter: (f: string) => boolean) {
  let entries: ReturnType<typeof readdirSync>;
  try { entries = readdirSync(dir, { withFileTypes: true }); }
  catch { return; }
  for (const e of entries) {
    if (e.isDirectory() && SKIP_DIRS.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walkDir(p, out, filter);
    else if (e.isFile() && filter(p)) out.push(p);
  }
}

function extractVersionConst(src: string): string {
  const m = src.match(/const\s+VERSION\s*=\s*["']([^"']+)["']/);
  if (!m) throw new Error('VERSION constant not found');
  return m[1];
}
