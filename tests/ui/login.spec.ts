import { expect, test } from '../../src/fixtures';

test.describe('Login', () => {
  test('an admin lands on the admin home', async ({ page, loginPage, admin }) => {
    await loginPage.login(admin.email, admin.password);

    await expect(page).toHaveURL(/\/admin\/home$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(`Bem Vindo ${admin.nome}`);
  });

  test('a customer lands on the store home', async ({ page, loginPage, store, customer }) => {
    await loginPage.login(customer.email, customer.password);

    await expect(page).toHaveURL(/\/home$/);
    await expect(store.heading).toBeVisible();
  });

  test('a wrong password shows an error and keeps the user on the login page', async ({ page, loginPage, customer }) => {
    await loginPage.login(customer.email, 'wrong-password');

    await expect(loginPage.alert('Email e/ou senha inválidos')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('submitting the empty form shows one error per required field', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.submit.click();

    await expect(loginPage.alert('Email é obrigatório')).toBeVisible();
    await expect(loginPage.alert('Password é obrigatório')).toBeVisible();
  });

  test('an email without "@" is blocked by the browser and never reaches the API', async ({ page, loginPage }) => {
    const loginCalls: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().endsWith('/login')) loginCalls.push(request.url());
    });

    await loginPage.login('invalid-email', 'any-password');

    await expect(loginPage.email).toHaveJSProperty('validity.valid', false);
    await expect(page).toHaveURL(/\/login$/);
    expect(loginCalls).toHaveLength(0);
  });

  test('"Cadastre-se" opens the sign-up page', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.signUpLink.click();

    await expect(page).toHaveURL(/\/cadastrarusuarios$/);
    await expect(page.getByRole('heading', { name: 'Cadastro' })).toBeVisible();
  });
});
