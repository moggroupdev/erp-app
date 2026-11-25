import { useI18n } from "@/lib/i18n/hooks";
import PrintDetail from "./print-detail";

export type PrintAppliedFilter = {
  label: string;
  value: string;
};

export default function PrintAppliedFilters({ filters }: { filters: PrintAppliedFilter[] }) {
  const { translate } = useI18n();

  if (filters.length === 0) return null;

  return (
    <>
      <section className="flex break-inside-avoid flex-col gap-2.5">
        <p className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
          {translate("Applied filters", "الفلاتر المطبقة")}
        </p>
        <div
          className={`grid gap-x-6 gap-y-3 ${
            filters.length === 1
              ? "grid-cols-1"
              : filters.length === 2
                ? "grid-cols-2"
                : "grid-cols-2 sm:grid-cols-4"
          }`}
        >
          {filters.map((filter) => (
            <PrintDetail key={`${filter.label}-${filter.value}`} label={filter.label} value={filter.value} />
          ))}
        </div>
      </section>
      <hr className="border-gray-300" />
    </>
  );
}
