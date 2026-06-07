# features

Behavior tests for gsheet2json, written in [cucumber-js](<https://github.com/cucumber/cucumber-js>). The Gherkin `.feature` files describe behavior; step definitions and support code live in the subfolders.

## Layout

* `*.feature`: scenarios grouped by area (export round-trip, import validation, onboarding, settings, sidebar toasts, pre-submit hygiene, single-line invariants, license states).
* `step_definitions/`: the step implementations (`static_steps`, `sidebar_dom_steps`, `invariants_steps`, `clasp_steps`).
* `support/`: world setup, the step registry, the jsdom sidebar loader, and the approved OAuth scope allowlist.

## Running

```bash
npm test           # type-check, then run the suite (everything except @gas)
npm run test:gas   # the @gas suite (requires a live clasp push)
```

Tags select subsets: `@static` checks shippable files with no browser, `@dom` exercises the sidebar markup in jsdom, and `@gas` runs against a live Apps Script deployment (so it is excluded from the default `npm test`).
