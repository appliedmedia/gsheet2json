import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import type { GScriptCall, TestWorld } from './world.ts';

const SRC_DIR = resolve('src');

function readSrc(name: string): string {
  return readFileSync(resolve(SRC_DIR, name), 'utf8');
}

function buildSidebarHtml(): string {
  const includes: Record<string, string> = {
    'styles': readSrc('styles.html'),
    'style-css': readSrc('style-css.html'),
    'layout': readSrc('layout.html'),
    'app-js': readSrc('app-js.html'),
  };
  return readSrc('index.html').replace(
    /<\?!= include\('([^']+)'\) \?>/g,
    (_match, key: string) => includes[key] ?? '',
  );
}

function makeChainable(
  calls: GScriptCall[],
  onSuccess?: (v?: unknown) => void,
  onFailure?: (e?: unknown) => void,
): unknown {
  return new Proxy({}, {
    get(_target, prop): unknown {
      if (prop === 'withSuccessHandler') {
        return (fn: (v?: unknown) => void) => makeChainable(calls, fn, onFailure);
      }
      if (prop === 'withFailureHandler') {
        return (fn: (e?: unknown) => void) => makeChainable(calls, onSuccess, fn);
      }
      return (...args: unknown[]) => {
        calls.push({ method: String(prop), args, onSuccess, onFailure });
      };
    },
  });
}

export function loadSidebar(world: TestWorld): void {
  const html = buildSidebarHtml();
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://sidebar.test/',
    beforeParse(window) {
      const calls = world.gscriptCalls;
      (window as unknown as { google: unknown }).google = {
        script: { run: makeChainable(calls) },
        host: { close: () => {} },
      };
    },
  });
  world.dom = dom;
}

export function nextTick(ms = 0): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}
