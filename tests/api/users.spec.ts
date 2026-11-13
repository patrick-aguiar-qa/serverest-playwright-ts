import { buildUser } from '../../src/data/factory';
import { expect, test } from '../../src/fixtures';
import type { CreatedBody, NewUser } from '../../src/types';

test.describe('API - /usuarios', () => {
  test('creates a user and returns it on GET by id', async ({ api, data }) => {
    const user = buildUser();

    const created = await api.postUser(user);
    expect(created.status()).toBe(201);
    const body = (await created.json()) as CreatedBody;
    expect(body).toEqual({ message: 'Cadastro realizado com sucesso', _id: expect.any(String) });
    data.user(body._id);

    const fetched = await api.getUser(body._id);
    expect(fetched.status()).toBe(200);
    expect(await fetched.json()).toEqual({ ...user, _id: body._id });
  });

  test('rejects a second user with the same email', async ({ api, data }) => {
    const existing = await api.createUser();
    data.user(existing._id);

    const response = await api.postUser(buildUser({ email: existing.email }));

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ message: 'Este email já está sendo usado' });
  });

  test('rejects an email without a valid format', async ({ api }) => {
    const response = await api.postUser(buildUser({ email: 'invalid-email' }));

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ email: 'email deve ser um email válido' });
  });

  const requiredFields: (keyof NewUser)[] = ['nome', 'email', 'password', 'administrador'];
  for (const field of requiredFields) {
    test(`returns a field error when "${field}" is missing`, async ({ api }) => {
      const user: Partial<NewUser> = buildUser();
      delete user[field];

      const response = await api.postUser(user);

      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({ [field]: `${field} é obrigatório` });
    });
  }

  test('updates a user with PUT', async ({ api, data }) => {
    const user = await api.createUser();
    data.user(user._id);
    const changes = { ...buildUser(), nome: 'QA Renamed' };

    const response = await api.putUser(user._id, changes);

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ message: 'Registro alterado com sucesso' });
    expect(await (await api.getUser(user._id)).json()).toMatchObject({ nome: 'QA Renamed', email: changes.email });
  });

  test('deletes a user, after which GET returns "not found"', async ({ api }) => {
    const user = await api.createUser();

    const deleted = await api.deleteUser(user._id);
    expect(deleted.status()).toBe(200);
    expect(await deleted.json()).toEqual({ message: 'Registro excluído com sucesso' });

    const fetched = await api.getUser(user._id);
    expect(fetched.status()).toBe(400);
    expect(await fetched.json()).toEqual({ message: 'Usuário não encontrado' });
  });
});
