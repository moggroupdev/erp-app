# AGENTS.md - ERP App

Next.js (App Router) + React 19 + Mantine + TanStack React Query frontend. Follow existing patterns; keep changes focused.

Path alias: `@/*` → `./src/*`.

---

## Project structure

```
src/
├── app/[locale]/           # All routes are locale-prefixed (/en/…, /ar/…)
│   ├── layout.tsx           # Root providers + <html lang/dir>
│   ├── (inner)/             # Authenticated ERP app (sidebar shell)
│   ├── (outer)/             # Guest-only (e.g. login)
│   ├── (public)/            # Public pages (no auth gate)
│   └── [...not-found]/
├── components/
│   ├── global/              # Cross-feature (modals, sidebar, selects, …)
│   ├── guards/              # Auth + permission guards
│   ├── layouts/             # Inner shell / page chrome
│   ├── mantine/             # Mantine setup helpers
│   └── ui/                  # Reusable primitives (LayoutBox, sections, …)
├── contexts/
│   ├── user/                # Auth user state
│   └── query/               # React Query client + Devtools
├── hooks/                   # Shared hooks (private request, locations, …)
├── lib/
│   ├── api/                 # Domain API modules + query/keys.ts
│   ├── constants/           # Enums, stale times, global flags
│   ├── helpers/             # api-request, get-error-message, metadata, …
│   └── i18n/                # Locales, hooks, utils, dictionaries
├── middlewares/             # Localization (used from proxy.ts)
└── types/                   # Shared DTOs / domain types
```

Providers in `src/app/[locale]/layout.tsx`:

```
QueryProvider → UserProvider → MantineProvider
```

Locale routing: `src/proxy.ts` → `src/middlewares/localization.middleware.ts` (no root `middleware.ts`).

---

## Route groups: `(inner)` / `(outer)` / `(public)`

All live under `src/app/[locale]/`. The group name is **not** in the URL - only `[locale]` and the page path are.

| Group      | Auth               | Layout behavior                                                        | When to use                                  |
| ---------- | ------------------ | ---------------------------------------------------------------------- | -------------------------------------------- |
| `(inner)`  | Must be logged in  | `AuthenticationGuard access="authenticated"` + `InnerLayout` (sidebar) | ERP feature pages (CRUD, dashboard, profile) |
| `(outer)`  | Must be logged out | `AuthenticationGuard access="guest"`                                   | Login and other guest-only flows             |
| `(public)` | Anyone             | No auth guard (no group layout today)                                  | Marketing/legal: privacy, terms, contact     |

**Behavior details:**

- Unauthenticated visit to `(inner)` → redirect to `/login?from=<currentPath>`.
- Authenticated visit to `(outer)` → redirect to `from` query or `/dashboard`.
- `(public)` is reachable signed in or out; do **not** wrap it with `AuthenticationGuard` unless requirements change.
- Permission checks (`PermissionGuard` / layout `PERMISSIONS.`\*) apply inside `(inner)` feature areas - they are separate from auth.

**Do** place new pages in the correct group by access model. **Don’t** put login under `(inner)`, or put authenticated CRUD under `(public)`.

---

## Data fetching (React Query)

| Piece       | Path                                   |
| ----------- | -------------------------------------- |
| Provider    | `src/contexts/query/provider.tsx`      |
| Query keys  | `src/lib/api/query/keys.ts`            |
| Stale times | `src/lib/constants/stale-times.ts`     |
| Errors      | `src/lib/helpers/get-error-message.ts` |

Defaults: `retry: 0`, `staleTime: 0`, `refetchOnWindowFocus: false`. Override `staleTime` per resource via `staleTimes`.

### Query keys

Use `queryKeys` only - never hardcode key arrays in pages/modals.

Hierarchy (see JSDoc on `keys.ts`):

- `all` → everything under a resource
- `lists()` / `list(filters)` → all lists vs one filtered list
- `details()` / `detail(id)` → all details vs one item
- Nested keys (e.g. `addresses(id)`) hang off `detail(id)`

**New resource:** add entries to `queryKeys` (+ `staleTimes` when caching should differ from default).

Current stale times: vendors `10m`, customers `5m`, locations/departments `Infinity` (until full reload).

### Queries

- `"use client"` pages use `useQuery` with `queryKey` from `queryKeys` and `queryFn` that passes `signal` into the API when supported.
- Authenticated fetches: inject `usePrivateRequest()`.
- Paginated lists: `placeholderData: keepPreviousData`.
- **Loading UI:** drive from `isFetching` (full loading on every fetch/refetch), not `isPending` alone.
- Manual refresh: `RefetchButton` in `LayoutBox` header `sideElements` + `refetch()` / shared retry handler.
- Rarely changing shared data: `useLocations()` / `useDepartments()` - **do not** reintroduce Locations/Departments context providers.

### Mutations & cache

