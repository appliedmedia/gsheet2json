@static
Feature: Pre-submit Marketplace hygiene

  Background:
    Given the source tree at "src/" is present

  Scenario: No alert() calls in server-side TS (would crash; UI alerts in HTML are intentional fallbacks)
    When I scan "src/*.ts" for "alert("
    Then no occurrences are found

  Scenario: No unsafe innerHTML assignments in server-side TS (server has no DOM)
    When I scan "src/*.ts" for "innerHTML ="
    Then no occurrences are found

  Scenario: OAuth scopes are minimal and on the allowlist
    Given the allowlist of approved scopes
    When I read appsscript.json scopes
    Then every scope is on the allowlist
    And the scope set exactly matches the allowlist

  Scenario: Required legal and asset files exist
    Then "docs/privacy_policy.md" exists and is non-empty
    And "docs/terms_of_service.md" exists and is non-empty
    And "assets/marketplace_listing.yaml" exists and parses as YAML
    And "docs/screenshot_plan.md" lists 5 screenshots

  Scenario: Vanity URLs only -- no baked-in github.io references in shippable files
    When I scan "src/" "docs/" "assets/" for "github.io"
    Then no occurrences are found

  Scenario: Version constants agree across files
    Then VERSION in "src/main.ts" equals version in "package.json"
    And VERSION in "src/main.ts" equals appVersion in "assets/marketplace_listing.yaml"

  Scenario: appsscript.json is shaped for an Editor add-on (no Workspace addOns block)
    Then appsscript.json has no key "addOns"
    And appsscript.json has key "oauthScopes"
