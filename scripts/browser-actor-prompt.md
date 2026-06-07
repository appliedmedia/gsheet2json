<!-- scripts/browser-actor-prompt.md Copyright (c) 2026:appliedmedia. Licensed under Code Transparency v1 (see LICENSE). -->

# gsheet2json Promo Video: Browser Actor Prompt

Paste this entire file into a Claude Code session that has the Claude-in-Chrome extension active. Claude executes each step via browser automation. The operator runs `./scripts/record-screen.sh start` before pasting and `./scripts/record-screen.sh stop` after Claude prints "SHOT LIST COMPLETE".

## Prereqs checklist (verify before pasting)

* gsheet2json add-on installed in the active Chrome session (production listing or sideloaded dev deployment).
* Fixture spreadsheet open in a Chrome tab. Use `assets/Test File Sample FInancial Data.xlsx` imported to Google Sheets, or any sheet with 10+ rows of data.
* Chrome window maximized or set to 1920×1080 via the resize step below.
* `.env.local` has `YOUTUBE_REFRESH_TOKEN` set (for the upload step after recording).
* `scripts/record-screen.sh start` already running (recording in progress).

---

## Step 0 — Setup (Claude executes)

Use `mcp__claude-in-chrome__tabs_context_mcp` to get current tabs. Identify the fixture spreadsheet tab by URL (docs.google.com/spreadsheets). If not found, instruct the user to open the fixture sheet and re-paste this prompt.

Use `mcp__claude-in-chrome__resize_window` to set the Chrome window to 1920×1080.

Pause 2 seconds after resize.

---

## Step 1 — Sheet visible (t=0:06–0:18)

Navigate to the fixture spreadsheet tab. Confirm the sheet is visible with data in cells.

Pause 3 seconds so the camera sees the sheet.

**Shot boundary note:** 6 seconds elapsed. Title card overlay covers t=0–6 in post; no action needed here for the title card.

---

## Step 2 — Open sidebar (t=0:06–0:18)

Click the Extensions menu in the Google Sheets menu bar.

Wait for the Extensions dropdown to open (up to 3 seconds).

Click "gsheet2json" in the dropdown.

Wait for the gsheet2json submenu to appear.

Click "Open" in the submenu.

Wait up to 5 seconds for the gsheet2json sidebar to open on the right side of the sheet.

Pause 2 seconds so the camera sees the open sidebar.

**Shot boundary note:** ~18 seconds elapsed.

---

## Step 3 — Export (t=0:18–0:32)

In the gsheet2json sidebar, click the Export button.

Wait up to 3 seconds for the export name dialog or Drive save dialog to appear.

If a filename input appears: type a filename (e.g. `promo-export`), then confirm/save.

Wait up to 5 seconds for the export confirmation (activity log entry or success toast).

Pause 3 seconds so the camera sees the Drive save confirmation.

**Shot boundary note:** ~32 seconds elapsed.

---

## Step 4 — JSON preview cut (t=0:32–0:42)

Open a new tab and navigate to Google Drive (drive.google.com).

Wait up to 4 seconds for Drive to load.

Locate the most recently modified JSON file (the export from Step 3).

Click on it to open the preview or viewer.

Wait up to 3 seconds for the file content to appear.

Scroll slowly through the JSON content (2–3 scroll steps, 1 second apart).

Pause 2 seconds at the end of the scroll.

**Shot boundary note:** ~42 seconds elapsed.

---

## Step 5 — Import (t=0:42–0:58)

Navigate back to the fixture spreadsheet tab.

In the gsheet2json sidebar, click the Import button.

Wait up to 3 seconds for the Import panel to open.

Click "Paste JSON" or equivalent input area.

Paste a short valid JSON snippet (use this literal text — it represents a minimal round-trip payload):

```json
[{"row":1,"values":["Name","Score","Active"]},{"row":2,"values":["Alice","92","true"]},{"row":3,"values":["Bob","87","false"]}]
```

Click the Import / Apply button.

Wait up to 6 seconds for the rows to land in the sheet (Drive + Sheets API call).

Pause 3 seconds so the camera sees the populated cells.

**Shot boundary note:** ~58 seconds elapsed.

---

## Step 6 — Activity log (t=0:58–1:08)

In the gsheet2json sidebar, click the Activity Log tab or scroll to the activity log section (bottom of sidebar).

Wait up to 2 seconds for the log entries to be visible.

Pause 4 seconds so the camera sees the populated activity log showing both the export and import entries.

**Shot boundary note:** ~68 seconds elapsed. End card overlay begins at t=68 in post; no action needed here.

---

## Step 7 — End card hold (t=1:08–1:18)

Close or minimize the sidebar (click X on the sidebar or use the Extensions menu to close).

Navigate to a new blank tab or back to the fixture sheet showing clean data.

Pause 8 seconds — this gives the end card overlay (applied in post at t=68) room to show.

---

## Done

Print: `SHOT LIST COMPLETE — the operator: run ./scripts/record-screen.sh stop now`

Wait for the operator to confirm recording stopped, then run:

```bash
./scripts/edit-promo.sh
npx tsx scripts/upload-youtube.ts tmp/promo-final.mp4
```

Print the resulting YouTube URL.

---

## Pacing notes

* Every network-bound action (Drive save, import, Drive load) waits for the operation to complete, up to the per-step timeout noted above, before proceeding.
* Every shot boundary pause is 2–3 seconds of "hold" to give the camera clean cut points.
* If any step fails (sidebar does not open, export does not complete, import rows do not land): stop, print the failure, and do NOT continue. Do not attempt recovery — the recording will need a retake from Step 0.
* Total target runtime: 78 seconds. Actual may vary 5–10 seconds due to network latency.

<!-- end scripts/browser-actor-prompt.md -->
