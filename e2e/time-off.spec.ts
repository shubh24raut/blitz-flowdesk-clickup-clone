import { expect, test, type Page } from "@playwright/test";

const FIXED_HOLIDAYS = ["01-26", "05-01", "08-15", "10-02", "12-25"];

/** A weekday ~10 weeks out that isn't a seeded holiday, as yyyy-MM-dd. */
function freeWorkingDay(): string {
  const d = new Date();
  d.setDate(d.getDate() + 70);
  for (;;) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const weekday = d.getDay() !== 0 && d.getDay() !== 6;
    if (weekday && !FIXED_HOLIDAYS.includes(key.slice(5))) return key;
    d.setDate(d.getDate() + 1);
  }
}

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("demo@flowdesk.com");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/dashboard");
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("request a day off and see it pending", async ({ page }) => {
  await page.goto(`/time-off?request=${freeWorkingDay()}`);
  const dialog = page.getByRole("dialog", { name: "Request time off" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("1 day", { exact: true })).toBeVisible();
  await dialog.getByLabel("Reason").fill("Dentist");
  await dialog.getByRole("button", { name: "Send request" }).click();

  await expect(page.getByText("Request sent for approval")).toBeVisible();
  const myRequests = page.locator("section", { has: page.getByRole("heading", { name: "My requests" }) });
  await expect(myRequests.getByText("Dentist")).toBeVisible();
  await expect(myRequests.getByText("Pending").first()).toBeVisible();
});

test("an owner approves a teammate's request", async ({ page }) => {
  await page.goto("/time-off?tab=approvals");
  const row = page.getByRole("listitem").filter({ hasText: "Mayuri Shah" });
  await row.getByRole("button", { name: "Approve" }).click();
  const dialog = page.getByRole("dialog", { name: "Approve leave" });
  await dialog.getByRole("button", { name: "Approve" }).click();

  await expect(page.getByText("Mayuri Shah's leave approved")).toBeVisible();
  const decisions = page.locator("section", { has: page.getByRole("heading", { name: "Recent decisions" }) });
  await expect(decisions.getByText("Mayuri Shah")).toBeVisible();
});

test("an owner can't approve their own request", async ({ page }) => {
  await page.goto(`/time-off?request=${freeWorkingDay()}`);
  await page.getByRole("dialog").getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText("Request sent for approval")).toBeVisible();
  await page.getByRole("tab", { name: /Approvals/ }).click();
  const own = page.getByRole("listitem").filter({ hasText: "Sachin Darde" });
  await expect(own.getByText("Needs another admin")).toBeVisible();
  await expect(own.getByRole("button", { name: "Approve" })).toHaveCount(0);
});

test("reviewers see which days were not counted", async ({ page }) => {
  // A Friday → Monday request ~10 weeks out, clear of the seeded holidays.
  const friday = new Date();
  friday.setDate(friday.getDate() + 70);
  while (friday.getDay() !== 5 || FIXED_HOLIDAYS.includes(`${String(friday.getMonth() + 1).padStart(2, "0")}-${String(friday.getDate()).padStart(2, "0")}`)) {
    friday.setDate(friday.getDate() + 1);
  }
  const monday = new Date(friday);
  monday.setDate(friday.getDate() + 3);
  const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const long = (d: Date) =>
    `${d.toLocaleDateString("en-GB", { weekday: "long" })}, ${d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`;

  await page.goto(`/time-off?request=${key(friday)}`);
  const dialog = page.getByRole("dialog", { name: "Request time off" });
  await dialog.locator("#leave-end").click();
  // Weekends are labelled in the picker.
  const saturday = new Date(friday);
  saturday.setDate(friday.getDate() + 1);
  await expect(page.getByRole("button", { name: `${long(saturday)}, Weekend` })).toBeVisible();
  await page.getByRole("button", { name: long(monday), exact: true }).click();

  await expect(dialog.getByText("Not counted: 2 weekend days")).toBeVisible();
  await dialog.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText("Request sent for approval")).toBeVisible();

  await page.getByRole("tab", { name: /Approvals/ }).click();
  const waiting = page.locator("section", { has: page.getByRole("heading", { name: "Waiting for approval" }) });
  const row = waiting.getByRole("listitem").filter({ hasText: "Sachin Darde" });
  await expect(row.getByText("· 2 days")).toBeVisible();
  await expect(row.getByText("Not counted: 2 weekend days")).toBeVisible();
});

test("holidays tab lists national and company holidays", async ({ page }) => {
  await page.goto("/time-off?tab=holidays");
  await expect(page.getByText("Republic Day")).toBeVisible();
  await expect(page.getByText("Independence Day")).toBeVisible();
});
