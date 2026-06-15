#!/bin/bash
# scripts/edit-promo-install.sh Copyright (c) 2005...2026-06-14.001:a@cov.in + Applied Media. All Rights Reserved. Do Not Distribute.
#
# Edit Promo Video — "Install with OAuth"
# Overlays title card (0-6s), step labels, and end card (60s+) onto install promo video, trims to 70 seconds.
#
# Usage:
#   ./scripts/edit-promo-install.sh [INPUT] [OUTPUT]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

INPUT="${1:-tmp/promo-install-raw.mp4}"
OUTPUT="${2:-tmp/promo-install-final.mp4}"

TITLE_CARD="$REPO_ROOT/assets/promo/title-card.png"
END_CARD="$REPO_ROOT/assets/promo/end-card.png"

if [[ ! -f "$INPUT" ]]; then echo "Error: Input file not found: $INPUT" >&2; exit 1; fi
if [[ ! -f "$TITLE_CARD" ]]; then echo "Error: Title card not found: $TITLE_CARD" >&2; exit 1; fi
if [[ ! -f "$END_CARD" ]]; then echo "Error: End card not found: $END_CARD" >&2; exit 1; fi

OUTPUT_DIR="$(dirname "$OUTPUT")"
mkdir -p "$OUTPUT_DIR"

# Step label settings — white text, semi-transparent black box, top-left corner
FONT="/System/Library/Fonts/Helvetica.ttc"
LABEL_OPTS="fontfile=${FONT}:fontsize=42:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=14:x=40:y=40"

# Timeline:
#   t=0–6    title card
#   t=6–18   Step 1: Marketplace listing
#   t=18–24  Step 2: Click Install
#   t=24–44  Step 3: OAuth consent screen
#   t=44–60  Step 4: Add-on in Extensions menu + sidebar open
#   t=60+    end card
ffmpeg -i "$INPUT" -i "$TITLE_CARD" -i "$END_CARD" \
  -filter_complex "
    [1:v]scale=1920:1080[title];
    [2:v]scale=1920:1080[end];
    [0:v][title]overlay=enable='between(t,0,6)'[v1];
    [v1][end]overlay=enable='gte(t,60)'[v2];
    [v2]drawtext=${LABEL_OPTS}:text='Google Workspace Marketplace':enable='between(t,6,24)'[v3];
    [v3]drawtext=${LABEL_OPTS}:text='Authorizing gsheet2json':enable='between(t,24,44)'[v4];
    [v4]drawtext=${LABEL_OPTS}:text='Installed — open from Extensions menu':enable='between(t,44,60)'[out]
  " \
  -map "[out]" -vcodec libx264 -crf 18 -preset medium -pix_fmt yuv420p -t 70 "$OUTPUT" -y

echo "Successfully created $OUTPUT"

# end scripts/edit-promo-install.sh
