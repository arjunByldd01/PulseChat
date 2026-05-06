import { test as base, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

export interface TestState {
  workspaceId: string | null;
}

export function readState(): TestState {
  try {
    const raw = fs.readFileSync(path.join('tests', '.auth', 'state.json'), 'utf-8');
    return JSON.parse(raw) as TestState;
  } catch {
    return { workspaceId: null };
  }
}

export const test = base;
export { expect };
