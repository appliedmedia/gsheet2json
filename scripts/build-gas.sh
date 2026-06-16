#!/usr/bin/env bash
# scripts/build-gas.sh Copyright (c) 2005...2026-06-15.001:a@cov.in + Applied Media. All Rights Reserved. Do Not Distribute.
set -euo pipefail

# @gas test build: same as build.sh but compiles with tsconfig.gas.json and uses
# the gas manifest. Bakes the exact package.json version into the bundle.
rm -rf out && mkdir -p out
tsc -p tsconfig.gas.json
for f in out/*.js; do mv "$f" "${f%.js}.gs"; done
cp src/appsscript.gas.json out/appsscript.json
cp src/styles.html src/index.html src/style-css.html src/layout.html src/app-js.html out/

VERSION=$(node -p "require('./package.json').version")
sed -i '' "s/const VERSION = \"[^\"]*\"/const VERSION = \"${VERSION}\"/" out/main.gs

# end scripts/build-gas.sh
