"use client";

import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { Button, TextInput } from "@mantine/core";
import { ChevronDown, ChevronRight, FolderTree, Search, X } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import ProtectedLink from "@/components/ui/protected-link";
import EmptySection from "@/components/ui/sections/empty";
import ErrorSection from "@/components/ui/sections/error";
import LoadingSection from "@/components/ui/sections/loading";
import NoResultsSection from "@/components/ui/sections/no-results";
import type { Permission } from "@/lib/constants/enums/permissions";
import { useI18n } from "@/lib/i18n/hooks";

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

export function CategoryTreeLink({ href, permission }: { href: string; permission: Permission }) {
  const { translate } = useI18n();

  return (
    <ProtectedLink
      permission={permission}
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg bg-plum-50 px-2.5 py-1.5 text-sm font-medium text-plum-700 hover:bg-plum-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum-600"
    >
      <FolderTree size={15} />
      {translate("Category tree", "شجرة الفئات")}
    </ProtectedLink>
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
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-600">
        {translate(
          `${groups.length} main categories, ${subCount} subcategories`,
          `${groups.length} فئة رئيسية، ${subCount} فئة فرعية`,
        )}
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <TextInput
          value={keyword}
          onChange={(event) => setKeyword(event.currentTarget.value)}
          placeholder={translate("Search categories...", "ابحث في الفئات...")}
          leftSection={<Search size={15} />}
          radius="md"
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

        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="light" color="dark" radius="md" onClick={expandAll}>
            {translate("Expand all", "توسيع الكل")}
          </Button>
          <Button type="button" variant="light" color="dark" radius="md" onClick={collapseAll}>
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
        <ul className="flex flex-col gap-3">
          {visibleGroups.map((group) => {
            const expanded = !collapsedIds.has(group.main.id);
            const panelId = `category-subs-${group.main.id}`;
            const listHref = `${listPath}?mainCategoryId=${encodeURIComponent(group.main.id)}`;

            return (
              <li key={group.main.id} className="border-s-2 border-plum-600 ps-3">
                <div className="flex flex-col gap-1 py-1 sm:flex-row sm:items-center sm:gap-3">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-start text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum-600"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={() => toggleMain(group.main.id)}
                  >
                    {expanded ? (
                      <ChevronDown size={16} className="shrink-0 text-plum-600" />
                    ) : (
                      <ChevronRight size={16} className="shrink-0 text-plum-600 rtl:rotate-180" />
                    )}
                    <span className="min-w-0 font-semibold">
                      <HighlightedText text={group.main.title} query={query} />
                    </span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2 ps-6 sm:ps-0">
                    <CodeWithCopy code={group.main.legacyCode} query={query} />
                    <span
                      className="rounded-md bg-plum-50 px-1.5 py-0.5 text-xs font-medium text-plum-700 tabular-nums"
                      title={translate(
                        `${group.totalSubCount} subcategories`,
                        `${group.totalSubCount} فئات فرعية`,
                      )}
                    >
                      {group.totalSubCount}
                    </span>
                    <ViewInListLink href={listHref} permission={listPermission} />
                  </div>
                </div>

                {expanded && group.subs.length > 0 && (
                  <ul id={panelId} className="ms-2 mt-1 border-s border-plum-200">
                    {group.subs.map((sub) => {
                      const subHref = `${listPath}?mainCategoryId=${encodeURIComponent(group.main.id)}&subCategoryId=${encodeURIComponent(sub.id)}`;

                      return (
                        <li
                          key={sub.id}
                          className="flex flex-col gap-1 px-4 py-1.5 sm:flex-row sm:items-center sm:gap-3"
                        >
                          <span className="min-w-0 flex-1 text-sm text-gray-800">
                            <HighlightedText text={sub.title} query={query} />
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            <CodeWithCopy code={sub.legacyCode} query={query} />
                            <ViewInListLink href={subHref} permission={listPermission} />
                          </div>
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
      <mark key={`${matchAt}-${index}`} className="rounded-sm bg-plum-50 text-inherit">
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
    <span className="inline-flex items-center gap-1 font-mono text-sm text-gray-500">
      <HighlightedText text={code} query={query} />
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
      className="rounded-md text-sm font-medium text-plum-700 hover:text-plum-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum-600"
    >
      {translate("View in list", "عرض في القائمة")}
    </ProtectedLink>
  );
}
