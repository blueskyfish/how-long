import { expect, test } from '@playwright/test';

test('shows the app version and repository in the About overlay', async ({ page }) => {
  await page.goto('/');

  const versionLabel = page.getByTestId('about-button');
  await expect(versionLabel).toHaveText(/^\s*v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\s*$/);
  const displayedVersion = (await versionLabel.textContent())?.trim();
  await versionLabel.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'About' })).toBeVisible();
  const logo = dialog.locator('img');
  await expect(logo).toBeVisible();
  await expect
    .poll(() => logo.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);
  await expect(logo).toHaveAttribute('src', './logo.svg');
  await expect
    .poll(() =>
      logo.evaluate((image: HTMLImageElement) => {
        const bounds = image.getBoundingClientRect();
        return Math.max(bounds.width, bounds.height);
      }),
    )
    .toBeLessThanOrEqual(196);
  await expect(logo).toHaveCSS('border-radius', '14px');

  const appName = dialog.locator('p').first();
  const version = dialog.locator('p').nth(1);
  await expect(appName).toHaveText('How long');
  const appNameSize = await appName.evaluate((element) => getComputedStyle(element).fontSize);
  const versionSize = await version.evaluate((element) => getComputedStyle(element).fontSize);
  expect(parseFloat(appNameSize)).toBeGreaterThan(parseFloat(versionSize));

  const heading = dialog.getByRole('heading', { name: 'About' });
  const closeButton = dialog.getByTestId('close');
  await expect(closeButton).toHaveAccessibleName('Close');
  await expect(closeButton.locator('ng-icon')).toBeVisible();
  await expect(dialog.locator('ng-icon')).toHaveCount(1);
  const [headingBounds, closeBounds] = await Promise.all([
    heading.boundingBox(),
    closeButton.boundingBox(),
  ]);
  expect(headingBounds).not.toBeNull();
  expect(closeBounds).not.toBeNull();
  if (headingBounds && closeBounds) {
    const headingCenter = headingBounds.y + headingBounds.height / 2;
    const closeCenter = closeBounds.y + closeBounds.height / 2;
    expect(Math.abs(headingCenter - closeCenter)).toBeLessThanOrEqual(1);
  }

  await expect(dialog.locator('p').nth(1)).toHaveText(`Version ${displayedVersion?.slice(1)}`);

  const repositoryLink = dialog.getByRole('link', {
    name: 'https://github.com/blueskyfish/how-long',
  });
  await expect(repositoryLink).toHaveAttribute('href', 'https://github.com/blueskyfish/how-long');
  await expect(repositoryLink).toHaveAttribute('target', '_blank');
});
