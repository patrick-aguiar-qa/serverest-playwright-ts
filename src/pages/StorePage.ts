import type { Locator, Page, Response } from '@playwright/test';
import { env } from '../env';

/** The unfiltered GET /produtos the store sends when it opens (searches add ?nome=). */
export function isCatalogResponse(response: Response): boolean {
  const url = new URL(response.url());
  return (
    url.origin === new URL(env.apiURL).origin &&
    url.pathname === '/produtos' &&
    !url.searchParams.has('nome') &&
    response.request().method() === 'GET'
  );
}

export type DetailLabel = 'R$:' | 'Quantidade:' | 'Descrição:';

export class StorePage {
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly cards: Locator;
  readonly noResults: Locator;
  readonly detailName: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Serverest Store' });
    this.searchInput = page.getByTestId('pesquisar');
    this.searchButton = page.getByTestId('botaoPesquisar');
    this.cards = page.locator('.card');
    this.noResults = page.getByText('Nenhum produto foi encontrado');
    this.detailName = page.getByTestId('product-detail-name');
  }

  /**
   * Opens the store and, by default, waits for the initial catalog request (GET /produtos without filters).
   * Searching before it answers hits a race in the front-end (BUG-11), so tests wait like a user would.
   */
  async goto({ waitForCatalog = true } = {}): Promise<void> {
    const catalog = waitForCatalog ? this.page.waitForResponse(isCatalogResponse) : Promise.resolve();
    await this.page.goto('/home');
    await catalog;
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.searchButton.click();
  }

  card(nome: string): Locator {
    return this.cards.filter({ hasText: nome });
  }

  async openDetails(nome: string): Promise<void> {
    await this.search(nome);
    await this.card(nome).getByRole('link', { name: 'Detalhes' }).click();
  }

  async addToShoppingList(nome: string): Promise<void> {
    await this.search(nome);
    await this.card(nome).getByTestId('adicionarNaLista').click();
    await this.page.waitForURL('**/minhaListaDeProdutos');
  }

  detail(label: DetailLabel): Locator {
    return this.page.getByRole('heading', { level: 4 }).filter({ hasText: label });
  }
}
