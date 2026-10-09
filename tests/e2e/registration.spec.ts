import { expect, test } from "@playwright/test";
import { MENTOR, PASSWORD, signIn, signOut } from "./helpers";

test("register, mentor approves, member signs in and posts a task", async ({ page }) => {
  const email = `divya.${Date.now()}@example.com`;
  const name = `Divya E2E ${Date.now() % 10000}`;

  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Creative", exact: true }).click();
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("heading", { name: "Waiting for your mentor" })).toBeVisible();
  await expect(page.getByText(`${MENTOR.name} will confirm it before you can sign in`)).toBeVisible();

  // Pending accounts can't sign in.
  await signIn(page, email, PASSWORD);
  await expect(page.getByText("Your registration is waiting for a mentor to confirm your department.")).toBeVisible();

  // Mentor approves, correcting the department to Production.
  await signIn(page, MENTOR.email, MENTOR.password);
  await page.waitForURL("**/dashboard");
  await page.goto("/mentor/people");
  const row = page.getByRole("listitem").filter({ hasText: email });
  await row.getByLabel(`Department for ${name}`).selectOption({ label: "Production" });
  await row.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText(`${name} approved into Production (tagged Creative)`)).toBeVisible();
  await signOut(page);

  // Member signs in, sees only their own department, and posts a task.
  await signIn(page, email, PASSWORD);
  await page.waitForURL("**/dashboard");
  const nav = page.getByRole("complementary");
  await expect(nav.getByRole("link", { name: "Production", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Finance", exact: true })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Creative", exact: true })).toHaveCount(0);

  await page.goto("/tasks");
  await expect(page.getByText("You can only post to Production")).toBeVisible();
  await page.getByLabel("What did you do?").fill("Recce at the Bandra location");
  await page.getByLabel("Type of work").selectOption({ label: "Recce" });
  await page.getByLabel("Location").fill("Bandra");
  await page.getByRole("button", { name: "Add to Production log" }).click();
  await expect(page.getByText("Recce at the Bandra location")).toBeVisible();

  await page.getByLabel("What did you do?").fill("Call sheet for Friday");
  await page.getByRole("button", { name: "In progress" }).click();
  await page.getByRole("button", { name: "Add to Production log" }).click();
  await expect(page.getByText("Call sheet for Friday")).toBeVisible();

  // Toggle one, then send the day.
  await page.getByRole("button", { name: /Status: In progress/ }).click();
  await expect(page.getByRole("button", { name: /Status: In progress/ })).toHaveCount(0);
  await page.getByRole("button", { name: /Send day to/ }).click();
  await expect(page.getByText("Sent for review")).toBeVisible();

  // The other department's page is not reachable.
  // (With a loading boundary the response streams as 200, so check what's shown.)
  await page.goto("/departments/finance");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByText("Today's updates")).toHaveCount(0);
});
