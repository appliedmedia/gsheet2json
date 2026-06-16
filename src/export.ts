/**
 * Export logic: sheet -> JSON with styles and label deduplication.
 * Depends on: types.ts, utils.ts (global scope).
 * No import/export: Apps Script global scope.
 */

/**
 * Export active or named sheet to JSON with styles and label deduplication.
 *
 * `sessionId` (optional) — when supplied, progress checkpoints are written
 * to the CacheService channel so the sidebar can show a live progress bar.
 */
namespace gsheet2json {
  export class Export {
    public static exportSheetToJson(
      sheetName?: string,
      sessionId?: string,
      spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet,
    ): string {
  const sheet = getSheet(sheetName, spreadsheet);
  const name = sheet.getName();
  reportProgress(sessionId, 2, "Reading sheet\u2026");
  const range = sheet.getDataRange();
  if (range.getNumRows() === 0 || range.getNumColumns() === 0) {
    const out: SheetExport = { sheetName: name, rowHeights: {}, columnWidths: {}, styles: {}, cells: {} };
    return JSON.stringify(out, null, 2);
  }

  const numRows = range.getNumRows();
  const numCols = range.getNumColumns();
  const values = range.getValues() as unknown[][];
  const displayValues = range.getDisplayValues();
  const formulas = range.getFormulas();
  const backgrounds = range.getBackgrounds();
  const fontColors = range.getFontColors();
  const fontWeights = range.getFontWeights();
  const fontSizes = range.getFontSizes();
  const fontFamilies = range.getFontFamilies();
  const horizontalAlignments = range.getHorizontalAlignments();
  const verticalAlignments = range.getVerticalAlignments();
  const numberFormats = range.getNumberFormats();
  const wrapStrategies = range.getWrapStrategies();
  const dataValidations = range.getDataValidations();

  // Count display value occurrences (including formula cells) so we create labels for values that appear 2+ times.
  const valueCount = new Map<string, number>();
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const rawVal = values[r][c];
      const vk = valueKey(rawVal);
      valueCount.set(vk, (valueCount.get(vk) ?? 0) + 1);
    }
  }

  reportProgress(sessionId, 5, "Scanning styles\u2026");

  // ── Pass 1 ─────────────────────────────────────────────────────────
  // Compute a fully-populated normalized style for every cell in the range
  // and tally how often each distinct style appears. The most common style
  // becomes `s_base` — the implicit default for any cell that omits `s`.
  // Tie-break: first encountered in row-major order.
  type StyleBucket = { key: string; entry: StyleEntry; count: number; firstR: number; firstC: number };
  const buckets = new Map<string, StyleBucket>();
  const normalizedGrid: StyleEntry[][] = Array.from({ length: numRows }, () => Array(numCols));
  const styleProgressEvery = Math.max(1, Math.floor(numRows / 20));
  for (let r = 0; r < numRows; r++) {
    if (r % styleProgressEvery === 0 || r === numRows - 1) reportProgress(sessionId, 5 + (r / numRows) * 25, `Scanning styles: row ${r + 1} of ${numRows}`);
    for (let c = 0; c < numCols; c++) {
      const entry: StyleEntry = {
        bg: backgrounds[r][c],
        fontColor: fontColors[r][c],
        fontWeight: fontWeights[r][c],
        fontSize: fontSizes[r][c],
        fontFamily: fontFamilies[r][c],
        horizontalAlignment: horizontalAlignments[r][c],
        verticalAlignment: verticalAlignments[r][c],
        numberFormat: numberFormats[r][c],
        wrapStrategy: wrapStrategies[r][c]?.toString(),
      };
      const normalized = normalizeStyle(entry);
      normalizedGrid[r][c] = normalized;
      const key = JSON.stringify(normalized);
      const existing = buckets.get(key);
      if (existing) {
        existing.count++;
      } else {
        buckets.set(key, { key, entry: normalized, count: 1, firstR: r, firstC: c });
      }
    }
  }

