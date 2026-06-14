#!/bin/bash
# scripts/record-screen.sh Copyright (c) 2026:appliedmedia. Licensed under Code Transparency v1 (see LICENSE).
set -euo pipefail

DISPLAY_INDEX="2"
TMP_DIR="tmp"
FIFO_PATH="${TMP_DIR}/record.fifo"
PID_FILE="${TMP_DIR}/record.pid"
OUTPUT_FILE="${TMP_DIR}/promo-raw.mp4"

# Crop rectangle for the Chrome content area on the LG 5K display.
# Window outer: x=0 y=31 w=1600 h=1700. Browser chrome=121px + "Claude debugging" infobar=26px = 147px total.
# Content area: x=0 y=180 w=1600 h=1553 (screen y=31+147+2px buffer=180).
CROP_X="${CROP_X:-0}"
CROP_Y="${CROP_Y:-180}"
CROP_W="${CROP_W:-1600}"
CROP_H="${CROP_H:-1553}"

# Ensure tmp directory exists
mkdir -p "${TMP_DIR}"

# Function to print error and exit
error_exit() {
  echo "Error: $1" >&2
  exit 1
}

# Function to start recording
start_recording() {
  # Launch ffmpeg in the background. -nostdin keeps it from consuming the shell's
  # stdin; stdin is redirected from /dev/null so it never blocks. We stop it later
  # with SIGINT, which ffmpeg traps to finalize the MP4 (write the moov atom).
  # The earlier FIFO approach deadlocked: ffmpeg blocked opening the FIFO for read
  # until a writer appeared, so it never actually captured any frames.
  ffmpeg -nostdin -y -f avfoundation -framerate 30 -i "${DISPLAY_INDEX}" \
    -vf "crop=${CROP_W}:${CROP_H}:${CROP_X}:${CROP_Y}" \
    -vcodec libx264 -crf 18 -preset ultrafast -pix_fmt yuv420p \
    "${OUTPUT_FILE}"</dev/null >"${TMP_DIR}/ffmpeg.log" 2>&1 &

  local ffmpeg_pid=$!

  # Wait a moment and confirm ffmpeg is still alive (catches permission failures).
  sleep 1
  if ! kill -0 "${ffmpeg_pid}" 2>/dev/null; then
    echo "ffmpeg failed to start. Last log lines:" >&2
    tail -5 "${TMP_DIR}/ffmpeg.log" >&2
    error_exit "Check Screen Recording permission in System Settings > Privacy & Security > Screen Recording"
  fi

  echo "${ffmpeg_pid}" > "${PID_FILE}"
  echo "Recording started (PID: ${ffmpeg_pid})"
  exit 0
}

# Function to stop recording
stop_recording() {
  if [[ ! -f "${PID_FILE}" ]]; then
    error_exit "Recording not running (${PID_FILE} not found)"
  fi

  local ffmpeg_pid
  ffmpeg_pid=$(cat "${PID_FILE}")

  # SIGINT = graceful stop; ffmpeg finalizes the output file.
  kill -INT "${ffmpeg_pid}" 2>/dev/null || true

  # Wait up to 10 seconds for ffmpeg to flush and exit.
  local count=0
  while [[ $count -lt 50 ]]; do
    if ! kill -0 "${ffmpeg_pid}" 2>/dev/null; then
      rm -f "${PID_FILE}"
      echo "Recording stopped gracefully"
      exit 0
    fi
    sleep 0.2
    count=$((count + 1))
  done

  # Last resort: SIGTERM (may leave the file unfinalized).
  echo "Timeout on graceful stop, sending SIGTERM..." >&2
  kill -TERM "${ffmpeg_pid}" 2>/dev/null || true
  sleep 0.5
  rm -f "${PID_FILE}"
  echo "Recording stopped (forced)"
  exit 0
}

# Function to record for specified duration (test mode)
duration_recording() {
  local duration=$1

  if ffmpeg -f avfoundation -framerate 30 -i "${DISPLAY_INDEX}" \
    -vf "crop=${CROP_W}:${CROP_H}:${CROP_X}:${CROP_Y}" \
    -t "${duration}" -vcodec libx264 -crf 18 -preset ultrafast -pix_fmt yuv420p \
    "${OUTPUT_FILE}" 2>/dev/null; then
    echo "Recording completed (${duration}s)"
    exit 0
  else
    error_exit "ffmpeg failed. Check Screen Recording permission in System Preferences > Security & Privacy > Screen Recording"
  fi
}

# Parse command line arguments
case "${1:-}" in
  start)
    start_recording
    ;;
  stop)
    stop_recording
    ;;
  --duration)
    if [[ -z "${2:-}" ]]; then
      error_exit "Duration value required: --duration N"
    fi
    duration_recording "${2}"
    ;;
  *)
    cat >&2 << 'EOF'
Usage: scripts/record-screen.sh {start|stop|--duration N}

  start              Start recording in background
  stop               Stop the running recording
  --duration N       Record for N seconds (blocking, test mode)

Examples:
  ./scripts/record-screen.sh start
  ./scripts/record-screen.sh stop
  ./scripts/record-screen.sh --duration 5
EOF
    exit 1
    ;;
esac

# end scripts/record-screen.sh
