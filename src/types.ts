/**
 * Shared type definitions for gsheet2json.
 * Single source of truth — no duplicates in other files.
 * No import/export: Apps Script global scope.
 */

interface StyleEntry {
  /**
   * Parent style id. When set, this entry only lists the properties that
   * differ from its (resolved) parent — a delta. Chains are bounded at
   * export time to `MAX_CHAIN_DEPTH` levels (see utils.ts).
   */
  base?: string;
  bg?: string;
  /** Text color (e.g. "#ffffff"). Omitted when default black/unset. */
  fontColor?: string;
  fontWeight?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  horizontalAlignment?: string;
  verticalAlignment?: string;
  numberFormat?: string;
  /** WRAP, OVERFLOW, or CLIP */
  wrapStrategy?: string;
}

interface ValidationEntry {
  criteriaType: string;
  /** Inline values: list items, numeric bounds, formula strings. */
  values?: (string | number | boolean | null)[];
  /** Sheet-qualified A1 range ref for VALUE_IN_RANGE (e.g. "'Lookups'!A1:A50"). */
  range?: string;
  helpText?: string;
  /** Only stored when false (default is true). */
  allowInvalid?: boolean;
}

interface CellExport {
  v?: string | number | boolean | null;
  /**
   * Cell type: "s" string, "n" number, "b" boolean, "d" date, "f" formula.
   * Omitted for style-only entries — empty cells whose styling differs from
   * `s_base`. Such entries carry `s` (and nothing else) so the import can
   * faithfully restore the cell's style without a heuristic neighbor-fill.
   */
  t?: string;
  /**
   * Style id. Omitted when the cell's style matches the sheet's implicit
   * default (`s_base` — the most common style in the sheet). Importers
   * must fall back to `s_base` when `s` is undefined.
   */
  s?: string;
  /** Formula (e.g. "=l_foo" or "=A1+B1"). */
  f?: string;
  /** Named range label. On import, creates a named range pointing to this cell. */
  l?: string;
  /** Data validation ID referencing an entry in validations. */
  dv?: string;
  /**
   * Merged-cell anchor. Only present on the top-left cell of a merged range.
   * Format `r_NNNNN_c_NNNNN` (same shape as a cell id), where the row part
   * is the count of *additional* rows down and the column part is the count
   * of *additional* columns right to merge into this cell. Both dimensions
   * are always supplied even when one is 0:
   *   `r_00000_c_00002` = 1-row, 3-column horizontal merge
   *   `r_00002_c_00000` = 3-row, 1-column vertical merge
   *   `r_00001_c_00001` = 2x2 merge
   * On import, the merge is applied before formatting so background, font,
   * and alignment land on the visible merged area.
   */
  merge?: string;
}

interface SheetExport {
  sheetName: string;
  /** r_00000: height (px) or ref to another row id with the same height. */
  rowHeights?: Record<string, number | string>;
  /** c_00000: width (px) or ref to another col id with the same width. */
  columnWidths?: Record<string, number | string>;
  styles: Record<string, StyleEntry>;
  validations?: Record<string, ValidationEntry>;
  cells: Record<string, CellExport>;
}

/**
 * A single activity-feed entry. Persisted in UserProperties and rendered in
 * the sidebar's activity pane.
 */
interface ActivityEntry {
  /** Short unique id (used for the "Forget" button). */
  id: string;
  /** ISO timestamp of the event. */
  at: string;
  /** Whether the operation succeeded. */
  ok: boolean;
  /** One-line human-readable title, e.g. `Saved "report.json" to Drive`. */
  title: string;
  /** Optional second line (e.g. source folder, error message). */
  subtitle?: string;
  /** Drive URL when applicable — renders as an [Open] action. */
  openUrl?: string;
  /** Drive file id when applicable (for future actions). */
  fileId?: string;
  /** Full error details for failure entries (rendered behind a [Details] button). */
  error?: string;
}

/** An ignored Drive item. Name is kept alongside the id purely for display. */
interface IgnoredDriveRef {
  id: string;
  name: string;
}

interface UserSettings {
  /** Hide any file whose name matches (anywhere in Drive). */
  ignoredDriveFileNames: string[];
  /** Hide this specific file by id. Name stored for display. */
  ignoredDriveFileIds: IgnoredDriveRef[];
  /** Hide anything inside a folder whose name matches. */
  ignoredDriveFolderNames: string[];
  /** Hide anything inside this specific folder by id. Name stored for display. */
  ignoredDriveFolderIds: IgnoredDriveRef[];
  /** Cross-session activity feed, newest first. Capped server-side. */
  activityFeed: ActivityEntry[];
}

/** One file entry returned by getJsonFilesInDrive, with enough info to disambiguate duplicates. */
interface DriveJsonFile {
  id: string;
  name: string;
  webViewLink: string;
  /** Enclosing folder id (first parent, or "" for My Drive root/shared-with-me). */
  folderId: string;
  /** Human-readable folder name (e.g. "Reports"), "" when not resolvable. */
  folderName: string;
  /** File size in bytes from Drive metadata. 0 when Drive omits it (rare for non-native files). */
  sizeBytes: number;
}
