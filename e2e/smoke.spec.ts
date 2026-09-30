import { expect, test } from "@playwright/test";

test("login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
});

test("landing page is public and links into the app", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Clients, projects and your team");
  await page.getByRole("link", { name: "Get started free" }).click();
  await page.waitForURL("**/signup");
});

test("the live demo button signs in to the demo workspace", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try the live demo" }).click();
  await page.waitForURL("**/dashboard");
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Open FlowDesk" }).first()).toBeVisible();
});
