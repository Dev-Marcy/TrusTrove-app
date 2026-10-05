import { expect } from "@playwright/test";
import { test } from "./fixtures/freighter";

test.use({ skipOnboardingTour: false });

test("walks through onboarding and can relaunch it on demand", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Connect Wallet/i }).click();
  await expect(page.getByText(/GBMOCK\.\.\.XXXX/i)).toBeVisible();

  const dialog = page.getByTestId("onboarding-tour");
  const stepHeading = dialog.getByRole("heading");

  await expect(stepHeading).toHaveText("Welcome to TrusTrove");

  await dialog.getByRole("button", { name: "Next" }).click();
  await expect(stepHeading).toHaveText("Pick your role");
  await dialog.getByRole("button", { name: "Next" }).click();
  await expect(stepHeading).toHaveText("Your wallet balances");

  await dialog.getByRole("button", { name: "Back" }).click();
  await expect(stepHeading).toHaveText("Pick your role");
  await dialog.getByRole("button", { name: "Next" }).click();

  for (const title of [
    "Your wallet balances",
    "SME Dashboard",
    "LP Portal",
    "Marketplace",
    "Profile & verification",
    "You're all set",
  ]) {
    await expect(stepHeading).toHaveText(title);
    if (title !== "You're all set") {
      await dialog.getByRole("button", { name: "Next" }).click();
    }
  }

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.localStorage.getItem("trusttrove:onboarding-tour-seen"),
      ),
    )
    .toBe("true");

  await page.reload();
  await page.getByRole("button", { name: /Connect Wallet/i }).click();
  await expect(dialog).toHaveCount(0);

  await page.getByRole("button", { name: "Take the tour" }).click();
  await expect(stepHeading).toHaveText("Welcome to TrusTrove");
});