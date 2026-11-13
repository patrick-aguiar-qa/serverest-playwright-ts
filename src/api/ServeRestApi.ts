import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import { buildProduct, buildUser } from '../data/factory';
import type {
  CartItem,
  CreatedBody,
  LoginBody,
  NewProduct,
  NewUser,
  Product,
  User,
} from '../types';

/**
 * Thin typed client for the ServeRest API.
 * Raw methods return the APIResponse (for API tests that assert status and body);
 * `create*` helpers assert success and return typed data (for test setup).
 */
export class ServeRestApi {
  constructor(
    private readonly request: APIRequestContext,
    private readonly apiURL: string,
  ) {}

  private url(path: string): string {
    return `${this.apiURL}${path}`;
  }

  // ---------- users ----------
  postUser(user: Partial<NewUser>): Promise<APIResponse> {
    return this.request.post(this.url('/usuarios'), { data: user });
  }

  getUser(id: string): Promise<APIResponse> {
    return this.request.get(this.url(`/usuarios/${id}`));
  }

  listUsers(params: Record<string, string> = {}): Promise<APIResponse> {
    return this.request.get(this.url('/usuarios'), { params });
  }

  putUser(id: string, user: NewUser): Promise<APIResponse> {
    return this.request.put(this.url(`/usuarios/${id}`), { data: user });
  }

  deleteUser(id: string): Promise<APIResponse> {
    return this.request.delete(this.url(`/usuarios/${id}`));
  }

  async createUser(overrides: Partial<NewUser> = {}): Promise<User> {
    const user = buildUser(overrides);
    const response = await this.postUser(user);
    expect(response.status(), await response.text()).toBe(201);
    const body = (await response.json()) as CreatedBody;
    return { ...user, _id: body._id };
  }

  // ---------- auth ----------
  login(email: string, password: string): Promise<APIResponse> {
    return this.request.post(this.url('/login'), { data: { email, password } });
  }

  async token(user: Pick<User, 'email' | 'password'>): Promise<string> {
    const response = await this.login(user.email, user.password);
    expect(response.status(), await response.text()).toBe(200);
    return ((await response.json()) as LoginBody).authorization;
  }

  // ---------- products ----------
  postProduct(product: Partial<NewProduct>, token?: string): Promise<APIResponse> {
    return this.request.post(this.url('/produtos'), {
      data: product,
      headers: token ? { Authorization: token } : {},
    });
  }

  listProducts(params: Record<string, string> = {}): Promise<APIResponse> {
    return this.request.get(this.url('/produtos'), { params });
  }

  getProduct(id: string): Promise<APIResponse> {
    return this.request.get(this.url(`/produtos/${id}`));
  }

  deleteProduct(id: string, token: string): Promise<APIResponse> {
    return this.request.delete(this.url(`/produtos/${id}`), { headers: { Authorization: token } });
  }

  async createProduct(adminToken: string, overrides: Partial<NewProduct> = {}): Promise<Product> {
    const product = buildProduct(overrides);
    const response = await this.postProduct(product, adminToken);
    expect(response.status(), await response.text()).toBe(201);
    const body = (await response.json()) as CreatedBody;
    return { ...product, _id: body._id };
  }

  // ---------- carts ----------
  postCart(items: CartItem[], token: string): Promise<APIResponse> {
    return this.request.post(this.url('/carrinhos'), {
      data: { produtos: items },
      headers: { Authorization: token },
    });
  }

  cancelPurchase(token: string): Promise<APIResponse> {
    return this.request.delete(this.url('/carrinhos/cancelar-compra'), { headers: { Authorization: token } });
  }

  completePurchase(token: string): Promise<APIResponse> {
    return this.request.delete(this.url('/carrinhos/concluir-compra'), { headers: { Authorization: token } });
  }
}
