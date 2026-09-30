import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("demo@flowdesk.com");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/dashboard");
}

/** A project card on the Projects page (the sidebar may list starred ones too). */
function project(page: Page, name: string) {
  return page.locator("#main").getByRole("link", { name, exact: true });
}

function switcher(page: Page) {
  return page.getByRole("button", { name: /^Current workspace:/ });
}

async function switchTo(page: Page, name: string) {
  await switcher(page).click();
  await page.getByRole("menuitem", { name: new RegExp(name) }).click();
  await expect(page.getByText(`Switched to ${name}`)).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("switching workspace changes the projects", async ({ page }) => {
  await page.goto("/projects");
  await expect(switcher(page)).toHaveAccessibleName(/Dream Kasper LLP/);
  await expect(project(page, "Website Redesign")).toBeVisible();

  await switchTo(page, "Northwind Studio");
  await expect(switcher(page)).toHaveAccessibleName(/Northwind Studio/);
  await expect(project(page, "Bloom Bakery Rebrand")).toBeVisible();
  await expect(project(page, "Website Redesign")).toHaveCount(0);

  // Sachin is only a Member here, so the Team page offers no invite button.
  await page.goto("/team");
  await expect(page.getByText("Everyone in Northwind Studio.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Invite Member" })).toHaveCount(0);
});

test("switching away from an open project redirects to the project list", async ({ page }) => {
  await page.goto("/projects/p_web/tasks");
  await expect(page.getByRole("heading", { name: "Website Redesign" })).toBeVisible();
  await switchTo(page, "Northwind Studio");
  await page.waitForURL("**/projects");
  await expect(project(page, "Bloom Bakery Rebrand")).toBeVisible();
  await expect(project(page, "Website Redesign")).toHaveCount(0);
});

test("creating a workspace switches to it, and Dream Kasper stays intact", async ({ page }) => {
  await switcher(page).click();
  await page.getByRole("menuitem", { name: "Create workspace" }).click();

  const dialog = page.getByRole("dialog", { name: "Create workspace" });
  await dialog.getByLabel("Workspace name").fill("Personal Workspace");
  await expect(dialog.getByLabel("Workspace URL")).toHaveValue("personal-workspace");
  await dialog.getByRole("button", { name: "Create Workspace" }).click();

  await expect(page.getByText("Workspace created successfully")).toBeVisible();
  await page.waitForURL("**/dashboard");
  await expect(switcher(page)).toHaveAccessibleName(/Personal Workspace/);

  await page.goto("/projects");
  await expect(page.getByText("No projects yet")).toBeVisible();
  await page.goto("/clients");
  await expect(page.getByText("No clients yet")).toBeVisible();

  // Work created here stays here.
  await page.goto("/projects");
  await page.getByRole("button", { name: "New Project" }).first().click();
  const projectDialog = page.getByRole("dialog", { name: "Create project" });
  await projectDialog.getByLabel("Project name").fill("Side Quest");
  await projectDialog.getByRole("button", { name: "Create project", exact: true }).click();
  await expect(project(page, "Side Quest")).toBeVisible();

  await switchTo(page, "Dream Kasper LLP");
  await page.goto("/projects");
  await expect(project(page, "Website Redesign")).toBeVisible();
  await expect(project(page, "Side Quest")).toHaveCount(0);
  await page.goto("/team");
  await expect(page.getByRole("table").getByText("Aditya Patil")).toBeVisible();
});

test("the workspace survives a reload", async ({ page }) => {
  await switchTo(page, "Northwind Studio");
  await page.reload();
  await expect(switcher(page)).toHaveAccessibleName(/Northwind Studio/);
});

test("phones switch workspace from the More sheet", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/projects");
  await page.getByRole("button", { name: "More" }).click();
  await page.getByRole("button", { name: /^Current workspace: Dream Kasper LLP/ }).click();
  await page.getByRole("dialog", { name: "Workspaces" }).getByRole("button", { name: /Northwind Studio/ }).click();
  await expect(page.getByText("Switched to Northwind Studio")).toBeVisible();
  await expect(project(page, "Bloom Bakery Rebrand")).toBeVisible();
});
