# src

Apps Script source for the gsheet2json add-on. TypeScript compiles to `.gs`; the `.html` partials and `appsscript.json` manifest are copied into the build output by `npm run build`. Everything runs in the Apps Script global scope, so there are no module imports between files.

## Modules

* `main.ts`: entry points (`onOpen`, `onInstall`), the add-on menu, the sidebar launcher, the `google.script.run` command router, and user-facing error mapping.
* `export.ts`: serialize the active tab to the JSON format and save it to Drive (via the Advanced Drive Service) or return it for local download.
* `import.ts`: rebuild a tab from JSON as a new sheet, restoring styles, validations, dimensions, named ranges, and merges.
* `gsheet2jsonLogic.ts`: the pure, environment-independent round-trip logic that the static tests exercise directly.
* `utils.ts`: shared helpers, including the style-delta and chain-depth invariants.
* `types.ts`: shared type definitions and the single source of truth for the JSON schema.
* `progress.ts`: server-side progress checkpoints, polled by the sidebar to drive the progress bar.
* `settings.ts`: user preferences and the Drive-picker ignore lists.
* `licensing.ts`: Marketplace Licensing API integration (trial, paid, and expired states, plan tiers, a feature gate, and onboarding helpers). The launch is free, so the sidebar's trial and license UI is disabled, but the logic is present.

## Sidebar UI

* `index.html`: the sidebar template that includes the partials below.
* `layout.html`: the sidebar markup (action cards, staging editor, activity log, footer).
* `styles.html` and `style-css.html`: the sidebar styles.
* `app-js.html`: the client-side behavior.

## Manifests and test runner

* `appsscript.json`: production manifest with the narrow OAuth scopes.
* `appsscript.gas.json`: the broader manifest used by `npm run build:gas` for the in-Apps-Script test runner.
* `test_runner.ts`: the runner invoked by the `@gas` test suite.
