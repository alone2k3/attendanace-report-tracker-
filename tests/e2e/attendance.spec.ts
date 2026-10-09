import { expect, test } from "@playwright/test";
import { activeMember, PASSWORD, signIn } from "./helpers";

test("member checks in and out", async ({ page }) => {
  const m = await activeMember("Ravi", "production");
  await signIn(page, m.email, PASSWORD);
  await page.waitForURL("**/dashboard");
  await expect(page.getByText("Not checked in yet")).toBeVisible();
  await page.getByRole("button", { name: "Check in now" }).click();
  await expect(page.getByText(/Checked in at \d{1,2}:\d{2} (AM|PM)/)).toBeVisible();
  await page.getByRole("button", { name: "Check out" }).click();
  await expect(page.getByText("Done for today")).toBeVisible();
  // Under 4 h 30 m worked, so it's a half day.
  await expect(page.getByText("Half day").first()).toBeVisible();

  await page.goto("/attendance");
  await expect(page.getByRole("heading", { name: /\w+ \d{4}/ })).toBeVisible();
});

test("phone layout works at 360 px with no sideways scroll", async ({ page }) => {
  const m = await activeMember("Meena", "finance");
  await page.setViewportSize({ width: 360, height: 760 });
  await signIn(page, m.email, PASSWORD);
  await page.waitForURL("**/dashboard");
  for (const path of ["/dashboard", "/tasks", "/attendance", "/projects", "/departments/finance"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${path} scrolls sideways`).toBeLessThanOrEqual(0);
  }
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Daily tasks" })).toBeVisible();
});

test("cron routes reject calls without the secret", async ({ request }) => {
  expect((await request.get("/api/cron/reminder")).status()).toBe(401);
  expect((await request.get("/api/cron/digest", { headers: { authorization: "Bearer wrong" } })).status()).toBe(401);
  expect((await request.get("/api/cron/digest", { headers: { authorization: "Bearer e2e-cron-secret" } })).status()).toBe(200);
});