  // Pick the most-common style as `s_base`. Ties resolved by first-encountered.
  let baseKey: string | null = null;
  let baseBucket: StyleBucket | null = null;
  for (const b of buckets.values()) {
    if (!baseBucket) { baseBucket = b; baseKey = b.key; continue; }
    if (b.count > baseBucket.count) { baseBucket = b; baseKey = b.key; continue; }
    if (b.count === baseBucket.count) {
      if (b.firstR < baseBucket.firstR ||
          (b.firstR === baseBucket.firstR && b.firstC < baseBucket.firstC)) {
        baseBucket = b;
        baseKey = b.key;
      }
    }
  }

  // ── Pass 2 ─────────────────────────────────────────────────────────
  // Walk cells in deterministic order, assigning each one either `s_base`
  // (then omitting `s` on the cell) or a registered / newly-created style.
  const styleMap = new Map<string, string>();
  const styles: Record<string, StyleEntry> = {};
  if (baseBucket) {
    styles["s_base"] = baseBucket.entry;
    styleMap.set(baseBucket.key, "s_base");
  }

  const validationMap = new Map<string, string>();
  const validations: Record<string, ValidationEntry> = {};

  /** Maps valueKey -> { lid, cellId } for the first cell that defines this label. */
  const labelMap = new Map<string, { lid: string; cellId: string }>();
  /** Set of label IDs already used (for uniqueness). */
  const usedLabelIds = new Set<string>();

  const cells: Record<string, CellExport> = {};
  const styleHits: Record<string, number> = {};

  /**
   * Register a newly-seen normalized style. Pick the base candidate that
   * produces the smallest delta, provided:
   *   - the candidate's depth + 1 <= MAX_CHAIN_DEPTH, and
   *   - the resulting delta has <= OVERRIDE_THRESHOLD differing fields.
   * If no candidate qualifies, emit the style as its own fully-populated
   * standalone entry (a new "root" in the styles dict).
   */
  function registerStyle(normalized: StyleEntry): string {
    const sid = nextStyleId(normalized, styles);
    let bestBase: string | undefined;
    let bestOverrides: StyleEntry | null = null;
    let bestCount = Infinity;
    for (const candId of Object.keys(styles)) {
      if (styleDepth(styles, candId) + 1 > MAX_CHAIN_DEPTH) continue;
      const resolved = resolveStyle(styles, candId);
      if (!resolved) continue;
      const overrides = styleOverrides(resolved, normalized);
      const count = Object.keys(overrides).length;
      if (count === 0) continue; // identical styles shouldn't reach this path
      if (count > OVERRIDE_THRESHOLD) continue;
      if (count < bestCount) {
        bestBase = candId;
        bestOverrides = overrides;
        bestCount = count;
      }
    }
    if (bestBase && bestOverrides) {
      styles[sid] = { base: bestBase, ...bestOverrides };
    } else {
      styles[sid] = normalized;
    }
    return sid;
  }

  // Pre-compute merge anchors keyed by anchor cell id, mapping to the
  // delta-encoded merge value the cell entry will carry. One Apps Script
  // call (range.getMergedRanges) populates the lookup; the per-cell loop
  // below then handles merge as just another field on the cell.
  const mergeAnchors = new Map<string, string>();
  for (const m of range.getMergedRanges()) {
    const dRows = m.getNumRows() - 1;
    const dCols = m.getNumColumns() - 1;
    if (dRows === 0 && dCols === 0) continue;
    mergeAnchors.set(cellId(m.getRow() - 1, m.getColumn() - 1), cellId(dRows, dCols));
  }

