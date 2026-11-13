import type { Locator, Page } from '@playwright/test';

export interface SignUpData {
  nome: string;
  email: string;
  password: string;
  admin?: boolean;
}

export class SignUpPage {
  readonly name: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly adminCheckbox: Locator;
  readonly submit: Locator;
  readonly loginLink: Locator;
  readonly successMessage: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByTestId('nome');
    this.email = page.getByTestId('email');
    this.password = page.getByTestId('password');
    this.adminCheckbox = page.getByTestId('checkbox');
    this.submit = page.getByRole('button', { name: 'Cadastrar' });
    this.loginLink = page.getByTestId('entrar');
    this.successMessage = page.locator('.alert').filter({ hasText: 'Cadastro realizado com sucesso' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/cadastrarusuarios');
  }

  async signUp({ nome, email, password, admin = false }: SignUpData): Promise<void> {
    await this.name.fill(nome);
    await this.email.fill(email);
    await this.password.fill(password);
    if (admin) await this.adminCheckbox.check();
    await this.submit.click();
  }

  alert(message: string): Locator {
    return this.page.getByRole('alert').filter({ hasText: message });
  }
}
