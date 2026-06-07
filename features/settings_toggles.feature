@gas
Feature: User settings persist through PropertiesService

  Scenario: Toggling ignoredDriveFileNames persists and reverts cleanly
    When I run test_settings_toggles
    Then the result is pass
