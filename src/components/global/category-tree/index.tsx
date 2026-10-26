"use client";

import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button, Menu, TextInput } from "@mantine/core";
import { ChevronDown, ChevronRight, FolderTree, Search, X } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import ProtectedLink from "@/components/ui/protected-link";
import EmptySection from "@/components/ui/sections/empty";
import ErrorSection from "@/components/ui/sections/error";
import LoadingSection from "@/components/ui/sections/loading";
import NoResultsSection from "@/components/ui/sections/no-results";
import useHasPermission from "@/hooks/use-has-permission";
import type { Permission } from "@/lib/constants/enums/permissions";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";

export type CategoryTreeMain = {
  id: string;
  legacyCode: string;
  title: string;
};

export type CategoryTreeSub = CategoryTreeMain & {
  mainCategoryId: string;
};

type CategoryGroup = {
  main: CategoryTreeMain;
  subs: CategoryTreeSub[];
  totalSubCount: number;
};

export function CategoryTreeMenuItem({ href, permission }: { href: string; permission: Permission }) {
  const { translate } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const hasPermission = useHasPermission(permission);

  if (!hasPermission) return null;

  return (
    <Menu.Item component={Link} href={getLocalizedHref(href)} leftSection={<FolderTree size={14} />}>
      {translate("Category tree", "شجرة الفئات")}
    </Menu.Item>
  );
}

