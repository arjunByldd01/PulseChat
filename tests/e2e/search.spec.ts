import { test, expect } from '@playwright/test';
import { AUTH_FILE } from '../global.setup';
import { readState } from './fixtures/index';

test.use({ storageState: AUTH_FILE });

test.describe('Search overlay', () => {
  test('clicking the top-bar search button opens the overlay', async ({ page }) => {
    const { workspaceId } = readState();
    if (!workspaceId) { test.skip(); return; }

    await page.goto(`/workspace/${workspaceId}`);

    // Top-bar search trigger (aria-label contains "Search")
    await page.getByLabel(/^Search /).first().click();

    // Overlay input is visible and focused
    const searchInput = page.locator('input[placeholder*="Search across"]');
    await expect(searchInput).toBeVisible({ timeout: 5_000 });
    await expect(searchInput).toBeFocused();
  });

  test('empty search shows recent searches section', async ({ page }) => {
    const { workspaceId } = readState();
    if (!workspaceId) { test.skip(); return; }

    await page.goto(`/workspace/${workspaceId}`);
    await page.getByLabel(/^Search /).first().click();

    await expect(page.getByText('Recent searches')).toBeVisible({ timeout: 5_000 });
    // At least one static recent search chip should be visible
    await expect(page.getByText('standup')).toBeVisible();
  });

  test('typing hides recent searches and shows workspace chip', async ({ page }) => {
    const { workspaceId } = readState();
    if (!workspaceId) { test.skip(); return; }

    await page.goto(`/workspace/${workspaceId}`);
    await page.getByLabel(/^Search /).first().click();

    const searchInput = page.locator('input[placeholder*="Search across"]');
    await searchInput.fill('hello');

    // Recent searches hidden
    await expect(page.getByText('Recent searches')).not.toBeVisible();

    // Workspace search chip appears
    await expect(page.getByText(/Search in/)).toBeVisible();
    await expect(page.getByText('Enter')).toBeVisible();
  });

  test('Escape key closes the overlay', async ({ page }) => {
    const { workspaceId } = readState();
    if (!workspaceId) { test.skip(); return; }

    await page.goto(`/workspace/${workspaceId}`);
    await page.getByLabel(/^Search /).first().click();

    await expect(page.locator('input[placeholder*="Search across"]')).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press('Escape');

    await expect(page.locator('input[placeholder*="Search across"]')).not.toBeVisible({ timeout: 3_000 });
  });

  test('sidebar search button also opens the overlay', async ({ page }) => {
    const { workspaceId } = readState();
    if (!workspaceId) { test.skip(); return; }

    await page.goto(`/workspace/${workspaceId}`);

    // Sidebar has a second search button (aria-label="Search …")
    const sidebarSearch = page.locator('aside').getByLabel(/^Search /);
    await expect(sidebarSearch).toBeVisible({ timeout: 5_000 });
    await sidebarSearch.click();

    await expect(page.locator('input[placeholder*="Search across"]')).toBeVisible({ timeout: 5_000 });
  });
});
