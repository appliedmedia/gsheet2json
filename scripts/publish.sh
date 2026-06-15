#!/usr/bin/env zsh
# scripts/publish.sh Copyright (c) 2005...2026-06-14.001:a@cov.in + Applied Media. All Rights Reserved. Do Not Distribute.
#
# Full publish flow: build → push → create Apps Script version → update Marketplace deployment.
# Usage: ./scripts/publish.sh "optional version description"

set -euo pipefail

DEPLOYMENT_ID="AKfycbyVkxEjiFyV4kzMd8cZADsjmHUlAN-DgSRb2errioqNHi3k3r4abUSbrr_JD_6wQIyh"
PKG_VERSION=$(node -p "require('./package.json').version")
DESCRIPTION="${1:-v${PKG_VERSION}}"

echo "▶ Building and pushing…"
npm run push

echo "▶ Creating Apps Script version: ${DESCRIPTION}"
VERSION_OUTPUT=$(npx clasp version "$DESCRIPTION")
echo "$VERSION_OUTPUT"
NEW_VERSION=$(echo "$VERSION_OUTPUT" | grep -oE '[0-9]+$')

echo "▶ Updating Marketplace deployment to version ${NEW_VERSION}…"
npx clasp deploy --deploymentId "$DEPLOYMENT_ID" --versionNumber "$NEW_VERSION" --description "$DESCRIPTION"

PREV_VERSION=$((NEW_VERSION - 1))

echo ""
echo "✅ Pushed and deployed Apps Script version ${NEW_VERSION}."
echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo "   Go to: https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/overview?project=am-gsheet2json"
echo "   App Configuration → bump 'Sheets Add-on Script Version *' from ${PREV_VERSION} to ${NEW_VERSION} → Save."
echo ""
echo "   (Copying URL to clipboard…)"
echo -n "https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/overview?project=am-gsheet2json" | pbcopy
echo "   Done — URL is in your clipboard."

# end scripts/publish.sh
