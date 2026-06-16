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

  Scenario: Vanity URLs only -- no baked-in github.io references in shippable files
    When I scan "src/" "docs/" "assets/" for "github.io"
    Then no occurrences are found

  Scenario: Version constant stays current within tolerance
    Then VERSION in "src/main.ts" is within 10 of version in "package.json"

  Scenario: appsscript.json is shaped for an Editor add-on (no Workspace addOns block)
    Then appsscript.json has no key "addOns"
    And appsscript.json has key "oauthScopes"
