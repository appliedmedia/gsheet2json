@dom
Feature: Sidebar copy-toast surfaces brief feedback at the cursor

  The sidebar's `showToast(message, x, y)` helper is the user-visible feedback
  channel for clipboard copies (activity-row error details, validation status).
  It should pop a small toast near the cursor that auto-dismisses, and center
  in the viewport when no coordinates are supplied.

  Background:
    Given the sidebar is loaded in jsdom

  Scenario: showToast with cursor coordinates positions below the cursor
    When I call window.showToast with arguments "Copied", 100, 200
    Then the element "#copyToast" has class "visible"
    And the element "#copyToast" text is "Copied"
    And the element "#copyToast" style "left" is "100px"
    And the element "#copyToast" style "top" is "220px"

  Scenario: showToast without coordinates centers in the viewport
    When I call window.showToast with arguments "Saved"
    Then the element "#copyToast" has class "visible"
    And the element "#copyToast" text is "Saved"
    And the element "#copyToast" style "left" is ""
    And the element "#copyToast" style "top" is ""

  Scenario: showToast falls back to the default message when none is provided
    When I call window.showToast with arguments
    Then the element "#copyToast" text is "Copied to clipboard"
