import type { Request } from '@playwright/test';
import { buildProduct } from '../../src/data/factory';
import { env } from '../../src/env';
import { expect, test } from '../../src/fixtures';
import { isCatalogResponse } from '../../src/pages/StorePage';

// Match calls to the back-end only, never front-end routes such as /admin/listarprodutos
const apiCall = (path: string) => (url: URL) => url.origin === new URL(env.apiURL).origin && url.pathname === path;

test.describe('Network - front-end behavior with a controlled back-end', () => {
  test.describe('as a customer', () => {
    test.use({ loginAs: 'customer' });

    test('the store renders exactly the products the API returns', async ({ page, store }) => {
      const products = [
        { ...buildProduct({ nome: 'Mocked Keyboard', preco: 120 }), _id: 'mock-1' },
        { ...buildProduct({ nome: 'Mocked Mouse', preco: 45 }), _id: 'mock-2' },
      ];
      await page.route(apiCall('/produtos'), (route) =>
        route.fulfill({ json: { quantidade: products.length, produtos: products } }),
      );

      await store.goto();

      await expect(store.cards).toHaveCount(2);
      await expect(store.cards.locator('.card-title')).toHaveText(['Mocked Keyboard', 'Mocked Mouse']);
    });

    test('an empty catalog renders the store without product cards', async ({ page, store }) => {
      await page.route(apiCall('/produtos'), (route) => route.fulfill({ json: { quantidade: 0, produtos: [] } }));

      await store.goto();

      await expect(page.getByRole('heading', { name: 'Produtos', level: 4 })).toBeVisible();
      await expect(store.searchInput).toBeEditable();
      await expect(store.cards).toHaveCount(0);
    });

    // Found with this mock: the search shows an empty state, the home page with an empty catalog does not
    test.fail(
      'BUG-10: an empty catalog should show the "no products" message',
      { annotation: { type: 'issue', description: 'BUG_REPORTS.md#bug-10' } },
      async ({ page, store }) => {
        await page.route(apiCall('/produtos'), (route) => route.fulfill({ json: { quantidade: 0, produtos: [] } }));

        await store.goto();
        await expect(page.getByRole('heading', { name: 'Produtos', level: 4 })).toBeVisible();

        await expect(store.noResults).toBeVisible({ timeout: 5_000 });
      },
    );

    test('the search sends the typed term to the API as the "nome" filter', async ({ page, store }) => {
      await store.goto();
      const searchRequest = page.waitForRequest(
        (request: Request) => apiCall('/produtos')(new URL(request.url())) && request.url().includes('nome='),
      );

      await store.search('Keyboard X');

      expect(new URL((await searchRequest).url()).searchParams.get('nome')).toBe('Keyboard X');
    });
  });

  test.describe('race between the catalog and a search', () => {
    test.use({ loginAs: 'customer' });

    // Found as a flaky Firefox run (the "no products" message shown next to the whole catalog),
    // then made deterministic by delaying only the initial catalog response
    test.fail(
      'BUG-11: a slow catalog response must not overwrite the search results',
      { annotation: { type: 'issue', description: 'BUG_REPORTS.md#bug-11' } },
      async ({ page, store }) => {
      await page.route(apiCall('/produtos'), async (route) => {
        if (!new URL(route.request().url()).searchParams.has('nome')) await new Promise((r) => setTimeout(r, 3_000));
        await route.continue();
      });
      const slowCatalog = page.waitForResponse(isCatalogResponse);

      await store.goto({ waitForCatalog: false });
      await store.search('zzz-product-that-does-not-exist');
      await expect(store.noResults).toBeVisible();
      await (await slowCatalog).finished();
      // "Must stay at 0" cannot auto-wait: give React a moment to render the late response before checking
      await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1_000)));

      await expect(store.cards).toHaveCount(0);
      await expect(store.noResults).toBeVisible();
      },
    );
  });

  test('a server error on login keeps the user on the login page without a session', async ({ page, loginPage, customer }) => {
    await page.route(apiCall('/login'), (route) => route.fulfill({ status: 500, json: { message: 'Internal error' } }));

    await loginPage.login(customer.email, customer.password);

    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => localStorage.getItem('serverest/userToken'))).toBeNull();
  });

  test('a network failure on login keeps the user on the login page without a session', async ({ page, loginPage, customer }) => {
    await page.route(apiCall('/login'), (route) => route.abort('internetdisconnected'));

    await loginPage.login(customer.email, customer.password);

    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => localStorage.getItem('serverest/userToken'))).toBeNull();
  });
});
