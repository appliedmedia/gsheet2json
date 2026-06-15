<!-- scripts/record-session-install.md Copyright (c) 2026:appliedmedia. Licensed under Code Transparency v1 (see LICENSE). -->

# gsheet2json Promo Video — "Install with OAuth": Full Recording Session

Paste this entire file into a Claude Code session. Claude runs both the shell commands and the browser actor without any human interaction after the paste. End result: a YouTube Unlisted URL printed to the terminal.

See `scripts/record-session-using.md` for the companion functionality demo video.

## Before pasting

Verify all prereqs are true:

* gsheet2json add-on **uninstalled** from the account. Uninstall at [workspace.google.com/marketplace/myapps](https://workspace.google.com/marketplace/myapps) → gsheet2json → Uninstall. Do this immediately before recording.
* `.env.local` contains `YOUTUBE_REFRESH_TOKEN` (run `npx tsx scripts/get-youtube-token.ts` once if missing).
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

Confirm the output says "Recording started" before proceeding.

### Step 3 — Browser actor (shot list)

Read `scripts/browser-actor-prompt-install.md` and execute it step by step using the Claude-in-Chrome tools (`mcp__claude-in-chrome__*`). Follow every step, pacing note, and wait instruction in that file exactly.

When `browser-actor-prompt-install.md` prints "SHOT LIST COMPLETE", proceed immediately to Step 4.

### Step 4 — Stop screen recording

```bash
./scripts/record-screen.sh stop
```

Confirm the output says "Recording stopped" and that `tmp/promo-install-raw.mp4` exists:

```bash
test -f tmp/promo-install-raw.mp4 && ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 tmp/promo-install-raw.mp4
```

The duration should be approximately 68–82 seconds.

### Step 5 — Edit

```bash
./scripts/edit-promo-install.sh
```

Confirm `tmp/promo-install-final.mp4` exists and is approximately 70 seconds:

```bash
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 tmp/promo-install-final.mp4
```

### Step 6 — Upload to YouTube

```bash
npx tsx scripts/upload-youtube.ts tmp/promo-install-final.mp4
```

Capture the printed `https://youtu.be/...` URL from stdout.

### Step 7 — Done

Print:

```text
Done. YouTube URL (Install): <the URL from Step 6>
```

---

## After the session

1. Open the URL in a browser and confirm the video is visible as Unlisted.
2. Include this URL alongside the "Using" video URL in your reply to the Google reviewer.
3. Re-install gsheet2json from the Marketplace so the add-on is available for the "Using" recording.

## Published takes

| Date | YouTube URL | Notes |
| --- | --- | --- |
| 2026-06-14 | https://youtu.be/w3AZom-UyHw | H.265 re-encode — too blurry, superseded |
| 2026-06-14 | https://youtu.be/xglvaJKlenA | Original H.264 trim, 44s, 14MB; trimmed 15s–59s from raw — use this one |

<!-- end scripts/record-session-install.md -->
