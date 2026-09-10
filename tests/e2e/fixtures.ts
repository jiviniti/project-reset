import { expect, test as base } from "@playwright/test";

export const test = base.extend<{ cspViolations: string[] }>({
  cspViolations: [async ({ page }, use) => {
    const violations: string[] = [];
    page.on("console", (message) => {
      if (/content security policy|violates the following.*directive/i.test(message.text())) {
        violations.push(message.text());
      }
    });
    await use(violations);
    expect(violations, "browser CSP violations").toEqual([]);
  }, { auto: true }],
});

export { expect };
