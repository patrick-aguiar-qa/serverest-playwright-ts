import type { NewProduct, NewUser } from '../types';

export const PASSWORD = 'Test@1234';

let counter = 0;

/** Unique on a shared public server: timestamp + worker-local counter + random part. */
export function uniqueSuffix(): string {
  counter += 1;
  return `${Date.now()}${counter}${Math.floor(Math.random() * 10_000)}`;
}

export function buildUser(overrides: Partial<NewUser> = {}): NewUser {
  const admin = overrides.administrador === 'true';
  return {
    nome: admin ? 'QA Admin' : 'QA Customer',
    email: `qa.pw.${uniqueSuffix()}@qa.com`,
    password: PASSWORD,
    administrador: 'false',
    ...overrides,
  };
}

export function buildProduct(overrides: Partial<NewProduct> = {}): NewProduct {
  return {
    nome: `QA PW Product ${uniqueSuffix()}`,
    preco: 250,
    descricao: 'Mechanical keyboard',
    quantidade: 3,
    ...overrides,
  };
}
