import { buildProduct } from '../../src/data/factory';
import { expect, test } from '../../src/fixtures';

test.describe('Admin - products', () => {
  test.use({ loginAs: 'admin' });

  test.beforeEach(async ({ adminProducts }) => {
    await adminProducts.gotoRegister();
  });

  test('a registered product appears in the product list with its data', async ({ page, adminProducts, data, adminToken }) => {
    const product = buildProduct();

    await adminProducts.register(product);

    await expect(page).toHaveURL(/\/admin\/listarprodutos$/);
    const cells = adminProducts.cells(product.nome);
    const expected = [product.nome, String(product.preco), product.descricao, String(product.quantidade)];
    for (const [column, text] of expected.entries()) {
      await expect(cells.nth(column)).toHaveText(text);
    }
    await data.productByName(product.nome, adminToken);
  });

  test('a product name that already exists shows an error', async ({ page, adminProducts, product }) => {
    await adminProducts.register(buildProduct({ nome: product.nome }));

    await expect(adminProducts.alert('Já existe produto com esse nome')).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/cadastrarprodutos$/);
  });

  test('submitting the empty form shows one error per required field', async ({ adminProducts }) => {
    await adminProducts.submit.click();

    for (const message of ['Nome é obrigatório', 'Preco é obrigatório', 'Descricao é obrigatório', 'Quantidade é obrigatório']) {
      await expect(adminProducts.alert(message)).toBeVisible();
    }
  });

  test.describe('price boundary', () => {
    test('price 0 is rejected', async ({ adminProducts }) => {
      await adminProducts.register(buildProduct({ preco: 0 }));

      await expect(adminProducts.alert('Preco deve ser um número positivo')).toBeVisible();
    });

    test('price 1 is accepted', async ({ page, adminProducts, data, adminToken }) => {
      const product = buildProduct({ preco: 1 });

      await adminProducts.register(product);

      await expect(page).toHaveURL(/\/admin\/listarprodutos$/);
      await expect(adminProducts.cells(product.nome).nth(1)).toHaveText('1');
      await data.productByName(product.nome, adminToken);
    });
  });

  test('"Excluir" removes the product from the list', async ({ adminProducts, product }) => {
    await adminProducts.gotoList();

    await adminProducts.remove(product.nome);

    await expect(adminProducts.listHeading).toBeVisible();
    await expect(adminProducts.row(product.nome)).toHaveCount(0);
  });
});
