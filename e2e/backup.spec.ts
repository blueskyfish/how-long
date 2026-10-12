import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

type BackupData = {
  countdowns: Array<{
    date: string;
    description?: string;
    appointments: Array<{ date: string; title: string; color: string; icon: string }>;
  }>;
};

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

async function downloadBackup(page: Page): Promise<{ json: string; backup: BackupData }> {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export as JSON' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^how-long-\d{4}-\d{2}-\d{2}\.json$/);
  const downloadPath = await download.path();
  if (!downloadPath) {
    throw new Error('The backup download has no file path.');
  }

  const json = await readFile(downloadPath, 'utf8');
  return { json, backup: JSON.parse(json) as BackupData };
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

  const { backup: exported } = await downloadBackup(page);
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

test('[#23] round-trips the downloaded backup and preserves data after a rejected import', async ({
  page,
}) => {
  await createExistingCountdown(page);
  await page.locator('main li').filter({ hasText: 'Existing' }).getByRole('link').click();

  await page.getByTestId('add-appointment').click();
  const appointmentDialog = page.getByRole('dialog');
  await appointmentDialog.getByLabel('Title').fill('Synthetic milestone');
  await appointmentDialog.getByLabel('Date').fill('2099-12-01');
  await appointmentDialog.getByTestId('save').click();
  await expect(page.getByText('Synthetic milestone', { exact: true })).toBeVisible();

  await page.goto('/#/admin');
  const { json: originalJson, backup: original } = await downloadBackup(page);
  expect(original.countdowns).toHaveLength(1);
  expect(original.countdowns[0]).toMatchObject({
    date: '2099-12-24',
    description: 'Existing',
    appointments: [
      expect.objectContaining({
        date: '2099-12-01',
        title: 'Synthetic milestone',
      }),
    ],
  });

  const invalid = JSON.parse(originalJson) as BackupData;
  invalid.countdowns[0].appointments[0].date = '2099-12-25';
  await uploadBackup(page, JSON.stringify(invalid));
  await expect(
    page.getByText(/Import failed:.*countdowns\[0\]\.appointments\[0\]\.date/),
  ).toBeVisible();

  await page.reload();
  await expect(page.locator('main li')).toHaveCount(1);
  const { backup: afterRejectedImport } = await downloadBackup(page);
  expect(afterRejectedImport.countdowns).toEqual(original.countdowns);

  await uploadBackup(page, originalJson);
  await page.getByRole('dialog').getByTestId('merge').click();
  await expect(page.locator('main li')).toHaveCount(2);

  await page.reload();
  await expect(page.locator('main li')).toHaveCount(2);
  const { backup: afterRoundTrip } = await downloadBackup(page);
  expect(afterRoundTrip.countdowns).toEqual([original.countdowns[0], original.countdowns[0]]);
});

test('rejects malformed backups without changing stored countdowns', async ({ page }) => {
  await createExistingCountdown(page);
  await uploadBackup(page, '{ not json');

  await expect(page.getByText('Import failed: The file is not valid JSON.')).toBeVisible();
  await expect(page.locator('main li')).toHaveCount(1);
  await expect(page.locator('main')).toContainText('Existing');
});
