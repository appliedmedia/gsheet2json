// src/main.ts Copyright (c) 2005...2026-06-14.001:a@cov.in + Applied Media. All Rights Reserved. Do Not Distribute.
//
// Apps Script project:  1gjETvEjQ7-IK3NM3C0lNMhRRio3aDcAz8BwJuSjx8oKfKrT80IvZ4rSv
// Marketplace deploy:   AKfycbyVkxEjiFyV4kzMd8cZADsjmHUlAN-DgSRb2errioqNHi3k3r4abUSbrr_JD_6wQIyh
// @gas test deploy:     AKfycbyayRrWOTCu67kjC-_081if7PxWEJLqrgr2Nvcp9LI-iByLm2amoKwaNIQq-ofEDAu1

/**
 * Entry points, menu, sidebar, and command router for gsheet2json add-on.
 * Depends on: export.ts, import.ts, settings.ts, licensing.ts (global scope).
 * No import/export: Apps Script global scope.
 */

const VERSION = "1.2.37"; // latest known version; build substitutes the exact package.json version into the bundle

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------
namespace gsheet2json {
  export class App {
    public static onOpenMenu(): void {
      const ui = SpreadsheetApp.getUi();
      ui.createAddonMenu()
        .addItem("Open", "showUI")
        .addToUi();
    }

    // Menu shortcut endpoints — each sets a pending action, then opens the sidebar.
    // The sidebar reads (and clears) the pending action on init and performs it.
    public static menuImportLocal(): void {
      App.setPendingAction("import_local");
      App.showUI();
    }
    public static menuImportGDrive(): void {
      App.setPendingAction("import_gdrive");
      App.showUI();
    }
    public static menuExportLocal(): void {
      App.setPendingAction("export_local");
      App.showUI();
    }
    public static menuExportGDrive(): void {
      App.setPendingAction("export_gdrive");
      App.showUI();
    }

    public static setPendingAction(action: string): void {
      try {
        PropertiesService.getUserProperties().setProperty("gsheet2json_pendingAction", action);
      } catch (_) {
        // UserProperties may not be accessible in some contexts
      }
    }

    /** Returns and clears the pending-action flag set by the menu shortcuts. */
    public static getPendingAction(): string {
      try {
        const props = PropertiesService.getUserProperties();
        const action = props.getProperty("gsheet2json_pendingAction") || "";
        if (action) props.deleteProperty("gsheet2json_pendingAction");
        return action;
      } catch (_) {
        return "";
      }
    }

    public static onOpenTrigger(): void {
      App.onOpenMenu();
    }

    public static onInstallTrigger(): void {
      App.onOpenMenu();
      setFirstInstallDate();
    }

    public static showUI(): void {
      const html = HtmlService.createTemplateFromFile("index")
        .evaluate()
        .setTitle("gsheet2json");
      SpreadsheetApp.getUi().showSidebar(html);
    }
  }
}

function gsheet2json_onOpen(): void { gsheet2json.App.onOpenMenu(); }
function menuImportLocal(): void { gsheet2json.App.menuImportLocal(); }
function menuImportGDrive(): void { gsheet2json.App.menuImportGDrive(); }
function menuExportLocal(): void { gsheet2json.App.menuExportLocal(); }
function menuExportGDrive(): void { gsheet2json.App.menuExportGDrive(); }
function setPendingAction(action: string): void { gsheet2json.App.setPendingAction(action); }
function getPendingAction(): string { return gsheet2json.App.getPendingAction(); }
/** Called by Google Sheets when the spreadsheet is opened. */
function onOpen(): void { gsheet2json.App.onOpenTrigger(); }
/** Called by Apps Script when the add-on is first installed. */
function onInstall(): void { gsheet2json.App.onInstallTrigger(); }
function showUI(): void { gsheet2json.App.showUI(); }
// Backward-compatible alias.
function openSidebar(): void { gsheet2json.App.showUI(); }

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

/**
 * Map raw error messages to user-friendly text. Returns the friendly message
 * or null if no mapping matches (caller should fall back to original message).
 */
