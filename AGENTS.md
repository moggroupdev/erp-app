# AGENTS.md - ERP App

Next.js (App Router) + React 19 + Mantine + TanStack React Query frontend. Follow existing patterns; keep changes focused.

Path alias: `@/*` → `./src/*`.

---

## Project structure

```
src/
├── app/[locale]/             # All routes are locale-prefixed (/en/…, /ar/…)
│   ├── layout.tsx             # Root providers + <html lang/dir>
│   ├── (inner)/               # Authenticated ERP app (sidebar shell)
│   ├── (outer)/               # Guest-only (e.g. login)
│   ├── (public)/              # Public pages (no auth gate)
│   └── [...not-found]/
├── components/
│   ├── global/                # Cross-feature UI (sidebar, logo, address-card, …)
│   │   ├── data-modals/       # Shared create/edit entity modals
│   │   └── selections/        # Shared LocalizedSelect wrappers
│   │       ├── enum-based/    # Options from `lib/constants/enums`
│   │       └── query-based/   # Options from `@/hooks/reference`
│   ├── guards/                # Auth + permission guards
│   ├── layouts/               # Inner shell / page chrome
│   ├── mantine/               # Mantine setup helpers
│   └── ui/                    # Reusable primitives (LayoutBox, sections, …)
├── contexts/
│   └── user/                  # Auth user state (context + provider + hook)
├── providers/
│   └── query.tsx              # React Query client + Devtools
├── hooks/                     # Shared hooks (private request, permissions, …)
│   └── reference/             # Cached reference data hooks
├── lib/
│   ├── api/                   # Domain API modules + query-keys/
│   ├── constants/             # Enums (incl. derived/), stale times, global flags
│   ├── helpers/               # api-request, get-error-message, metadata, …
│   └── i18n/                  # Locales, hooks, utils, dictionaries
├── middlewares/               # Localization (used from proxy.ts)
└── types/                     # Shared DTOs / domain types (+ reports/ for aggregate shapes)
```

Providers in `src/app/[locale]/layout.tsx`:

```
QueryProvider → UserProvider → MantineProvider
```

Locale routing: `src/proxy.ts` → `src/middlewares/localization.middleware.ts` (no root `middleware.ts`).

---

## Route groups: `(inner)` / `(outer)` / `(public)`

All live under `src/app/[locale]/`. The group name is **not** in the URL — only `[locale]` and the page path are.

| Group      | Auth               | Layout behavior                                                        | When to use                                  |
| ---------- | ------------------ | ---------------------------------------------------------------------- | -------------------------------------------- |
| `(inner)`  | Must be logged in  | `AuthenticationGuard access="authenticated"` + `InnerLayout` (sidebar) | ERP feature pages (CRUD, dashboard, profile) |
| `(outer)`  | Must be logged out | `AuthenticationGuard access="guest"`                                   | Login and other guest-only flows             |
| `(public)` | Anyone             | No auth guard (no group layout today)                                  | Marketing/legal: privacy, terms, contact     |

**Behavior:**

- Unauthenticated visit to `(inner)` → redirect to `/login?from=<currentPath>`.
- Authenticated visit to `(outer)` → redirect to `from` query or `/dashboard`.
- `(public)` is reachable signed in or out; do **not** wrap it with `AuthenticationGuard` unless requirements change.
- Permission checks (`PermissionGuard` / layout `PERMISSIONS.*`) apply inside `(inner)` feature areas — separate from auth.

**Do** place new pages in the correct group by access model. **Don’t** put login under `(inner)`, or put authenticated CRUD under `(public)`.

---

## Data fetching (React Query)

| Piece       | Path                                   |
| ----------- | -------------------------------------- |
| Provider    | `src/providers/query.tsx`              |
| Query keys  | `src/lib/api/query-keys/index.ts`      |
| Stale times | `src/lib/constants/stale-times.ts`     |
| Errors      | `src/lib/helpers/get-error-message.ts` |

Defaults (in `QueryProvider`): `retry: 0`, `staleTime: 0`, `refetchOnWindowFocus: false`. Override `staleTime` per resource via `staleTimes`.

### Stale times

Most resources use a flat entry (`staleTimes.materials`). When a domain has **multiple caches with different lifetimes** (reports), nest by feature:

```ts
staleTimes.reports.materialsInventorySummary;
```

Do **not** share one stale time across all reports — each report gets its own key under `staleTimes.reports`.

### Query keys

Import from `@/lib/api/query-keys`. Use `queryKeys` only — never hardcode key arrays in pages/modals.

Hierarchy (see JSDoc on `query-keys/index.ts`):

- `all` → everything under a resource
- `lists()` / `list(filters)` → all lists vs one filtered list
- `details()` / `detail(id)` → all details vs one item (materials use `detail(code)`)
- Nested keys (e.g. `addresses(id)`) hang off `detail(id)`

**New resource:** add entries to `queryKeys` (+ `staleTimes` when caching should differ from default).

### Queries

