import type { Locator, Page } from '@playwright/test';

export class ShoppingListPage {
  readonly productName: Locator;
  readonly quantity: Locator;
  readonly price: Locator;
  readonly increase: Locator;
  readonly decrease: Locator;
  readonly clear: Locator;
  readonly emptyMessage: Locator;

  constructor(page: Page) {
    this.productName = page.getByTestId('shopping-cart-product-name');
    this.quantity = page.getByTestId('shopping-cart-product-quantity');
    this.price = page.getByText(/^Preço R\$/);
    this.increase = page.getByTestId('product-increase-quantity');
    this.decrease = page.getByTestId('product-decrease-quantity');
    this.clear = page.getByTestId('limparLista');
    this.emptyMessage = page.getByTestId('shopping-cart-empty-message');
  }
}
