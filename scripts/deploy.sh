#!/usr/bin/env zsh
# scripts/deploy.sh Copyright (c) 2005...2026-06-14.001:a@cov.in + Applied Media. All Rights Reserved. Do Not Distribute.

set -euo pipefail

DEPLOYMENT_ID="AKfycbyVkxEjiFyV4kzMd8cZADsjmHUlAN-DgSRb2errioqNHi3k3r4abUSbrr_JD_6wQIyh"

# Read max existing Apps Script version, predict next
PREV_VER=$(npx clasp versions 2>/dev/null | tail -1 | grep -oE '^[0-9]+')
NEW_VER=$((PREV_VER + 1))

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

echo ""
echo "⚠️  MANUAL STEP: bump 'Sheets Add-on Script Version *' from ${PREV_VER} to ${NEW_VER} at:"
echo "   https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/overview?project=am-gsheet2json"
echo -n "https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/overview?project=am-gsheet2json" | pbcopy
echo "   (URL copied to clipboard)"

# end scripts/deploy.sh
