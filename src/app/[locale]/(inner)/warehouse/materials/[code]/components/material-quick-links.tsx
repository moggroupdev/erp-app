"use client";

import Link from "next/link";
import { ChartNoAxesCombined, ChevronRight, ClipboardList, History } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useHasPermission from "@/hooks/use-has-permission";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";

export default function MaterialQuickLinks({ materialCode }: { materialCode: string }) {
  const { translate } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const canReadPriceHistory = useHasPermission(PERMISSIONS.READ_MATERIAL_PURCHASING_PRICE_HISTORY_REPORT);
  const canReadRequisitionHistory = useHasPermission(PERMISSIONS.READ_MATERIAL_PURCHASING_REQUISITION_HISTORY_REPORT);
  const canReadIssuePermitHistory = useHasPermission(PERMISSIONS.READ_MATERIAL_LEGACY_ISSUE_PERMIT_HISTORY_REPORT);

  if (!canReadPriceHistory && !canReadRequisitionHistory && !canReadIssuePermitHistory) return null;

  return (
    <section className="mt-4 flex flex-col gap-3">
      <h4 className="text-lg font-semibold text-gray-900">{translate("Quick Links", "روابط سريعة")}</h4>

      <div className="grid gap-3 sm:grid-cols-2">
        {canReadPriceHistory && (
          <Link
            href={getLocalizedHref(`/reports/purchasing-materials/price-history?materialCode=${materialCode}`)}
            className="group flex items-center justify-between gap-3 rounded-xl border border-gray-200/80 bg-white px-4 py-3 transition-colors hover:border-haze-200"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                <ChartNoAxesCombined size={18} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-gray-900 group-hover:text-haze-800">
                  {translate("Material Price History", "تاريخ أسعار المادة")}
                </span>
                <span className="text-xs text-gray-500">
                  {translate("View purchase price history for this material", "عرض تاريخ أسعار الشراء لهذه المادة")}
                </span>
              </div>
            </div>

            <ChevronRight
              size={16}
              className={`shrink-0 text-gray-400 group-hover:text-haze-600 ${translate("", "rotate-180")}`}
            />
          </Link>
        )}

        {canReadRequisitionHistory && (
          <Link
            href={getLocalizedHref(`/reports/purchasing-materials/requisition-history?materialCode=${materialCode}`)}
            className="group flex items-center justify-between gap-3 rounded-xl border border-gray-200/80 bg-white px-4 py-3 transition-colors hover:border-haze-200"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-haze-50 text-haze-600">
                <ClipboardList size={18} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-gray-900 group-hover:text-haze-800">
                  {translate("Requisition History", "تاريخ طلبات الشراء")}
                </span>
                <span className="text-xs text-gray-500">
                  {translate(
                    "View purchase requisition history for this material",
                    "عرض تاريخ طلبات الشراء لهذه المادة",
                  )}
                </span>
              </div>
            </div>

            <ChevronRight
              size={16}
              className={`shrink-0 text-gray-400 group-hover:text-haze-600 ${translate("", "rotate-180")}`}
            />
          </Link>
        )}

        {canReadIssuePermitHistory && (
          <Link
            href={getLocalizedHref(`/reports/materials/issue-permit-history?materialCode=${materialCode}`)}
            className="group flex items-center justify-between gap-3 rounded-xl border border-gray-200/80 bg-white px-4 py-3 transition-colors hover:border-haze-200"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ochre-50 text-ochre-600">
                <History size={18} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-gray-900 group-hover:text-haze-800">
                  {translate("Legacy Issue Permit History", "تاريخ أذونات الصرف المرحلية")}
                </span>
                <span className="text-xs text-gray-500">
                  {translate(
                    "View interim legacy issue permit history for this material",
                    "عرض تاريخ أذونات الصرف المرحلية لهذه المادة",
                  )}
                </span>
              </div>
            </div>

            <ChevronRight
              size={16}
              className={`shrink-0 text-gray-400 group-hover:text-haze-600 ${translate("", "rotate-180")}`}
            />
          </Link>
        )}
      </div>
    </section>
  );
}
