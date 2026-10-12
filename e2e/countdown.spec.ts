import { expect, test } from '@playwright/test';

const targetDate = '2099-12-24';

test('creates a countdown and manages its appointments', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('empty-state')).toContainText('No countdown configured');

  await page.getByRole('link', { name: 'Create one' }).click();
  await page.getByTestId('add-countdown').click();

  const countdownDialog = page.getByRole('dialog');
  await countdownDialog.getByLabel('Target date').fill(targetDate);
  await countdownDialog.getByLabel('Description').fill('Christmas');
  await countdownDialog.getByTestId('save').click();

  await page.getByRole('link', { name: 'Back to countdown' }).click();
  await expect(page.getByTestId('current-date')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/);

  await page.getByRole('link', { name: 'Administration' }).click();
  const countdown = page.locator('main li').filter({ hasText: 'Christmas' });
  await expect(countdown).toContainText(targetDate);
  await countdown.getByRole('link').click();
  await expect(page.getByTestId('target-date')).toHaveText(targetDate);

  await page.getByTestId('add-appointment').click();
  const appointmentDialog = page.getByRole('dialog');
  await appointmentDialog.getByLabel('Title').fill('Advent');
  await appointmentDialog.getByLabel('Date').fill('2099-12-01');
  await appointmentDialog.getByTestId('save').click();
  await expect(page.getByText('Advent', { exact: true })).toBeVisible();

  await page.getByTestId('add-appointment').click();
  const invalidAppointment = page.getByRole('dialog');
  await invalidAppointment.getByLabel('Title').fill('Too late');
  await invalidAppointment.getByLabel('Date').fill('2099-12-25');
  await expect(invalidAppointment.getByTestId('date-error')).toBeVisible();
  await expect(invalidAppointment.getByTestId('save')).toBeDisabled();
  await invalidAppointment.getByTestId('cancel').click();

  await page.getByRole('button', { name: 'Edit Advent' }).click();
  const editDialog = page.getByRole('dialog');
  await editDialog.getByLabel('Title').fill('Advent begins');
  await editDialog.getByTestId('save').click();
  await expect(page.getByText('Advent begins', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Delete Advent begins' }).click();
  await page.getByRole('dialog').getByTestId('confirm').click();
  await expect(page.getByText('Advent begins', { exact: true })).toHaveCount(0);
});

test('switches language and remembers it after reload', async ({ page }) => {
  await page.goto('/#/admin');

  await page.getByTestId('language-switch').click();
  await page.getByTestId('language-option-de').click();
  await expect(page.getByTestId('add-countdown')).toHaveAttribute('aria-label', 'Neuer Countdown');

  await page.reload();
  await expect(page.getByTestId('language-switch')).toContainText('de');
  await expect(page.getByTestId('add-countdown')).toHaveAttribute('aria-label', 'Neuer Countdown');
});
