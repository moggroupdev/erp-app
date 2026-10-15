---
name: improve-ui-ux
description: >-
  Audits and improves the UI and UX of existing ERP pages and reusable
  components: usability, clarity, visual hierarchy, accessibility,
  responsiveness, density, and design-system consistency. Use when the user
  asks to improve, polish, modernize, tighten, or audit a page, layout, form,
  table, modal, empty state, or shared UI component, or mentions visual
  hierarchy, spacing, whitespace, density, or interface consistency. Implements
  the smallest coherent production change and preserves product behavior,
  architecture, and the existing design system.
---

# Improve UI/UX

Improve the usability, clarity, visual hierarchy, accessibility, responsiveness, and consistency of the existing interface. Make the smallest coherent set of changes that delivers a meaningful improvement. Prefer production-ready implementation over generic advice. Prefer a modern, compact interface. Do not add large white space.

Work on the existing page or component. Preserve product behavior, data flow, permissions, routes, and the design system in `AGENTS.md`.

## Decide the job

| Request | Do this |
| --- | --- |
| Improve, polish, modernize, tighten, or fix the interface | Audit, then implement |
| Audit or review only | Return the ranked change set and stop |

If the target is unclear, use the page or component the user has open. Do not widen the task to neighboring screens.

## Workflow

1. Read the target and one sibling of the same kind (list, detail, create/edit form, report, modal, or shared primitive). Match the sibling's structure unless it is the thing being fixed.
2. Open the screen in the browser when it is reachable. Note what a user must scan, click, or recover from. Screenshot appearance is not the audit.
3. Rank real problems. A problem is real when it slows a task, hides the primary action, breaks alignment, fails in Arabic or on a narrow viewport, or drifts from the design system.
4. Pick the smallest set of those problems that can ship together as one coherent pass. Drop taste-only ideas.
5. Implement in the existing files. Prefer editing a shared component when every caller has the same defect. Keep a one-off fix on the page when only that page is wrong.
6. Verify the changed flow in the browser before finishing.

## Leave these alone

- Query keys, API modules, request params, mutations, cache invalidation, and server contracts.
- Permission constants, `PermissionGuard` placement, and who can see an action.
- Routes, locale prefixes, and redirect behavior.
- Validation rules and submitted field meaning.
- Providers, reference hooks, and where data is fetched.
- Color hex values. Edit `src/lib/constants/color-palette.json` only when the user asked to change the theme, then run `npm run generate:theme`.
- Copy meaning. Reword a label only to make the existing action clearer, in both languages.

A visual pass may change markup, Tailwind classes, Mantine props, and local layout. It may not redesign the feature.

## Density

This is an operational ERP. Screens should feel current and tight: clear grouping, short distances between a label and its value, and little unused surface.

- Keep the page shell rhythm in `LayoutBox`: `gap-4`, `p-4`, `sm:p-6`, `rounded-[20px]`. Do not increase that padding or gap.
- Inside a section, prefer `gap-2` or `gap-3`. Put a heading directly above its content.
- Keep filters, search, and secondary actions on one wrapping row. Do not give each filter its own full-width band.
- Use table `verticalSpacing` of `xs` or `sm`. Do not introduce tall rows to create air.
- Empty, error, and loading regions stay short: a message and, when useful, one action. Reduce padding that makes them dominate the page.
- Forms use a wrapping grid. Related fields share a row on `sm` and up. The primary action sits with the other actions, in the existing footer or header slot.
- Do not add hero bands, intro paragraphs, spacer divs, extra cards around a single table, or large icon-only empty canvases.
- Do not add shadows. The page shell already has `shadow-lg`. Separate regions with the existing border, `bg-gray-100`, or a divider.

## Hierarchy

Each view has one primary action, colored `haze`. Destructive actions use `clay` and stay away from the primary button. Success, warning, and danger states use `teal`, `ochre`, and `clay` through `getSemanticStatusColors` or `semanticTw()`.

- Page title stays the `LayoutBox` `h1`. Section titles use the existing `h2` / `h3` scale. Metadata uses gray text, smaller than the value it describes.
- Status is text plus color. Color alone is not the status.
- Icons come from `lucide-react` at the size already used beside that control (usually 14 to 18). Do not add decorative icons that repeat the label.
- Numeric and code columns align and stay on one line when the table scrolls. Use the existing mono treatment for codes.
- Repeated tables of the same shape get `table-fixed` and shared column widths so columns line up across groups.
- Hover stays quiet. Do not add `translate-y`, lift, or a stronger hover shadow.

## Use what already exists

| Need | Use |
| --- | --- |
| Page chrome | `LayoutBox` title, subtitle, back link, `sideElements` |
| Fetch states | `LoadingSection`, `ErrorSection`, `EmptySection`, `NoResultsSection` driven by `isFetching` |
| Refresh | `RefetchButton` |
| Dialogs | `src/components/ui/modal.tsx` and `useDisclosure` |
| Row actions | `ActionsMenu` |
| Access | `PermissionGuard` or `useHasPermission` |
| Enum options | `components/global/selections/enum-based/` |
| Reference options | `components/global/selections/reference-based/` |
| Searchable entities | `components/global/selections/remote-based/` |
| Entered vs base quantities | `UnitToggle` and the existing format helpers |
| Status color | `getSemanticStatusColors()` |

Do not invent a second shell, modal, select, or unit switch. Mantine color names such as `red`, `blue`, and `orange` are outside the palette. Semantic names are `haze`, `teal`, `ochre`, `clay`, `plum`. `navy` is brand selection and caret, not a status badge.

## Accessibility and both locales

- Keep every existing label, `title`, and keyboard path. Icon-only buttons keep a localized accessible name.
- Do not convey state by color alone. Keep the word.
- Text on a tinted surface uses the palette's darker step (`600` or `700`) on the light step (`50`).
- Do not shrink controls below the mobile button scale in `src/app/globals.css`.
- Wide tables scroll inside their container. Do not crush columns until the text overlaps.
- New UI strings go through `translate("English", "العربية")` or the existing dictionary. Pass hrefs without a locale prefix. Do not write the em dash character in UI copy.
- Arabic is the default locale and is RTL. Check that wrapped rows, icons, and the back arrow still read correctly. Follow the existing direction handling (`dir` on modals, `rotateY` on the back arrow) instead of adding a new RTL system.
- Prefer `ms` / `me`, `ps` / `pe`, and `text-start` when adding new spacing or alignment so the change survives RTL.

## What to look for

Scan only the target, in this order:

1. Primary action is visible without hunting, and secondary actions do not compete with it.
2. Related fields and values are grouped. Labels sit next to the thing they name.
3. Filters, table headers, and row actions align with sibling pages.
4. Loading, empty, error, and no-results states are present when that page already fetches data, and they do not leave a large blank region.
5. Status badges, links, and destructive buttons use the semantic roles above.
6. The layout wraps cleanly below the `sm` breakpoint and still fits longer Arabic labels.
7. Interactive elements have names, visible focus, and enough target size.
8. Shared primitives are reused. Duplicated local markup is a candidate to switch to the primitive, not a reason to restyle only one copy.

## Ship bar

Ship the pass when the target is easier to scan, the primary task is obvious, status and actions match the rest of the app, and the screen is denser without overlap or clipped text. Behavior, permissions, and submitted data stay the same.

Stop when the next edit would only swap spacing, color, or wording by taste.

## Verification

After implementation, exercise the changed flow in the browser: the main task, plus empty, error, and loading states when those branches changed. Repeat in Arabic when copy or layout changed. Check a narrow viewport when widths, wrapping, or tables changed.

If the browser is unavailable, say what you could not verify.
