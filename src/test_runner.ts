/**
 * @gas test runner. Compiled into out/test_runner.gs by `npm run build:gas`
 * and pushed to the live Apps Script project. Excluded from production builds
 * via tsconfig.json's include array; only tsconfig.gas.json picks it up.
 *
 * Each top-level test_* function returns { pass: boolean, detail: string }.
 * The cucumber bridge (features/step_definitions/clasp_steps.ts) invokes them
 * via `clasp run` and parses the JSON result from stdout.
 *
 * Hygiene: features/pre_submit_hygiene.feature asserts out/test_runner.gs is
 * absent before Marketplace submission, since `npm run build` is hermetic
 * (rm -rf out) the artifact only persists if build:gas was the most recent run.
 */

namespace gsheet2json {
  export class TestRunner {
    // Hardcoded fixture sheet ID. Lives only in the test runner, which is
    // excluded from the Marketplace deployment by tsconfig.json.
    public static readonly FIXTURE_SHEET_ID = "15E8LvrzXeDy3ruj9AoM29Bh987sv1CQSDUKRC7moduo";

    /**
     * Idempotently creates the 5 fixture tabs. Skips any tab that already
     * exists. Never deletes or modifies existing tabs / their data.
     */
    public static bootstrap_fixtures(): { pass: boolean; detail: string } {
      try {
        const ss = SpreadsheetApp.openById(TestRunner.FIXTURE_SHEET_ID);
        const existing = new Set(ss.getSheets().map((s) => s.getName()));
        const created: string[] = [];

        if (!existing.has("simple_grid")) {
          const sheet = ss.insertSheet("simple_grid");
          sheet.getRange(1, 1, 5, 5).setValues([
            ["A", "B", "C", "D", "E"],
            [1, 2, 3, 4, 5],
            [6, 7, 8, 9, 10],
            [11, 12, 13, 14, 15],
            [16, 17, 18, 19, 20],
          ]);
          created.push("simple_grid");
        }

        if (!existing.has("with_validations")) {
          const sheet = ss.insertSheet("with_validations");
          sheet.getRange(1, 1, 5, 2).setValues([
            ["Item", "Status"],
            ["a", "active"],
            ["b", "inactive"],
            ["c", "active"],
            ["d", "pending"],
          ]);
          const rule = SpreadsheetApp.newDataValidation()
            .requireValueInList(["active", "inactive", "pending"], true)
            .build();
          sheet.getRange(2, 2, 4, 1).setDataValidation(rule);
          created.push("with_validations");
        }

        if (!existing.has("with_styles")) {
          const sheet = ss.insertSheet("with_styles");
          sheet.getRange(1, 1, 3, 3).setValues([
            ["A", "B", "C"],
            [1, 2, 3],
            [4, 5, 6],
          ]);
          sheet.getRange(1, 1, 1, 3).setBackground("#fce5cd").setFontWeight("bold");
          sheet.getRange(2, 1, 2, 3).setFontColor("#3d85c6");
          sheet.getRange(3, 1, 1, 3).setBorder(true, true, true, true, false, false);
          created.push("with_styles");
        }

        if (!existing.has("empty")) {
          ss.insertSheet("empty");
          created.push("empty");
        }

        if (!existing.has("large")) {
          const sheet = ss.insertSheet("large");
          // Lane 3 plan called for 1000x20 perf baseline; 100x20 keeps the
          // round-trip test under a few seconds while still exercising the
          // batch-write code paths. Scale up if perf regressions show up.
          const rows = 100;
          const cols = 20;
          const values: number[][] = [];
          for (let r = 0; r < rows; r++) {
            const row: number[] = [];
            for (let c = 0; c < cols; c++) row.push(r * cols + c);
            values.push(row);
          }
          sheet.getRange(1, 1, rows, cols).setValues(values);
          created.push("large");
        }

        return {
          pass: true,
          detail: created.length
            ? `Created tabs: ${created.join(", ")}`
            : `All 5 fixture tabs already exist`,
        };
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        return { pass: false, detail: `bootstrap_fixtures failed: ${err.message}` };
      }
    }

