import { expect, test } from '../../src/fixtures';

// Runs only in the "mobile" project (Pixel 7 viewport, touch, mobile user agent)
test.describe('Responsive - mobile', { tag: '@mobile' }, () => {
  test('a customer can log in on a phone', async ({ page, loginPage, store, customer }) => {
    await loginPage.login(customer.email, customer.password);

    await expect(page).toHaveURL(/\/home$/);
    await expect(store.heading).toBeVisible();
  });

  test('the login form fits the screen without horizontal scroll', async ({ page, loginPage }) => {
    await loginPage.goto();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(loginPage.submit).toBeInViewport();
  });

  test.describe('logged in', () => {
    test.use({ loginAs: 'customer' });

    test('the navigation collapses behind a menu toggle', async ({ store, nav }) => {
      await store.goto();

      await expect(nav.menuToggle).toBeVisible();
      await expect(nav.logout).toBeHidden();
    });
  });
});
