import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import type { JSDOM } from 'jsdom';

export interface ScanHit {
  file: string;
  line: number;
  text: string;
}

export interface GScriptCall {
  method: string;
  args: unknown[];
  onSuccess?: (value?: unknown) => void;
  onFailure?: (err?: unknown) => void;
}

export interface GasResult {
  pass: boolean;
  detail: string;
}

export class TestWorld extends World {
  hits: ScanHit[] = [];
  scopes: string[] = [];
  allowedScopes: string[] = [];
  appsscript: Record<string, unknown> = {};

  dom?: JSDOM;
  gscriptCalls: GScriptCall[] = [];

  lastGasResult?: GasResult;
  lastGasFn?: string;

  constructor(opts: IWorldOptions) {
    super(opts);
  }

  get window(): Window & typeof globalThis {
    if (!this.dom) {
      throw new Error('Sidebar not loaded. Use "Given the sidebar is loaded in jsdom" first.');
    }
    return this.dom.window as unknown as Window & typeof globalThis;
  }

  get document(): Document {
    return this.window.document;
  }
}

setWorldConstructor(TestWorld);