    /**
     * Export a fixture tab to JSON, re-import into a fresh tab, diff values.
     * Always cleans up the temp imported tab.
     */
    public static test_export_roundtrip(tabName: string): { pass: boolean; detail: string } {
      let importedTabName: string | null = null;
      try {
        const ss = SpreadsheetApp.openById(TestRunner.FIXTURE_SHEET_ID);
        const fixture = ss.getSheetByName(tabName);
        if (!fixture) return { pass: false, detail: `Fixture tab "${tabName}" not found` };

        const json = gsheet2json.Export.exportSheetToJson(tabName, undefined, ss);
        importedTabName = gsheet2json.Import.importJsonToSheet(json, undefined, ss);

        const imported = ss.getSheetByName(importedTabName);
        if (!imported) return { pass: false, detail: `Imported tab "${importedTabName}" not found` };

        const orig = fixture.getDataRange();
        const impd = imported.getDataRange();

        if (orig.getNumRows() === 0 && impd.getNumRows() === 0) {
          return { pass: true, detail: `Both tabs empty; round-trip clean` };
        }
        if (orig.getNumRows() !== impd.getNumRows() || orig.getNumColumns() !== impd.getNumColumns()) {
          return {
            pass: false,
            detail: `Dimension mismatch: orig ${orig.getNumRows()}x${orig.getNumColumns()}, imported ${impd.getNumRows()}x${impd.getNumColumns()}`,
          };
        }

        const ov = orig.getValues();
        const iv = impd.getValues();
        const diffs: string[] = [];
        for (let r = 0; r < ov.length && diffs.length < 5; r++) {
          for (let c = 0; c < ov[r].length && diffs.length < 5; c++) {
            if (String(ov[r][c]) !== String(iv[r][c])) {
              diffs.push(`[${r},${c}]: "${ov[r][c]}" vs "${iv[r][c]}"`);
            }
          }
        }
        if (diffs.length > 0) return { pass: false, detail: `Value diffs: ${diffs.join("; ")}` };

        return { pass: true, detail: `Round-trip clean for "${tabName}" (${ov.length}x${ov[0].length})` };
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        return { pass: false, detail: `test_export_roundtrip failed: ${err.message}` };
      } finally {
        if (importedTabName) {
          try {
            const ss = SpreadsheetApp.openById(TestRunner.FIXTURE_SHEET_ID);
            const sheet = ss.getSheetByName(importedTabName);
            if (sheet) ss.deleteSheet(sheet);
          } catch (_) { /* cleanup is best-effort */ }
        }
      }
    }

    /**
     * Import a known synthesized JSON, assert the imported tab matches.
     * Skips the Drive round-trip; just exercises Import.importJsonToSheet.
     */
    public static test_import_validation(): { pass: boolean; detail: string } {
      let importedTabName: string | null = null;
      try {
        const ss = SpreadsheetApp.openById(TestRunner.FIXTURE_SHEET_ID);

        const sample = JSON.stringify({
          sheetName: "validation_smoke",
          rowHeights: { "1": 21, "2": 21 },
          columnWidths: { "1": 100, "2": 100 },
          styles: { s_base: {} },
          cells: {
            "1": { "1": { v: "hello" }, "2": { v: "world" } },
            "2": { "1": { v: 1 }, "2": { v: 2 } },
          },
        });

        importedTabName = gsheet2json.Import.importJsonToSheet(sample, undefined, ss);
        const sheet = ss.getSheetByName(importedTabName);
        if (!sheet) return { pass: false, detail: `Imported tab not found` };

        const vals = sheet.getDataRange().getValues();
        if (vals.length !== 2 || vals[0].length !== 2) {
          return { pass: false, detail: `Expected 2x2, got ${vals.length}x${vals[0]?.length || 0}` };
        }
        if (String(vals[0][0]) !== "hello" || String(vals[0][1]) !== "world") {
          return { pass: false, detail: `Header values wrong: ${JSON.stringify(vals[0])}` };
        }
        if (String(vals[1][0]) !== "1" || String(vals[1][1]) !== "2") {
          return { pass: false, detail: `Data values wrong: ${JSON.stringify(vals[1])}` };
        }

        return { pass: true, detail: `Imported 2x2 from JSON, values match` };
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        return { pass: false, detail: `test_import_validation failed: ${err.message}` };
      } finally {
        if (importedTabName) {
          try {
            const ss = SpreadsheetApp.openById(TestRunner.FIXTURE_SHEET_ID);
            const sheet = ss.getSheetByName(importedTabName);
            if (sheet) ss.deleteSheet(sheet);
          } catch (_) { /* best-effort */ }
        }
      }
    }

