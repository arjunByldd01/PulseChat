import { test, expect } from '@playwright/test';
import { AUTH_FILE } from '../global.setup';
import { readState } from './fixtures/index';

test.use({ storageState: AUTH_FILE });

test.describe('Channels', () => {
  test('create a channel and see it in the sidebar', async ({ page }) => {
    const { workspaceId } = readState();
    if (!workspaceId) { test.skip(); return; }

    await page.goto(`/workspace/${workspaceId}`);

    // Click "Add a channel" in sidebar
    await page.getByRole('button', { name: 'Add a channel' }).click();

    // Fill in channel name in dialog
    const channelName = `e2e-chan-${Date.now()}`;
    await page.getByLabel('Channel name').fill(channelName);
    await page.getByRole('button', { name: 'Create channel' }).click();

    // Channel appears as a link in the sidebar
    await expect(page.getByRole('link', { name: `# ${channelName}` })).toBeVisible({ timeout: 8_000 });
  });

  test('navigate to a channel and see the channel header', async ({ page }) => {
    const { workspaceId } = readState();
    if (!workspaceId) { test.skip(); return; }

    await page.goto(`/workspace/${workspaceId}`);

    // Create a channel to navigate to
    await page.getByRole('button', { name: 'Add a channel' }).click();
    const channelName = `e2e-nav-${Date.now()}`;
    await page.getByLabel('Channel name').fill(channelName);
    await page.getByRole('button', { name: 'Create channel' }).click();

    // Click the channel in the sidebar
    await page.getByRole('link', { name: `# ${channelName}` }).click();
    await page.waitForURL(/\/channel\//, { timeout: 8_000 });

    // Channel name appears in the header
    await expect(page.getByRole('heading', { name: channelName }).or(
      page.locator('h2').filter({ hasText: channelName })
    )).toBeVisible({ timeout: 5_000 });
  });

  test('message composer is visible in a channel', async ({ page }) => {
    const { workspaceId } = readState();
    if (!workspaceId) { test.skip(); return; }

    await page.goto(`/workspace/${workspaceId}`);

    // Create and navigate to a channel
    await page.getByRole('button', { name: 'Add a channel' }).click();
    const channelName = `e2e-msg-${Date.now()}`;
    await page.getByLabel('Channel name').fill(channelName);
    await page.getByRole('button', { name: 'Create channel' }).click();
    await page.getByRole('link', { name: `# ${channelName}` }).click();
    await page.waitForURL(/\/channel\//, { timeout: 8_000 });

    // Composer textarea is present
    const composer = page.getByLabel(`Message #${channelName}`);
    await expect(composer).toBeVisible({ timeout: 5_000 });
  });

  test('channel tabs (Messages, Bookmarks, Files) are interactive', async ({ page }) => {
    const { workspaceId } = readState();
    if (!workspaceId) { test.skip(); return; }

    await page.goto(`/workspace/${workspaceId}`);

    await page.getByRole('button', { name: 'Add a channel' }).click();
    const channelName = `e2e-tabs-${Date.now()}`;
    await page.getByLabel('Channel name').fill(channelName);
    await page.getByRole('button', { name: 'Create channel' }).click();
    await page.getByRole('link', { name: `# ${channelName}` }).click();
    await page.waitForURL(/\/channel\//, { timeout: 8_000 });

    // Messages tab is selected by default
    const messagesTab = page.getByRole('tab', { name: 'Messages' });
    await expect(messagesTab).toHaveAttribute('aria-selected', 'true');

    // Clicking Bookmarks switches the active tab
    await page.getByRole('tab', { name: 'Bookmarks' }).click();
    await expect(page.getByRole('tab', { name: 'Bookmarks' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Coming soon')).toBeVisible();
  });
});
