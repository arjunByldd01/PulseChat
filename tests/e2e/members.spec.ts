import { test, expect } from '@playwright/test';
import { AUTH_FILE } from '../global.setup';
import { readState } from './fixtures/index';

test.use({ storageState: AUTH_FILE });

test.describe('Members modal', () => {
  async function openChannelWithMembers(page: import('@playwright/test').Page, workspaceId: string): Promise<void> {
    await page.goto(`/workspace/${workspaceId}`);

    // Create a channel to land in
    await page.getByRole('button', { name: 'Add a channel' }).click();
    const channelName = `e2e-members-${Date.now()}`;
    await page.getByLabel('Channel name').fill(channelName);
    await page.getByRole('button', { name: 'Create channel' }).click();
    await page.getByRole('link', { name: `# ${channelName}` }).click();
    await page.waitForURL(/\/channel\//, { timeout: 8_000 });
  }

  test('Members button opens the members modal', async ({ page }) => {
    const { workspaceId } = readState();
    if (!workspaceId) { test.skip(); return; }

    await openChannelWithMembers(page, workspaceId);

    await page.getByRole('button', { name: 'Members' }).click();

    // Dialog with title "Members" appears
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible();
  });

  test('members modal shows at least the current user', async ({ page }) => {
    const { workspaceId } = readState();
    if (!workspaceId) { test.skip(); return; }

    await openChannelWithMembers(page, workspaceId);
    await page.getByRole('button', { name: 'Members' }).click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    // At minimum the admin user (PW Admin) should appear
    await expect(page.getByText('PW Admin')).toBeVisible({ timeout: 8_000 });
    // Current user row shows "(you)" label
    await expect(page.getByText('(you)')).toBeVisible();
  });

  test('Find members input filters the member list', async ({ page }) => {
    const { workspaceId } = readState();
    if (!workspaceId) { test.skip(); return; }

    await openChannelWithMembers(page, workspaceId);
    await page.getByRole('button', { name: 'Members' }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    // Type a search term that matches admin
    await page.getByLabel('Find members').fill('PW Admin');
    await expect(page.getByText('PW Admin')).toBeVisible();

    // Type something that matches nothing
    await page.getByLabel('Find members').fill('xyzxyzxyz-no-match');
    await expect(page.getByText('No members found')).toBeVisible({ timeout: 3_000 });
  });

  test('modal closes when Escape is pressed', async ({ page }) => {
    const { workspaceId } = readState();
    if (!workspaceId) { test.skip(); return; }

    await openChannelWithMembers(page, workspaceId);
    await page.getByRole('button', { name: 'Members' }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3_000 });
  });
});
