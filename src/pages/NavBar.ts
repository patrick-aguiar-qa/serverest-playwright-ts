import type { Locator, Page } from '@playwright/test';

export class NavBar {
  readonly home: Locator;
  readonly shoppingList: Locator;
  readonly logout: Locator;
  readonly menuToggle: Locator;

  constructor(page: Page) {
    this.home = page.getByTestId('paginaInicial');
    this.shoppingList = page.getByTestId('lista-de-compras');
    this.logout = page.getByTestId('logout');
    this.menuToggle = page.locator('.navbar-toggler');
  }
}
