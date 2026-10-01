import { expect, type Page } from "@playwright/test";

/** E2E accounts are real Better Auth users; global-teardown.ts deletes every `e2e.*@example.com` account. */
export const E2E_EMAIL_PATTERN = "e2e.%@example.com";
export const E2E_PASSWORD = "e2e-password-1";

export function e2eEmail(): string {
  return `e2e.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/** Signs up a fresh account and lands on onboarding. */
export async function signUp(page: Page, name = "E2E Tester"): Promise<string> {
  const email = e2eEmail();
  await page.goto("/signup");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/onboarding");
  return email;
}

export async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

/** Onboarding → first workspace → dashboard. */
export async function createFirstWorkspace(page: Page, name: string) {
  await page.getByLabel("Workspace name").fill(name);
  await page.getByRole("button", { name: "Create Workspace" }).click();
  await page.waitForURL("**/dashboard");
  await expect(switcher(page)).toHaveAccessibleName(new RegExp(name));
}

export function switcher(page: Page) {
  return page.getByRole("button", { name: /^Current workspace:/ });
}

/** A project card on the Projects page (the sidebar may list starred ones too). */
export function project(page: Page, name: string) {
  return page.locator("#main").getByRole("link", { name, exact: true });
}

export async function createProject(page: Page, name: string) {
  await page.goto("/projects");
  await page.getByRole("button", { name: "New Project" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Create project" });
  await dialog.getByLabel("Project name").fill(name);
  await dialog.getByRole("button", { name: "Create project", exact: true }).click();
  await expect(project(page, name)).toBeVisible();
}