- `"use client"` pages use `useQuery` with `queryKey` from `queryKeys` and `queryFn` that passes `signal` into the API when supported.
- Authenticated fetches: inject `usePrivateRequest()`.
- Paginated lists: `placeholderData: keepPreviousData`.
- **Loading UI:** drive from `isFetching` (full loading on every fetch/refetch), not `isPending` alone.
- Manual refresh: `RefetchButton` in `LayoutBox` header `sideElements` + `refetch()` / shared retry handler.

### Mutations & cache

| After write                        | Prefer                                                                |
| ---------------------------------- | --------------------------------------------------------------------- |
| Create / update entity             | `invalidateQueries({ queryKey: queryKeys.<resource>.all })`           |
| Nested collection only (addresses) | `invalidateQueries` on that nested key (e.g. `vendors.addresses(id)`) |

---

## Reference data hooks

Cached, rarely changing shared data lives under `src/hooks/reference/`. Each hook returns `{ data, loading, error, reload, helpers }`.

Do **not**:

- Inline `.find()` against the list in pages/components
- Add separate `use-*-helpers` files
- Reintroduce Locations / Departments / Roles (or categories) context providers

| Hook                      | Path                                             | `helpers`                                                                                               |
| ------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `useLocations()`          | `src/hooks/reference/use-locations.ts`           | `getCountryById`, `getGovernorateById`, `getCityById`, `getGovernorateOfCity`, `getCitiesOfGovernorate` |
| `useDepartments()`        | `src/hooks/reference/use-departments.ts`         | `getDepartmentById`                                                                                     |
| `useRoles()`              | `src/hooks/reference/use-roles.ts`               | `getRoleById`                                                                                           |
| `useMaterialCategories()` | `src/hooks/reference/use-material-categories.ts` | `getMaterialCategoryMainById`, `getMaterialCategorySubById`, `getMaterialSubcategoriesOfMain`           |
| `useProductCategories()`  | `src/hooks/reference/use-product-categories.ts`  | `getProductCategoryMainById`, `getProductCategorySubById`, `getProductSubcategoriesOfMain`              |

```ts
import useDepartments from "@/hooks/reference/use-departments";
import useLocations from "@/hooks/reference/use-locations";

const { data: departments, loading, helpers } = useDepartments();
const department = helpers.getDepartmentById(departmentId);

const { helpers: locationHelpers } = useLocations();
const city = locationHelpers.getCityById(cityId);
```

**New reference hook:** add it under `src/hooks/reference/` with the same return shape and lookup helpers under `helpers`.

Query-based selects under `components/global/selections/query-based/` should use these hooks (not fetch ad hoc).

---

## API layer

| Piece            | Path                                              |
| ---------------- | ------------------------------------------------- |
| HTTP wrapper     | `src/lib/helpers/api-request.ts`                  |
| Domain APIs      | `src/lib/api/<domain>.ts` (default-export object) |
| Query keys       | `src/lib/api/query-keys/`                         |
| Types            | `src/types/api.ts` (`PrivateRequest`, options)    |
| Private requests | `src/hooks/use-private-request.ts`                |

- Public endpoints (login, locations, categories): call via `apiRequest` / domain API without bearer injection.
- Protected endpoints: API methods accept `{ privateRequest, … }` and call `privateRequest(...)`.
- Pages/modals must not set `Authorization` themselves — `usePrivateRequest` does.
- Base URL: `NEXT_PUBLIC_API_URL`. Pass React Query `signal` through for cancellation.
- Surface errors with `getErrorMessage(locale, error)` (mutations: often with `ErrorAlert`).

---

## Reports

Reports differ from CRUD domains: response shapes are custom aggregates, not entity DTOs.

| Piece       | Path                                                                 |
| ----------- | -------------------------------------------------------------------- |
| API         | `src/lib/api/reports.ts` — nest by domain (`reportsApi.materials.*`) |
| Types       | `src/types/reports/<domain>.ts` + barrel `index.ts`                  |
| Query keys  | `queryKeys.reports.<domain>.…`                                       |
| Stale times | `staleTimes.reports.<reportName>` (per report, not one shared value) |

**Types:** do **not** put report shapes in a flat `src/types/<domain>.ts` CRUD file. Use `src/types/reports/<domain>.ts` (e.g. `materials.ts`) and re-export from `src/types/reports/index.ts`. Import via `@/types/reports`.

**New report:** add types under the matching domain file, API method under `reportsApi.<domain>`, query key, and a dedicated `staleTimes.reports.<reportName>` entry.

---

## Auth & permissions

| Piece             | Path                                                     |
| ----------------- | -------------------------------------------------------- |
| User context      | `src/contexts/user/` (`useUser`)                         |
| Auth guard        | `src/components/guards/auth.tsx`                         |
| Permission guard  | `src/components/guards/permission.tsx`                   |
| Permission hook   | `src/hooks/use-has-permission.ts`                        |
| Permission values | `src/lib/constants/enums/permissions.ts` → `PERMISSIONS` |

