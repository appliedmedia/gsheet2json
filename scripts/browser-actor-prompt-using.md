<!-- scripts/browser-actor-prompt.md Copyright (c) 2026:appliedmedia. Licensed under Code Transparency v1 (see LICENSE). -->

# gsheet2json Promo Video: Browser Actor Prompt

Paste this entire file into a Claude Code session that has the Claude-in-Chrome extension active. Claude executes each step via browser automation. The operator runs `./scripts/record-screen.sh start` before pasting and `./scripts/record-screen.sh stop` after Claude prints "SHOT LIST COMPLETE".

## Prereqs checklist (verify before pasting)

* gsheet2json add-on installed in the active Chrome session (production listing or sideloaded dev deployment).
* Fixture spreadsheet open in a Chrome tab. URL: https://docs.google.com/spreadsheets/d/15E8LvrzXeDy3ruj9AoM29Bh987sv1CQSDUKRC7moduo (see `scripts/fixture-sheet.md`)
* Chrome window maximized or set to 1352×896 via the resize step below.
* `.env.local` has `YOUTUBE_REFRESH_TOKEN` set (for the upload step after recording).
* `scripts/record-screen.sh start` already running (recording in progress).
* **gsheet2json authorization has been revoked** so the OAuth consent screen fires on first Open. Revoke at [myaccount.google.com/permissions](https://myaccount.google.com/permissions) → find gsheet2json → Remove Access. Do this immediately before starting the recording.

---

## Step 0 — Setup (Claude executes)

Use `mcp__claude-in-chrome__tabs_context_mcp` to get current tabs. Identify the fixture spreadsheet tab by URL (docs.google.com/spreadsheets). If not found, instruct the user to open the fixture sheet and re-paste this prompt.

Use `mcp__claude-in-chrome__resize_window` to set the Chrome window to 1352×896.

Pause 2 seconds after resize.

---

## Step 0.5 — Authorization flow (t=0:06–0:22)

Click the Extensions menu in the Google Sheets menu bar.

Wait for the Extensions dropdown to open (up to 3 seconds).

Click "gsheet2json" in the dropdown.

Wait for the gsheet2json submenu to appear.

Click "Open" in the submenu.

Because authorization was revoked in prereqs, Google's OAuth consent screen will appear. Wait up to 5 seconds for it.

Pause 3 seconds on the consent screen — the camera must see "gsheet2json wants to access your Google Account" clearly.

Click "Allow."

Wait up to 8 seconds for the sidebar to open (post-auth redirect takes longer than normal open).

Pause 2 seconds so the camera sees the fully authorized, open sidebar.

**Shot boundary note:** ~22 seconds elapsed. The OAuth consent screen and the Allow click are now on tape.

---

## Step 1 — Sheet visible with open sidebar (t=0:22–0:28)

Navigate to the fixture spreadsheet tab (sidebar remains open from Step 0.5). Confirm the sheet is visible with data in cells and the sidebar is docked on the right.

Pause 4 seconds so the camera sees the sheet and sidebar together.

**Shot boundary note:** ~28 seconds elapsed. Title card overlay covers t=0–6 in post.

---

## Step 2 — Export (t=0:28–0:44)

In the gsheet2json sidebar, click the Export button.

Wait up to 3 seconds for the export name dialog or Drive save dialog to appear.

If a filename input appears: type a filename (e.g. `promo-export`), then confirm/save.

Wait up to 8 seconds for the export confirmation (activity log entry or success toast). Do NOT proceed until the confirmation is visible — not a spinner.

Pause 3 seconds so the camera sees the Drive save confirmation clearly.

**Shot boundary note:** ~44 seconds elapsed.

---

## Step 3 — JSON preview cut (t=0:44–0:54)

Open a new tab and navigate to Google Drive (drive.google.com).

Wait up to 4 seconds for Drive to load.

Locate the most recently modified JSON file (the export from Step 2).

Click on it to open the preview or viewer.

Wait up to 3 seconds for the file content to appear.

Press `Cmd++` twice to zoom in so the JSON structure is readable on screen.

Scroll slowly through the JSON content (2–3 scroll steps, 1 second apart).

Pause 2 seconds at the end of the scroll.

**Shot boundary note:** ~54 seconds elapsed.

---

## Step 4 — Import (t=0:54–1:10)

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

Scroll the sheet to row 1 so the imported rows are prominently visible.

Pause 3 seconds so the camera sees the populated cells clearly.

**Shot boundary note:** ~70 seconds elapsed.

---

## Step 5 — Activity log (t=1:10–1:20)

In the gsheet2json sidebar, click the Activity Log tab or scroll to the activity log section (bottom of sidebar).

Wait up to 2 seconds for the log entries to be visible.

Pause 4 seconds so the camera sees the populated activity log showing both the export and import entries.

**Shot boundary note:** ~80 seconds elapsed. End card overlay begins at t=80 in post; no action needed here.

---

## Step 6 — End card hold (t=1:20–1:32)

Close or minimize the sidebar (click X on the sidebar or use the Extensions menu to close).

Navigate to a new blank tab or back to the fixture sheet showing clean data.

Pause 8 seconds — this gives the end card overlay (applied in post at t=80) room to show.

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
* Total target runtime: 92 seconds. Actual may vary 5–10 seconds due to network latency.

<!-- end scripts/browser-actor-prompt.md -->
