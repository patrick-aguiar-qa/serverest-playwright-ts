import type { Locator, Page } from '@playwright/test';
import type { NewProduct } from '../types';

export class AdminProductsPage {
  readonly name: Locator;
  readonly price: Locator;
  readonly description: Locator;
  readonly quantity: Locator;
  readonly submit: Locator;
  readonly listHeading: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByTestId('nome');
    this.price = page.getByTestId('preco');
    this.description = page.getByTestId('descricao');
    this.quantity = page.getByTestId('quantity');
    this.submit = page.getByRole('button', { name: 'Cadastrar' });
    this.listHeading = page.getByRole('heading', { name: 'Lista dos Produtos' });
  }

  async gotoRegister(): Promise<void> {
    await this.page.goto('/admin/cadastrarprodutos');
  }

  async gotoList(): Promise<void> {
    await this.page.goto('/admin/listarprodutos');
  }

  async register(product: Partial<NewProduct>): Promise<void> {
    if (product.nome !== undefined) await this.name.fill(product.nome);
    if (product.preco !== undefined) await this.price.fill(String(product.preco));
    if (product.descricao !== undefined) await this.description.fill(product.descricao);
    if (product.quantidade !== undefined) await this.quantity.fill(String(product.quantidade));
    await this.submit.click();
  }

  row(nome: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('cell', { name: nome, exact: true }) });
  }

  cells(nome: string): Locator {
    return this.row(nome).getByRole('cell');
  }

  async remove(nome: string): Promise<void> {
    await this.row(nome).getByRole('button', { name: 'Excluir' }).click();
  }

  alert(message: string): Locator {
    return this.page.getByRole('alert').filter({ hasText: message });
  }
}
