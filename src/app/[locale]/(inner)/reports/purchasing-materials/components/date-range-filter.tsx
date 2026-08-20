"use client";

import { useI18n } from "@/lib/i18n/hooks";

type GroupBy = "month" | "quarter" | "year";

export default function DateRangeFilter({
  from,
  to,
  groupBy,
  onFromChange,
  onToChange,
  onGroupByChange,
}: {
  from: string;
  to: string;
  groupBy: GroupBy;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onGroupByChange: (value: GroupBy) => void;
}) {
  const { translate } = useI18n();

  return (
    <section className="rounded-3xl bg-white px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
        <div className="flex-1">
          <label htmlFor="spending-from" className="mb-1 block text-xs font-medium text-stone-500">
            {translate("From", "من")}
          </label>
          <input
            id="spending-from"
            type="date"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="spending-to" className="mb-1 block text-xs font-medium text-stone-500">
            {translate("To", "إلى")}
          </label>
          <input
            id="spending-to"
            type="date"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="spending-group-by" className="mb-1 block text-xs font-medium text-stone-500">
            {translate("Group by", "تجميع حسب")}
          </label>
          <select
            id="spending-group-by"
            value={groupBy}
            onChange={(e) => onGroupByChange(e.target.value as GroupBy)}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none"
          >
            <option value="month">{translate("Month", "شهر")}</option>
            <option value="quarter">{translate("Quarter", "ربع سنة")}</option>
            <option value="year">{translate("Year", "سنة")}</option>
          </select>
        </div>
      </div>
    </section>
  );
}
