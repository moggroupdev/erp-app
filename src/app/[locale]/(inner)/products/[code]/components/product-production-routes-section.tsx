"use client";

import { useI18n } from "@/lib/i18n/hooks";
import { useDisclosure } from "@mantine/hooks";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import type { ProductProductionRoute } from "@/types/product";
import { Button } from "@mantine/core";
import { ArrowRight, Plus, Route } from "lucide-react";
import PermissionGuard from "@/components/guards/permission";
import EmptySection from "@/components/ui/sections/empty";
import ProductProductionRoutesModal from "@/components/global/data-modals/product-production-routes-modal";

export default function ProductProductionRoutesSection({
  productCode,
  productionRoutes,
}: {
  productCode: string;
  productionRoutes: ProductProductionRoute[];
}) {
  const { locale, translate } = useI18n();
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  return (
    <section className="mt-4 flex flex-col gap-4">
      <ProductProductionRoutesModal
        opened={modalOpened}
        close={closeModal}
        productCode={productCode}
        existingRoutes={productionRoutes}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
            <Route size={16} />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="text-lg font-semibold text-gray-900">
              {translate("Production Routes", "مسارات الإنتاج")}
            </h4>
            <p className="text-xs text-gray-600">
              {translate(
                "Production path from first step to finished product",
                "مسار الإنتاج من أول خطوة حتى المنتج النهائي",
              )}
            </p>
          </div>
        </div>

        <PermissionGuard permission={PERMISSIONS.UPDATE_PRODUCT}>
          <Button
            onClick={openModal}
            variant="light"
            color="blue"
            radius="md"
            leftSection={productionRoutes.length > 0 ? null : <Plus size={15} />}
          >
            {productionRoutes.length > 0
              ? translate("Edit Routes", "تعديل المسارات")
              : translate("Set Routes", "تعيين المسارات")}
          </Button>
        </PermissionGuard>
      </div>

      {productionRoutes.length === 0 ? (
        <EmptySection message={translate("No production routes set", "لا توجد مسارات إنتاج مسجلة")} />
      ) : (
        <div className="overflow-hidden rounded-2xl border-gray-200 bg-linear-to-br from-white via-gray-50/80 to-blue-50/50 p-4 sm:p-6">
          <div className="overflow-x-auto pb-1">
            <div className="flex min-w-max items-stretch gap-0">
              {productionRoutes.map((route, index) => {
                const isLast = index === productionRoutes.length - 1;
                const percentage = Number(route.completionPercentage);

                return (
                  <div key={route.id} className="flex items-center">
                    <div className="relative flex w-44 flex-col items-center gap-3 sm:w-48">
                      <div className="relative flex h-20 w-20 items-center justify-center">
                        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80" aria-hidden>
                          <circle cx="40" cy="40" r="35" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                          <circle
                            cx="40"
                            cy="40"
                            r="35"
                            fill="none"
                            stroke="#2b7fff"
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={`${(percentage / 100) * 219.9} 219.9`}
                          />
                        </svg>
                        <div className="z-10 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
                          <span className="text-[10px] leading-none font-medium opacity-80">
                            {translate("Step", "خطوة")}
                          </span>
                          <span className="mt-1.5 text-base leading-none font-bold">{route.sequenceOrder}</span>
                        </div>
                      </div>

                      <div className="w-full rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-center">
                        <p className="line-clamp-2 text-sm font-semibold text-gray-800">
                          {getProductionSubDepartmentLabel(route.productionSubDepartment, locale)}
                        </p>
                        <p className="mt-1 text-xs font-medium text-blue-500 tabular-nums">
                          {percentage}% {translate("of path", "من المسار")}
                        </p>
                      </div>
                    </div>

                    {!isLast && (
                      <div
                        className="mx-1 mb-16 flex w-8 shrink-0 items-center justify-center sm:mx-2 sm:w-10"
                        aria-hidden
                      >
                        <ArrowRight size={18} className="text-blue-500 rtl:rotate-180" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
