<!-- scripts/browser-actor-prompt-explainer.md Copyright (c) 2005...2026-06-14.001:a@cov.in + Applied Media. All Rights Reserved. Do Not Distribute. -->

# gsheet2json Explainer Video — Browser Actor Prompt

Claude executes each step via browser automation. The operator runs `./scripts/record-screen.sh start` before beginning and tells Claude when to stop.

## Prereqs checklist (verify before starting)

* gsheet2json add-on installed and authorized in Chrome — sidebar opens directly, no OAuth prompt.
* Chrome window set to **1500×1600** at position **(0, 31)** on the LG 5K display.
* Fixture spreadsheet open: https://docs.google.com/spreadsheets/d/15E8LvrzXeDy3ruj9AoM29Bh987sv1CQSDUKRC7moduo
* No other screen recording active.

---

## Step 0 — Setup (Claude executes)

Use `mcp__claude-in-chrome__tabs_context_mcp` to identify the fixture spreadsheet tab. If not found, stop and ask the operator to open it.

Set Chrome window to **1500×1600** at position **(0, 31)** via the Swift AX API.

Open the sidebar via **Extensions → gsheet2json → Open**.

Wait up to 5 seconds for the sidebar to appear.

Pause 3 seconds.

---

## Step 1 — Export to local file (t=0:00–0:12)

In the sidebar, click the **Export to local file** button (download icon under EXPORT).

Wait up to 5 seconds for the browser's file save dialog to appear.

**Operator action required:** accept the default filename and save the file. Reply "done" in this Claude session to continue.

Wait for the activity log entry confirming the local save.

Pause 3 seconds.

**Shot boundary note:** ~12 seconds elapsed.

---

## Step 2 — Import local file + text display (t=0:12–0:28)

In the sidebar, click the **Import from local file** button (upload icon under IMPORT).

**Operator action required:** select the file just saved. Reply "done" in this Claude session to continue.

Wait up to 8 seconds for the import to complete and the text display to populate. Do NOT proceed until the JSON content is visible in the text pane.

Pause 4 seconds so the viewer can read the displayed JSON.

**Shot boundary note:** ~28 seconds elapsed.

---

## Step 3 — Introduce an error (t=0:28–0:44)

Click into the text display pane to focus it.

Delete any `"` or `{` character on lines 2–3 of the displayed JSON to produce a syntax error — the exact character doesn't matter, only that the result is invalid JSON.

Pause 2 seconds.

Confirm the error indicator appears (red underline, gutter marker, or status message). Do not proceed until it is visible.

Pause 4 seconds so the viewer can see the error callout.

**Shot boundary note:** ~44 seconds elapsed.

---

## Step 4 — Fix the error, preview in tab (t=0:44–1:04)

Restore the deleted character so the JSON is valid again.

Pause 2 seconds — confirm the error indicator disappears.

Click the **Play / Preview** button (triangle icon) to render the JSON in a new sheet tab.

Wait up to 8 seconds for the new sheet tab to appear. Do NOT proceed until the tab is visible.

Click the new tab so the camera sees the rendered data.

Pause 4 seconds.

**Shot boundary note:** ~64 seconds elapsed.

---

## Step 5 — Export to Google Drive (t=1:04–1:22)

Navigate back to the original sheet tab.

In the sidebar, click the **Export to Drive** button (cloud icon under EXPORT).

Wait up to 10 seconds for the export to complete and an activity log entry to appear. Do NOT proceed until the entry is visible — not a spinner.

Pause 3 seconds so the camera sees the activity entry.

**Shot boundary note:** ~82 seconds elapsed.

---

## Step 6 — Activity log: open folder, open in Drive, download (t=1:22–1:46)

Scroll the sidebar activity log so the export entry is centered.

Hover over the activity entry to reveal its action icons.

Hover over the **open enclosing folder** icon for 2 seconds.

Click the **open enclosing folder** icon to open the file's location in Drive in a new tab.

Wait up to 5 seconds for Drive to open.

Pause 3 seconds so the viewer sees the folder.

Navigate back to the spreadsheet tab.

Hover over the activity entry again.

Hover over the **open file in Drive** icon for 2 seconds, then click it.

Wait up to 4 seconds for the file preview to open.

Pause 3 seconds.

Navigate back to the spreadsheet tab.

Hover over the activity entry again.

Hover over the **download** icon for 2 seconds — do NOT click.

Pause 2 seconds.

**Shot boundary note:** ~106 seconds elapsed.

---

## Step 7 — Import from Google Drive + filter (t=1:46–2:10)

In the sidebar, click the **Import from Drive** button (folder icon under IMPORT).

Wait up to 5 seconds for the Drive file picker / list to open.

Locate the filter or search field within the picker.

Type `.json` into the filter field to narrow the list to JSON files. If a "show only JSON" toggle is visible instead, click that.

Pause 2 seconds so the viewer sees the filtered list.

Click one of the listed `.g2j.json` files to select it.

Wait up to 10 seconds for the import to complete and a new sheet tab to appear.

Click the new imported sheet tab.

Pause 4 seconds.

**Shot boundary note:** ~130 seconds elapsed.

---

## Step 8 — Resize panes (t=2:10–2:22)

Navigate back to the original sheet tab.

Click and drag the divider between the top/bottom panes (or left/right panes) in the g2j sidebar column — drag it noticeably (at least 80 px) to demonstrate the resize.

Pause 2 seconds.

Drag it back toward the original position.

Pause 2 seconds.

**Shot boundary note:** ~142 seconds elapsed.

---

## Step 9 — Gear icon + hover over trash buttons (t=2:22–2:44)

Scroll the sidebar to reveal the **gear icon** in the lower corner.

Click the gear icon to open the settings panel.

Pause 4 seconds so the viewer can read the settings options.

Scroll or navigate within settings to show any notable options (e.g., default export format, naming template).

Pause 3 seconds.

Close or dismiss the settings panel.

Locate the **trash / delete** icon buttons in the activity log or file list.

Hover over the first trash button for 2 seconds — do NOT click.

Hover over the second trash button (if present) for 2 seconds — do NOT click.

Pause 2 seconds.

**Shot boundary note:** ~164 seconds elapsed.

---

## Step 10 — End card hold (t=2:44–2:54)

Close the sidebar (click X).

Pause 8 seconds for the end card overlay room.

---

## Done

Tell the operator to stop the recording.

---

## Pacing notes

* All network-bound steps wait for visual confirmation before proceeding.
* Steps 1 and 2 require operator file dialog interaction — Claude pauses and waits for the signal.
* If any step fails: stop, print the failure, do NOT continue. Retake from Step 0.
* Total target runtime: ~175 seconds (~2 min 55 sec).

<!-- end scripts/browser-actor-prompt-explainer.md -->
