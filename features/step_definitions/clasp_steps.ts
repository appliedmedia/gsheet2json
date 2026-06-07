import { Given, When, Then } from '@cucumber/cucumber';
import { execSync } from 'node:child_process';
import assert from 'node:assert/strict';
import type { TestWorld, GasResult } from '../support/world.js';

function runClasp(fnName: string, params: unknown[]): GasResult {
  const paramJson = JSON.stringify(params);
  const cmd = `npx clasp run ${fnName} --params '${paramJson}'`;
  let stdout = '';
  try {
    stdout = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    const err = e as { stderr?: string; stdout?: string; message: string };
    throw new Error(
      `clasp run ${fnName} failed:\nstderr: ${err.stderr || '(none)'}\nstdout: ${err.stdout || '(none)'}\nmsg: ${err.message}`,
    );
  }

  const trimmed = stdout.trim();
  // clasp run prints the return value as JSON. Try whole-string parse first.
  try {
    return JSON.parse(trimmed) as GasResult;
  } catch (_) {
    // Fallthrough: look for a JSON object containing "pass"
    const match = trimmed.match(/\{[\s\S]*"pass"[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as GasResult;
      } catch (_) { /* fall through */ }
    }
    throw new Error(`Could not parse clasp run output for ${fnName}: ${trimmed.slice(0, 500)}`);
  }
}

Given('the fixture sheet has been bootstrapped', function (this: TestWorld) {
  this.lastGasResult = runClasp('bootstrap_fixtures', []);
  this.lastGasFn = 'bootstrap_fixtures';
  assert.equal(
    this.lastGasResult.pass,
    true,
    `bootstrap_fixtures failed: ${this.lastGasResult.detail}`,
  );
});

When('I run {word} on {string}', function (this: TestWorld, fnName: string, arg: string) {
  this.lastGasResult = runClasp(fnName, [arg]);
  this.lastGasFn = fnName;
});

When('I run {word} with reset {string}', function (this: TestWorld, fnName: string, reset: string) {
  this.lastGasResult = runClasp(fnName, [reset === 'true']);
  this.lastGasFn = fnName;
});

When('I run {word}', function (this: TestWorld, fnName: string) {
  this.lastGasResult = runClasp(fnName, []);
  this.lastGasFn = fnName;
});

Then('the result is pass', function (this: TestWorld) {
  assert.ok(this.lastGasResult, 'no gas result recorded');
  assert.equal(
    this.lastGasResult!.pass,
    true,
    `Expected pass but got fail: ${this.lastGasResult!.detail}`,
  );
});

Then('the result is fail', function (this: TestWorld) {
  assert.ok(this.lastGasResult, 'no gas result recorded');
  assert.equal(
    this.lastGasResult!.pass,
    false,
    `Expected fail but got pass: ${this.lastGasResult!.detail}`,
  );
});

Then('the detail contains {string}', function (this: TestWorld, needle: string) {
  assert.ok(this.lastGasResult, 'no gas result recorded');
  assert.ok(
    this.lastGasResult!.detail.includes(needle),
    `Expected detail to contain "${needle}", got: ${this.lastGasResult!.detail}`,
  );
});
