#!/usr/bin/env zsh
# scripts/deploy.sh Copyright (c) 2005...2026-06-14.001:a@cov.in + Applied Media. All Rights Reserved. Do Not Distribute.

set -euo pipefail

DEPLOYMENT_ID="AKfycbyVkxEjiFyV4kzMd8cZADsjmHUlAN-DgSRb2errioqNHi3k3r4abUSbrr_JD_6wQIyh"
PKG_VERSION=$(node -p "require('./package.json').version")

npm run push

npx clasp version "v${PKG_VERSION}"

NEW_VER=$(npx clasp versions 2>/dev/null | grep -oE '^[0-9]+' | sort -n | tail -1)
PREV_VER=$((NEW_VER - 1))

npx clasp deploy --deploymentId "$DEPLOYMENT_ID" --versionNumber "$NEW_VER" --description "v${PKG_VERSION}"

echo ""
echo "⚠️  MANUAL STEP: bump 'Sheets Add-on Script Version *' from ${PREV_VER} to ${NEW_VER} at:"
echo "   https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/overview?project=am-gsheet2json"
echo -n "https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/overview?project=am-gsheet2json" | pbcopy
echo "   (URL copied to clipboard)"

# end scripts/deploy.sh
