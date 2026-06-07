# gsheet2json

![CI](images/ci.svg) ![Coverage](images/coverage.svg) ![License](images/license.svg)

Round-trip a Google Sheets tab to structured JSON and back, preserving values, formatting, formulas, data validations, dimensions, named ranges, and merged cells. Built for AI workflows: hand a tab to an LLM as JSON, let it edit, then import the result as a new tab with the formatting intact.

## Install

gsheet2json is a Google Sheets editor add-on. Install it from the Google Workspace Marketplace; the home and install link is [gsheet2json.com](<https://gsheet2json.com>). Once installed, open it from any sheet via Extensions, then gsheet2json, then Open.

## Using the sidebar

The add-on runs entirely in a sidebar inside Google Sheets. There are no external servers, and your data stays in your Google account.

* **Import** and **Export** are the two action cards, and each offers a local-file option and a Google Drive option.
* **Export** writes the active tab to a timestamped JSON file, saved to your Drive or downloaded locally.
* **Import** loads JSON from Drive, a local file, or pasted text into a staging editor. You review or edit it there, then run the import, which rebuilds the tab as a new sheet.
* A **progress bar** tracks long operations, since large sheets encode and decode server-side with live progress.
* An **activity log** records every operation with a success or failure marker and per-entry actions (open the Drive file, re-download, or forget the entry).

## JSON format

An export is a single JSON object describing one tab:

```json
{
  "sheetName": "WebEval",
  "rowHeights":   { "r_00000": 28, "r_00001": "r_00000" },
  "columnWidths": { "c_00000": 50, "c_00001": 220 },
  "styles":       { "s_base": {}, "s_score": { "base": "s_base", "bg": "#fff7e6" } },
  "validations":  { "dv_list": { "criteriaType": "VALUE_IN_LIST", "values": ["A", "B"] } },
  "cells":        { "r_00005_c_00004": { "t": "n", "v": 3, "s": "s_score" } }
}
```

### Styles

Styles are deduplicated to keep files small without losing fidelity.

* The first entry is always `s_base`, the most common style in the sheet. A cell with no `s` field inherits `s_base`.
* Other entries are either standalone (fully populated) or a delta: a `base` pointer plus only the properties that differ. Delta chains are bounded at three levels and are cycle-free.
* No reported property is dropped for merely looking like a default, which prevents silent inheritance bugs.

### Cells

Each cell entry is keyed `r_NNNNN_c_NNNNN` and may carry:

* `v` for the value and `t` for the type (`s` string, `n` number, `b` boolean, `d` date, `f` formula).
* `s` for the style id, omitted when it matches `s_base`.
* `f` for a formula, `l` for a named-range label, and `dv` for a data-validation id.
* `merge` on the top-left cell of a merged range, encoding the additional rows and columns to span.

## Development

```bash
npm install
npm run build      # tsc, then rename outputs to .gs and copy the sidebar HTML + manifest
npm run push       # build, then clasp push --force
npm test           # type-check the suite and run the cucumber tests (excludes @gas)
```

`.clasp.json` holds the Apps Script project id and is not committed; create your own to push to a project you control. See [src/](<src>) for the add-on source, [features/](<features>) for the test suite, and [scripts/](<scripts>) for build and release tooling.

## Help and community

* Questions and ideas: GitHub Discussions on this repository.
* Bugs and support: [g2j.support](<https://g2j.support>).
* Privacy policy and terms: [docs/](<docs>).

## License

Code Transparency v1; see [LICENSE](<LICENSE>). You may view, audit, and submit pull requests. Redistribution, derivative works, and commercial use require a separate license.
