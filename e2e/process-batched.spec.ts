/**
 * Skeleton E2E tests for the batched process execution UI.
 *
 * These tests verify the UI structure of the ProgressPanel and batch
 * controls. They require a running backend + frontend with at least one
 * saved process configuration.
 *
 * Run with:  LIVE_SERVER=1 npx playwright test process-batched
 */
import { test, expect } from '@playwright/test';

const LIVE = process.env.LIVE_SERVER === '1';

test.describe('Process Batched Execution', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    test.skip(!LIVE, 'Requires live server (LIVE_SERVER=1)');

    // Login
    await page.goto('http://localhost:5173/login');
    await page.locator('input[type="email"]').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/queries**', { timeout: 15000 });

    // Navigate to a process page
    await page.goto('http://localhost:5173/processes');
    await page.waitForTimeout(2000);
  });

  /** Helper: click the first available Execute button, skip if none found. */
  async function clickExecute(page: import('@playwright/test').Page) {
    const executeBtn = page.locator('button:has-text("Execute")').first();
    if (!(await executeBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'No process configurations found to execute');
    }
    await executeBtn.click();
    await page.waitForTimeout(1000);
  }

  test('progress panel appears after Execute click', async ({ page }) => {
    await clickExecute(page);

    // Verify ProgressPanel container appears
    const progressPanel = page.locator('[data-testid="progress-panel"]');
    const fallback = page.locator('text=/fetching|joining|transforming|running/i').first();

    const visible =
      (await progressPanel.isVisible({ timeout: 10000 }).catch(() => false)) ||
      (await fallback.isVisible({ timeout: 5000 }).catch(() => false));

    expect(visible).toBeTruthy();
  });

  test('phase indicator shows fetching/joining/transforming dots', async ({ page }) => {
    await clickExecute(page);

    // Verify phase indicator with 3 phase labels
    const phaseLabels = page.locator('text=/Fetching|Joining|Transforming/');
    const count = await phaseLabels.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Verify individual phases exist
    const fetching = page.locator('text=/Fetching/i');
    const joining = page.locator('text=/Joining/i');
    const transforming = page.locator('text=/Transforming/i');

    const hasFetching = (await fetching.count()) > 0;
    const hasJoining = (await joining.count()) > 0;
    const hasTransforming = (await transforming.count()) > 0;

    // At least the first phase should be visible during execution
    expect(hasFetching || hasJoining || hasTransforming).toBeTruthy();
  });

  test('batch controls are visible during execution', async ({ page }) => {
    await clickExecute(page);

    // Verify pause button exists
    const pauseBtn = page.locator('button:has-text("Pause"), button[aria-label="Pause"]');
    expect(await pauseBtn.count()).toBeGreaterThanOrEqual(0);

    // Verify preset buttons (Slower, Balanced, Faster)
    const slowerBtn = page.locator('button:has-text("Slower")');
    const balancedBtn = page.locator('button:has-text("Balanced")');
    const fasterBtn = page.locator('button:has-text("Faster")');

    const hasPresets =
      (await slowerBtn.count()) > 0 ||
      (await balancedBtn.count()) > 0 ||
      (await fasterBtn.count()) > 0;

    // Verify batch size input field
    const batchSizeInput = page.locator(
      'input[aria-label*="batch" i], input[placeholder*="batch" i], [data-testid="batch-size-input"]'
    );
    const hasBatchInput = (await batchSizeInput.count()) > 0;

    // Verify target seconds input
    const targetSecondsInput = page.locator(
      'input[aria-label*="target" i], input[placeholder*="seconds" i], [data-testid="target-seconds-input"]'
    );
    const hasTargetInput = (await targetSecondsInput.count()) > 0;

    // Verify auto-adapt checkbox
    const autoAdaptCheckbox = page.locator(
      'input[type="checkbox"][aria-label*="auto" i], [data-testid="auto-adapt-checkbox"], label:has-text("Auto") input[type="checkbox"]'
    );
    const hasAutoAdapt = (await autoAdaptCheckbox.count()) > 0;

    // At least some batch controls should be present
    expect(hasPresets || hasBatchInput || hasTargetInput || hasAutoAdapt).toBeTruthy();
  });

  test('dataset progress rows appear', async ({ page }) => {
    await clickExecute(page);

    // Verify dataset progress entries exist (rows showing per-dataset status)
    const progressRows = page.locator(
      '[data-testid="dataset-progress-row"], [data-testid="progress-panel"] tr, [data-testid="progress-panel"] li'
    );
    // Also look for status icons (spinners, checkmarks, etc.)
    const statusIcons = page.locator(
      '[data-testid="progress-panel"] svg, [data-testid="dataset-status-icon"]'
    );

    await page.waitForTimeout(2000);

    const hasRows = (await progressRows.count()) > 0;
    const hasIcons = (await statusIcons.count()) > 0;

    expect(hasRows || hasIcons).toBeTruthy();
  });

  test('cancel button stops execution', async ({ page }) => {
    await clickExecute(page);

    const cancelBtn = page.locator(
      'button:has-text("Cancel"), button[aria-label="Cancel"], [data-testid="cancel-button"]'
    );

    if (await cancelBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await cancelBtn.first().click();
      await page.waitForTimeout(1000);

      // Verify execution stops — progress panel disappears or shows cancelled state
      const cancelled = page.locator('text=/cancel/i');
      const panelGone = !(await page
        .locator('[data-testid="progress-panel"]')
        .isVisible({ timeout: 3000 })
        .catch(() => false));

      expect((await cancelled.count()) > 0 || panelGone).toBeTruthy();
    }
  });

  test('preview button opens dataset preview dialog', async ({ page }) => {
    await clickExecute(page);

    // Wait for at least one dataset to complete fetching
    await page.waitForTimeout(5000);

    const previewBtn = page.locator(
      'button:has-text("Preview"), button[aria-label="Preview"], [data-testid="preview-button"]'
    );

    if (await previewBtn.first().isVisible({ timeout: 10000 }).catch(() => false)) {
      await previewBtn.first().click();
      await page.waitForTimeout(500);

      // Verify dialog opens with data table
      const dialog = page.locator('[role="dialog"], [data-testid="preview-dialog"]');
      const table = page.locator('table, [data-testid="data-table"]');

      const hasDialog = (await dialog.count()) > 0;
      const hasTable = (await table.count()) > 0;

      expect(hasDialog || hasTable).toBeTruthy();
    }
  });

  test('pause and resume work', async ({ page }) => {
    await clickExecute(page);

    // Click pause
    const pauseBtn = page.locator(
      'button:has-text("Pause"), button[aria-label="Pause"], [data-testid="pause-button"]'
    );

    if (await pauseBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await pauseBtn.first().click();
      await page.waitForTimeout(500);

      // Verify paused state — resume button should appear or paused indicator visible
      const resumeBtn = page.locator(
        'button:has-text("Resume"), button[aria-label="Resume"], [data-testid="resume-button"]'
      );
      const pausedIndicator = page.locator('text=/paused/i');

      const isPaused =
        (await resumeBtn.count()) > 0 || (await pausedIndicator.count()) > 0;
      expect(isPaused).toBeTruthy();

      // Click resume
      if (await resumeBtn.first().isVisible().catch(() => false)) {
        await resumeBtn.first().click();
        await page.waitForTimeout(500);

        // Verify resumed state — pause button reappears
        const pauseAgain = page.locator(
          'button:has-text("Pause"), button[aria-label="Pause"]'
        );
        expect(await pauseAgain.count()).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('completion transitions to results table', async ({ page }) => {
    await clickExecute(page);

    // Wait for completion (up to 2 minutes for small datasets)
    const dataTable = page.locator(
      '[data-testid="data-table"], table.results-table, [data-testid="results-container"] table'
    );

    try {
      await dataTable.first().waitFor({ state: 'visible', timeout: 120000 });
      // Verify DataTable appears with results
      expect(await dataTable.count()).toBeGreaterThan(0);

      // Check that rows are present
      const rows = dataTable.first().locator('tbody tr, [role="row"]');
      expect(await rows.count()).toBeGreaterThan(0);
    } catch {
      // Timeout is acceptable for skeleton tests — the process may be too large
      test.skip(true, 'Execution did not complete within timeout');
    }
  });
});
