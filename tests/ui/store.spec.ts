import { expect, test } from '../../src/fixtures';

test.describe('Store - search and shopping list', () => {
  test.use({ loginAs: 'customer' });

  test.beforeEach(async ({ store }) => {
    await store.goto();
  });

  test('searching by the exact name shows only that product', async ({ store, product }) => {
    await store.search(product.nome);

    await expect(store.cards).toHaveCount(1);
    await expect(store.cards.locator('.card-title')).toHaveText(product.nome);
  });

  test('a search with no results shows a "no products" message', async ({ store }) => {
    await store.search('zzz-product-that-does-not-exist');

    await expect(store.noResults).toBeVisible();
    await expect(store.cards).toHaveCount(0);
  });

  test('the details page shows name, price, stock and description', async ({ store, product }) => {
    await store.openDetails(product.nome);

    await expect(store.detailName).toHaveText(product.nome);
    await expect(store.detail('R$:')).toHaveText(`R$: ${product.preco}`);
    await expect(store.detail('Quantidade:')).toHaveText(`Quantidade: ${product.quantidade}`);
    await expect(store.detail('Descrição:')).toHaveText(`Descrição: ${product.descricao}`);
  });

  test('a product is added to the shopping list with quantity 1', async ({ store, shoppingList, product }) => {
    await store.addToShoppingList(product.nome);

    await expect(shoppingList.productName).toHaveText(`Produto:${product.nome}`);
    await expect(shoppingList.quantity).toHaveText('Total: 1');
    await expect(shoppingList.price).toHaveText(`Preço R$${product.preco}`);
  });

  test('increasing the quantity recalculates the total price', async ({ store, shoppingList, product }) => {
    await store.addToShoppingList(product.nome);

    await shoppingList.increase.click();

    await expect(shoppingList.quantity).toHaveText('Total: 2');
    await expect(shoppingList.price).toHaveText(`Preço R$${product.preco * 2}`);
  });

  test('the shopping list is kept when the customer goes back to the store', async ({ store, shoppingList, nav, product }) => {
    await store.addToShoppingList(product.nome);

    await nav.home.click();
    await nav.shoppingList.click();

    await expect(shoppingList.productName).toContainText(product.nome);
  });

  test('"Limpar Lista" empties the shopping list', async ({ store, shoppingList, product }) => {
    await store.addToShoppingList(product.nome);

    await shoppingList.clear.click();

    await expect(shoppingList.emptyMessage).toHaveText('Seu carrinho está vazio');
  });
});
