#!/usr/bin/env zsh
# scripts/deploy.sh Copyright (c) 2005...2026-06-14.001:a@cov.in + Applied Media. All Rights Reserved. Do Not Distribute.

set -euo pipefail

DEPLOYMENT_ID="AKfycbyVkxEjiFyV4kzMd8cZADsjmHUlAN-DgSRb2errioqNHi3k3r4abUSbrr_JD_6wQIyh"

# Max existing Apps Script version -> next version to create.
MAX_VER=$(npx clasp versions 2>/dev/null | tail -1 | grep -oE '^[0-9]+')
NEW_VER=$((MAX_VER + 1))

# Version the marketplace deployment currently points at, captured BEFORE we
# redeploy below. Best programmatic proxy for "currently published"; the actual
# console "Sheets Add-on Script Version" field isn't readable via API. Empty if
# it can't be determined.
CURRENT_PUBLISHED_VER=$(npx clasp deployments 2>/dev/null | grep -- "$DEPLOYMENT_ID" | grep -oE '@[0-9]+' | tr -d '@' | tail -1 || true)

# Pre-bump package.json before build so gear icon bakes in the right version
node -e "const fs=require('fs'),p=JSON.parse(fs.readFileSync('package.json'));const parts=p.version.split('.');parts[2]='${NEW_VER}';p.version=parts.join('.');fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n')"
PKG_VERSION=$(node -p "require('./package.json').version")

# Bump the in-source VERSION strings to match, so the published version is baked
# into the bundle and checked in. src/main.ts -> server VERSION (gear's server
# value); src/app-js.html -> SIDEBAR_VERSION (gear's bundle value).
node -e "const fs=require('fs');for(const f of ['src/main.ts','src/app-js.html']){fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace(/const VERSION = \"[^\"]*\"/,'const VERSION = \"${PKG_VERSION}\"').replace(/const SIDEBAR_VERSION = \"[^\"]*\"/,'const SIDEBAR_VERSION = \"${PKG_VERSION}\"'))}"

echo "▶ Version will be ${PKG_VERSION} (Apps Script v${NEW_VER})"

npm run push
npx clasp version "v${PKG_VERSION}"
npx clasp deploy --deploymentId "$DEPLOYMENT_ID" --versionNumber "$NEW_VER" --description "v${PKG_VERSION}"

MARKET_URL="https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/overview?project=am-gsheet2json"
echo ""
echo "=================================================================="
echo "FINAL STEP (no API for this field; it must be set in the Console GUI):"
echo "  URL   : ${MARKET_URL}"
echo "  TAB   : App Configuration"
echo "  FIELD : 'Sheets Add-on Script Version' (under the checked 'Sheets add-on')"
echo "  SET   : from ${CURRENT_PUBLISHED_VER:-?} to ${NEW_VER}"
echo "  THEN  : click [Save Draft], reload the page, confirm it shows ${NEW_VER}"
echo ""
echo "claude-in-chrome, now do: scripts/browser-actor-prompt-marketplace-bump.md and set 'Sheets Add-on Script Version' to ${NEW_VER}"
echo "=================================================================="
echo -n "${MARKET_URL}" | pbcopy
echo "(URL copied to clipboard)"

# end scripts/deploy.sh
