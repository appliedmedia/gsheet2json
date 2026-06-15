<!-- scripts/browser-actor-prompt-using.md Copyright (c) 2005...2026-06-14.001:a@cov.in + Applied Media. All Rights Reserved. Do Not Distribute. -->

# gsheet2json Promo Video — "Using": Browser Actor Prompt

Claude executes each step via browser automation. The operator runs `./scripts/record-screen.sh start` before beginning and tells Claude when to stop.

See `scripts/record-session-using.md` for the full session wrapper.

## Prereqs checklist (verify before starting)

* gsheet2json add-on installed in Chrome.
* Chrome window set to **1600×1700** at position **(0, 31)** on the LG 5K display (set via AX at session start per `fixture-sheet.md`).
* Fixture spreadsheet open: https://docs.google.com/spreadsheets/d/15E8LvrzXeDy3ruj9AoM29Bh987sv1CQSDUKRC7moduo
* `YOUTUBE_REFRESH_TOKEN` and `YOUTUBE_TOKEN` env vars set.
* gsheet2json add-on authorized and ready — sidebar opens directly with no OAuth prompt.
* No other screen recording active.

---

## Step 0 — Setup (Claude executes)

Use `mcp__claude-in-chrome__tabs_context_mcp` to get current tabs. Identify the fixture spreadsheet tab. If not found, stop and tell the operator to open it.

Set Chrome window to **1600×1700** at position **(0, 31)** via the Swift AX position/size API.

Pause 2 seconds.

---

## Step 1 — Open sidebar (t=0:06–0:20)

Click the **Extensions** menu in the Google Sheets menu bar.

Wait up to 3 seconds for the dropdown to open.

Click **gsheet2json** → **Open**.

Wait up to 5 seconds for the sidebar to open.

Pause 3 seconds so the camera sees the open sidebar.

**Shot boundary note:** ~20 seconds elapsed.

---

## Step 2 — Sheet + sidebar overview (t=0:20–0:28)

Confirm the sheet is visible with the Income Statement data and the sidebar is docked on the right showing the Import/Export cards.

Pause 6 seconds so the camera takes in the full picture — sheet data on the left, sidebar on the right.

**Shot boundary note:** ~36 seconds elapsed.

---

## Step 3 — Export to Google Drive (t=0:36–0:56)

In the sidebar, click the **Export to Drive** button (cloud icon under EXPORT).

Wait up to 10 seconds for the export to complete and an activity log entry to appear. Do NOT proceed until the activity entry is visible — not a spinner.

Pause 4 seconds so the camera sees the activity entry confirming the Drive save.

**Shot boundary note:** ~56 seconds elapsed.

---

## Step 4 — Show the JSON file in Drive (t=0:56–1:10)

Click the **folder icon** on the activity log entry to open the file's location in Google Drive in a new tab.

Wait up to 5 seconds for Drive to open.

Click on the exported `.g2j.json` file to open its preview.

Wait up to 3 seconds for the preview to render.

Scroll slowly through the JSON (3 scroll steps, 1.5 seconds apart) so the viewer can see the structure.

Pause 2 seconds at the bottom.

**Shot boundary note:** ~70 seconds elapsed.

---

## Step 5 — Import from Drive (t=1:10–1:28)

Navigate back to the fixture spreadsheet tab.

In the sidebar, click the **Import from Drive** button (folder icon under IMPORT).

Wait up to 5 seconds for the Drive file picker to open.

Select the `.g2j.json` file exported in Step 3.

Wait up to 10 seconds for the import to complete and a new sheet tab to appear. Do NOT proceed until the new tab is visible.

Click the new imported sheet tab so the camera sees the freshly imported data.

Pause 4 seconds.

**Shot boundary note:** ~88 seconds elapsed.

---

## Step 6 — Activity log close-up (t=1:28–1:38)

Navigate back to the original sheet tab (the sidebar stays open).

Scroll the sidebar down to the **Activity** section so both the export and import entries are visible.

Pause 6 seconds so the camera sees the full activity history.

**Shot boundary note:** ~98 seconds elapsed.

---

## Step 7 — End card hold (t=1:38–1:48)

Close the sidebar (click X).

Pause 8 seconds for the end card overlay room.

---

## Done

Tell the operator to stop the recording.

---

## Pacing notes

* All network-bound steps wait for completion before proceeding.
* OAuth Allow click at Step 1 must be done by the operator — cannot be automated.
* If any step fails: stop, print the failure, do NOT continue. Retake from Step 0.
* Total target runtime: ~100 seconds.

<!-- end scripts/browser-actor-prompt-using.md -->
