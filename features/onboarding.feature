@gas
Feature: Onboarding first-run flag flips on dismiss

  Scenario: Reset UserProperties, dismissOnboarding clears isFirstRun
    When I run test_onboarding with reset "true"
    Then the result is pass
