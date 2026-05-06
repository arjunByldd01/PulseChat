import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

export const ADMIN_EMAIL = 'pw-admin@test.local';
export const ADMIN_PASSWORD = 'Playwright123!';
export const ADMIN_NAME = 'PW Admin';

export const MEMBER_EMAIL = 'pw-member@test.local';
export const MEMBER_PASSWORD = 'Playwright123!';
export const MEMBER_NAME = 'PW Member';

export const AUTH_FILE = path.join('tests', '.auth', 'admin.json');
export const STATE_FILE = path.join('tests', '.auth', 'state.json');

async function register(email: string, password: string, name: string) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok && res.status !== 409) {
    console.warn(`[setup] register ${email} → ${res.status}`);
  }
}

export default async function globalSetup() {
  await fs.mkdir(path.join('tests', '.auth'), { recursive: true });

  // Ensure test users exist (409 = already registered, that's fine)
  await register(ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME);
  await register(MEMBER_EMAIL, MEMBER_PASSWORD, MEMBER_NAME);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Sign in as admin
  await page.goto(`${BASE_URL}/sign-in`);
  await page.getByLabel('Email address').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in with email' }).click();

  // May land on /workspace/new if the admin has no workspaces yet
  await page.waitForURL(/\/(workspace|$)/, { timeout: 20_000 });

  if (page.url().includes('/workspace/new')) {
    await page.getByLabel('Workspace name').fill('PW Test Workspace');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForURL(/\/workspace\/[^/]+$/, { timeout: 10_000 });
  }

  // Extract workspace ID from URL
  const match = /\/workspace\/([^/?#]+)/.exec(page.url());
  const workspaceId = match?.[1] ?? null;

  // Save auth cookies
  await context.storageState({ path: AUTH_FILE });

  // Save workspace ID for use in specs
  await fs.writeFile(STATE_FILE, JSON.stringify({ workspaceId }));

  await browser.close();

  console.log(`[setup] admin auth saved — workspaceId: ${workspaceId ?? 'unknown'}`);
}
