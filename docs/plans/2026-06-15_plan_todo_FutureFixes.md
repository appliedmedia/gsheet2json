<!-- docs/plans/2026-06-15_plan_todo_FutureFixes.md Copyright (c) 2005...2026-06-15.001:a@cov.in + Applied Media. All Rights Reserved. Do Not Distribute. -->

# gsheet2json — Future Fixes

**Status:** todo
**Last updated:** 2026-06-15

Backlog of non-blocking improvements to pick up in a future pass.

## Build / tooling

* Consider switching `scripts/build.sh` and `scripts/build-gas.sh` from bash to zsh, since zsh is now the macOS native shell. Would align them with `scripts/deploy.sh` (already zsh). Check the `sed -i ''` and glob behavior still work under zsh before flipping the shebang and the `npm` invocations.

<!-- end docs/plans/2026-06-15_plan_todo_FutureFixes.md -->
