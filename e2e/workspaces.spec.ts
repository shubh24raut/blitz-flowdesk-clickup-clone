import { expect, test, type Page } from "@playwright/test";
import { createFirstWorkspace, createProject, project, signUp, switcher } from "./helpers";

async function createWorkspace(page: Page, name: string) {
  await switcher(page).click();
  await page.getByRole("menuitem", { name: "Create workspace" }).click();
  const dialog = page.getByRole("dialog", { name: "Create workspace" });
  await dialog.getByLabel("Workspace name").fill(name);
  await dialog.getByRole("button", { name: "Create Workspace" }).click();
  await expect(page.getByText("Workspace created successfully")).toBeVisible();
  await expect(switcher(page)).toHaveAccessibleName(new RegExp(name));
}

async function switchTo(page: Page, name: string) {
  await switcher(page).click();
  await page.getByRole("menuitem", { name: new RegExp(name) }).click();
  await expect(page.getByText(`Switched to ${name}`)).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await signUp(page);
  await createFirstWorkspace(page, "Alpha Agency");
});

test("a new workspace starts empty and keeps its data separate", async ({ page }) => {
  await createProject(page, "Alpha Website");

  await createWorkspace(page, "Personal Workspace");
  await page.goto("/projects");
  await expect(page.getByText("No projects yet")).toBeVisible();
  await page.goto("/clients");
  await expect(page.getByText("No clients yet")).toBeVisible();
  await createProject(page, "Side Quest");

  await switchTo(page, "Alpha Agency");
  await page.goto("/projects");
  await expect(project(page, "Alpha Website")).toBeVisible();
  await expect(project(page, "Side Quest")).toHaveCount(0);
});

test("switching away from an open project redirects to the project list", async ({ page }) => {
  await createProject(page, "Alpha Website");
  await createWorkspace(page, "Personal Workspace");
  await switchTo(page, "Alpha Agency");
  await project(page, "Alpha Website").click();
  await expect(page.getByRole("heading", { name: "Alpha Website" })).toBeVisible();

  await switchTo(page, "Personal Workspace");
  await page.waitForURL(/\/projects$/);
  await expect(project(page, "Alpha Website")).toHaveCount(0);
});

test("the owner sees owner controls on the Team page", async ({ page }) => {
  await page.goto("/team");
  await expect(page.getByText("Everyone in Alpha Agency.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Invite Member" })).toBeVisible();
});

test("the workspace survives a reload", async ({ page }) => {
  await createWorkspace(page, "Personal Workspace");
  await switchTo(page, "Alpha Agency");
  await page.reload();
  await expect(switcher(page)).toHaveAccessibleName(/Alpha Agency/);
});

test("phones switch workspace from the More sheet", async ({ page }) => {
  await createWorkspace(page, "Personal Workspace");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/projects");
  await page.getByRole("button", { name: "More" }).click();
  await page.getByRole("button", { name: /^Current workspace: Personal Workspace/ }).click();
  await page.getByRole("dialog", { name: "Workspaces" }).getByRole("button", { name: /Alpha Agency/ }).click();
  await expect(page.getByText("Switched to Alpha Agency")).toBeVisible();
});
