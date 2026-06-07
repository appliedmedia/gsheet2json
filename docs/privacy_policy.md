# Privacy Policy

**Effective date:** 2026-04-15
**Last updated:** 2026-04-15
**Add-on:** gsheet2json (Google Workspace Marketplace)

## Overview

gsheet2json is a Google Sheets add-on that exports spreadsheet data to JSON and imports JSON back into Sheets. This policy explains what data the add-on accesses, how it is used, and how it is stored.

## Data the Add-on Accesses

### Spreadsheet Content

gsheet2json reads cell values, formulas, formatting, data validations, row heights, column widths, and named ranges from the active spreadsheet. This data is used solely to build the JSON export. During import, the add-on writes this data back into a new sheet tab.

* **OAuth scope:** `spreadsheets.currentonly` -- limits access to the spreadsheet the user has open

### Google Drive

Exported JSON files are saved to Google Drive in the same folder as the source spreadsheet. The add-on also lists recent .json files in Drive so users can select one for import.

* **OAuth scope:** `drive.file` -- limits access to files the add-on creates or the user explicitly opens

### User Properties

Settings (export toggles, default destination) and license state (trial start date, cached license status) are stored in Google Apps Script UserProperties, which are scoped to the individual user and the add-on. These values never leave the user's Google account.

### Email Address

The add-on requests the `userinfo.email` scope to identify the current user for licensing purposes. The email address is not stored, logged, or transmitted outside of Google's own licensing infrastructure.

## Data the Add-on Does Not Access

* Contacts, calendar, or Gmail
* Other spreadsheets beyond the one currently open
* Files in Drive beyond those the add-on creates or the user explicitly selects

## External Servers

gsheet2json does not send data to any external server. All processing happens within Google Apps Script. No analytics, telemetry, or tracking services are used.

## Data Retention

* **Exported JSON files** remain in the user's Google Drive under their control. The add-on does not delete or modify them after creation.
* **UserProperties** (settings, license cache) persist until the user uninstalls the add-on or clears them manually.
* **No server-side storage** exists. There is no database, no backend, and no logs outside of Google's own infrastructure.

## Third Parties

No data is shared with third parties. The add-on has no external dependencies, does not embed third-party scripts, and does not make network requests outside of Google APIs.

## Children's Privacy

gsheet2json is not directed at children under 13 and does not knowingly collect information from children.

## Changes to This Policy

If this policy changes, the updated version will be published at the same URL with a new "Last updated" date. Continued use of the add-on after a policy update constitutes acceptance of the revised terms.

## Contact

For questions about this privacy policy or the add-on's data practices, open an issue at:

[g2j.support](<https://g2j.support>)
