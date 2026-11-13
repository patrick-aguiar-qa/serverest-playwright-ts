import { expect, test } from '../../src/fixtures';
import type { Product, ProductListBody } from '../../src/types';
import type { ServeRestApi } from '../../src/api/ServeRestApi';

async function stockOf(api: ServeRestApi, product: Product): Promise<number> {
  const body = (await (await api.listProducts({ _id: product._id })).json()) as ProductListBody;
  return body.produtos[0].quantidade;
}

test.describe('API - /carrinhos (stock rules)', () => {
  // Each test gets its own buyer, because a user can own only one cart
  let buyerToken: string;

  test.beforeEach(async ({ api, data }) => {
    const buyer = await api.createUser();
    data.user(buyer._id);
    buyerToken = await api.token(buyer);
    data.cart(buyerToken);
  });

  test('a cart reserves stock and cancelling it gives the stock back', async ({ api, product }) => {
    const created = await api.postCart([{ idProduto: product._id, quantidade: 2 }], buyerToken);
    expect(created.status()).toBe(201);
    expect(await stockOf(api, product)).toBe(product.quantidade - 2);

    const cancelled = await api.cancelPurchase(buyerToken);
    expect(cancelled.status()).toBe(200);
    expect(await cancelled.json()).toEqual({
      message: 'Registro excluído com sucesso. Estoque dos produtos reabastecido',
    });
    expect(await stockOf(api, product)).toBe(product.quantidade);
  });

  test('completing the purchase keeps the stock reduced', async ({ api, product }) => {
    await api.postCart([{ idProduto: product._id, quantidade: 1 }], buyerToken);

    const completed = await api.completePurchase(buyerToken);

    expect(completed.status()).toBe(200);
    expect(await completed.json()).toEqual({ message: 'Registro excluído com sucesso' });
    expect(await stockOf(api, product)).toBe(product.quantidade - 1);
  });

  test('rejects a cart with more units than the stock', async ({ api, product }) => {
    const response = await api.postCart([{ idProduto: product._id, quantidade: product.quantidade + 1 }], buyerToken);

    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({ message: 'Produto não possui quantidade suficiente' });
    expect(await stockOf(api, product)).toBe(product.quantidade);
  });

  test('rejects a second cart for the same user', async ({ api, product }) => {
    await api.postCart([{ idProduto: product._id, quantidade: 1 }], buyerToken);

    const second = await api.postCart([{ idProduto: product._id, quantidade: 1 }], buyerToken);

    expect(second.status()).toBe(400);
    expect(await second.json()).toEqual({ message: 'Não é permitido ter mais de 1 carrinho' });
  });

  test('does not allow deleting a product that is in a cart', async ({ api, product, adminToken }) => {
    await api.postCart([{ idProduto: product._id, quantidade: 1 }], buyerToken);

    const response = await api.deleteProduct(product._id, adminToken);

    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({ message: 'Não é permitido excluir produto que faz parte de carrinho' });
  });
});
