import { expect, test } from '@playwright/test';

test('shows the app version and repository in the About overlay', async ({ page }) => {
  await page.goto('/');

  const versionLabel = page.getByTestId('about-button');
  await expect(versionLabel).toHaveText(/^\s*v\d+\.\d+\.\d+\s*$/);
  const displayedVersion = (await versionLabel.textContent())?.trim();
  await versionLabel.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'About' })).toBeVisible();
  await expect(dialog.locator('p').nth(1)).toHaveText(`Version ${displayedVersion?.slice(1)}`);

  const repositoryLink = dialog.getByRole('link', { name: 'GitHub repository' });
  await expect(repositoryLink).toHaveAttribute('href', 'https://github.com/blueskyfish/how-long');
  await expect(repositoryLink).toHaveAttribute('target', '_blank');
});