  reportProgress(sessionId, 30, "Encoding cells\u2026");
  const encodeProgressEvery = Math.max(1, Math.floor(numRows / 20));
  for (let r = 0; r < numRows; r++) {
    if (r % encodeProgressEvery === 0 || r === numRows - 1) reportProgress(sessionId, 30 + (r / numRows) * 55, `Encoding cells: row ${r + 1} of ${numRows}`);
    for (let c = 0; c < numCols; c++) {
      const id = cellId(r, c);
      const mergeDelta = mergeAnchors.get(id);
      const normalized = normalizedGrid[r][c];
      const sk = JSON.stringify(normalized);
      let sid = styleMap.get(sk);
      if (sid === undefined) {
        sid = registerStyle(normalized);
        styleMap.set(sk, sid);
      }

      let rawVal = values[r][c];
      let cellType: string;
      const formula = formulas[r][c];
      const hasFormula = typeof formula === "string" && formula.length > 0;

      if (hasFormula) {
        cellType = "f";
      } else if (rawVal instanceof Date) {
        cellType = "d";
        rawVal = displayValues[r][c];
      } else if (typeof rawVal === "number") {
        cellType = "n";
      } else if (typeof rawVal === "boolean") {
        cellType = "b";
      } else {
        cellType = "s";
      }

      const hasDv = dataValidations[r][c] !== null;
      if (!hasFormula && isEmpty(rawVal) && !hasDv) {
        // Empty cells with the implicit base style contribute nothing UNLESS
        // they're a merge anchor (a blank merged header still needs an entry
        // so the merge round-trips). Empty cells with a non-base style are
        // emitted as style-only entries so the styling round-trips faithfully.
        if (sid === "s_base" && !mergeDelta) continue;
        const empty: CellExport = {};
        if (sid !== "s_base") empty.s = sid;
        if (mergeDelta) empty.merge = mergeDelta;
        cells[id] = empty;
        if (sid !== "s_base") {
          let hitId: string | undefined = sid;
          const hitSeen = new Set<string>();
          while (hitId && !hitSeen.has(hitId)) {
            hitSeen.add(hitId);
            styleHits[hitId] = (styleHits[hitId] ?? 0) + 1;
            hitId = styles[hitId]?.base;
          }
        }
        continue;
      }

      const vk = valueKey(rawVal);
      const useLabel =
        !isEmpty(rawVal) && !hasFormula && (valueCount.get(vk) ?? 0) >= 2;
      const cellV = rawVal as string | number | boolean | null;

      // Omit `s` when the cell's style is `s_base` — saves bytes on every
      // occurrence of the most common style.
      const cell: CellExport = { t: cellType };
      if (sid !== "s_base") cell.s = sid;
      if (hasFormula) {
        cell.f = formula;
      } else {
        cell.v = cellV;
      }

      if (useLabel) {
        if (labelMap.has(vk)) {
          cell.f = `=${labelMap.get(vk)!.lid}`;
        } else {
          const lid = nextLabelId(rawVal as string | number | boolean, usedLabelIds);
          const cid = cellId(r, c);
          labelMap.set(vk, { lid, cellId: cid });
          cell.l = lid;
        }
      }

      const dvRule = dataValidations[r][c];
      if (dvRule) {
        const dvEntry = extractValidation(dvRule);
        const dvKey = JSON.stringify(dvEntry);
        let dvId = validationMap.get(dvKey);
        if (dvId === undefined) {
          dvId = nextValidationId(dvEntry, validations);
          validationMap.set(dvKey, dvId);
          validations[dvId] = dvEntry;
        }
        cell.dv = dvId;
      }

      if (mergeDelta) cell.merge = mergeDelta;

      // Count this style and every ancestor it chains through, so none of them
      // get pruned below.
      let hitId: string | undefined = sid;
      const hitSeen = new Set<string>();
      while (hitId && !hitSeen.has(hitId)) {
        hitSeen.add(hitId);
        styleHits[hitId] = (styleHits[hitId] ?? 0) + 1;
        hitId = styles[hitId]?.base;
      }

      cells[id] = cell;
    }
  }

