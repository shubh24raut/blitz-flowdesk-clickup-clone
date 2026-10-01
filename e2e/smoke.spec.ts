import { expect, test } from "@playwright/test";
import { E2E_PASSWORD, e2eEmail, signIn, signUp } from "./helpers";

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

test("the app requires a real session", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForURL("**/login");
});

test("sign up lands a new account on onboarding", async ({ page }) => {
  await signUp(page);
  await expect(page.getByRole("heading", { name: "Welcome to FlowDesk" })).toBeVisible();
});

test("wrong passwords and unknown emails are rejected", async ({ page }) => {
  const email = await signUp(page);
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("not-the-password-9");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Incorrect email or password.")).toBeVisible();

  await page.getByLabel("Email address").fill(e2eEmail());
  await page.getByLabel("Password", { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Incorrect email or password.")).toBeVisible();
});

test("signing out ends the session", async ({ page }) => {
  const email = await signUp(page);
  await page.getByRole("button", { name: "Log out" }).click();
  await page.waitForURL("**/login");
  await page.goto("/dashboard");
  await page.waitForURL("**/login");
  // And signing back in works.
  await signIn(page, email);
  await page.waitForURL("**/onboarding");
});
