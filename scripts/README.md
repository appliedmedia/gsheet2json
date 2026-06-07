# scripts

Build, QA, and release tooling. None of this ships inside the add-on; it supports development and producing the promo video.

* `verify_domains.sh`: check that the vanity domains resolve to their canonical targets.
* `record-screen.sh`: start and stop an ffmpeg screen capture (used to record the demo).
* `edit-promo.sh`: the ffmpeg pipeline that overlays the title and end cards onto the screen capture and trims it to length.
* `record-session.md`: the runbook for recording a promo session.
* `browser-actor-prompt.md`: the step-by-step prompt for driving the demo via the Claude-in-Chrome extension.
* `get-youtube-token.ts`: one-time helper to obtain a YouTube OAuth refresh token.
* `upload-youtube.ts`: upload the finished video to YouTube as Unlisted.

The YouTube scripts read credentials from `scripts/client_secret.json` and a `YOUTUBE_REFRESH_TOKEN` environment variable. Both are gitignored and must never be committed.
