import { buildProduct } from '../../src/data/factory';
import { expect, test } from '../../src/fixtures';
import type { CreatedBody, ProductListBody } from '../../src/types';

const TOKEN_ERROR = 'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais';

test.describe('API - /produtos', () => {
  test('an admin creates a product that can be found by name', async ({ api, data, adminToken }) => {
    const product = buildProduct();

    const created = await api.postProduct(product, adminToken);
    expect(created.status()).toBe(201);
    const { _id } = (await created.json()) as CreatedBody;
    data.product(_id, adminToken);

    const list = (await (await api.listProducts({ nome: product.nome })).json()) as ProductListBody;
    expect(list.quantidade).toBe(1);
    expect(list.produtos[0]).toEqual({ ...product, _id });
  });

  test.describe('authorization', () => {
    test('returns 401 without a token', async ({ api }) => {
      const response = await api.postProduct(buildProduct());

      expect(response.status()).toBe(401);
      expect(await response.json()).toEqual({ message: TOKEN_ERROR });
    });

    test('returns 401 with a tampered token', async ({ api, adminToken }) => {
      const response = await api.postProduct(buildProduct(), `${adminToken}x`);

      expect(response.status()).toBe(401);
      expect(await response.json()).toEqual({ message: TOKEN_ERROR });
    });

    test('returns 403 when the user is not an admin', async ({ api, customer }) => {
      const token = await api.token(customer);

      const response = await api.postProduct(buildProduct(), token);

      expect(response.status()).toBe(403);
      expect(await response.json()).toEqual({ message: 'Rota exclusiva para administradores' });
    });
  });

  test('rejects a product name that already exists', async ({ api, adminToken, product }) => {
    const response = await api.postProduct(buildProduct({ nome: product.nome }), adminToken);

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ message: 'Já existe produto com esse nome' });
  });

  test.describe('price boundary (positive integer)', () => {
    for (const preco of [-1, 0]) {
      test(`price ${preco} returns 400`, async ({ api, adminToken }) => {
        const response = await api.postProduct(buildProduct({ preco }), adminToken);

        expect(response.status()).toBe(400);
        expect(await response.json()).toEqual({ preco: 'preco deve ser um número positivo' });
      });
    }

    test('price 1 returns 201', async ({ api, data, adminToken }) => {
      const response = await api.postProduct(buildProduct({ preco: 1 }), adminToken);

      expect(response.status()).toBe(201);
      data.product(((await response.json()) as CreatedBody)._id, adminToken);
    });
  });

  test('deletes a product, after which GET returns "not found"', async ({ api, adminToken }) => {
    const product = await api.createProduct(adminToken);

    const deleted = await api.deleteProduct(product._id, adminToken);
    expect(deleted.status()).toBe(200);
    expect(await deleted.json()).toEqual({ message: 'Registro excluído com sucesso' });

    const fetched = await api.getProduct(product._id);
    expect(fetched.status()).toBe(400);
    expect(await fetched.json()).toEqual({ message: 'Produto não encontrado' });
  });
});
