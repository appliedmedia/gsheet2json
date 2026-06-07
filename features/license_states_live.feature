@gas
Feature: License state resolution returns a valid status

  Scenario: getLicenseState resolves to trial, paid, or expired
    When I run test_license_states_with_mock_api
    Then the result is pass
