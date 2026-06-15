<!-- scripts/browser-actor-prompt-install.md Copyright (c) 2005...2026-06-14.001:a@cov.in + Applied Media. All Rights Reserved. Do Not Duplicate. -->

# gsheet2json Promo Video — "Install with OAuth": Browser Actor Prompt

Paste this entire file into a Claude Code session that has the Claude-in-Chrome extension active. Claude executes each step via browser automation. The operator runs `./scripts/record-screen.sh start` before pasting and `./scripts/record-screen.sh stop` after Claude prints "SHOT LIST COMPLETE".

## Prereqs checklist (verify before pasting)

* gsheet2json add-on **uninstalled** from the account. Uninstall at [workspace.google.com/marketplace/myapps](https://workspace.google.com/marketplace/myapps) → gsheet2json → Uninstall. Do this immediately before recording.
* Chrome window set to 1500×1500 at position (0, 31) on the LG 5K display (set via AX at session start per `fixture-sheet.md`).
* `.env.local` has `YOUTUBE_REFRESH_TOKEN` set (for the upload step after recording).
* `scripts/record-screen.sh start` already running (recording in progress).

---

## Step 0 — Setup (Claude executes)

Use `mcp__claude-in-chrome__tabs_context_mcp` to get current tabs.

Set Chrome window to 1500×1500 at position (0, 31) via the AX position/size API (not resize_window — use the Swift AX approach per `fixture-sheet.md`).

Pause 2 seconds after resize.

---

## Step 1 — Marketplace listing (t=0:06–0:18)

Navigate to the gsheet2json Marketplace listing:
https://workspace.google.com/marketplace/app/gsheet2json/334934718668

Wait up to 5 seconds for the listing page to load fully.

Pause 4 seconds so the camera sees the listing — app name, icon, description, and Install button all visible.

**Shot boundary note:** ~18 seconds elapsed. Title card overlay covers t=0–6 in post.

---

## Step 2 — Click Install (t=0:18–0:30)

Click the "Install" button on the listing page.

Wait up to 5 seconds for the account chooser or permissions dialog to appear.

Pause 2 seconds so the camera sees the dialog at rest.

Scroll slowly to the bottom of the dialog (3 scroll steps, 1.5 seconds apart) so a viewer can read the full content before anything is clicked.

Pause 2 seconds at the bottom.

**Shot boundary note:** ~30 seconds elapsed.

---

## Step 3 — OAuth consent screen during install (t=0:30–0:54)

A Google OAuth consent screen will appear listing the permissions gsheet2json requests (Google Sheets access, Drive access, etc.). If a "Continue" button appears first on a pre-consent dialog, click it and wait up to 5 seconds for the full OAuth screen.

Wait up to 5 seconds for the OAuth screen to fully render.

Pause 3 seconds at the top so the camera sees the app name and g2j logo clearly.

Scroll slowly to the bottom of the consent screen (3 scroll steps, 1.5 seconds apart) so a viewer can read every permission before the Allow click.

Pause 3 seconds at the bottom.

Click "Allow".

Wait up to 8 seconds for the install confirmation page to appear.

Pause 4 seconds so the camera sees "gsheet2json has been installed."

**Shot boundary note:** ~44 seconds elapsed.

---

## Step 4 — Add-on in Extensions menu (t=0:44–1:00)

Navigate to the fixture spreadsheet:
https://docs.google.com/spreadsheets/d/15E8LvrzXeDy3ruj9AoM29Bh987sv1CQSDUKRC7moduo

Wait up to 5 seconds for the sheet to load.

Click the Extensions menu in the Google Sheets menu bar.

Wait for the dropdown to open (up to 3 seconds).

Pause 3 seconds so the camera sees "gsheet2json" in the Extensions menu — proof the install landed.

Click "gsheet2json" → "Open" in the submenu.

Wait up to 5 seconds for the sidebar to open (no second auth prompt — permissions were granted at install).

Pause 3 seconds so the camera sees the open, authorized sidebar.

**Shot boundary note:** ~60 seconds elapsed.

---

## Step 5 — End card hold (t=1:00–1:10)

Close or minimize the sidebar.

Pause 8 seconds — this gives the end card overlay (applied in post at t=60) room to show.

---

## Done

Print: `SHOT LIST COMPLETE — the operator: run ./scripts/record-screen.sh stop now`

Wait for the operator to confirm recording stopped, then run:

```bash
./scripts/edit-promo-install.sh
npx tsx scripts/upload-youtube.ts tmp/promo-install-final.mp4
```

Print the resulting YouTube URL.

---

## Pacing notes

* Every network-bound action (Marketplace load, install confirmation) waits for completion before proceeding.
* Every shot boundary pause is 2–3 seconds of "hold" to give the camera clean cut points.
* The OAuth consent screen hold at Step 3 is intentionally long (6 seconds) — this is the primary evidence Google is looking for.
* If any step fails (Install button not found, consent screen does not appear, sidebar does not open): stop, print the failure, and do NOT continue. The recording will need a retake from Step 0.
* Total target runtime: 70 seconds. Actual may vary 5–10 seconds due to network latency.

<!-- end scripts/browser-actor-prompt-install.md -->
