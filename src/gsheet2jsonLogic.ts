/**
 * Pure logic for stylesheet keys, value keys, and value resolution.
 * Test-only importable mirror of the production helpers in src/utils.ts
 * (ValueUtils) and the schema in src/types.ts. It exists as a module because
 * the production code runs in Apps Script global scope and has no exports;
 * keep these definitions in sync with utils.ts / types.ts.
 */

export interface StyleEntry {
  base?: string;
  bg?: string;
  fontColor?: string;
  fontWeight?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  horizontalAlignment?: string;
  verticalAlignment?: string;
  numberFormat?: string;
  wrapStrategy?: string;
}

export function styleKey(entry: StyleEntry): string {
  return JSON.stringify(entry);
}

export function valueKey(v: unknown): string {
  if (v === null || v === undefined) return "__null__";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function resolveValue(
  v: string | number | boolean | null | undefined,
  cellType?: string
): string | number | boolean | Date | null {
  if (v === null || v === undefined) return null;
  if (cellType === "d" && typeof v === "string") {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  return v;
}
