/**
 * Shared utility classes for gsheet2json.
 * Organized under namespace classes with legacy wrapper functions.
 */

namespace gsheet2json {
  export class CellIds {
    private static pad5(n: number): string {
      return (`00000${n}`).slice(-5);
    }

    public static colId(c: number): string {
      return `c_${CellIds.pad5(c)}`;
    }

    public static rowId(r: number): string {
      return `r_${CellIds.pad5(r)}`;
    }

    public static cellId(r: number, c: number): string {
      return `${CellIds.rowId(r)}_${CellIds.colId(c)}`;
    }

    public static parseCellId(id: string): { r: number; c: number } | null {
      const m = id.match(/^r_(\d+)_c_(\d+)$/);
      if (!m) return null;
      return { r: parseInt(m[1], 10), c: parseInt(m[2], 10) };
    }
  }

  /**
   * Constants for gsheet2json's export filename format. Centralized so the
   * `.g2j.json` suffix and the `export` fallback base name aren't hardcoded
   * in every call site that builds or defaults a filename.
   */
  export class ExportFormat {
    /** Filename suffix marking a gsheet2json-shaped JSON export. The double
     *  extension distinguishes our format at a glance in Drive listings while
     *  the outer `.json` keeps mime detection and editor associations working. */
    public static readonly EXTENSION = ".g2j.json";
    /** Base filename used when no sheet name is available (combine with EXTENSION). */
    public static readonly DEFAULT_NAME = "export";
  }

  export class SheetNames {
    /** Google Sheets tab name max length. */
    public static readonly SHEET_TAB_NAME_MAX_LENGTH = 100;

    public static getSheet(
      name?: string,
      spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet,
    ): GoogleAppsScript.Spreadsheet.Sheet {
      const ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
      if (name) {
        const sheet = ss.getSheetByName(name);
        if (!sheet) throw new Error(`Sheet not found: ${name}`);
        return sheet;
      }
      const sheet = ss.getActiveSheet();
      if (!sheet) throw new Error("No active sheet");
      return sheet;
    }

    /** If tab name starts with YYYY-MM-DD or YYYY-MM-DD_HHMMSS_, strip that prefix. */
    public static stripLeadingDatePrefix(name: string): string {
      return name.replace(/^\d{4}-\d{2}-\d{2}(?:_\d{6})?_?/, "").trim();
    }

