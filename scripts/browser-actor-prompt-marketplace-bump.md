<!-- scripts/browser-actor-prompt-marketplace-bump.md Copyright (c) 2005...2026-06-16.001:a@cov.in + Applied Media. All Rights Reserved. Do Not Distribute. -->

# Marketplace SDK Version Bump — Browser Actor Prompt

The final manual step of every publish: after `npm run deploy` creates Apps Script version `NEW_VER` and points the marketplace deployment at it, the **"Sheets Add-on Script Version"** field in the Google Workspace Marketplace SDK config must be bumped to `NEW_VER` and saved. There is no API for this field (confirmed 2026-06-16), so Claude drives it through Claude-in-Chrome.

Claude executes each step via the `mcp__claude-in-chrome__*` tools. The console page is a normal same-origin SPA (unlike the add-on sidebar iframe), so `find` / `read_page` return real element refs, prefer those over raw coordinates.

## Inputs

* `NEW_VER`: the Apps Script version number just deployed. Read it from the deploy output line `Version will be x.y.NEW_VER (Apps Script vNEW_VER)`, or the `from <current> to <NEW_VER>` manual-step line.
* Project: `am-gsheet2json`.
* Config page: [https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/googleworkspacemarketplace?project=am-gsheet2json](<https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/googleworkspacemarketplace?project=am-gsheet2json>) (the **App Configuration** tab of the Marketplace SDK). If that path 404s or lands on the API overview, navigate to the Marketplace SDK and open **App Configuration** manually.

## Prereqs (verify before starting)

* The operator is already **signed in** to the Google Cloud Console in this Chrome profile. Claude must NOT enter credentials, complete sign-in, or solve any login/2FA challenge. If the page shows a sign-in or consent wall, stop and ask the operator to sign in, then resume.
* `npm run deploy` has completed and `NEW_VER` is known.

## Step 0 — Open the page

Call `mcp__claude-in-chrome__tabs_context_mcp`. Reuse the existing console tab if one is open; otherwise `tabs_create_mcp` and `navigate` to the config page URL above. Wait up to 10 seconds for it to load. If a sign-in wall appears, stop and ask the operator (see prereqs).

## Step 1 — Locate the version field

Use `find` with query "Sheets Add-on Script Version input field". If not found, `read_page` (filter interactive) and locate the input whose label/nearby text contains "Sheets Add-on Script Version" (it may read "Script Version" or "Add-on Script Version" depending on console copy). Capture its element ref. Take a screenshot to confirm visually.

## Step 2 — Check current value

Read the field's current value.

* If it already equals `NEW_VER`: nothing to do. Report "already at NEW_VER" and stop.
* Otherwise note the current value (this is the real "from" for the report).

## Step 3 — Set the new value

Focus the field (click its ref), select-all (`cmd+a`), and type `NEW_VER`. Do NOT touch any other field on the page. Screenshot to confirm the field now shows `NEW_VER`.

## Step 4 — Save

Find the **Save** button for the App Configuration form (query "Save button"). Before clicking, confirm in a screenshot that only the version field changed and the value is `NEW_VER`. Click Save. Wait up to 10 seconds for a success toast / the form to settle.

## Step 5 — Verify

Re-read the version field (or reload the page and re-find it). Confirm it persisted as `NEW_VER`. Report: "Marketplace script version saved: `<old>` -> `NEW_VER`." If the save did not persist, do not retry blindly, screenshot and surface the page state to the operator.

## Guardrails

* Never enter passwords, 2FA codes, or complete sign-in. That is operator-only.
* Change ONLY the "Sheets Add-on Script Version" field. Do not edit scopes, OAuth, store listing, or any other config.
* Save is an irreversible publish-affecting action; only click it after confirming the single intended change in a screenshot.
* Prefer `find`/`read_page` refs over coordinates, the console layout shifts and coordinate clicks are unreliable.

<!-- end scripts/browser-actor-prompt-marketplace-bump.md -->
