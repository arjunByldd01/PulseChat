import { test, expect } from '@playwright/test';
import { AUTH_FILE } from '../global.setup';
import { readState } from './fixtures/index';

test.use({ storageState: AUTH_FILE });

test.describe('Workspace', () => {
  test('create a new workspace and land on its home page', async ({ page }) => {
    await page.goto('/workspace/new');
    await page.getByLabel('Workspace name').fill(`E2E Workspace ${Date.now()}`);
    await page.getByRole('button', { name: 'Next' }).click();

    await page.waitForURL(/\/workspace\/[^/]+$/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/workspace\/[^/]+$/);
  });

  test('workspace home shows empty-state prompt', async ({ page }) => {
    const { workspaceId } = readState();
    if (!workspaceId) { test.skip(); return; }

    await page.goto(`/workspace/${workspaceId}`);
    await expect(page.getByText("It's looking a bit empty")).toBeVisible({ timeout: 10_000 });
  });

  test('workspace settings page loads for admin', async ({ page }) => {
    const { workspaceId } = readState();
    if (!workspaceId) { test.skip(); return; }

    await page.goto(`/workspace/${workspaceId}/settings`);
    await expect(page.getByRole('button', { name: 'Members' })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('button', { name: 'Channels' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Invite people' })).toBeVisible();
  });

  test('non-member cannot access another workspace', async ({ page }) => {
    await page.goto('/workspace/completely-fake-id-xyz');
    await page.waitForURL(/\/(workspace\/[^/]+$|sign-in)/, { timeout: 8_000 });
    expect(page.url()).not.toContain('completely-fake-id-xyz');
  });
});
