#!/bin/bash
# scripts/edit-promo.sh Copyright (c) 2026:appliedmedia. All Rights Reserved. Do Not Distribute.
#
# Lane 3: Edit Promo Video
# Overlays title card (0-6s) and end card (68s+) onto promo video, trims to 78 seconds.
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

# Run ffmpeg to overlay cards and trim
ffmpeg -i "$INPUT" -i "$TITLE_CARD" -i "$END_CARD" \
  -filter_complex "[1:v]scale=1920:1080[title];[2:v]scale=1920:1080[end];[0:v][title]overlay=enable='between(t,0,6)'[v1];[v1][end]overlay=enable='gte(t,68)'[out]" \
  -map "[out]" -vcodec libx264 -crf 18 -preset medium -pix_fmt yuv420p -t 78 "$OUTPUT" -y

echo "Successfully created $OUTPUT"

# end scripts/edit-promo.sh
