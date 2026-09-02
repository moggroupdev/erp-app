"use client";

import Link from "next/link";
import { ChartNoAxesCombined, ChevronRight } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useHasPermission from "@/hooks/use-has-permission";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";

export default function MaterialQuickLinks({ materialCode }: { materialCode: string }) {
  const { translate } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const canReadPurchasingReports = useHasPermission(PERMISSIONS.READ_MATERIAL_PURCHASING_REPORTS);

  if (!canReadPurchasingReports) return null;

  return (
    <section className="mt-4 flex flex-col gap-3">
      <h4 className="text-lg font-semibold text-gray-900">{translate("Quick Links", "روابط سريعة")}</h4>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href={getLocalizedHref(`/reports/purchasing-materials/price-history?materialCode=${materialCode}`)}
          className="group flex items-center justify-between gap-3 rounded-xl border border-gray-200/80 bg-white px-4 py-3 transition-colors hover:border-blue-200"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <ChartNoAxesCombined size={18} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-800">
                {translate("Price History", "تاريخ الأسعار")}
              </span>
              <span className="text-xs text-gray-500">
                {translate("View purchase price history for this material", "عرض تاريخ أسعار الشراء لهذه المادة")}
              </span>
            </div>
          </div>

          <ChevronRight
            size={16}
            className={`shrink-0 text-gray-400 group-hover:text-blue-600 ${translate("", "rotate-180")}`}
          />
        </Link>
      </div>
    </section>
  );
}