| After write                        | Prefer                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| Create / update entity             | `invalidateQueries({ queryKey: queryKeys.<resource>.all })`                                 |
| Update when API returns the entity | also `setQueryData(queryKeys.<resource>.detail(id), response)` (see vendor/customer modals) |
| Nested collection only (addresses) | `invalidateQueries` on that nested key                                                      |

Prefer invalidation for correctness; `setQueryData` is an optional detail patch when the response is complete.

**Do not** revive deleted helpers: `use-data-handler.ts`, `handle-request.ts`.

---

## API layer

| Piece            | Path                                              |
| ---------------- | ------------------------------------------------- |
| HTTP wrapper     | `src/lib/helpers/api-request.ts`                  |
| Domain APIs      | `src/lib/api/<domain>.ts` (default-export object) |
| Types            | `src/types/api.ts` (`PrivateRequest`, options)    |
| Private requests | `src/hooks/use-private-request.ts`                |

- Public endpoints (login, locations): call via `apiRequest` / domain API without bearer injection.
- Protected endpoints: API methods accept `{ privateRequest, … }` and call `privateRequest(...)`.
- Pages/modals must not set `Authorization` themselves - `usePrivateRequest` does.
- Base URL: `NEXT_PUBLIC_API_URL`. Pass React Query `signal` through for cancellation.
- Surface errors with `getErrorMessage(locale, error)` (mutations: often with `ErrorAlert`).

---

## Auth & permissions

| Piece             | Path                                                     |
| ----------------- | -------------------------------------------------------- |
| User context      | `src/contexts/user/` (`useUser`)                         |
| Auth guard        | `src/components/guards/auth.tsx`                         |
| Permission guard  | `src/components/guards/permission.tsx`                   |
| Permission hook   | `src/hooks/use-has-permission.ts`                        |
| Permission values | `src/lib/constants/enums/permissions.ts` → `PERMISSIONS` |

- Use `PERMISSIONS.`\* constants only - never invent permission strings.
- Page access: layout-level `<PermissionGuard permission={…} isForPage>`.
- Buttons/actions: wrap with `PermissionGuard` or gate with `useHasPermission`.
- Admins (`user.isAdmin`) bypass permission checks.

---

## Enums & constants

All domain enums live under `src/lib/constants/enums/` (same pattern as existing files).

| Concern                  | Where                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| Values + typed map       | e.g. `PERMISSION_VALUES` → `PERMISSIONS`, `PRODUCT_SOURCE_TYPE_VALUES` → `PRODUCT_SOURCE_TYPES` |
| Labels / lists / helpers | Same file (`*_LABELS`, `get*Label`, …)                                                          |
| Other constants          | `src/lib/constants/` (`stale-times.ts`, `global.ts`, `regex.ts`, …)                             |

**Rules:**

1. Define new enums in `src/lib/constants/enums/<name>.ts` first - values, TypeScript type, `SCREAMING_MAP`, and bilingual labels when needed.
2. Import those constants in pages/components/API code.
3. **Never** hardcode enum strings (permission names, source types, …) directly in components or pages.

Permissions are part of this rule: always `PERMISSIONS.READ_VENDORS`, never `"read_vendors"` inline.

---

## i18n

Locales: `en` `ar` (default `**ar`). Config: `src/lib/i18n/config.ts`.

### Primary helpers

| Helper                           | Where                   | Use for                                                      |
| -------------------------------- | ----------------------- | ------------------------------------------------------------ |
| `useI18n()`                      | `src/lib/i18n/hooks.ts` | **Client** components - `{ locale, translate, translation }` |
| `getI18nFromParams(params)`      | `src/lib/i18n/utils.ts` | **Server** components / pages / `generateMetadata`           |
| `useLocaleHref()`                | `src/lib/i18n/hooks.ts` | **Client** links - returns `(path) => /${locale}${path}`     |
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

---

## UI patterns

| Pattern                 | Path                                                   |
| ----------------------- | ------------------------------------------------------ |
| Page shell              | `src/components/ui/layout-box.tsx`                     |
| Loading / error / empty | `src/components/ui/sections/{loading,error,empty}.tsx` |
| No search results       | `src/components/ui/sections/no-results.tsx`            |
| Refetch control         | `src/components/ui/refetch-button.tsx`                 |
| Modal shell             | `src/components/ui/modal.tsx`                          |
| Feature modals          | `src/components/global/*-modal` or page `components/`  |

Typical list/detail body: `isFetching` → `LoadingSection` → else `ErrorSection` (retry) → else empty/no-results → else content.

- Modal open/close: `@mantine/hooks` `useDisclosure`.
- Submit loading: `mutation.isPending` on Mantine `Button loading`.
- Document title: `useDocumentTitle` with bilingual titles.
- Icons: prefer `lucide-react`.
- Do **not** use heavy hover translate/lift (`translate-y`, etc.) or heavy hover shadow changes on cards and list items. Prefer quiet hover.

Match existing CRUD pages (vendors, customers, departments) when adding new ones.
