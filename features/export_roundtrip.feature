@gas
Feature: Export round-trips preserve cell content across fixture tabs

  Background:
    Given the fixture sheet has been bootstrapped

  Scenario Outline: <fixture> survives export then import unchanged
    When I run test_export_roundtrip on "<fixture>"
    Then the result is pass

    Examples:
      | fixture          |
      | simple_grid      |
      | with_validations |
      | with_styles      |
      | empty            |
      | large            |