  const totalRows = sheet.getMaxRows();
  const totalCols = sheet.getMaxColumns();

  const rowHeights: Record<string, number | string> = {};
  const heightToId: Record<number, string> = {};
  for (let r = 0; r < totalRows; r++) {
    const h = sheet.getRowHeight(r + 1);
    const id = rowId(r);
    if (h in heightToId) {
      rowHeights[id] = heightToId[h];
    } else {
      rowHeights[id] = h;
      heightToId[h] = id;
    }
  }

  const columnWidths: Record<string, number | string> = {};
  const widthToId: Record<number, string> = {};
  for (let c = 0; c < totalCols; c++) {
    const w = sheet.getColumnWidth(c + 1);
    const id = colId(c);
    if (w in widthToId) {
      columnWidths[id] = widthToId[w];
    } else {
      columnWidths[id] = w;
      widthToId[w] = id;
    }
  }

  // Prune styles not referenced by any cell (or as base by a referenced style).
  // `s_base` is always kept — it's the implicit default for cells without `s`.
  reportProgress(sessionId, 90, "Pruning unused styles\u2026");
  for (const sid of Object.keys(styles)) {
    if (sid === "s_base") continue;
    if (!styleHits[sid]) delete styles[sid];
  }

  reportProgress(sessionId, 95, "Serializing JSON\u2026");
  const out: SheetExport = { sheetName: name, rowHeights, columnWidths, styles, validations, cells };
  return JSON.stringify(out, null, 2);
    }

    /** Return the export filename (no file creation). Used to show dialog immediately. */
    public static getExportFilename(
      sheetName?: string,
      spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet,
    ): string {
      const sheet = getSheet(sheetName, spreadsheet);
      const nameWithoutDate = stripLeadingDatePrefix(sheet.getName());
      const tabNameCleaned = cleanNameForFilename(nameWithoutDate);
      const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HHmmss");
      return `${timestamp}_${tabNameCleaned}${ExportFormat.EXTENSION}`;
    }

/**
 * Export active sheet to JSON and save as a file in the same Drive folder as the spreadsheet.
 * Filename: YYYY-MM-DD_HHMMSS_{tabNameCleaned}{ExportFormat.EXTENSION}
 *
 * The `.g2j.json` double-extension marks the file as gsheet2json's specific
 * shape (top-level `cells`, `styles`, etc. — see types.ts SheetExport) so that
 * users browsing Drive can tell at a glance that this is a round-trippable
 * sheet export and not arbitrary JSON. The `.json` outer extension keeps mime
 * detection and editor associations working (any `.json`-aware tool still
 * opens these correctly).
 */
    public static exportSheetToJsonFile(
      sheetName?: string,
      sessionId?: string,
      spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet,
    ): GoogleAppsScript.Drive.File {
      const ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
      const json = Export.exportSheetToJson(sheetName, sessionId, ss);
      const sheet = getSheet(sheetName, ss);
      const nameWithoutDate = stripLeadingDatePrefix(sheet.getName());
      const tabNameCleaned = cleanNameForFilename(nameWithoutDate);
      const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HHmmss");
      const filename = `${timestamp}_${tabNameCleaned}${ExportFormat.EXTENSION}`;
      reportProgress(sessionId, 97, "Writing to Drive\u2026");
      const ssFile = DriveApp.getFileById(ss.getId());
      const parents = ssFile.getParents();
      const folder = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
      const file = folder.createFile(filename, json, "application/json");
      return file;
    }

/** Return file content as string so the client can trigger download with correct filename. */
    public static getFileContent(fileId: string): string {
      return DriveApp.getFileById(fileId).getBlob().getDataAsString();
    }

