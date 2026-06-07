import { Given, When, Then } from '@cucumber/cucumber';
import { strict as assert } from 'node:assert';
import { TestWorld } from '../support/world.ts';
import { loadSidebar } from '../support/sidebar_loader.ts';

Given('the sidebar is loaded in jsdom', function (this: TestWorld) {
  loadSidebar(this);
});

When(
  'I call window.{word} with arguments {string}, {int}, {int}',
  function (this: TestWorld, fn: string, arg0: string, arg1: number, arg2: number) {
    invokeWindowFn(this, fn, [arg0, arg1, arg2]);
  },
);

When(
  'I call window.{word} with arguments {string}',
  function (this: TestWorld, fn: string, arg0: string) {
    invokeWindowFn(this, fn, [arg0]);
  },
);

When('I call window.{word} with arguments', function (this: TestWorld, fn: string) {
  invokeWindowFn(this, fn, []);
});

Then(
  'the element {string} has class {string}',
  function (this: TestWorld, selector: string, className: string) {
    const el = requireElement(this, selector);
    assert.ok(
      el.classList.contains(className),
      `Expected ${selector} to have class "${className}"; got "${el.className}"`,
    );
  },
);

Then(
  'the element {string} text is {string}',
  function (this: TestWorld, selector: string, expected: string) {
    const el = requireElement(this, selector);
    assert.equal((el.textContent ?? '').trim(), expected);
  },
);

Then(
  'the element {string} style {string} is {string}',
  function (this: TestWorld, selector: string, prop: string, expected: string) {
    const el = requireElement(this, selector) as HTMLElement;
    const actual = el.style.getPropertyValue(prop);
    assert.equal(actual, expected);
  },
);

function invokeWindowFn(world: TestWorld, fn: string, args: unknown[]): void {
  const target = (world.window as unknown as Record<string, unknown>)[fn];
  if (typeof target !== 'function') {
    throw new Error(`window.${fn} is not a function`);
  }
  (target as (...a: unknown[]) => unknown)(...args);
}

function requireElement(world: TestWorld, selector: string): Element {
  const el = world.document.querySelector(selector);
  if (!el) throw new Error(`No element matched ${selector}`);
  return el;
}
