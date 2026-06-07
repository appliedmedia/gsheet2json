Feature: As a developer with not a lot of time, I want a suite of single-line tests that all pass

  Background:
    Given the gsheet2json pure logic is loaded

  Scenario: Pure logic invariants
    Then valueKey(null) is "__null__"
    And valueKey(undefined) is "__null__"
    And valueKey("") is ""
    And valueKey("foo") is "foo"
    And valueKey(42) is "42"
    And valueKey(true) is "true"
    And valueKey({"a":1}) is '{"a":1}'
    And styleKey({}) is "{}"
    And styleKey({"bg":"#fff"}) is '{"bg":"#fff"}'
    And styleKey({"bg":"#fff","fontWeight":"bold"}) is '{"bg":"#fff","fontWeight":"bold"}'
    And styleKey({"fontSize":10}) is '{"fontSize":10}'
    And resolveValue("hello", {}) is "hello"
    And resolveValue(42, {}) is 42
    And resolveValue(null, {}) is null
    And resolveValue(undefined, {}) is null
    And resolveValue("=label_0", {"label_0":"repeated"}) is "repeated"
    And resolveValue("=label_1", {"label_1":99}) is 99
    And resolveValue("=label_missing", {}) is "=label_missing"
