#!/usr/bin/env bash
# scripts/build.sh Copyright (c) 2005...2026-06-15.001:a@cov.in + Applied Media. All Rights Reserved. Do Not Distribute.
set -euo pipefail

# Editor add-on build: compile TS, rename to .gs, copy HTML + manifest, then
# bake the exact package.json version into the bundle's VERSION constant.
rm -rf out && mkdir -p out
tsc
for f in out/*.js; do mv "$f" "${f%.js}.gs"; done
cp src/appsscript.json src/styles.html src/index.html src/style-css.html src/layout.html src/app-js.html out/

VERSION=$(node -p "require('./package.json').version")
sed -i '' "s/const VERSION = \"[^\"]*\"/const VERSION = \"${VERSION}\"/" out/main.gs
sed -i '' "s/const SIDEBAR_VERSION = \"[^\"]*\"/const SIDEBAR_VERSION = \"${VERSION}\"/" out/app-js.html

# end scripts/build.sh