function friendlyErrorMessage(err: Error): string {
  const msg = err.message || "";

  // Empty sheet / no data
  if (/no data|getDataRange.*empty|getValues.*empty/i.test(msg)) {
    return "This sheet has no data to export.";
  }

  // Malformed JSON: must look like an actual JSON.parse failure, not just any
  // error that happens to mention "JSON". The earlier `/JSON|parse|.../i` was
  // catching our own wrapper messages ("Save to Drive failed: ...") and the
  // .json-extension references in unrelated server errors, then re-mapping
  // them to the misleading "could not be parsed" text. Require the error to
  // explicitly reference a JSON parse step.
  const jsonMatch = msg.match(/JSON.*?(?:position|line)\s*(\d+)/i)
    || msg.match(/Unexpected token.*?(?:position|at)\s*(\d+)/i);
  const isJsonParseError =
    (/SyntaxError/.test(msg) && /JSON/i.test(msg)) ||
    /Unexpected (?:token|end of) JSON/i.test(msg) ||
    /JSON\.parse/.test(msg) ||
    /Unexpected end of JSON input/i.test(msg);
  if (isJsonParseError) {
    const hint = jsonMatch ? ` Check near position ${jsonMatch[1]}.` : "";
    return `The JSON could not be parsed. Check for syntax errors.${hint}`;
  }

  // Sheet name conflict
  if (/already exists|duplicate.*sheet/i.test(msg)) {
    const nameMatch = msg.match(/["'](.+?)["']/);
    const name = nameMatch ? nameMatch[1] : "(unknown)";
    return `A sheet named "${name}" already exists.`;
  }

  // Drive quota
  if (/quota|storage.*full|drive.*limit/i.test(msg)) {
    return "Google Drive storage is full. Free up space and try again.";
  }

  // Network / timeout
  if (/timeout|timed?\s*out|network|ETIMEDOUT|ECONNREFUSED|502|503|504/i.test(msg)) {
    return "Request timed out. Please try again.";
  }

  // Permission / access
  if (/permission|access.*denied|forbidden|not authorized/i.test(msg)) {
    return "You don't have permission to access this resource.";
  }

  // File not found
  if (/file.*not found|no such file|404/i.test(msg)) {
    return "The file could not be found. It may have been moved or deleted.";
  }

  return msg;
}

/**
 * Build a detail string for error copying: message, stack, sheet info, version.
 */
function buildErrorDetails(err: Error): string {
  const parts: string[] = [];
  parts.push(`Error: ${err.message || String(err)}`);
  if (err.stack) {
    parts.push(`Stack: ${err.stack}`);
  }
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (sheet) {
      parts.push(`Sheet: ${sheet.getName()} (${sheet.getMaxRows()} rows x ${sheet.getMaxColumns()} cols)`);
    }
  } catch (_) {
    // Sheet info not available
  }
  parts.push(`Version: ${VERSION}`);
  parts.push(`Timestamp: ${new Date().toISOString()}`);
  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Command router
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function gsheet2json_handleCommand(cmd: string, arg?: any): any {
  const fns: Record<string, Function> = {
    onOpen: gsheet2json_onOpen,
    getDriveFileInfo,
    getFileFolderUrl: (payload: { fileId: string }) => getFileFolderUrl(payload.fileId),
    runExportAndSave: (payload?: { sheetName?: string; sessionId?: string }) =>
      runExportAndSave(payload?.sheetName, payload?.sessionId),
    getExportJsonString: (payload?: { sheetName?: string; sessionId?: string }) =>
      getExportJsonString(payload?.sheetName, payload?.sessionId),
    getJsonFilesInDrive,
    loadDriveJson,
    driveJsonChanges: (payload: { token: string }) => getDriveJsonChanges(payload.token),
    runImportJsonToSheet: (payload: { json: string; sessionId?: string }) =>
      runImportJsonToSheet(payload.json, payload.sessionId),
    runImportJsonToSheetFromDrive: (payload: { fileId: string; sessionId?: string }) =>
      runImportJsonToSheetFromDrive(payload.fileId, payload.sessionId),
    getProgress,
    getFileContent,
    getSettings,
    setSetting: (payload: { key: string; value: unknown }) => {
      setSetting(payload.key as keyof UserSettings, payload.value as UserSettings[keyof UserSettings]);
    },
    ignoreDriveFileId: (payload: { id: string; name: string }) =>
      ignoreDriveFileId({ id: payload.id, name: payload.name }),
    ignoreDriveFileName: (payload: { name: string }) => ignoreDriveFileName(payload.name),
    ignoreDriveFolderId: (payload: { id: string; name: string }) =>
      ignoreDriveFolderId({ id: payload.id, name: payload.name }),
    ignoreDriveFolderName: (payload: { name: string }) => ignoreDriveFolderName(payload.name),
    unignoreDriveEntry: (payload: { kind: "fileName" | "fileId" | "folderName" | "folderId"; value: string }) =>
      unignoreDriveEntry(payload.kind, payload.value),
    appendActivityEntry: (payload: Omit<ActivityEntry, "id" | "at"> & { id?: string; at?: string }) => appendActivityEntry(payload),
    getActivityFeed,
    clearActivityFeed,
    forgetActivityEntry: (payload: { id: string }) => forgetActivityEntry(payload.id),
    getPendingAction,
    getLicenseState,
    clearLicenseCache,
    isFirstRun,
    dismissOnboarding,
    getUpgradeUrl,
    getVersion: () => VERSION,
    getErrorDetails: (payload: { message: string; stack?: string }) => {
      const err = new Error(payload.message);
      if (payload.stack) err.stack = payload.stack;
      return buildErrorDetails(err);
    },
  };
  if (!(cmd in fns)) throw new Error(`gsheet2json: unknown command "${cmd}"`);

  try {
    return arg !== undefined ? fns[cmd](arg) : fns[cmd]();
  } catch (e) {
    // Keep the user-facing message clean (friendly text only) and stash the
    // command + raw original on the stack so buildErrorDetails surfaces them
    // in the copy-error-details payload without leaking into the toast.
    const err = e instanceof Error ? e : new Error(String(e));
    const original = err.message;
    const friendly = friendlyErrorMessage(err) || original;
    const out = new Error(friendly);
    out.stack = [
      err.stack,
      `cmd=${cmd}`,
      friendly !== original ? `raw=${original}` : "",
    ].filter(Boolean).join("\n");
    throw out;
  }
}

// ---------------------------------------------------------------------------
// HTML template include helper
// ---------------------------------------------------------------------------

/** Standard Apps Script pattern for HTML includes via <?!= include('filename') ?> */
function include(filename: string): string {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