/** Run export and save to Drive; return file info for dialog. */
    public static runExportAndSave(
      sheetName?: string,
      sessionId?: string,
      spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet,
    ): { fileId: string; filename: string; url: string } {
      try {
        const ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
        const json = Export.exportSheetToJson(sheetName, sessionId, ss);
        const sheet = getSheet(sheetName, ss);
        const nameWithoutDate = stripLeadingDatePrefix(sheet.getName());
        const tabNameCleaned = cleanNameForFilename(nameWithoutDate);
        const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HHmmss");
        const filename = `${timestamp}_${tabNameCleaned}${ExportFormat.EXTENSION}`;
        reportProgress(sessionId, 97, "Writing to Drive…");
        // DriveApp.createFile/getParents all require full 'drive' scope, and
        // UrlFetchApp needs script.external_request (both removed for verification).
        // The Advanced Drive Service (enabled in appsscript.json) calls the Drive
        // API as a first-party service: works with drive.file, no external_request,
        // no full drive scope. files.create with drive.file creates a new file.
        const blob = Utilities.newBlob(json, "application/json", filename);
        const created = Drive!.Files!.create(
          { name: filename, mimeType: "application/json" },
          blob,
          { fields: "id,name,webViewLink" },
        );
        reportProgress(sessionId, 100, "Saved");
        return {
          fileId: created.id ?? "",
          filename: created.name ?? filename,
          url: created.webViewLink ?? `https://drive.google.com/file/d/${created.id}/view`,
        };
      } catch (err) {
        // Without this catch the client only ever saw Apps Script's generic
        // "We're sorry, a server error occurred" wrapper, with no message,
        // stack, or hint about which Drive call actually failed. Log to the
        // Apps Script execution log so we can inspect after the fact, and
        // re-throw with a message that the failure handler can surface in
        // the activity feed (and that the Details button can copy verbatim).
        const e = err as { message?: string; stack?: string; name?: string };
        const message = e && e.message ? e.message : String(err);
        const stack = e && e.stack ? e.stack : "(no stack)";
        Logger.log(`runExportAndSave failed: ${message}\n${stack}`);
        throw new Error(`Save to Drive failed: ${message}\n\nStack:\n${stack}`);
      } finally {
        clearProgress(sessionId);
      }
    }

/** Return Drive file content, URL, and filename by file ID. */
    public static getDriveFileInfo(fileId: string): { content: string; url: string; filename: string } {
      const file = DriveApp.getFileById(fileId);
      return {
        content: file.getBlob().getDataAsString(),
        url: file.getUrl(),
        filename: file.getName(),
      };
    }

/**
 * Build filename + JSON content for the active (or named) sheet — no Drive write.
 * Used by the "Download" export path so the client can stream a blob download
 * without persistence. Accepts an optional sessionId for progress reporting.
 */
    public static getExportJsonString(
      sheetName?: string,
      sessionId?: string,
      spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet,
    ): { filename: string; content: string } {
      try {
        const content = Export.exportSheetToJson(sheetName, sessionId, spreadsheet);
        reportProgress(sessionId, 100, "Ready");
        return {
          filename: Export.getExportFilename(sheetName, spreadsheet),
          content: content,
        };
      } finally {
        clearProgress(sessionId);
      }
    }

/**
 * Open-in-Drive helper for log-entry actions. Given a file id, return the URL
 * of its parent folder in Drive (or the file's own URL if the parent can't be
 * resolved).
 */
    public static getFileFolderUrl(fileId: string): string {
      // Use the Drive Advanced Service (already a manifest dependency) rather
      // than DriveApp here. DriveApp.getFileById + .getParents silently returns
      // an empty iterator for files that live in a shared drive or were shared
      // with the user, then fell through to file.getUrl() (the file viewer
      // URL), so clicking "Show enclosing folder" opened the FILE instead of
      // its FOLDER. Drive.Files.get with supportsAllDrives surfaces parents
      // correctly across all drive types.
      const meta = Drive!.Files!.get(fileId, {
        fields: "parents",
        supportsAllDrives: true,
      });
      const parents = (meta as unknown as { parents?: string[] }).parents;
      if (Array.isArray(parents) && parents.length > 0) {
        return `https://drive.google.com/drive/folders/${parents[0]}`;
      }
      // No parent (file at the root of My Drive, or orphaned). Open My Drive
      // rather than the file viewer so the user lands somewhere they can
      // browse from.
      return "https://drive.google.com/drive/my-drive";
    }

