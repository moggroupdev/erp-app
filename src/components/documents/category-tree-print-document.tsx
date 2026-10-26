import { useI18n } from "@/lib/i18n/hooks";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";

export type CategoryTreePrintItem = {
  id: string;
  legacyCode: string;
  title: string;
};

export type CategoryTreePrintSub = CategoryTreePrintItem & {
  mainCategoryId: string;
};

function compareLegacyCode(a: { legacyCode: string }, b: { legacyCode: string }) {
  return a.legacyCode.localeCompare(b.legacyCode, undefined, { numeric: true, sensitivity: "base" });
}

export default function CategoryTreePrintDocument({
  documentLabel,
  heading,
  mains,
  subs,
}: {
  documentLabel: string;
  heading?: string;
  mains: CategoryTreePrintItem[];
  subs: CategoryTreePrintSub[];
}) {
  const { locale, translate } = useI18n();
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);
  const documentHeading = heading ?? translate("All categories", "جميع الفئات");

  const subsByMain = new Map<string, CategoryTreePrintSub[]>();
  for (const sub of subs) {
    const current = subsByMain.get(sub.mainCategoryId);
    if (current) current.push(sub);
    else subsByMain.set(sub.mainCategoryId, [sub]);
  }
  for (const list of subsByMain.values()) {
    list.sort(compareLegacyCode);
  }

  const groups = [...mains].sort(compareLegacyCode).map((main) => ({
    main,
    subs: subsByMain.get(main.id) ?? [],
  }));

  return (
    <div className="flex flex-col gap-2.5 text-[9px] text-gray-900">
      <header className="flex items-end justify-between gap-3 border-b border-gray-300 pb-2">
        <div className="min-w-0">
          <p className="text-[9px] font-medium tracking-wide text-gray-500 uppercase">{documentLabel}</p>
          <h1 className="text-lg leading-tight font-semibold">{documentHeading}</h1>
          <p className="mt-0.5 text-[9px] text-gray-500">
            {printedAt}
            <span className="mx-1.5 text-gray-300">|</span>
            <span className="tabular-nums text-gray-700">
              {groups.length} {translate("mains", "رئيسية")}
              {", "}
              {subs.length} {translate("subs", "فرعية")}
            </span>
          </p>
        </div>
        <img src={logoSrc} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded object-contain" />
      </header>

      {groups.map((group) => (
        <section key={group.main.id} className="space-y-1.5">
          <div className="flex w-full break-after-avoid items-baseline justify-between gap-3 rounded-md bg-gray-100 px-3 py-1.5">
            <h2 className="min-w-0 text-[11px] font-semibold text-gray-900">
              <span className="me-2 font-mono text-[10px] font-medium text-gray-600">{group.main.legacyCode}</span>
              {group.main.title}
            </h2>
            <span className="shrink-0 text-[9px] font-medium text-gray-500 tabular-nums">
              {group.subs.length} {translate("subcategories", "فئات فرعية")}
            </span>
          </div>

          {group.subs.length === 0 ? (
            <p className="text-[9px] text-gray-400">{translate("No subcategories", "لا توجد فئات فرعية")}</p>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {group.subs.map((sub) => (
                <article
                  key={sub.id}
                  className="break-inside-avoid rounded border border-gray-300 px-2 py-1.5"
                >
                  <p className="font-mono text-[8px] text-gray-500">{sub.legacyCode}</p>
                  <p className="text-[9px] leading-snug font-medium text-gray-900">{sub.title}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      ))}

      <footer className="flex break-inside-avoid items-center justify-between gap-3 border-t border-gray-300 pt-1.5 text-[9px] text-gray-700">
        <span className="font-semibold tracking-wide uppercase">{translate("Document Total", "إجمالي المستند")}</span>
        <span className="tabular-nums">
          <span className="font-semibold text-gray-900">{groups.length}</span> {translate("mains", "رئيسية")}
          <span className="mx-1.5 text-gray-300">|</span>
          <span className="font-semibold text-gray-900">{subs.length}</span> {translate("subs", "فرعية")}
        </span>
      </footer>
    </div>
  );
}
