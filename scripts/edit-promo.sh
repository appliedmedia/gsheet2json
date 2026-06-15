#!/bin/bash
# scripts/edit-promo.sh Copyright (c) 2005...2026-06-14.001:a@cov.in + Applied Media. All Rights Reserved. Do Not Duplicate.
#
# Lane 3: Edit Promo Video
# Overlays title card (0-6s), step labels, and end card (80s+) onto promo video, trims to 92 seconds.
#
# Usage:
#   ./scripts/edit-promo.sh [INPUT] [OUTPUT]
#
# Arguments:
#   INPUT  - Input video file (default: tmp/promo-raw.mp4)
#   OUTPUT - Output video file (default: tmp/promo-final.mp4)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

INPUT="${1:-tmp/promo-raw.mp4}"
OUTPUT="${2:-tmp/promo-final.mp4}"

TITLE_CARD="$REPO_ROOT/assets/promo/title-card.png"
END_CARD="$REPO_ROOT/assets/promo/end-card.png"

# Verify input file exists
if [[ ! -f "$INPUT" ]]; then
    echo "Error: Input file not found: $INPUT" >&2
    exit 1
fi

# Verify card assets exist
if [[ ! -f "$TITLE_CARD" ]]; then
    echo "Error: Title card not found: $TITLE_CARD" >&2
    exit 1
fi

if [[ ! -f "$END_CARD" ]]; then
    echo "Error: End card not found: $END_CARD" >&2
    exit 1
fi

# Ensure output directory exists
OUTPUT_DIR="$(dirname "$OUTPUT")"
mkdir -p "$OUTPUT_DIR"

# Step label settings — white text, semi-transparent black box, top-left corner
FONT="/System/Library/Fonts/Helvetica.ttc"
LABEL_OPTS="fontfile=${FONT}:fontsize=42:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=14:x=40:y=40"

# Run ffmpeg to overlay cards, step labels, and trim
# Timeline:
#   t=0–6    title card
#   t=6–22   Step 0.5: OAuth authorization
#   t=22–28  Step 1:   Sheet + sidebar
#   t=28–44  Step 2:   Export
#   t=44–54  Step 3:   JSON in Drive
#   t=54–70  Step 4:   Import
#   t=70–80  Step 5:   Activity log
#   t=80+    end card
ffmpeg -i "$INPUT" -i "$TITLE_CARD" -i "$END_CARD" \
  -filter_complex "
    [1:v]scale=1920:1080[title];
    [2:v]scale=1920:1080[end];
    [0:v][title]overlay=enable='between(t,0,6)'[v1];
    [v1][end]overlay=enable='gte(t,80)'[v2];
    [v2]drawtext=${LABEL_OPTS}:text='Authorizing gsheet2json':enable='between(t,6,22)'[v3];
    [v3]drawtext=${LABEL_OPTS}:text='Export to JSON':enable='between(t,28,44)'[v4];
    [v4]drawtext=${LABEL_OPTS}:text='JSON in Google Drive':enable='between(t,44,54)'[v5];
    [v5]drawtext=${LABEL_OPTS}:text='Import JSON to Sheet':enable='between(t,54,70)'[v6];
    [v6]drawtext=${LABEL_OPTS}:text='Activity Log':enable='between(t,70,80)'[out]
  " \
  -map "[out]" -vcodec libx264 -crf 18 -preset medium -pix_fmt yuv420p -t 92 "$OUTPUT" -y

echo "Successfully created $OUTPUT"

# end scripts/edit-promo.sh
