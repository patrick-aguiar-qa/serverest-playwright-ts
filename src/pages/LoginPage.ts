import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly signUpLink: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByTestId('email');
    this.password = page.getByTestId('senha');
    this.submit = page.getByRole('button', { name: 'Entrar' });
    this.signUpLink = page.getByTestId('cadastrar');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.goto();
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }

  alert(message: string): Locator {
    return this.page.getByRole('alert').filter({ hasText: message });
  }
}
