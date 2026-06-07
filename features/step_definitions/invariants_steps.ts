import { Given, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { registry } from '../support/registry.js';

Given('the gsheet2json pure logic is loaded', function () {
  if (Object.keys(registry).length === 0) {
    throw new Error('registry is empty; dist-test build missing?');
  }
});

Then(/^(\w+)\((.*)\) is (.+)$/, function (fnName: string, argString: string, expectedString: string) {
  const fn = registry[fnName];
  if (!fn) throw new Error(`registry: no such fn "${fnName}"`);
  const args = parseArgList(argString);
  const expected = parseLiteral(expectedString);
  const actual = fn(...args);
  assert.deepStrictEqual(actual, expected);
});

function parseArgList(s: string): unknown[] {
  if (s.trim() === '') return [];
  const parts: string[] = [];
  let depth = 0;
  let inStr: string | null = null;
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      cur += ch;
      if (ch === '\\' && i + 1 < s.length) { cur += s[++i]; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'") { inStr = ch; cur += ch; continue; }
    if (ch === '{' || ch === '[') depth++;
    if (ch === '}' || ch === ']') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts.map(parseLiteral);
}

function parseLiteral(s: string): unknown {
  const t = s.trim();
  if (t === 'undefined') return undefined;
  if (t === 'null') return null;
  if (t.length >= 2 && t.startsWith("'") && t.endsWith("'")) {
    return t.slice(1, -1);
  }
  return JSON.parse(t);
}