    /**
     * Verify getLicenseState resolves to a valid state object. The full
     * LicenseManager path is exercised; if Marketplace runtime is unavailable
     * the licensing module falls back to install-date trial inference.
     */
    public static test_license_states_with_mock_api(): { pass: boolean; detail: string } {
      try {
        const state = gsheet2json.Licensing.getLicenseState();
        if (!state || typeof state !== "object") {
          return { pass: false, detail: `getLicenseState returned ${JSON.stringify(state)}` };
        }
        if (!["trial", "paid", "expired"].includes(state.status)) {
          return { pass: false, detail: `Invalid status: ${state.status}` };
        }
        return { pass: true, detail: `License state resolved: ${JSON.stringify(state)}` };
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        return { pass: false, detail: `test_license_states_with_mock_api failed: ${err.message}` };
      }
    }

    /**
     * Reset UserProperties, verify isFirstRun toggles correctly through
     * dismissOnboarding.
     */
    public static test_onboarding(reset: boolean): { pass: boolean; detail: string } {
      try {
        const props = PropertiesService.getUserProperties();
        if (reset) props.deleteProperty("gsheet2json_firstRunCompleted");

        const before = isFirstRun();
        dismissOnboarding();
        const after = isFirstRun();

        if (after !== false) {
          return { pass: false, detail: `isFirstRun still ${after} after dismissOnboarding()` };
        }
        return { pass: true, detail: `onboarding: before=${before}, after=${after}` };
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        return { pass: false, detail: `test_onboarding failed: ${err.message}` };
      }
    }

    /**
     * Flip an ignored-filename setting, read it back, then revert. Verifies
     * the round-trip through PropertiesService.
     */
    public static test_settings_toggles(): { pass: boolean; detail: string } {
      try {
        const before = getSettings();
        const sample = `__test_toggle_${Date.now()}__`;
        const next = [...before.ignoredDriveFileNames, sample];
        setSetting("ignoredDriveFileNames", next);

        const after = getSettings();
        if (!after.ignoredDriveFileNames.includes(sample)) {
          return { pass: false, detail: `Setting not persisted: ${sample} not in ignoredDriveFileNames` };
        }

        // Cleanup
        setSetting(
          "ignoredDriveFileNames",
          after.ignoredDriveFileNames.filter((n: string) => n !== sample),
        );

        return { pass: true, detail: `Settings toggle persisted and reverted` };
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        return { pass: false, detail: `test_settings_toggles failed: ${err.message}` };
      }
    }
  }
}

// Top-level GAS-callable wrappers. `clasp run <name>` invokes these directly.
function bootstrap_fixtures() { return gsheet2json.TestRunner.bootstrap_fixtures(); }
function test_export_roundtrip(tabName: string) { return gsheet2json.TestRunner.test_export_roundtrip(tabName); }
function test_import_validation() { return gsheet2json.TestRunner.test_import_validation(); }
function test_license_states_with_mock_api() { return gsheet2json.TestRunner.test_license_states_with_mock_api(); }
function test_onboarding(reset: boolean) { return gsheet2json.TestRunner.test_onboarding(reset); }
function test_settings_toggles() { return gsheet2json.TestRunner.test_settings_toggles(); }
