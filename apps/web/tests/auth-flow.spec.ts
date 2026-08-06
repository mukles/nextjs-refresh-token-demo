import { expect, test, type Page } from "@playwright/test";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "../lib/auth/constants";

const API_PATTERN = "**/api/v1/**";

async function reachOtp(page: Page, mobile: string) {
  await page.goto("/login");
  await page.getByLabel("Mobile Number").fill(mobile);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Enter OTP" })).toBeVisible();
}

async function signIn(page: Page, mobile: string) {
  await reachOtp(page, mobile);
  await page.locator("[data-input-otp]").fill("123456");
  await page.getByRole("button", { name: "Verify & Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByText(new RegExp(`Signed in as.*${mobile}`)),
  ).toBeVisible();
}

test("unauthenticated routes redirect safely and preserve an internal destination", async ({
  page,
}) => {
  await page.goto("/dashboard/settings");
  await expect(page).toHaveURL(/\/login\?from=%2Fdashboard%2Fsettings$/);

  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("login handles API outages without getting stuck", async ({ page }) => {
  await page.route(API_PATTERN, (route) => route.abort("connectionrefused"));
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByText("Something went wrong. Please try again."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled();
});

test("invalid OTP is rejected and resend resets the OTP field", async ({
  page,
}) => {
  await reachOtp(page, "01641146781");
  const otp = page.locator("[data-input-otp]");
  await otp.fill("000000");
  const rejected = page.waitForResponse((response) =>
    response.url().endsWith("/auth/verify-otp"),
  );
  await page.getByRole("button", { name: "Verify & Sign in" }).click();
  const rejectedResponse = await rejected;
  expect(rejectedResponse.status()).toBe(401);
  await expect(rejectedResponse.json()).resolves.toMatchObject({
    message: "Invalid OTP",
  });
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("button", { name: "Verify & Sign in" }),
  ).toBeEnabled();

  await page.getByRole("button", { name: "Resend OTP" }).click();
  await expect(page.getByText("OTP resent!")).toBeVisible();
  await expect(otp).toHaveValue("");
});

test("login creates secure HttpOnly cookies and blocks an external redirect", async ({
  page,
  context,
}) => {
  await page.goto("/login?from=https://example.com/phish");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("[data-input-otp]").fill("123456");
  await page.getByRole("button", { name: "Verify & Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  const cookies = await context.cookies();
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
    const cookie = cookies.find((candidate) => candidate.name === name);
    expect(cookie, `${name} cookie`).toBeTruthy();
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("Lax");
  }
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    ACCESS_COOKIE,
  );
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    REFRESH_COOKIE,
  );
});

test("an expired access token silently refreshes and retries once", async ({
  page,
}) => {
  await signIn(page, "01641146782");
  await page.waitForTimeout(2_300);

  let refreshCalls = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/auth/refresh")) refreshCalls += 1;
  });
  await page.getByRole("button", { name: "Call protected API" }).click();
  await expect(page.getByText("Access token silently refreshed")).toBeVisible();
  expect(refreshCalls).toBe(1);
});

test("updates profile settings and reflects the new name", async ({ page }) => {
  await signIn(page, "01641146787");
  await page.getByRole("link", { name: "Profile settings" }).click();
  await expect(page).toHaveURL(/\/dashboard\/settings$/);
  await page.getByLabel("Display name").fill("Updated Student");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile updated")).toBeVisible();
  await expect(page.getByText("Updated Student")).toBeVisible();
});

test("loads protected auth checks while scrolling", async ({ page }) => {
  await signIn(page, "01641146788");
  await page.getByText("Infinite auth checks").scrollIntoViewIfNeeded();
  await expect(page.getByText("Auth check #1")).toBeVisible();
});

test("Proxy refreshes an expired token before protected SSR", async ({
  page,
  context,
}) => {
  await signIn(page, "01641146786");
  const before = (await context.cookies()).find(
    (cookie) => cookie.name === ACCESS_COOKIE,
  )?.value;
  expect(before).toBeTruthy();
  await page.waitForTimeout(2_300);

  await page.goto("/dashboard/server");
  await expect(page).toHaveURL(/\/dashboard\/server$/);
  await expect(
    page.getByRole("heading", { name: "Server-rendered profile" }),
  ).toBeVisible();
  await expect(page.getByRole("main").getByText("Student 6786")).toBeVisible();

  const after = (await context.cookies()).find(
    (cookie) => cookie.name === ACCESS_COOKIE,
  )?.value;
  expect(after).toBeTruthy();
  expect(after).not.toBe(before);
});

test("missing refresh cookie redirects an expired session to login", async ({
  page,
  context,
}) => {
  await signIn(page, "01641146783");
  const access = (await context.cookies()).find(
    (cookie) => cookie.name === ACCESS_COOKIE,
  );
  await context.clearCookies();
  expect(access).toBeTruthy();
  await context.addCookies([{ ...access!, expires: -1 }]);
  await page.waitForTimeout(2_300);

  await page.getByRole("button", { name: "Call protected API" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(context.cookies()).resolves.toEqual([]);
});

test("a newer device login evicts the older browser session", async ({
  browser,
}) => {
  const first = await browser.newContext();
  const second = await browser.newContext();
  const firstPage = await first.newPage();
  const secondPage = await second.newPage();
  try {
    await signIn(firstPage, "01641146784");
    await signIn(secondPage, "01641146784");
    await firstPage.getByRole("button", { name: "Call protected API" }).click();
    await expect(firstPage).toHaveURL(/\/login$/);
    await expect(secondPage).toHaveURL(/\/dashboard$/);
  } finally {
    await first.close();
    await second.close();
  }
});

test("logout clears cookies and protects dashboard navigation", async ({
  page,
  context,
}) => {
  await signIn(page, "01641146785");
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(context.cookies()).resolves.toEqual([]);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?from=%2Fdashboard$/);
});