    /** Clean sheet name for use in a filename (remove/replace invalid chars). */
    public static cleanNameForFilename(name: string): string {
      return name.replace(/[\\/:*?"<>|\s]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "") || "sheet";
    }
  }

  export class ValueUtils {
    /** Abbreviations sorted longest-first so multi-word phrases match before their parts. */
    private static readonly ABBREVS: [string, string][] = ([
      ["quality_assurance_analyst_engineer", "qa"],
      ["vice_president_engineering", "vpe"],
      ["quality_assurance_analyst", "qa"],
      ["engineering_director", "edir"],
      ["engineering_manager", "emgr"],
      ["software_engineer", "swe"],
      ["tech_lead_manager", "tlm"],
      ["quality_assurance", "qa"],
      ["vice_president", "vp"],
      ["architecture", "arch"],
      ["engineering", "eng"],
      ["principal", "princ"],
      ["engineer", "eng"],
      ["examples", "eg"],
      ["software", "sw"],
      ["director", "dir"],
      ["example", "eg"],
      ["manager", "mgr"],
      ["general", "gen"],
      ["normal", "norm"],
      ["center", "ctr"],
      ["bottom", "btm"],
      ["middle", "mid"],
      ["senior", "sr"],
      ["junior", "jr"],
      ["italic", "i"],
      ["right", "rt"],
      ["bold", "b"],
      ["left", "lt"],
    ] as [string, string][]).sort((a, b) => b[0].length - a[0].length);

    public static valueKey(v: unknown): string {
      if (v === null || v === undefined) return "__null__";
      if (typeof v === "object") return JSON.stringify(v);
      return String(v);
    }

    /** Canonical empty check. 0, false, and other falsy-but-valid values are NOT empty. */
    public static isEmpty(value: unknown): boolean {
      if (value === null || value === undefined) return true;
      return typeof value === "string" && value.length === 0;
    }

    /**
     * Consecutive non-[a-zA-Z] chars (optionally +extraAllowed) become single _.
     * Collapse/trim, empty -> fallback.
     */
    public static toKeyPart(str: string, extraAllowed = "", fallback = "n"): string {
      const esc = (s: string) => s.replace(/[-\]\\^]/g, "\\$&");
      const re = extraAllowed
        ? new RegExp(`[^a-zA-Z0-9${esc(extraAllowed)}]+`, "g")
        : /[^a-zA-Z0-9]+/g;
      const normalized = String(str).trim().replace(re, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
      return normalized || fallback;
    }

    public static abbreviate(s: string): string {
      let out = s;
      for (const [from, to] of ValueUtils.ABBREVS) out = out.split(from).join(to);
      return out;
    }

    /** Label slug: slugify, abbreviate, then truncate at the next _ boundary after 30 chars. */
    public static toSlug(text: string): string {
      let s = ValueUtils.abbreviate(ValueUtils.toKeyPart(String(text).trim().toLowerCase()));
      s = s.replace(/_+/g, "_").replace(/^_|_$/g, "");
      if (s.length > 30) {
        const nextUnderscore = s.indexOf("_", 30);
        s = nextUnderscore > 0 ? s.slice(0, nextUnderscore) : s;
      }
      return s;
    }

    /** Produce unique label id: l_{slug} or l_{slug}_# if slug is already used. */
    public static nextLabelId(rawVal: string | number | boolean, usedIds: Set<string>): string {
      const slug = ValueUtils.toSlug(String(rawVal));
      const base = `l_${slug}`;
      let id = base;
      let n = 0;
      while (usedIds.has(id)) {
        n++;
        id = `${base}_${n}`;
      }
      usedIds.add(id);
      return id;
    }

    public static resolveValue(
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
  }

  export class StyleUtils {
    /**
     * Every style attribute we track. Order is significant for id-generation but
     * not for semantics.
     */
    public static readonly STYLE_PROPS =
      ["bg", "fontColor", "fontWeight", "fontSize", "fontFamily", "fontStyle", "horizontalAlignment", "verticalAlignment", "numberFormat", "wrapStrategy"] as const;

    /**
     * Max resolved chain depth.
     */
    public static readonly MAX_CHAIN_DEPTH = 3;

    /**
     * Max number of differing properties allowed in a delta.
     */
    public static readonly OVERRIDE_THRESHOLD = Math.ceil(StyleUtils.STYLE_PROPS.length / 2);

    /** Cap decimal placeholders: "0.#########..." -> "0.#####" (max 5 # after decimal). */
    public static normalizeNumberFormat(fmt: string): string {
      return fmt.replace(/^(0\.)(#{6,})$/, "$1#####");
    }

    public static normalizeStyle(entry: StyleEntry): StyleEntry {
      const o: StyleEntry = {};
      for (const k of StyleUtils.STYLE_PROPS) {
        const v = (entry as Record<string, unknown>)[k];
        if (v === undefined) continue;
        if (k === "numberFormat" && typeof v === "string") {
          (o as Record<string, unknown>)[k] = StyleUtils.normalizeNumberFormat(v);
        } else {
          (o as Record<string, unknown>)[k] = v;
        }
      }
      return o;
    }

    public static styleDepth(styles: Record<string, StyleEntry>, id: string): number {
      let depth = 1;
      let cur: string | undefined = id;
      const seen = new Set<string>();
      while (cur !== undefined) {
        if (seen.has(cur)) break;
        seen.add(cur);
        const entry: StyleEntry | undefined = styles[cur];
        if (!entry || !entry.base) break;
        depth++;
        cur = entry.base;
      }
      return depth;
    }

    public static resolveStyle(styles: Record<string, StyleEntry>, id: string): StyleEntry | undefined {
      const entry = styles[id];
      if (!entry) return undefined;
      const chain: StyleEntry[] = [];
      const seen = new Set<string>();
      let curId: string | undefined = id;
      let cur: StyleEntry | undefined = entry;
      while (cur) {
        if (curId && seen.has(curId)) break;
        if (curId) seen.add(curId);
        chain.push(cur);
        if (!cur.base) break;
        curId = cur.base;
        cur = styles[curId];
      }
      const out: StyleEntry = {};
      for (let i = chain.length - 1; i >= 0; i--) {
        const e = chain[i];
        for (const k of StyleUtils.STYLE_PROPS) {
          const v = (e as Record<string, unknown>)[k];
          if (v !== undefined) (out as Record<string, unknown>)[k] = v;
        }
      }
      return out;
    }

    public static styleOverrides(base: StyleEntry, full: StyleEntry): StyleEntry {
      const overrides: StyleEntry = {};
      for (const k of StyleUtils.STYLE_PROPS) {
        const b = (base as Record<string, unknown>)[k];
        const f = (full as Record<string, unknown>)[k];
        if (f !== b) (overrides as Record<string, unknown>)[k] = f;
      }
      return overrides;
    }

    /** Collapse date-like number formats, otherwise collapse repeated #. */
    public static shortenNumberFormat(fmt: string): string {
      const sections = fmt.match(/[a-zA-Z]+/g);
      if (sections && sections.every((s) => /^[ymdhs]+$/i.test(s))) {
        const seen = new Set<string>();
        const parts: string[] = [];
        for (const s of sections) {
          const ch = s.charAt(0).toLowerCase();
          if (!seen.has(ch)) { seen.add(ch); parts.push(ch); }
        }
        return parts.join("");
      }
      return fmt.replace(/#{2,}/g, "#");
    }

    /** Build style id base from present properties only. Missing properties are omitted. */
    public static styleIdBase(entry: StyleEntry): string {
      const parts: string[] = ["s"];
      if (entry.fontFamily !== undefined) parts.push(ValueUtils.toKeyPart(entry.fontFamily.toLowerCase()));
      if (entry.fontWeight !== undefined) parts.push(ValueUtils.abbreviate(ValueUtils.toKeyPart(entry.fontWeight.toLowerCase())));
      if (entry.fontSize !== undefined) parts.push(String(entry.fontSize));
      if (entry.horizontalAlignment !== undefined) parts.push(ValueUtils.abbreviate(ValueUtils.toKeyPart(entry.horizontalAlignment.toLowerCase())));
      if (entry.numberFormat !== undefined) {
        parts.push(StyleUtils.shortenNumberFormat(ValueUtils.toKeyPart(entry.numberFormat.slice(0, 20).toLowerCase(), "0-9.#")));
      }
      return parts.join("_");
    }

    /** Produce unique style id: s_{...} or s_{...}_# if base is already used. */
    public static nextStyleId(entry: StyleEntry, styles: Record<string, StyleEntry>): string {
      const base = StyleUtils.styleIdBase(entry);
      let id = base;
      let n = 0;
      while (id in styles) {
        n++;
        id = `${base}_${n}`;
      }
      return id;
    }
  }

  export class ValidationUtils {
    public static criteriaTypeToString(ct: GoogleAppsScript.Spreadsheet.DataValidationCriteria): string {
      for (const [k, v] of Object.entries(SpreadsheetApp.DataValidationCriteria)) {
        if (v === ct) return k;
      }
      return String(ct);
    }

    public static stringToCriteriaType(s: string): GoogleAppsScript.Spreadsheet.DataValidationCriteria | null {
      const ct = (SpreadsheetApp.DataValidationCriteria as Record<string, unknown>)[s];
      return ct !== undefined ? ct as GoogleAppsScript.Spreadsheet.DataValidationCriteria : null;
    }

    /** Build a ValidationEntry from a DataValidation object. */
    public static extractValidation(dv: GoogleAppsScript.Spreadsheet.DataValidation): ValidationEntry {
      const entry: ValidationEntry = {
        criteriaType: ValidationUtils.criteriaTypeToString(dv.getCriteriaType()),
      };
      const criteriaValues = dv.getCriteriaValues();
      if (criteriaValues && criteriaValues.length > 0) {
        for (const val of criteriaValues) {
          if (val !== null && typeof val === "object" && "getA1Notation" in val) {
            const rng = val as GoogleAppsScript.Spreadsheet.Range;
            try {
              const sheetName = rng.getSheet().getName();
              entry.range = `'${sheetName}'!${rng.getA1Notation()}`;
            } catch {
              entry.range = rng.getA1Notation();
            }
          } else if (val !== null && val !== undefined) {
            if (!entry.values) entry.values = [];
            if (val instanceof Date) {
              entry.values.push(val.toISOString());
            } else {
              entry.values.push(val as string | number | boolean);
            }
          }
        }
      }
      const helpText = dv.getHelpText();
      if (helpText) entry.helpText = helpText;
      if (!dv.getAllowInvalid()) entry.allowInvalid = false;
      return entry;
    }

    /** Build a validation ID from its criteria type. */
    public static validationIdBase(entry: ValidationEntry): string {
      return `dv_${ValueUtils.toKeyPart(entry.criteriaType.toLowerCase())}`;
    }

    /** Produce unique validation id: dv_{type} or dv_{type}_# if already used. */
    public static nextValidationId(entry: ValidationEntry, validations: Record<string, ValidationEntry>): string {
      const base = ValidationUtils.validationIdBase(entry);
      let id = base;
      let n = 0;
      while (id in validations) {
        n++;
        id = `${base}_${n}`;
      }
      return id;
    }

    /** Reconstruct criteria arguments array for withCriteria() from a ValidationEntry. */
    public static buildCriteriaArgs(
      dvEntry: ValidationEntry,
      ss: GoogleAppsScript.Spreadsheet.Spreadsheet
    ): unknown[] {
      if (dvEntry.range) {
        try {
          const rng = ss.getRange(dvEntry.range);
          return [rng];
        } catch {
          return dvEntry.values ?? [];
        }
      }
      return dvEntry.values ?? [];
    }
  }

}

// Compatibility constants and wrappers (existing call sites remain unchanged).
const STYLE_PROPS = gsheet2json.StyleUtils.STYLE_PROPS;
const MAX_CHAIN_DEPTH = gsheet2json.StyleUtils.MAX_CHAIN_DEPTH;
const OVERRIDE_THRESHOLD = gsheet2json.StyleUtils.OVERRIDE_THRESHOLD;
const SHEET_TAB_NAME_MAX_LENGTH = gsheet2json.SheetNames.SHEET_TAB_NAME_MAX_LENGTH;
const EXPORT_EXTENSION = gsheet2json.ExportFormat.EXTENSION;
const DEFAULT_EXPORT_NAME = gsheet2json.ExportFormat.DEFAULT_NAME;

function colId(c: number): string { return gsheet2json.CellIds.colId(c); }
function rowId(r: number): string { return gsheet2json.CellIds.rowId(r); }
function cellId(r: number, c: number): string { return gsheet2json.CellIds.cellId(r, c); }
function parseCellId(id: string): { r: number; c: number } | null { return gsheet2json.CellIds.parseCellId(id); }

function getSheet(
  name?: string,
  spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet,
): GoogleAppsScript.Spreadsheet.Sheet {
  return gsheet2json.SheetNames.getSheet(name, spreadsheet);
}
function stripLeadingDatePrefix(name: string): string { return gsheet2json.SheetNames.stripLeadingDatePrefix(name); }
function cleanNameForFilename(name: string): string { return gsheet2json.SheetNames.cleanNameForFilename(name); }

function normalizeNumberFormat(fmt: string): string { return gsheet2json.StyleUtils.normalizeNumberFormat(fmt); }
function normalizeStyle(entry: StyleEntry): StyleEntry { return gsheet2json.StyleUtils.normalizeStyle(entry); }
function styleDepth(styles: Record<string, StyleEntry>, id: string): number { return gsheet2json.StyleUtils.styleDepth(styles, id); }
function resolveStyle(styles: Record<string, StyleEntry>, id: string): StyleEntry | undefined { return gsheet2json.StyleUtils.resolveStyle(styles, id); }
function styleOverrides(base: StyleEntry, full: StyleEntry): StyleEntry { return gsheet2json.StyleUtils.styleOverrides(base, full); }
function shortenNumberFormat(fmt: string): string { return gsheet2json.StyleUtils.shortenNumberFormat(fmt); }
function styleIdBase(entry: StyleEntry): string { return gsheet2json.StyleUtils.styleIdBase(entry); }
function nextStyleId(entry: StyleEntry, styles: Record<string, StyleEntry>): string {
  return gsheet2json.StyleUtils.nextStyleId(entry, styles);
}

function valueKey(v: unknown): string { return gsheet2json.ValueUtils.valueKey(v); }
function isEmpty(value: unknown): boolean { return gsheet2json.ValueUtils.isEmpty(value); }
function toKeyPart(str: string, extraAllowed = "", fallback = "n"): string {
  return gsheet2json.ValueUtils.toKeyPart(str, extraAllowed, fallback);
}
function abbreviate(s: string): string { return gsheet2json.ValueUtils.abbreviate(s); }
function toSlug(text: string): string { return gsheet2json.ValueUtils.toSlug(text); }
function nextLabelId(rawVal: string | number | boolean, usedIds: Set<string>): string {
  return gsheet2json.ValueUtils.nextLabelId(rawVal, usedIds);
}
function resolveValue(
  v: string | number | boolean | null | undefined,
  cellType?: string
): string | number | boolean | Date | null {
  return gsheet2json.ValueUtils.resolveValue(v, cellType);
}

function criteriaTypeToString(ct: GoogleAppsScript.Spreadsheet.DataValidationCriteria): string {
  return gsheet2json.ValidationUtils.criteriaTypeToString(ct);
}
function stringToCriteriaType(s: string): GoogleAppsScript.Spreadsheet.DataValidationCriteria | null {
  return gsheet2json.ValidationUtils.stringToCriteriaType(s);
}
function extractValidation(dv: GoogleAppsScript.Spreadsheet.DataValidation): ValidationEntry {
  return gsheet2json.ValidationUtils.extractValidation(dv);
}
function validationIdBase(entry: ValidationEntry): string { return gsheet2json.ValidationUtils.validationIdBase(entry); }
function nextValidationId(entry: ValidationEntry, validations: Record<string, ValidationEntry>): string {
  return gsheet2json.ValidationUtils.nextValidationId(entry, validations);
}
function buildCriteriaArgs(
  dvEntry: ValidationEntry,
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet
): unknown[] {
  return gsheet2json.ValidationUtils.buildCriteriaArgs(dvEntry, ss);
}

