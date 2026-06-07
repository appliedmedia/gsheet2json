/**
 * Import logic: JSON -> sheet with styles, validations, named ranges.
 * Depends on: types.ts, utils.ts (global scope).
 * No import/export: Apps Script global scope.
 */

/**
 * Import JSON into a new tab (YYYY-MM-DD_HHMMSS or YYYY-MM-DD_HHMMSS_sheetName).
 * Creates named ranges from `l` fields and applies styles.
 *
 * `sessionId` (optional) — when supplied, progress checkpoints are written
 * to the CacheService channel so the sidebar can show a live progress bar.
 */
namespace gsheet2json {
  export class Import {
    public static importJsonToSheet(
      json: string,
      sessionId?: string,
      spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet,
    ): string {
  reportProgress(sessionId, 3, "Parsing JSON\u2026");
  const data = JSON.parse(json) as SheetExport;
  const ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HHmmss");
  const baseName = typeof data.sheetName === "string" && data.sheetName.trim()
    ? `${timestamp}_${data.sheetName.trim()}`
    : timestamp;
  const tabName = baseName.length > SHEET_TAB_NAME_MAX_LENGTH
    ? baseName.slice(0, SHEET_TAB_NAME_MAX_LENGTH)
    : baseName;
  reportProgress(sessionId, 6, `Creating tab "${tabName}"\u2026`);
  const sheet = ss.insertSheet(tabName);
  // Roll back the new tab if any step below fails, so a failed import leaves no orphan sheet.
  try {
  const { styles, validations: dvs, cells, columnWidths, rowHeights } = data;
  if (!cells || typeof cells !== "object" || Array.isArray(cells) || Object.keys(cells).length === 0) {
    throw new Error(
      "No cell data in JSON. Large files may be truncated when pasted (Apps Script limits dialog payload size). Use the Drive dropdown and click a file to import it directly."
    );
  }

  const numRows = rowHeights ? Object.keys(rowHeights).length : 0;
  const numCols = columnWidths ? Object.keys(columnWidths).length : 0;
  if (numRows === 0 || numCols === 0) {
    throw new Error("JSON has no rowHeights or columnWidths; cannot determine sheet size.");
  }

  // Size sheet to exact dimensions before writing any data.
  const curRows = sheet.getMaxRows();
  const curCols = sheet.getMaxColumns();
  if (curRows < numRows) sheet.insertRowsAfter(curRows, numRows - curRows);
  else if (curRows > numRows) sheet.deleteRows(numRows + 1, curRows - numRows);
  if (curCols < numCols) sheet.insertColumnsAfter(curCols, numCols - curCols);
  else if (curCols > numCols) sheet.deleteColumns(numCols + 1, curCols - numCols);

  const values: (string | number | boolean | Date | null)[][] = Array(numRows)
    .fill(null)
    .map(() => Array(numCols).fill(null));
  const formulas: string[][] = Array(numRows)
    .fill(null)
    .map(() => Array(numCols).fill(""));
  const backgrounds: string[][] = Array(numRows)
    .fill(null)
    .map(() => Array(numCols).fill("#ffffff"));
  const fontColors: string[][] = Array(numRows)
    .fill(null)
    .map(() => Array(numCols).fill("#000000"));
  const fontWeights: string[][] = Array(numRows)
    .fill(null)
    .map(() => Array(numCols).fill("normal"));
  const fontSizes: number[][] = Array(numRows)
    .fill(null)
    .map(() => Array(numCols).fill(10));
  const fontFamilies: string[][] = Array(numRows)
    .fill(null)
    .map(() => Array(numCols).fill("Arial"));
  const horizontalAlignments: string[][] = Array(numRows)
    .fill(null)
    .map(() => Array(numCols).fill("left"));
  const verticalAlignments: string[][] = Array(numRows)
    .fill(null)
    .map(() => Array(numCols).fill("bottom"));
  const numberFormats: string[][] = Array(numRows)
    .fill(null)
    .map(() => Array(numCols).fill(""));
  const wrapStrategies: string[][] = Array(numRows)
    .fill(null)
    .map(() => Array(numCols).fill("OVERFLOW"));

  const allCellKeys = Object.keys(cells);
  reportProgress(sessionId, 12, `Preparing ${allCellKeys.length} cells\u2026`);
  let cellScanCount = 0;
  const prepareProgressEvery = Math.max(1, Math.floor(allCellKeys.length / 20));
  for (const id of allCellKeys) {
    cellScanCount++;
    if (cellScanCount % prepareProgressEvery === 0 || cellScanCount === allCellKeys.length) {
      reportProgress(sessionId, 12 + (cellScanCount / allCellKeys.length) * 18, `Preparing cells: ${cellScanCount} of ${allCellKeys.length}`);
    }
    const cell = cells[id];
    const rc = parseCellId(id);
    if (!rc || rc.r < 0 || rc.r >= numRows || rc.c < 0 || rc.c >= numCols) continue;
    const { r, c } = rc;
    // Cells may omit `s` when their style matches `s_base` — use it as the
    // implicit default. Style-only entries (empty cells with non-base style)
    // omit `t`/`v`/`f` entirely — `resolveValue(undefined, undefined)` returns
    // null, which leaves the cell empty after setValues.
    const styleId = cell.s ?? "s_base";
    const style = resolveStyle(styles, styleId);
    values[r][c] = resolveValue(cell.v, cell.t);
    if (cell.f) formulas[r][c] = cell.f;
    backgrounds[r][c] = style?.bg ?? "#ffffff";
    fontColors[r][c] = style?.fontColor ?? "#000000";
    fontWeights[r][c] = style?.fontWeight ?? "normal";
    fontSizes[r][c] = style?.fontSize ?? 10;
    fontFamilies[r][c] = style?.fontFamily ?? "Arial";
    horizontalAlignments[r][c] = style?.horizontalAlignment ?? "left";
    verticalAlignments[r][c] = style?.verticalAlignment ?? "bottom";
    numberFormats[r][c] = style?.numberFormat ?? "";
    wrapStrategies[r][c] = style?.wrapStrategy ?? "OVERFLOW";
  }

  reportProgress(sessionId, 35, "Writing values\u2026");
  const range = sheet.getRange(1, 1, numRows, numCols);
  range.setValues(values);
  reportProgress(sessionId, 45, "Writing formulas\u2026");
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      if (formulas[r][c]) {
        sheet.getRange(r + 1, c + 1).setFormula(formulas[r][c]);
      }
    }
  }

