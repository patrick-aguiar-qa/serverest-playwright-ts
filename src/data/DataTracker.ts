import type { ServeRestApi } from '../api/ServeRestApi';
import type { ProductListBody, UserListBody } from '../types';

/**
 * Records everything a test creates on the shared public server and removes it afterwards,
 * in dependency order: carts -> products -> users.
 */
export class DataTracker {
  private readonly users = new Set<string>();
  private readonly products = new Map<string, string>(); // product id -> admin token
  private readonly cartOwners = new Set<string>(); // tokens of users that own a cart

  constructor(private readonly api: ServeRestApi) {}

  user(id: string): void {
    this.users.add(id);
  }

  product(id: string, adminToken: string): void {
    this.products.set(id, adminToken);
  }

  cart(ownerToken: string): void {
    this.cartOwners.add(ownerToken);
  }

  /** For data created through the UI, where the id is not returned to the test. */
  async userByEmail(email: string): Promise<void> {
    const response = await this.api.listUsers({ email });
    const body = (await response.json()) as UserListBody;
    body.usuarios.forEach(({ _id }) => this.user(_id));
  }

  async productByName(nome: string, adminToken: string): Promise<void> {
    const response = await this.api.listProducts({ nome });
    const body = (await response.json()) as ProductListBody;
    body.produtos.forEach(({ _id }) => this.product(_id, adminToken));
  }

  async cleanup(): Promise<void> {
    for (const token of this.cartOwners) await this.api.cancelPurchase(token).catch(() => undefined);
    for (const [id, token] of this.products) await this.api.deleteProduct(id, token).catch(() => undefined);
    for (const id of this.users) await this.api.deleteUser(id).catch(() => undefined);
    this.cartOwners.clear();
    this.products.clear();
    this.users.clear();
  }
}
