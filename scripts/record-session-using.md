<!-- scripts/record-session-using.md Copyright (c) 2005...2026-06-14.001:a@cov.in + Applied Media. All Rights Reserved. Do Not Duplicate. -->

# gsheet2json Promo Video — "Using": Full Recording Session

Paste this entire file into a Claude Code session. Claude runs the shell commands and browser actor with no required operator interaction. End result: a YouTube Unlisted URL printed to the terminal.

See `scripts/record-session-install.md` for the companion install + OAuth video.

## Before pasting

Verify all prereqs are true:

* gsheet2json add-on installed in Chrome (production listing or dev deployment).
* gsheet2json add-on installed and authorized — sidebar opens directly, no OAuth prompt.
* Fixture spreadsheet open: https://docs.google.com/spreadsheets/d/15E8LvrzXeDy3ruj9AoM29Bh987sv1CQSDUKRC7moduo
* `YOUTUBE_REFRESH_TOKEN` env var set (run `npx tsx scripts/get-youtube-token.ts` once if missing — it auto-writes to `.env.local`).
* `YOUTUBE_TOKEN` env var set to `~/.g2j-youtube-credentials.json`.
* No other screen recording is active.

---

## Session instructions for Claude

Run the following steps in order. If any step exits non-zero, stop immediately and print the error — do not continue.

### Step 1 — Validate prereqs

```bash
test -f .env.local && grep -q YOUTUBE_REFRESH_TOKEN .env.local || { echo "MISSING: .env.local or YOUTUBE_REFRESH_TOKEN"; exit 1; }
test -f "${YOUTUBE_TOKEN:-}" || { echo "MISSING: YOUTUBE_TOKEN env var or file not found"; exit 1; }
mkdir -p tmp
echo "Prereqs OK"
```

### Step 2 — Start screen recording

```bash
./scripts/record-screen.sh start
```

Confirm the output says "Recording started" before proceeding. If it prints a Screen Recording permission error, stop and ask the user to grant Screen Recording permission in System Settings → Privacy & Security → Screen Recording, then re-paste this prompt.

### Step 3 — Browser actor (shot list)

Read `scripts/browser-actor-prompt-using.md` and execute it step by step using the Claude-in-Chrome tools (`mcp__claude-in-chrome__*`). Follow every step, pacing note, and wait instruction in that file exactly.

When `browser-actor-prompt-using.md` prints "SHOT LIST COMPLETE", proceed immediately to Step 4 — do NOT wait for any user input.

### Step 4 — Stop screen recording

```bash
./scripts/record-screen.sh stop
```

Confirm the output says "Recording stopped" and that `tmp/promo-raw.mp4` exists:

```bash
test -f tmp/promo-raw.mp4 && ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 tmp/promo-raw.mp4
```

The duration should be approximately 100–115 seconds.

### Step 5 — Edit

```bash
./scripts/edit-promo.sh tmp/promo-raw.mp4 tmp/promo-using-final.mp4
```

Confirm `tmp/promo-using-final.mp4` exists and is approximately 92 seconds:

```bash
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 tmp/promo-using-final.mp4
```

### Step 6 — Upload to YouTube

```bash
npx tsx scripts/upload-youtube.ts tmp/promo-using-final.mp4
```

Capture the printed `https://youtu.be/...` URL from stdout.

### Step 7 — Done

Print:

```text
Done. YouTube URL (Using): <the URL from Step 6>
```

---

## After the session

1. Open the URL in a browser and confirm the video is visible as Unlisted.
2. Paste the URL into the Marketplace SDK Store Listing → Promotional Video URL field.
3. Save Draft.
4. Note the published URL in your release tracking.

<!-- end scripts/record-session-using.md -->
