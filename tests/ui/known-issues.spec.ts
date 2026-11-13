import { expect, test } from '../../src/fixtures';

/**
 * Open bugs, written as the CORRECT behavior and marked with test.fail():
 * they run in every pipeline and stay green while the bug exists.
 * When a bug gets fixed the test starts passing, Playwright reports it as an unexpected pass
 * and the pipeline fails, a reminder to remove test.fail() and move the test to the regression specs.
 * Details and steps to reproduce: BUG_REPORTS.md
 */
const issue = (id: string) => ({ type: 'issue', description: `BUG_REPORTS.md#${id.toLowerCase()}` });

test.describe('Known issues', () => {
  test.describe('as a customer', () => {
    test.use({ loginAs: 'customer' });

    test.fail('BUG-01: a customer must not open the admin area', { annotation: issue('BUG-01') }, async ({ page }) => {
      await page.goto('/admin/cadastrarusuarios');

      await expect(page).not.toHaveURL(/\/admin\//);
    });

    test.fail(
      'BUG-02: "-" at quantity 1 should remove the product from the shopping list',
      { annotation: issue('BUG-02') },
      async ({ store, shoppingList, product }) => {
        await store.goto();
        await store.addToShoppingList(product.nome);

        await shoppingList.decrease.click();

        await expect(shoppingList.emptyMessage).toBeVisible();
      },
    );

    test.fail(
      'BUG-03: the shopping list must not accept more units than the stock',
      { annotation: issue('BUG-03') },
      async ({ store, shoppingList, product }) => {
        await store.goto();
        await store.addToShoppingList(product.nome);

        // stock = 3: the 4th unit must be refused
        for (let unit = 2; unit <= product.quantidade + 1; unit++) await shoppingList.increase.click();

        await expect(shoppingList.quantity).toHaveText(`Total: ${product.quantidade}`);
      },
    );
  });

  test.describe('as an admin', () => {
    test.use({ loginAs: 'admin' });

    test.fail('BUG-06: the admin user list must not display passwords', { annotation: issue('BUG-06') }, async ({ page }) => {
      await page.goto('/admin/listarusuarios');
      await expect(page.getByRole('table')).toBeVisible();

      await expect(page.getByRole('columnheader', { name: 'Senha' })).toHaveCount(0);
    });
  });

  test.describe('mobile', { tag: '@mobile' }, () => {
    test.use({ loginAs: 'customer' });

    test.fail('BUG-07: the menu toggle must open the navigation', { annotation: issue('BUG-07') }, async ({ store, nav }) => {
      await store.goto();

      await nav.menuToggle.click();

      await expect(nav.logout).toBeVisible({ timeout: 5_000 });
    });
  });
});
