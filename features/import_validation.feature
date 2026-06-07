@gas
Feature: Import validates JSON shape and creates a correct tab

  Background:
    Given the fixture sheet has been bootstrapped

  Scenario: A well-formed JSON imports to a 2x2 tab with matching values
    When I run test_import_validation
    Then the result is pass
    And the detail contains "values match"