/**
 * List .json files (My Drive, shared drives, shared with me), modified in the last 90 days.
 * Includes enclosing folder id + name so the UI can disambiguate duplicate filenames
 * and offer "ignore file / ignore folder" actions. Honors the user's ignore lists.
 */
    public static getJsonFilesInDrive(): DriveJsonFile[] {
      try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 90);
        const modifiedAfter = `${cutoff.toISOString().slice(0, 19)}Z`;
        // Union, not intersection: a file qualifies if its NAME contains
        // '.json' OR its MIMETYPE is application/json. Name-only catches the
        // common case plus near-misses the user explicitly wants to see
        // ("notes.json.bak", "notes.json.txt", "foo.json5"); mimetype-only
        // catches files that were saved/uploaded as JSON but happen to lack
        // the extension. AND-ing the two (the original behavior) was the
        // single biggest reason the picker was returning a sparse list,
        // because many .json files in Drive carry text/plain or application/
        // octet-stream mimetypes from upload tooling. No post-filter on the
        // name — leniency is the goal here.
        // Explicitly exclude folders (`application/vnd.google-apps.folder`):
        // a folder named "tsv-to-json-rs" matches `name contains '.json'` and
        // has no `size`, so it would render as an extension-less, byte-less
        // row in the picker — visibly broken.
        const list = Drive!.Files!.list({
          q: `(name contains '.json' or mimeType = 'application/json') and mimeType != 'application/vnd.google-apps.folder' and modifiedTime > '${modifiedAfter}' and trashed = false`,
          fields: "files(id, name, webViewLink, modifiedTime, parents, size)",
          pageSize: 200,
          corpora: "allDrives",
          includeItemsFromAllDrives: true,
          supportsAllDrives: true,
          orderBy: "modifiedTime desc",
        });
        if (!list || !list.files) return [];

        const primary = list.files
          .filter((f): f is typeof f & { id: string; name: string } => Boolean(f.id && f.name))
          .map((f) => ({
            id: f.id,
            name: f.name,
            webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
            folderId: Array.isArray(f.parents) && f.parents.length > 0 ? f.parents[0] : "",
            // Drive returns size as a string of bytes; coerce to number, default 0
            // when omitted (Drive omits size for native Google Docs/Sheets/etc.,
            // which our query already excludes — but be defensive).
            sizeBytes: f.size ? parseInt(f.size as unknown as string, 10) || 0 : 0,
          }));

        // Resolve unique parent ids to folder names (one API call each, cached in-request).
        const folderIds = new Set<string>();
        for (const f of primary) {
          if (f.folderId) folderIds.add(f.folderId);
        }
        const folderNames = new Map<string, string>();
        folderIds.forEach((fid) => {
          try {
            const meta = Drive!.Files!.get(fid, { fields: "id, name", supportsAllDrives: true });
            folderNames.set(fid, meta && meta.name ? meta.name : "");
          } catch (_) {
            folderNames.set(fid, "");
          }
        });

        // Return the full list (including entries the user has hidden) and let
        // the client tag/filter ignored files locally. That way Hide/Unhide are
        // instant local re-renders instead of a fresh Drive rescan per toggle.
        return primary.map((f) => ({
          id: f.id,
          name: f.name,
          webViewLink: f.webViewLink,
          folderId: f.folderId,
          folderName: folderNames.get(f.folderId) || "",
          sizeBytes: f.sizeBytes,
        }));
      } catch (err) {
        console.error("getJsonFilesInDrive failed:", err);
        return [];
      }
    }

    /** Full load for the picker: the change token (captured first, so a change
     * mid-scan is caught next time) plus the file list. */
    public static loadJson(): { token: string; files: DriveJsonFile[] } {
      const token = Export.getDriveStartPageToken();
      const files = Export.getJsonFilesInDrive();
      return { token, files };
    }

    public static getDriveStartPageToken(): string {
      try {
        const res = Drive!.Changes!.getStartPageToken({ supportsAllDrives: true });
        return res && res.startPageToken ? res.startPageToken : "";
      } catch (err) {
        console.error("getDriveStartPageToken failed:", err);
        return "";
      }
    }

    /** Cheap delta check: were there ANY Drive changes since `token`? We don't
     * inspect individual changes, the presence of any change busts the cache.
     * On a change we return token:"" and let the caller's full reload mint a
     * fresh token. Only when there are zero changes do we paginate to capture the
     * advanced token. Missing token or any error reports changed=true. */
    public static getDriveChanges(token: string): { changed: boolean; token: string } {
      if (!token) return { changed: true, token: "" };
      try {
        let pageToken: string | undefined = token;
        let newStartPageToken = token;
        let guard = 0;
        while (pageToken && guard < 50) {
          guard++;
          const res: { changes?: unknown[]; newStartPageToken?: string; nextPageToken?: string } =
            Drive!.Changes!.list(pageToken, {
              pageSize: 100,
              includeRemoved: true,
              includeItemsFromAllDrives: true,
              supportsAllDrives: true,
              fields: "newStartPageToken,nextPageToken,changes(fileId)",
            });
          if (res.changes && res.changes.length > 0) {
            return { changed: true, token: "" };
          }
          if (res.nextPageToken) {
            pageToken = res.nextPageToken;
          } else {
            if (res.newStartPageToken) newStartPageToken = res.newStartPageToken;
            pageToken = undefined;
          }
        }
        return { changed: false, token: newStartPageToken };
      } catch (err) {
        console.error("getDriveChanges failed:", err);
        return { changed: true, token: "" };
      }
    }
  }
}

