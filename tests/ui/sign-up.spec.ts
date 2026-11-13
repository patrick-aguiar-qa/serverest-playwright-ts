import { buildUser } from '../../src/data/factory';
import { expect, test } from '../../src/fixtures';

test.describe('Sign-up', () => {
  test.beforeEach(async ({ signUpPage }) => {
    await signUpPage.goto();
  });

  test('a new customer account opens the store home', async ({ page, signUpPage, data }) => {
    const user = buildUser();

    await signUpPage.signUp(user);

    await expect(signUpPage.successMessage).toBeVisible();
    await expect(page).toHaveURL(/\/home$/, { timeout: 15_000 });
    await data.userByEmail(user.email);
  });

  test('checking "administrador" creates an admin account', async ({ page, signUpPage, data }) => {
    const user = buildUser({ administrador: 'true' });

    await signUpPage.signUp({ ...user, admin: true });

    await expect(page).toHaveURL(/\/admin\/home$/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(user.nome);
    await data.userByEmail(user.email);
  });

  test('an email that is already registered shows an error', async ({ page, signUpPage, customer }) => {
    await signUpPage.signUp({ nome: 'Another Name', email: customer.email, password: customer.password });

    await expect(signUpPage.alert('Este email já está sendo usado')).toBeVisible();
    await expect(page).toHaveURL(/\/cadastrarusuarios$/);
  });

  test('submitting the empty form shows one error per required field', async ({ signUpPage }) => {
    await signUpPage.submit.click();

    for (const message of ['Nome é obrigatório', 'Email é obrigatório', 'Password é obrigatório']) {
      await expect(signUpPage.alert(message)).toBeVisible();
    }
  });
});
