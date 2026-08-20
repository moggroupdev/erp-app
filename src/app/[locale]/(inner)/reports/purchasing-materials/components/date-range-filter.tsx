"use client";

import { Select } from "@mantine/core";
import DatePickerInput from "@/components/ui/date-picker-input";
import { useI18n } from "@/lib/i18n/hooks";

export type GroupBy = "month" | "quarter" | "year";

type DateRangeFilterProps = {
  from: string | null;
  to: string | null;
  onFromChange: (value: string | null) => void;
  onToChange: (value: string | null) => void;
  groupBy?: GroupBy;
  onGroupByChange?: (value: GroupBy) => void;
};

export default function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
  groupBy,
  onGroupByChange,
}: DateRangeFilterProps) {
  const { translate } = useI18n();
  const showGroupBy = groupBy !== undefined && onGroupByChange !== undefined;

  return (
    <section className="rounded-3xl bg-white px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
        <div className="flex-1">
          <DatePickerInput
            value={from}
            onChange={onFromChange}
            label={translate("From", "من")}
            placeholder={translate("Select start date", "اختر تاريخ البداية")}
            clearable
            maxDate={to ?? undefined}
          />
        </div>
        <div className="flex-1">
          <DatePickerInput
            value={to}
            onChange={onToChange}
            label={translate("To", "إلى")}
            placeholder={translate("Select end date", "اختر تاريخ النهاية")}
            clearable
            minDate={from ?? undefined}
          />
        </div>
        {showGroupBy && (
          <div className="flex-1">
            <Select
              value={groupBy}
              onChange={(value) => {
                if (value === "month" || value === "quarter" || value === "year") {
                  onGroupByChange(value);
                }
              }}
              label={translate("Group by", "تجميع حسب")}
              data={[
                { value: "month", label: translate("Month", "شهر") },
                { value: "quarter", label: translate("Quarter", "ربع سنة") },
                { value: "year", label: translate("Year", "سنة") },
              ]}
              allowDeselect={false}
              radius="md"
            />
          </div>
        )}
      </div>
    </section>
  );
}
