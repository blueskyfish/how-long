import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

async function uploadBackup(page: Page, content: string): Promise<void> {
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Import from JSON' }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(content),
  });
}

async function createExistingCountdown(page: Page): Promise<void> {
  await page.goto('/#/admin');
  await page.getByTestId('add-countdown').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Target date').fill('2099-12-24');
  await dialog.getByLabel('Description').fill('Existing');
  await dialog.getByTestId('save').click();
  await expect(page.locator('main li')).toHaveCount(1);
}

test('exports a backup and imports it alongside existing countdowns', async ({ page }) => {
  await createExistingCountdown(page);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export as JSON' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^how-long-\d{4}-\d{2}-\d{2}\.json$/);
  const downloadPath = await download.path();
  if (!downloadPath) {
    throw new Error('The backup download has no file path.');
  }
  const backupText = await readFile(downloadPath);
  const exported = JSON.parse(backupText.toString());
  expect(exported.countdowns).toHaveLength(1);
  expect(exported.countdowns[0]).toMatchObject({ date: '2099-12-24', description: 'Existing' });

  await uploadBackup(
    page,
    JSON.stringify({
      version: 1,
      exportedAt: '2099-01-01T00:00:00.000Z',
      countdowns: [{ date: '2099-06-01', description: 'Imported', appointments: [] }],
    }),
  );
  await page.getByRole('dialog').getByTestId('merge').click();
  await expect(page.locator('main li')).toHaveCount(2);
  await expect(page.locator('main')).toContainText('Existing');
  await expect(page.locator('main')).toContainText('Imported');

  await uploadBackup(
    page,
    JSON.stringify({
      version: 1,
      exportedAt: '2099-01-01T00:00:00.000Z',
      countdowns: [{ date: '2099-07-01', description: 'Replacement', appointments: [] }],
    }),
  );
  await page.getByRole('dialog').getByTestId('replace').click();
  await expect(page.locator('main li')).toHaveCount(1);
  await expect(page.locator('main')).toContainText('Replacement');
  await expect(page.locator('main')).not.toContainText('Existing');
});

test('rejects malformed backups without changing stored countdowns', async ({ page }) => {
  await createExistingCountdown(page);
  await uploadBackup(page, '{ not json');

  await expect(page.getByText('Import failed: The file is not valid JSON.')).toBeVisible();
  await expect(page.locator('main li')).toHaveCount(1);
  await expect(page.locator('main')).toContainText('Existing');
});