export default function CategoryTree({
  mains,
  subs,
  loading,
  error,
  reload,
  listPath,
  listPermission,
}: {
  mains: CategoryTreeMain[];
  subs: CategoryTreeSub[];
  loading: boolean;
  error: string;
  reload: () => void;
  listPath: string;
  listPermission: Permission;
}) {
  const { translate } = useI18n();
  const [keyword, setKeyword] = useState("");
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());

  const groups = useMemo(() => buildGroups(mains, subs), [mains, subs]);
  const query = keyword.trim().toLowerCase();

  const visibleGroups = useMemo(() => {
    if (!query) return groups;

    return groups.flatMap((group) => {
      const mainMatches = matchesQuery(group.main, query);
      const matchingSubs = group.subs.filter((sub) => matchesQuery(sub, query));
      if (mainMatches) return [group];
      if (matchingSubs.length > 0) return [{ ...group, subs: matchingSubs }];
      return [];
    });
  }, [groups, query]);

  useLayoutEffect(() => {
    if (!query) return;
    setCollapsedIds(new Set());
  }, [query]);

  const subCount = groups.reduce((total, group) => total + group.totalSubCount, 0);

  function toggleMain(id: string) {
    setCollapsedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll() {
    setCollapsedIds(new Set());
  }

  function collapseAll() {
    setCollapsedIds(new Set(visibleGroups.map((group) => group.main.id)));
  }

  if (loading) {
    return <LoadingSection message={translate("Loading categories...", "جاري تحميل الفئات...")} />;
  }

  if (error) {
    return (
      <ErrorSection
        errorTitle={translate("Error loading categories", "خطأ في تحميل الفئات")}
        errorMessage={error}
        button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: reload }}
      />
    );
  }

  if (groups.length === 0) {
    return <EmptySection useDefaultImg message={translate("No categories found", "لا توجد فئات")} />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 px-2 py-2">
        <TextInput
          value={keyword}
          onChange={(event) => setKeyword(event.currentTarget.value)}
          placeholder={translate("Search categories...", "ابحث في الفئات...")}
          leftSection={<Search size={15} />}
          radius="md"
          size="sm"
          className="min-w-0 flex-1"
          aria-label={translate("Search categories", "البحث في الفئات")}
          rightSection={
            keyword ? (
              <button type="button" onClick={() => setKeyword("")} aria-label={translate("Clear search", "مسح البحث")}>
                <X size={15} />
              </button>
            ) : undefined
          }
        />
        <span className="text-xs text-gray-500 tabular-nums">
          {translate(`${groups.length} mains, ${subCount} subs`, `${groups.length} رئيسية، ${subCount} فرعية`)}
        </span>
        <div className="flex items-center gap-1">
          <Button type="button" variant="subtle" color="dark" size="compact-sm" onClick={expandAll}>
            {translate("Expand all", "توسيع الكل")}
          </Button>
          <Button type="button" variant="subtle" color="dark" size="compact-sm" onClick={collapseAll}>
            {translate("Collapse all", "طي الكل")}
          </Button>
        </div>
      </div>

      {visibleGroups.length === 0 ? (
        <NoResultsSection
          keyword={keyword.trim()}
          button={{ text: translate("Clear search", "مسح البحث"), onClick: () => setKeyword("") }}
        />
      ) : (
        <ul>
          {visibleGroups.map((group) => {
            const expanded = !collapsedIds.has(group.main.id);
            const canToggle = group.subs.length > 0;
            const panelId = `category-subs-${group.main.id}`;
            const listHref = `${listPath}?mainCategoryId=${encodeURIComponent(group.main.id)}`;
            const expandLabel = expanded
              ? translate(`Collapse ${group.main.title}`, `طي ${group.main.title}`)
              : translate(`Expand ${group.main.title}`, `توسيع ${group.main.title}`);

            return (
              <li key={group.main.id} className="border-b border-gray-200 last:border-b-0">
                <div className="border-plum-600 bg-plum-50 flex items-center gap-2 border-s-2 px-2 py-1.5">
                  {canToggle ? (
                    <button
                      type="button"
                      className="text-plum-700 hover:bg-plum-100 focus-visible:outline-plum-600 flex size-7 shrink-0 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      aria-label={expandLabel}
                      onClick={() => toggleMain(group.main.id)}
                    >
                      {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} className="rtl:rotate-180" />}
                    </button>
                  ) : (
                    <span className="size-7 shrink-0" />
                  )}

                  <CodeWithCopy code={group.main.legacyCode} query={query} />

                  {canToggle ? (
                    <button
                      type="button"
                      className="focus-visible:outline-plum-600 min-w-0 flex-1 truncate text-start text-sm font-semibold text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2"
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      onClick={() => toggleMain(group.main.id)}
                    >
                      <HighlightedText text={group.main.title} query={query} />
                    </button>
                  ) : (
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
                      <HighlightedText text={group.main.title} query={query} />
                    </span>
                  )}

                  <span
                    className="bg-plum-100 text-plum-700 shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums"
                    title={translate(`${group.totalSubCount} subcategories`, `${group.totalSubCount} فئات فرعية`)}
                  >
                    {group.totalSubCount}
                  </span>

                  <ViewInListLink href={listHref} permission={listPermission} />
                </div>

                {expanded && group.subs.length > 0 && (
                  <ul id={panelId}>
                    {group.subs.map((sub) => {
                      const subHref = `${listPath}?mainCategoryId=${encodeURIComponent(group.main.id)}&subCategoryId=${encodeURIComponent(sub.id)}`;

                      return (
                        <li
                          key={sub.id}
                          className="flex items-center gap-2 border-t border-gray-100 px-2 py-2.5 ps-11 hover:bg-gray-50"
                        >
                          <span className="bg-plum-200 w-px self-stretch" aria-hidden />
                          <CodeWithCopy code={sub.legacyCode} query={query} />
                          <ProtectedLink
                            permission={listPermission}
                            href={subHref}
                            className="min-w-0 flex-1 truncate text-sm text-gray-800 hover:underline"
                          >
                            <HighlightedText text={sub.title} query={query} />
                          </ProtectedLink>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function buildGroups(mains: CategoryTreeMain[], subs: CategoryTreeSub[]): CategoryGroup[] {
  const subsByMain = new Map<string, CategoryTreeSub[]>();

  for (const sub of subs) {
    const current = subsByMain.get(sub.mainCategoryId);
    if (current) current.push(sub);
    else subsByMain.set(sub.mainCategoryId, [sub]);
  }

  for (const list of subsByMain.values()) {
    list.sort(compareLegacyCode);
  }

  return [...mains]
    .sort((a, b) => compareLegacyCode(a, b))
    .map((main) => {
      const mainSubs = subsByMain.get(main.id) ?? [];
      return {
        main,
        subs: mainSubs,
        totalSubCount: mainSubs.length,
      };
    });
}

function compareLegacyCode(a: { legacyCode: string }, b: { legacyCode: string }) {
  return a.legacyCode.localeCompare(b.legacyCode, undefined, { numeric: true, sensitivity: "base" });
}

function matchesQuery(item: { title: string; legacyCode: string }, query: string) {
  return item.title.toLowerCase().includes(query) || item.legacyCode.toLowerCase().includes(query);
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return text;

  const parts: ReactNode[] = [];
  const lower = text.toLowerCase();
  let cursor = 0;
  let index = 0;

  while (cursor < text.length) {
    const matchAt = lower.indexOf(query, cursor);
    if (matchAt === -1) {
      parts.push(text.slice(cursor));
      break;
    }

    if (matchAt > cursor) parts.push(text.slice(cursor, matchAt));
    parts.push(
      <mark key={`${matchAt}-${index}`} className="bg-plum-200 rounded-sm text-inherit">
        {text.slice(matchAt, matchAt + query.length)}
      </mark>,
    );
    index += 1;
    cursor = matchAt + query.length;
  }

  return <>{parts}</>;
}

function CodeWithCopy({ code, query }: { code: string; query: string }) {
  return (
    <span className="inline-flex w-19 shrink-0 items-center gap-1 font-mono text-xs text-gray-500">
      <span className="min-w-0 truncate">
        <HighlightedText text={code} query={query} />
      </span>
      <CopyButton text={code} />
    </span>
  );
}

function ViewInListLink({ href, permission }: { href: string; permission: Permission }) {
  const { translate } = useI18n();

  return (
    <ProtectedLink
      permission={permission}
      href={href}
      className="text-plum-700 hover:text-plum-600 focus-visible:outline-plum-600 shrink-0 text-xs font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {translate("View in list", "عرض في القائمة")}
    </ProtectedLink>
  );
}
