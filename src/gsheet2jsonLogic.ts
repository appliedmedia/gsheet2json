/**
 * Pure logic for stylesheet keys, value keys, and label resolution.
 * Used by tests (Node) and kept in sync with gsheet2json.ts (Apps Script).
 */

export interface StyleEntry {
  bg?: string;
  fontWeight?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  horizontalAlignment?: string;
  verticalAlignment?: string;
  numberFormat?: string;
  wrap?: boolean;
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
  v: string | number | boolean | null,
  labels: Record<string, string | number | boolean>
): string | number | boolean | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string" && v.startsWith("=")) {
    const lid = v.slice(1);
    return lid in labels ? labels[lid] : v;
  }
  return v;
}
