"use client";

import { DatesProvider } from "@mantine/dates";
import type { Locale } from "@/lib/i18n/types";
import "dayjs/locale/ar";

export default function MantineDatesProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <DatesProvider
      settings={{
        locale: locale === "ar" ? "ar" : "en",
        firstDayOfWeek: 0,
        weekendDays: [5, 6],
      }}
    >
      {children}
    </DatesProvider>
  );
}