function exportSheetToJson(
  sheetName?: string,
  sessionId?: string,
  spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet,
): string {
  return gsheet2json.Export.exportSheetToJson(sheetName, sessionId, spreadsheet);
}
function getExportFilename(
  sheetName?: string,
  spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet,
): string {
  return gsheet2json.Export.getExportFilename(sheetName, spreadsheet);
}
function exportSheetToJsonFile(
  sheetName?: string,
  sessionId?: string,
  spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet,
): GoogleAppsScript.Drive.File {
  return gsheet2json.Export.exportSheetToJsonFile(sheetName, sessionId, spreadsheet);
}
function getFileContent(fileId: string): string {
  return gsheet2json.Export.getFileContent(fileId);
}
function runExportAndSave(
  sheetName?: string,
  sessionId?: string,
  spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet,
): { fileId: string; filename: string; url: string } {
  return gsheet2json.Export.runExportAndSave(sheetName, sessionId, spreadsheet);
}
function getDriveFileInfo(fileId: string): { content: string; url: string; filename: string } {
  return gsheet2json.Export.getDriveFileInfo(fileId);
}
function getExportJsonString(
  sheetName?: string,
  sessionId?: string,
  spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet,
): { filename: string; content: string } {
  return gsheet2json.Export.getExportJsonString(sheetName, sessionId, spreadsheet);
}
function getFileFolderUrl(fileId: string): string {
  return gsheet2json.Export.getFileFolderUrl(fileId);
}
function getJsonFilesInDrive(): DriveJsonFile[] {
  return gsheet2json.Export.getJsonFilesInDrive();
}
function loadDriveJson(): { token: string; files: DriveJsonFile[] } {
  return gsheet2json.Export.loadJson();
}
function getDriveChanges(token: string): { changed: boolean; token: string } {
  return gsheet2json.Export.getDriveChanges(token);
}
