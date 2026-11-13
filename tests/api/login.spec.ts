import { expect, test } from '../../src/fixtures';
import type { LoginBody } from '../../src/types';

test.describe('API - /login', () => {
  test('returns a Bearer token for valid credentials', async ({ api, customer }) => {
    const response = await api.login(customer.email, customer.password);

    expect(response.status()).toBe(200);
    const body = (await response.json()) as LoginBody;
    expect(body.message).toBe('Login realizado com sucesso');
    // JWT: three base64url parts separated by dots
    expect(body.authorization).toMatch(/^Bearer [\w-]+\.[\w-]+\.[\w-]+$/);
  });

  test('returns 401 for a wrong password', async ({ api, customer }) => {
    const response = await api.login(customer.email, 'wrong-password');

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ message: 'Email e/ou senha inválidos' });
  });

  test('returns 401 for an email that is not registered', async ({ api }) => {
    const response = await api.login('nobody.registered@qa.com', 'any-password');

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ message: 'Email e/ou senha inválidos' });
  });

  test('returns field errors when email and password are empty', async ({ api }) => {
    const response = await api.login('', '');

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      email: 'email não pode ficar em branco',
      password: 'password não pode ficar em branco',
    });
  });
});
