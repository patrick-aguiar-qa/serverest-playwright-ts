# ServeRest Tests (Playwright + TypeScript)

![Tests](https://github.com/patrick-aguiar-qa/serverest-playwright-ts/actions/workflows/tests.yml/badge.svg)

API and end-to-end web tests for [ServeRest](https://serverest.dev), a REST API and React e-commerce
([front-end](https://front.serverest.dev)) built for testing practice. Written in **TypeScript** with
**Playwright Test**, using page objects, custom fixtures and network mocking.

**70 test cases, 109 runs per pipeline:**

| Project | Runs | What it covers |
|---|---|---|
| `api` | 27 | Users, login, products and carts: status codes, exact bodies, authorization (401 / 403), boundaries, stock rules |
| `chromium` | 39 | Login, sign-up, session, admin products, store and shopping list, network mocking, known bugs |
| `firefox` | 39 | The same UI suite in a second engine |
| `mobile` | 4 | Pixel 7 viewport with touch and mobile user agent (`@mobile` tag) |

It also tracks **7 open bugs** with `test.fail()`, documented in [BUG_REPORTS.md](BUG_REPORTS.md). Two of them
are **new findings of this project**:

- **BUG-11, a race condition:** a flaky Firefox run showed the "no products" message next to the whole catalog.
  Instead of adding a retry, the race was isolated with `page.route()` (only the initial catalog response is
  delayed) and now reproduces in 6 of 6 runs: a slow response overwrites the search results.
- **BUG-10, a missing empty state:** found by mocking an empty catalog.

This project is part of a QA portfolio on the same product:
[API tests (Mocha)](https://github.com/patrick-aguiar-qa/serverest-api-tests) ·
[Web tests (Cypress)](https://github.com/patrick-aguiar-qa/serverest-web-cypress) ·
**Playwright + TypeScript** (this repo) ·
[Performance tests (k6)](https://github.com/patrick-aguiar-qa/serverest-k6-performance).

## Stack

| Tool | Purpose |
|---|---|
| [Playwright Test 1.65](https://playwright.dev/) | Test runner, browser automation (Chromium, Firefox, mobile emulation) and API testing (`APIRequestContext`) |
| TypeScript (strict) | Typed API client, page objects and fixtures; `tsc --noEmit` runs in CI |
| ESLint + `typescript-eslint` + `eslint-plugin-playwright` | Blocks `force: true`, hard waits, non-web-first assertions and conditional expects |
| GitHub Actions | Lint and typecheck, then one parallel job per project, each publishing its HTML report with traces |

## What is tested

### API (`tests/api`)

| Spec | Tests | Focus |
|---|---|---|
| `users.spec.ts` | 9 | Create + GET by id (exact body), duplicate email, email format, each required field (data-driven), PUT, DELETE |
| `login.spec.ts` | 4 | JWT format of the token, wrong password, unknown email, blank fields |
| `products.spec.ts` | 9 | Create + search, 401 without / with a tampered token, 403 for customers, duplicate name, price boundary `-1 / 0 / 1`, DELETE |
| `carts.spec.ts` | 5 | Stock is reserved and given back on cancel, kept on purchase, over-stock refused, one cart per user, product in a cart cannot be deleted |

### Web (`tests/ui`)

| Spec | Tests | Focus |
|---|---|---|
| `login.spec.ts` | 6 | Admin and customer login, wrong password, required fields, HTML5 email validation (no request sent), sign-up link |
| `sign-up.spec.ts` | 4 | Customer and admin accounts, duplicate email, required fields |
| `session.spec.ts` | 5 | Private pages redirect to login; logout really ends the session |
| `admin-products.spec.ts` | 6 | Register and list with data in each column, duplicate name, required fields, price boundary `0 / 1`, delete |
| `store.spec.ts` | 7 | Search, no results, details page, add to list, quantity × price, list kept across pages, clear list |
| `network.spec.ts` | 7 | `page.route()`: the store renders exactly what the API returns, empty catalog (BUG-10), search sends the right query, slow catalog vs. search race (BUG-11), login with HTTP 500 and with the network down |
| `responsive.spec.ts` | 3 | `@mobile`: login on a phone, no horizontal scroll, collapsed navigation |
| `known-issues.spec.ts` | 5 | Open bugs (BUG-01, 02, 03, 06 and the mobile BUG-07) asserted as the correct behavior with `test.fail()` |

## Design decisions

- **Fixtures instead of hooks.** `src/fixtures.ts` extends Playwright's `test` with a typed API client, page objects,
  one admin and one customer **per worker** (created and deleted through the API) and a fresh `product` per test.
  A test only asks for what it needs: `async ({ store, shoppingList, product }) => …`.
- **Login through the API, not the UI**, except where login is the goal. `test.use({ loginAs: 'admin' })` overrides
  Playwright's `storageState` with the token and the same `localStorage` keys the front-end writes on login.
- **Clean data on a shared public server.** Every test gets a `DataTracker` that deletes what it created
  (carts → products → users, in dependency order); names and emails are unique per run.
- **Network mocking for states that are hard to create:** an empty catalog, a server error or a network failure on
  login cannot be produced on a shared server, so `page.route()` produces them. The route matcher compares the
  API origin and path, so front-end routes such as `/admin/listarprodutos` are never intercepted by mistake.
- **Known bugs run in every pipeline with `test.fail()`.** They assert the expected behavior and stay green while the
  bug exists; when a bug is fixed, the test passes unexpectedly and the pipeline fails, a reminder to promote it
  to the regression specs. Each one carries an `issue` annotation that points to its report.
- **Locators users can see:** `getByRole`, `getByTestId` (`data-testid`) and visible text; web-first assertions
  (`toHaveText`, `toHaveURL`, `toHaveCount`) with auto-waiting, no fixed waits.
- **Flaky tests are investigated, not retried away.** The retry in CI (1, only there) absorbs network noise from the
  shared server, but a flaky result is read in the trace first. That is how BUG-11 was found, and why
  `StorePage.goto()` now waits for the initial catalog before a search, as a user would.
- **Evidence:** trace (DOM snapshots, network, console) and screenshot kept for every failure.

## Project structure

```
├── .github/workflows/tests.yml   # lint + typecheck, then api / chromium / firefox / mobile in parallel
├── src/
│   ├── api/ServeRestApi.ts       # typed client: raw calls for API tests, create* helpers for setup
│   ├── data/
│   │   ├── factory.ts            # unique users and products
│   │   └── DataTracker.ts        # deletes what each test created
│   ├── pages/                    # page objects: Login, SignUp, AdminProducts, Store, ShoppingList, NavBar
│   ├── fixtures.ts               # test.extend: users, tokens, product, loginAs, page objects
│   ├── env.ts                    # BASE_URL / API_URL
│   └── types.ts                  # API contracts (User, Product, CartItem, response bodies)
├── tests/
│   ├── api/                      # project "api" (no browser)
│   └── ui/                       # projects "chromium", "firefox" and "mobile" (@mobile only)
├── playwright.config.ts
└── BUG_REPORTS.md
```

## Getting started

**Requirements:** Node.js 20 or later.

```bash
git clone https://github.com/patrick-aguiar-qa/serverest-playwright-ts.git
cd serverest-playwright-ts
npm install
npx playwright install chromium firefox
```

| Command | What it does |
|---|---|
| `npm test` | Runs every project (api, chromium, firefox, mobile) |
| `npm run test:api` | API tests only, no browser needed |
| `npm run test:ui` | UI tests in Chromium, Firefox and mobile |
| `npm run test:headed` | Chromium with the browser visible |
| `npm run test:debug` | Playwright Inspector, step by step |
| `npm run report` | Opens the last HTML report (with traces of failures) |
| `npm run typecheck` / `npm run lint` | Static checks that also run in CI |

### Environments

The front-end and API URLs default to the public ServeRest and can be changed with the `BASE_URL` and
`API_URL` environment variables. For example, the API tests against a local ServeRest (`npx serverest`,
port 3000):

```bash
API_URL=http://localhost:3000 npm run test:api
```

## Author

**Patrick Aguiar** — QA Engineer · [LinkedIn](https://www.linkedin.com/in/patrick-aguiar-qa) · [GitHub](https://github.com/patrick-aguiar-qa)
