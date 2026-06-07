import * as logic from '../../dist-test/gsheet2jsonLogic.js';

export type Fn = (...args: unknown[]) => unknown;

export const registry: Record<string, Fn> = {
  styleKey: logic.styleKey as unknown as Fn,
  valueKey: logic.valueKey as unknown as Fn,
  resolveValue: logic.resolveValue as unknown as Fn,
};
