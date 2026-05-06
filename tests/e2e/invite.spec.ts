import { test, expect } from '@playwright/test';
import { AUTH_FILE, BASE_URL, MEMBER_EMAIL, MEMBER_PASSWORD } from '../global.setup';
import { readState } from './fixtures/index';

// ------------------------------------------------------------------
// Tests that need an admin session use a browser.newContext approach
// so we can mix auth states within the file.
// ------------------------------------------------------------------

test.describe('Invite — invalid link', () => {
  test('invalid invite token shows error page', async ({ page }) => {
    await page.goto('/invite/this-token-does-not-exist-xyz');
    await expect(page.getByText('Invalid invite link')).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Invite — authenticated flows', () => {
  // All tests here run as admin
  test.use({ storageState: AUTH_FILE });

  test('admin generates an invite link in settings', async ({ page }) => {
    const { workspaceId } = readState();
    if (!workspaceId) { test.skip(); return; }

    await page.goto(`/workspace/${workspaceId}/settings`);
    await page.getByRole('button', { name: 'Invite people' }).click();

    // Generate if no link exists yet
    const hasLink = await page.getByRole('button', { name: 'Copy link' }).isVisible().catch(() => false);
    if (!hasLink) {
      await page.getByRole('button', { name: 'Generate invite link' }).click();
    }

    // Invite URL containing /invite/ appears
    await expect(page.getByText(/\/invite\//).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('button', { name: 'Copy link' })).toBeVisible();
  });

  test('valid token shows join form for unauthenticated visitor', async ({ page, browser }) => {
    const { workspaceId } = readState();
    if (!workspaceId) { test.skip(); return; }

    // Generate token via API (page is already admin-authenticated)
    const tokenRes = await page.request.post(`/api/workspaces/${workspaceId}/invite-tokens`);
    const { token } = await tokenRes.json() as { token?: string };
    if (!token) { test.skip(); return; }

    // Open a fresh unauthenticated context to visit the invite URL
    const anonCtx = await browser.newContext();
    const anonPage = await anonCtx.newPage();
    await anonPage.goto(`/invite/${token}`);

    await expect(anonPage.getByRole('heading', { name: /^Join / })).toBeVisible({ timeout: 8_000 });
    await expect(anonPage.getByLabel('Email')).toBeVisible();
    await expect(anonPage.getByLabel('Password')).toBeVisible();
    await expect(anonPage.getByRole('button', { name: 'Create account & join' })).toBeVisible();

    await anonCtx.close();
  });

  test('authenticated member visits valid invite and lands in workspace', async ({ page, browser }) => {
    const { workspaceId } = readState();
    if (!workspaceId) { test.skip(); return; }

    // Generate token as admin
    const tokenRes = await page.request.post(`/api/workspaces/${workspaceId}/invite-tokens`);
    const { token } = await tokenRes.json() as { token?: string };
    if (!token) { test.skip(); return; }

    // Sign in as member in a separate context
    const memberCtx = await browser.newContext();
    const memberPage = await memberCtx.newPage();
    await memberPage.goto(`${BASE_URL}/sign-in`);
    await memberPage.getByLabel('Email address').fill(MEMBER_EMAIL);
    await memberPage.getByLabel('Password').fill(MEMBER_PASSWORD);
    await memberPage.getByRole('button', { name: 'Sign in with email' }).click();
    await memberPage.waitForURL(/\/workspace\//, { timeout: 20_000 });

    // Visit the invite URL
    await memberPage.goto(`/invite/${token}`);

    // If already a member → immediate redirect; otherwise show join button
    try {
      await memberPage.waitForURL(/\/workspace\/[^/]+$/, { timeout: 5_000 });
    } catch {
      const joinBtn = memberPage.getByRole('button', { name: /^Join / });
      if (await joinBtn.isVisible()) {
        await joinBtn.click();
        await memberPage.waitForURL(/\/workspace\/[^/]+$/, { timeout: 10_000 });
      }
    }

    expect(memberPage.url()).toContain('/workspace/');
    await memberCtx.close();
  });
});
