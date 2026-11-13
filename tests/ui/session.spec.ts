import { expect, test } from '../../src/fixtures';

test.describe('Session', () => {
  for (const privatePage of ['/home', '/minhaListaDeProdutos', '/admin/home', '/admin/cadastrarprodutos']) {
    test(`${privatePage} redirects to the login page without a session`, async ({ page }) => {
      await page.goto(privatePage);

      await expect(page).toHaveURL(/\/login$/);
    });
  }

  test('logout ends the session so private pages are no longer accessible', async ({ page, loginPage, nav, admin }) => {
    await loginPage.login(admin.email, admin.password);
    await expect(page).toHaveURL(/\/admin\/home$/);

    await nav.logout.click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/admin/home');
    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => localStorage.getItem('serverest/userToken'))).toBeNull();
  });
});
