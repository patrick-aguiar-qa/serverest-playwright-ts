# Bug reports

Open defects in the [ServeRest front-end](https://front.serverest.dev) (public environment, November 2026)
that this suite tracks with `test.fail()` in
[`tests/ui/known-issues.spec.ts`](tests/ui/known-issues.spec.ts) and
[`tests/ui/network.spec.ts`](tests/ui/network.spec.ts).

BUG-01 to BUG-07 were first found and fully reported (steps, expected and actual results, evidence) in the
[Cypress project](https://github.com/patrick-aguiar-qa/serverest-web-cypress/blob/main/BUG_REPORTS.md); this suite
reproduces them independently in Chromium, Firefox and a mobile viewport. **BUG-10 and BUG-11 are new**, found
here with network mocking.

> ServeRest is a study project, so some of these behaviors may be intentional for teaching purposes.
> They are reported here the way I would report them in a real product.

| ID | Summary | Severity | Priority | Browsers |
|---|---|---|---|---|
| [BUG-01](#bug-01) | Customers can open the admin area | High | High | Chromium, Firefox |
| [BUG-02](#bug-02) | "−" does not remove the last unit from the shopping list | Medium | Medium | Chromium, Firefox |
| [BUG-03](#bug-03) | Shopping list accepts more units than the stock | Medium | Medium | Chromium, Firefox |
| [BUG-06](#bug-06) | Admin user list shows every user's password | High | High | Chromium, Firefox |
| [BUG-07](#bug-07) | Mobile menu does not open | High | High | Mobile (Pixel 7) |
| [BUG-10](#bug-10) | Empty catalog shows a blank store instead of an empty-state message | Low | Low | Chromium, Firefox |
| [BUG-11](#bug-11) | A slow catalog response overwrites the search results | Medium | Medium | Chromium, Firefox |

---

## BUG-01

**Customers can open the admin area.** A customer who types `/admin/cadastrarusuarios` in the address bar gets the
admin page. The front-end checks only that a token exists, not the user's role.

## BUG-02

**"−" does not remove the last unit.** With quantity 1, clicking "−" leaves the product in the shopping list.

## BUG-03

**The shopping list accepts more units than the stock.** A product with stock 3 can be raised to 4 or more units;
the customer only finds out when the order is refused.

## BUG-06

**The admin user list shows every user's password** in a "Senha" column, in plain text (security).

## BUG-07

**The mobile menu does not open.** On a phone the navigation collapses behind a toggle that does nothing, so the
customer cannot reach "Lista de Compras", "Carrinho" or "Logout".

---

## BUG-10

**Empty catalog shows a blank store instead of an empty-state message**

**Severity:** Low — no data loss, but a customer who opens an empty store sees a blank area under "Produtos"
and cannot tell "no products" from "still loading" or "broken page".
**Priority:** Low. **Type:** missing empty state / inconsistent message.

**How it was found:** `page.route()` returns `{ "quantidade": 0, "produtos": [] }` for `GET /produtos`, the only
way to get an empty catalog on a shared public server.

**Steps to reproduce**
1. Log in as a customer
2. Make `GET https://serverest.dev/produtos` return an empty list (mock, or an environment with no products)
3. Open `/home`

**Expected result:** the same message the search shows when nothing matches: "Nenhum produto foi encontrado".
**Actual result:** only the "Produtos" heading is shown, with an empty area below it.

**Evidence:** `tests/ui/network.spec.ts` → "BUG-10" (trace and screenshot in the HTML report when run without
`test.fail()`).

---

## BUG-11

**A slow catalog response overwrites the search results**

**Severity:** Medium. The customer searches, gets a result (or the "Nenhum produto foi encontrado" message), and
a moment later the whole catalog replaces it. They see products that do not match the search, and on a slow
connection the message and the full catalog appear at the same time.
**Priority:** Medium. **Type:** race condition (stale response). **Reproducible:** 6 of 6 runs with the mock
below, in Chromium and Firefox.

**How it was found:** a flaky run in Firefox, where the regression test "a search with no results" saw the
"no products" message **and** 269 product cards. Instead of adding a retry, the race was isolated: only the first,
unfiltered `GET /produtos` is delayed by 3 s with `page.route()`, and the search runs before it answers.

**Steps to reproduce**
1. Log in as a customer on a slow connection (or delay `GET /produtos` without `?nome=` by 3 s)
2. Open `/home` and search right away for `zzz-product-that-does-not-exist`
3. The message "Nenhum produto foi encontrado" is shown
4. Wait for the initial catalog request to answer

**Expected result:** the search result stays on screen; a response for an older request is ignored
(for example by cancelling it with an `AbortController`, or by keeping only the response of the latest request).
**Actual result:** the whole catalog (269 products at the time) is shown below the "no products" message.

**Evidence:** `tests/ui/network.spec.ts` → "BUG-11". The regression specs wait for the initial catalog before
searching (`StorePage.goto()`), the way a user waits for the page to load, so they stay stable.
