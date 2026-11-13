import { test as base, expect } from '@playwright/test';
import { ServeRestApi } from './api/ServeRestApi';
import { DataTracker } from './data/DataTracker';
import { env } from './env';
import { AdminProductsPage } from './pages/AdminProductsPage';
import { LoginPage } from './pages/LoginPage';
import { NavBar } from './pages/NavBar';
import { ShoppingListPage } from './pages/ShoppingListPage';
import { SignUpPage } from './pages/SignUpPage';
import { StorePage } from './pages/StorePage';
import type { Product, User } from './types';

export type Role = 'guest' | 'admin' | 'customer';

type WorkerFixtures = {
  /** API client that lives for the whole worker (used to create and delete the worker's users). */
  workerApi: ServeRestApi;
  /** One admin and one customer per worker, created through the API and deleted when the worker ends. */
  admin: User;
  customer: User;
};

type TestFixtures = {
  /** Who the browser is logged in as when the test starts. Set with `test.use({ loginAs: 'admin' })`. */
  loginAs: Role;
  api: ServeRestApi;
  /** Tracks and deletes the data a single test creates. */
  data: DataTracker;
  adminToken: string;
  /** A fresh product (stock 3, price 250) created through the API for the test. */
  product: Product;
  loginPage: LoginPage;
  signUpPage: SignUpPage;
  adminProducts: AdminProductsPage;
  store: StorePage;
  shoppingList: ShoppingListPage;
  nav: NavBar;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  workerApi: [
    async ({ playwright }, use) => {
      const request = await playwright.request.newContext();
      await use(new ServeRestApi(request, env.apiURL));
      await request.dispose();
    },
    { scope: 'worker' },
  ],

  admin: [
    async ({ workerApi }, use) => {
      const user = await workerApi.createUser({ administrador: 'true' });
      await use(user);
      await workerApi.deleteUser(user._id);
    },
    { scope: 'worker' },
  ],

  customer: [
    async ({ workerApi }, use) => {
      const user = await workerApi.createUser({ administrador: 'false' });
      await use(user);
      await workerApi.deleteUser(user._id);
    },
    { scope: 'worker' },
  ],

  loginAs: ['guest', { option: true }],

  api: async ({ request }, use) => {
    await use(new ServeRestApi(request, env.apiURL));
  },

  data: async ({ api }, use) => {
    const tracker = new DataTracker(api);
    await use(tracker);
    await tracker.cleanup();
  },

  adminToken: async ({ api, admin }, use) => {
    await use(await api.token(admin));
  },

  product: async ({ api, data, adminToken }, use) => {
    const product = await api.createProduct(adminToken);
    data.product(product._id, adminToken);
    await use(product);
  },

  // Log in through the API and hand the browser the same localStorage the front-end writes on login.
  // Tests whose goal is the login itself keep loginAs = 'guest' and use the UI.
  storageState: async ({ loginAs, admin, customer, api, baseURL }, use) => {
    if (loginAs === 'guest') {
      await use(undefined);
      return;
    }
    const user = loginAs === 'admin' ? admin : customer;
    const token = await api.token(user);
    await use({
      cookies: [],
      origins: [
        {
          origin: new URL(baseURL ?? env.baseURL).origin,
          localStorage: [
            { name: 'serverest/userToken', value: token },
            { name: 'serverest/userEmail', value: user.email },
            { name: 'serverest/userNome', value: user.nome },
          ],
        },
      ],
    });
  },

  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  signUpPage: async ({ page }, use) => use(new SignUpPage(page)),
  adminProducts: async ({ page }, use) => use(new AdminProductsPage(page)),
  store: async ({ page }, use) => use(new StorePage(page)),
  shoppingList: async ({ page }, use) => use(new ShoppingListPage(page)),
  nav: async ({ page }, use) => use(new NavBar(page)),
});

export { expect };
