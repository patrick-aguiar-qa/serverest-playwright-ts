export const env = {
  baseURL: process.env.BASE_URL ?? 'https://front.serverest.dev',
  apiURL: process.env.API_URL ?? 'https://serverest.dev',
} as const;