  // Apply merges before styles so background, font, and alignment land on
  // the visible merged area. Each `merge` value is `r_NNNNN_c_NNNNN`
  // encoding the additional rows + cols beyond the anchor; the resulting
  // range size is `(deltaR + 1) x (deltaC + 1)`.
  reportProgress(sessionId, 50, "Merging cells\u2026");
  for (const id of Object.keys(cells)) {
    const merge = cells[id].merge;
    if (!merge) continue;
    const rc = parseCellId(id);
    const delta = parseCellId(merge);
    if (!rc || !delta) continue;
    const h = delta.r + 1;
    const w = delta.c + 1;
    if (h <= 1 && w <= 1) continue;
    sheet.getRange(rc.r + 1, rc.c + 1, h, w).merge();
  }

  reportProgress(sessionId, 55, "Applying styles\u2026");
  range.setBackgrounds(backgrounds);
  range.setFontColors(fontColors);
  range.setFontWeights(fontWeights as GoogleAppsScript.Spreadsheet.FontWeight[][]);
  range.setFontSizes(fontSizes);
  range.setFontFamilies(fontFamilies);
  range.setHorizontalAlignments(horizontalAlignments as Array<Array<"left" | "center" | "normal" | "right" | null>>);
  range.setVerticalAlignments(verticalAlignments as Array<Array<"top" | "middle" | "bottom" | null>>);
  range.setNumberFormats(numberFormats);
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const ws = wrapStrategies[r][c];
      const strategy = ws === "WRAP" ? SpreadsheetApp.WrapStrategy.WRAP
        : ws === "CLIP" ? SpreadsheetApp.WrapStrategy.CLIP
        : SpreadsheetApp.WrapStrategy.OVERFLOW;
      sheet.getRange(r + 1, c + 1).setWrapStrategy(strategy);
    }
  }

  reportProgress(sessionId, 70, "Applying data validations\u2026");
  // Apply data validations.
  if (dvs && typeof dvs === "object") {
    for (const id of Object.keys(cells)) {
      const cell = cells[id];
      if (!cell.dv || !dvs[cell.dv]) continue;
      const rc = parseCellId(id);
      if (!rc || rc.r < 0 || rc.r >= numRows || rc.c < 0 || rc.c >= numCols) continue;
      const dvEntry = dvs[cell.dv];
      const ct = stringToCriteriaType(dvEntry.criteriaType);
      if (!ct) continue;
      let builder = SpreadsheetApp.newDataValidation().withCriteria(ct, buildCriteriaArgs(dvEntry, ss));
      if (dvEntry.helpText) builder = builder.setHelpText(dvEntry.helpText);
      if (dvEntry.allowInvalid === false) builder = builder.setAllowInvalid(false);
      sheet.getRange(rc.r + 1, rc.c + 1).setDataValidation(builder.build());
    }
  }

  reportProgress(sessionId, 80, "Sizing rows & columns\u2026");
  if (rowHeights && typeof rowHeights === "object") {
    for (let r = 0; r < numRows; r++) {
      let h = rowHeights[rowId(r)];
      if (typeof h === "string") h = rowHeights[h];
      if (typeof h === "number") sheet.setRowHeight(r + 1, h);
    }
  }
  if (columnWidths && typeof columnWidths === "object") {
    for (let c = 0; c < numCols; c++) {
      let w = columnWidths[colId(c)];
      if (typeof w === "string") w = columnWidths[w];
      if (typeof w === "number") sheet.setColumnWidth(c + 1, w);
    }
  }

  // Reconcile import labels against existing named ranges in the spreadsheet.
  const existingRanges = ss.getNamedRanges();
  const existingLabels = new Map<string, string>();
  const existingLabelNames = new Set<string>();
  for (const nr of existingRanges) {
    const name = nr.getName();
    existingLabelNames.add(name);
    try {
      existingLabels.set(name, nr.getRange().getDisplayValue());
    } catch (_) {
      existingLabels.set(name, "");
    }
  }

  const labelRenames = new Map<string, string>();

  for (const id of Object.keys(cells)) {
    const cell = cells[id];
    if (!cell.l) continue;
    const origLabel = cell.l;

    if (existingLabels.has(origLabel)) {
      const rc = parseCellId(id);
      if (!rc) continue;
      const importVal = sheet.getRange(rc.r + 1, rc.c + 1).getDisplayValue();
      const existingVal = existingLabels.get(origLabel)!;

      if (importVal === existingVal) {
        delete cell.l;
        cell.f = `=${origLabel}`;
        sheet.getRange(rc.r + 1, rc.c + 1).setFormula(`=${origLabel}`);
        labelRenames.set(origLabel, origLabel);
        continue;
      }

      let deduped = origLabel;
      let n = 0;
      while (existingLabelNames.has(deduped)) {
        n++;
        deduped = `${origLabel}_${n}`;
      }
      existingLabelNames.add(deduped);
      cell.l = deduped;
      labelRenames.set(origLabel, deduped);
    }
  }

  // Rewrite renamed-label references inside import formulas. Handles both a
  // whole-cell reference (=l_foo) and labels embedded in a larger formula
  // (=l_foo + l_bar) by matching whole label tokens via word boundaries.
  // Label ids are [a-z0-9_] slugs, so they are regex-safe; the only edge case
  // not handled is a label-like token inside a formula string literal.
  if (labelRenames.size > 0) {
    const activeRenames = [...labelRenames.entries()].filter(([from, to]) => from !== to);
    if (activeRenames.length > 0) {
      for (const id of Object.keys(cells)) {
        const cell = cells[id];
        if (!cell.f) continue;
        let next = cell.f;
        for (const [from, to] of activeRenames) {
          next = next.replace(new RegExp(`\\b${from}\\b`, "g"), to);
        }
        if (next !== cell.f) {
          cell.f = next;
          const rc = parseCellId(id);
          if (rc) sheet.getRange(rc.r + 1, rc.c + 1).setFormula(next);
        }
      }
    }
  }

  reportProgress(sessionId, 92, "Creating named ranges\u2026");
  // Create named ranges for remaining cells with `l` field.
  for (const id of Object.keys(cells)) {
    const cell = cells[id];
    if (!cell.l) continue;
    const rc = parseCellId(id);
    if (!rc) continue;
    ss.setNamedRange(cell.l, sheet.getRange(rc.r + 1, rc.c + 1));
  }

  reportProgress(sessionId, 100, "Done");
  sheet.activate();
  return tabName;
  } catch (importErr) {
    try { ss.deleteSheet(sheet); } catch (_) { /* sheet already removed */ }
    throw importErr;
  }
    }

    /** Server-side import entry point. Accepts optional sessionId for progress. */
    public static runImportJsonToSheet(
      json: string,
      sessionId?: string,
      spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet,
    ): { ok: boolean; message: string; tabName: string } {
      try {
        if (!json.trim()) return { ok: false, message: "JSON is empty.", tabName: "" };
        const tabName = Import.importJsonToSheet(json, sessionId, spreadsheet);
        return { ok: true, message: `Imported to "${tabName}"`, tabName };
      } catch (e) {
        return { ok: false, message: `Import failed: ${(e as Error).message}`, tabName: "" };
      } finally {
        clearProgress(sessionId);
      }
    }

    /** Import JSON from a Drive file by ID (no dialog payload limit). */
    public static runImportJsonToSheetFromDrive(
      fileId: string,
      sessionId?: string,
      spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet,
    ): { ok: boolean; message: string; tabName: string } {
      try {
        reportProgress(sessionId, 1, "Fetching from Drive\u2026");
        const file = DriveApp.getFileById(fileId);
        const json = file.getBlob().getDataAsString();
        if (!json.trim()) return { ok: false, message: "File is empty.", tabName: "" };
        const tabName = Import.importJsonToSheet(json, sessionId, spreadsheet);
        return { ok: true, message: `Imported "${file.getName()}" to "${tabName}"`, tabName };
      } catch (e) {
        return { ok: false, message: `Import failed: ${(e as Error).message}`, tabName: "" };
      } finally {
        clearProgress(sessionId);
      }
    }
  }
}

function importJsonToSheet(
  json: string,
  sessionId?: string,
  spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet,
): string {
  return gsheet2json.Import.importJsonToSheet(json, sessionId, spreadsheet);
}

function runImportJsonToSheet(
  json: string,
  sessionId?: string,
  spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet,
): { ok: boolean; message: string; tabName: string } {
  return gsheet2json.Import.runImportJsonToSheet(json, sessionId, spreadsheet);
}

function runImportJsonToSheetFromDrive(
  fileId: string,
  sessionId?: string,
  spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet,
): { ok: boolean; message: string; tabName: string } {
  return gsheet2json.Import.runImportJsonToSheetFromDrive(fileId, sessionId, spreadsheet);
}
