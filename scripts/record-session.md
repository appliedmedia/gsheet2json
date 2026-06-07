<!-- scripts/record-session.md Copyright (c) 2026:appliedmedia. All Rights Reserved. Do Not Distribute. -->

# gsheet2json Promo Video: Full Recording Session

Paste this entire file into a Claude Code session. Claude runs both the shell commands and the browser actor without any human interaction after the paste. End result: a YouTube Unlisted URL printed to the terminal.

## Before pasting

Verify all prereqs are true:

* gsheet2json add-on installed in Chrome (production listing or dev deployment).
* Fixture spreadsheet open in a Chrome tab (any sheet with 10+ rows of data).
* `scripts/client_secret.json` in place (one-time OAuth setup via `npx tsx scripts/get-youtube-token.ts`).
* `.env.local` contains `YOUTUBE_REFRESH_TOKEN=<value>` from the one-time setup step.
* No other screen recording is active.

---

## Session instructions for Claude

Run the following steps in order. If any step exits non-zero, stop immediately and print the error — do not continue.

### Step 1 — Validate prereqs

```bash
test -f .env.local && grep -q YOUTUBE_REFRESH_TOKEN .env.local || { echo "MISSING: .env.local or YOUTUBE_REFRESH_TOKEN"; exit 1; }
test -f scripts/client_secret.json || { echo "MISSING: scripts/client_secret.json"; exit 1; }
mkdir -p tmp
echo "Prereqs OK"
```

### Step 2 — Start screen recording

```bash
./scripts/record-screen.sh start
```

Confirm the output says "Recording started" before proceeding. If it prints a Screen Recording permission error, stop and ask the user to grant Screen Recording permission in System Settings → Privacy & Security → Screen Recording, then re-paste this prompt.

### Step 3 — Browser actor (shot list)

Read `scripts/browser-actor-prompt.md` and execute it step by step using the Claude-in-Chrome tools (`mcp__claude-in-chrome__*`). Follow every step, pacing note, and wait instruction in that file exactly.

When `browser-actor-prompt.md` prints "SHOT LIST COMPLETE", proceed immediately to Step 4 — do NOT wait for any user input.

### Step 4 — Stop screen recording

```bash
./scripts/record-screen.sh stop
```

Confirm the output says "Recording stopped" and that `tmp/promo-raw.mp4` exists:

```bash
test -f tmp/promo-raw.mp4 && ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 tmp/promo-raw.mp4
```

The duration should be approximately 78–90 seconds.

### Step 5 — Edit

```bash
./scripts/edit-promo.sh
```

Confirm `tmp/promo-final.mp4` exists and is approximately 78 seconds:

```bash
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 tmp/promo-final.mp4
```

### Step 6 — Upload to YouTube

```bash
npx tsx scripts/upload-youtube.ts tmp/promo-final.mp4
```

Capture the printed `https://youtu.be/...` URL from stdout.

### Step 7 — Done

Print:

```
Done. YouTube URL: <the URL from Step 6>
```

---

## After the session

1. Open the URL in a browser and confirm the video is visible as Unlisted.
2. Paste the URL into the Marketplace SDK Store Listing → Promotional Video URL field.
3. Save Draft.
4. Update `docs/plans/2026-05-09_plan_todo_AndrewHandsOnRequired.md` Step 2.5: mark done, paste URL.

<!-- end scripts/record-session.md -->