- Use `PERMISSIONS.*` constants only — never invent permission strings.
- Page access: layout-level `<PermissionGuard permission={…} isForPage>`.
- Buttons/actions: wrap with `PermissionGuard` or gate with `useHasPermission`.
- Admins (`user.isAdmin`) bypass permission checks.

---

## Enums & constants

Domain enums live under `src/lib/constants/enums/`. Most mirror DB-backed values from the server (`erp-server` `src/utils/constants.ts`).

| Concern                  | Where                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| DB-backed enums          | `src/lib/constants/enums/<name>.ts` (e.g. material types, permissions)                                       |
| Derived / app-only enums | `src/lib/constants/enums/derived/<name>.ts` — no DB enum counterpart (e.g. stock status computed in reports) |
| Values + typed map       | e.g. `PERMISSION_VALUES` → `PERMISSIONS`, `PRODUCT_SOURCE_TYPE_VALUES` → `PRODUCT_SOURCE_TYPES`              |
| Labels / lists / helpers | Same file (`*_LABELS`, `get*Label`, …)                                                                       |
| Other constants          | `src/lib/constants/` (`stale-times.ts`, `global.ts`, `regex.ts`, …)                                          |

**Rules:**

1. Define new **DB-backed** enums in `src/lib/constants/enums/<name>.ts` first — values, TypeScript type, `SCREAMING_MAP`, and bilingual labels when needed. Keep them aligned with the server constants.
2. Define **derived** enums (computed classifications, report-only statuses, anything with no DB enum) under `src/lib/constants/enums/derived/` — same file pattern, different folder.
3. Import those constants in pages/components/API code.
4. **Never** hardcode enum strings (permission names, source types, …) directly in components or pages.
5. Enum-backed selects belong under `components/global/selections/enum-based/`.

Permissions are part of this rule: always `PERMISSIONS.READ_VENDORS`, never `"read_vendors"` inline.

---

## i18n

Locales: `en` `ar` (default `ar`). Config: `src/lib/i18n/config.ts`.

### Primary helpers

| Helper                           | Where                   | Use for                                                      |
| -------------------------------- | ----------------------- | ------------------------------------------------------------ |
| `useI18n()`                      | `src/lib/i18n/hooks.ts` | **Client** components — `{ locale, translate, translation }` |
| `getI18nFromParams(params)`      | `src/lib/i18n/utils.ts` | **Server** components / pages / `generateMetadata`           |
| `useLocaleHref()`                | `src/lib/i18n/hooks.ts` | **Client** links — returns `(path) => /${locale}${path}`     |
| `getLocalizedHref(locale, path)` | `src/lib/i18n/utils.ts` | **Server** links / redirects                                 |

### Usage

```ts
// Client component
const { locale, translate } = useI18n();
const href = useLocaleHref();
<a href={href("/procurement/vendors")}>{translate("Vendors", "الموردون")}</a>

// Server page / components
const { locale, translate, translation } = await getI18nFromParams(params);
const url = getLocalizedHref(locale, "/privacy-policy");
```

**Rules:**

- Pass paths **without** a locale prefix (`"/dashboard"`, not `"/ar/dashboard"`).
- Never hardcode `/en/...` or `/ar/...` in hrefs.
- Inline bilingual UI copy via `translate("English", "العربية")`.
- Dictionary strings (dir, shared messages) via `translation` when appropriate.
- Do **not** use the em dash character (`—`) in UI copy or string literals.

---

## UI patterns

| Pattern                 | Path                                                   |
| ----------------------- | ------------------------------------------------------ |
| Page shell              | `src/components/ui/layout-box.tsx`                     |
| Loading / error / empty | `src/components/ui/sections/{loading,error,empty}.tsx` |
| No search results       | `src/components/ui/sections/no-results.tsx`            |
| Refetch control         | `src/components/ui/refetch-button.tsx`                 |
| Modal shell             | `src/components/ui/modal.tsx`                          |
| Data modals             | `src/components/global/data-modals/*-modal`            |
| Page-local modals       | Feature page `components/` (e.g. department modal)     |
| Enum-based selects      | `src/components/global/selections/enum-based/*`        |
| Query-based selects     | `src/components/global/selections/query-based/*`       |

Typical list/detail body: `isFetching` → `LoadingSection` → else `ErrorSection` (retry) → else empty/no-results → else content.

- Modal open/close: `@mantine/hooks` `useDisclosure`.
- Submit loading: `mutation.isPending` on Mantine `Button loading`.
- Document title: `useDocumentTitle` with bilingual titles.
- Icons: prefer `lucide-react`.
- Do **not** use heavy hover translate/lift (`translate-y`, etc.) or heavy hover shadow changes on cards and list items. Prefer quiet hover.

**Selects:** enum options → `selections/enum-based/`; reference-hook options (locations, departments, roles, categories, …) → `selections/query-based/`. Do not leave new shared selects at `components/global/select-*`.

Match existing CRUD pages (vendors, customers, materials, departments) when adding new ones.
