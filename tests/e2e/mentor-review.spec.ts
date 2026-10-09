import { expect, test } from "@playwright/test";
import { activeMember, MENTOR, PASSWORD, signIn, signOut } from "./helpers";

test("mentor flags a task, sends the day back, member sees it", async ({ page }) => {
  const m = await activeMember("Priya");
  await signIn(page, m.email, PASSWORD);
  await page.waitForURL("**/dashboard");
  await page.goto("/tasks");
  await page.getByLabel("What did you do?").fill("Diwali key visual, round 2");
  await page.getByLabel("Type of work").selectOption({ label: "Design" });
  await page.getByRole("button", { name: "Add to Creative log" }).click();
  await expect(page.getByText("Diwali key visual, round 2")).toBeVisible();
  await page.getByRole("button", { name: /Send day to/ }).click();
  await expect(page.getByText("Sent for review")).toBeVisible();
  await signOut(page);

  await signIn(page, MENTOR.email, MENTOR.password);
  await page.waitForURL("**/dashboard");
  await page.goto("/mentor?tab=tasks");
  const task = page.getByRole("listitem").filter({ hasText: "Diwali key visual, round 2" }).filter({ hasText: m.name });
  await task.getByRole("button", { name: "Flag", exact: true }).click();
  await task.getByLabel("Flag note").fill("Add the file link");
  await task.getByRole("button", { name: "Flag", exact: true }).last().click();
  await expect(task.getByRole("button", { name: "Flagged" })).toBeVisible();

  await page.goto("/mentor");
  const item = page.getByRole("listitem").filter({ hasText: m.name }).filter({ hasText: "Diwali key visual" });
  await item.getByRole("button", { name: "Send back" }).click();
  await item.getByLabel("What needs fixing?").fill("Please link the project");
  await item.getByRole("button", { name: "Send back" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: m.name }).filter({ hasText: "Diwali key visual" })).toHaveCount(0);
  await signOut(page);

  await signIn(page, m.email, PASSWORD);
  await page.waitForURL("**/dashboard");
  await page.goto("/tasks");
  await expect(page.getByText("Flagged by your mentor.")).toBeVisible();
  await expect(page.getByText("Add the file link")).toBeVisible();
  await expect(page.getByText("Please link the project")).toBeVisible();
});

test("a mentor cannot edit a member's task (no edit controls, RLS blocks writes)", async ({ page }) => {
  await signIn(page, MENTOR.email, MENTOR.password);
  await page.waitForURL("**/dashboard");
  await page.goto("/mentor?tab=tasks");
  await expect(page.getByRole("button", { name: /^Remove/ })).toHaveCount(0);
});
