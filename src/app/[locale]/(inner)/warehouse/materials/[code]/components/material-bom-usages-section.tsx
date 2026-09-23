"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import useHasPermission from "@/hooks/use-has-permission";
import bomsApi from "@/lib/api/boms";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { formatEnteredQuantityForDisplay } from "@/lib/helpers/format-quantity";
import { formatDimensionLabel } from "@/lib/helpers/format-dimension-label";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import type { MaterialWithCreatorAndUnitConversions } from "@/types/material";
import type { BomMaterialUsage } from "@/types/bom";
import type { Locale } from "@/lib/i18n/types";
import { Badge, Table } from "@mantine/core";
import { Boxes } from "lucide-react";
import EmptySection from "@/components/ui/sections/empty";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import UnitToggle from "@/components/ui/unit-toggle";
import { EmptyValue } from "@/components/ui/entity-details";

export default function MaterialBomUsagesSection({ material }: { material: MaterialWithCreatorAndUnitConversions }) {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const privateRequest = usePrivateRequest();
  const canReadProductBoms = useHasPermission(PERMISSIONS.READ_PRODUCT_BOMS);
  const canReadProducts = useHasPermission(PERMISSIONS.READ_PRODUCTS);

  const productUsagesQuery = useQuery({
    queryKey: queryKeys.boms.usages(material.code),
    queryFn: ({ signal }) => bomsApi.listByMaterial({ privateRequest, materialCode: material.code, signal }),
    staleTime: staleTimes.boms,
    enabled: canReadProductBoms,
  });

  if (!canReadProductBoms) return null;

  const usages = productUsagesQuery.data ?? [];
  const isFetching = productUsagesQuery.isFetching;
  const errorMessage = productUsagesQuery.error ? getErrorMessage(locale, productUsagesQuery.error) : "";

  return (
    <section className="mt-4 flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
          <Boxes size={16} />
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-lg font-semibold text-gray-900">
            {translate("Used in Product BOMs", "مستخدمة في قوائم مواد المنتجات")}
          </h4>
          <p className="text-xs text-gray-500">
            {translate(
              "Product bills of materials that include this material as a component.",
              "قوائم مواد المنتجات التي تتضمن هذه المادة كمكون.",
            )}
          </p>
        </div>
      </div>

      {isFetching ? (
        <LoadingSection message={translate("Loading product BOM usages", "جاري تحميل استخدامات قوائم مواد المنتجات")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate(
            "An error occurred while loading product BOM usages",
            "حدث خطأ أثناء تحميل استخدامات قوائم مواد المنتجات",
          )}
          errorMessage={errorMessage}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => productUsagesQuery.refetch() }}
        />
      ) : usages.length === 0 ? (
        <EmptySection
          message={translate(
            "This material is not used in any product BOM.",
            "هذه المادة غير مستخدمة في أي قائمة مواد منتج.",
          )}
        />
      ) : (
        <ProductBomUsagesTable
          material={material}
          usages={usages}
          canLinkProduct={canReadProducts}
          getLocalizedHref={getLocalizedHref}
          locale={locale}
          translate={translate}
          productDimensionUnit={translation.productDimensionUnit}
        />
      )}
    </section>
  );
}

// ==================== Table ====================

type TranslateFn = (en: string, ar: string) => string;
type LocaleHrefFn = (path: string) => string;

function ProductBomUsagesTable({
  material,
  usages,
  canLinkProduct,
  getLocalizedHref,
  locale,
  translate,
  productDimensionUnit,
}: {
  material: MaterialWithCreatorAndUnitConversions;
  usages: BomMaterialUsage[];
  canLinkProduct: boolean;
  getLocalizedHref: LocaleHrefFn;
  locale: Locale;
  translate: TranslateFn;
  productDimensionUnit: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <Table className="text-nowrap" highlightOnHover verticalSpacing="xs">
        <Table.Thead className="bg-gray-50">
          <Table.Tr className="h-10">
            <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              {translate("Product Code", "كود المنتج")}
            </Table.Th>
            <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              {translate("Product Name", "اسم المنتج")}
            </Table.Th>
            <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              {translate("Dimension", "المقاس")}
            </Table.Th>
            <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              {translate("Production Department", "قسم الانتاج")}
            </Table.Th>
            <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              {translate("Unit", "الوحدة")}
            </Table.Th>
            <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              {translate("Quantity", "الكمية")}
            </Table.Th>
            <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              {translate("Notes", "الملاحظات")}
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {usages.map((usage) => {
            const enteredUnit = usage.unitOfMeasurementSelected ?? material.unitOfMeasurement;
            const bomHref = getLocalizedHref(`/products/${usage.product.code}/boms/${usage.dimension.id}`);

            return (
              <UnitToggle
                key={`${usage.id}:${usage.unitOfMeasurementSelected ?? material.unitOfMeasurement}`}
                baseUnit={material.unitOfMeasurement}
                unitConversions={material.unitConversions}
                defaultUnit={usage.unitOfMeasurementSelected ?? material.unitOfMeasurement}
              >
                {({ unit, toggleButton }) => (
                  <Table.Tr className="text-gray-600">
                    <Table.Td>
                      {canLinkProduct ? (
                        <Link
                          href={bomHref}
                          className="font-mono text-xs text-gray-500 hover:text-teal-700 hover:underline"
                        >
                          {usage.product.code}
                        </Link>
                      ) : (
                        <span className="font-mono text-xs text-gray-500">{usage.product.code}</span>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {canLinkProduct ? (
                        <Link href={bomHref} className="font-medium text-gray-800 hover:text-teal-700 hover:underline">
                          {usage.product.title}
                        </Link>
                      ) : (
                        <span className="font-medium text-gray-800">{usage.product.title}</span>
                      )}
                    </Table.Td>
                    <Table.Td>{formatDimensionLabel(usage.dimension, productDimensionUnit)}</Table.Td>
                    <Table.Td>
                      {usage.productionSubDepartment ? (
                        getProductionSubDepartmentLabel(usage.productionSubDepartment, locale)
                      ) : (
                        <EmptyValue />
                      )}
                    </Table.Td>
                    <Table.Td>
                      <div className="flex items-center gap-1">
                        <Badge size="sm" variant="light" color="gray" radius="md">
                          {getMaterialUnitLabel(unit, locale)}
                        </Badge>
                        {toggleButton}
                      </div>
                    </Table.Td>
                    <Table.Td className="font-medium text-gray-800">
                      {formatEnteredQuantityForDisplay(usage.quantityRequired, enteredUnit, unit, material)}
                    </Table.Td>
                    <Table.Td className="max-w-48 truncate text-gray-500">{usage.notes || <EmptyValue />}</Table.Td>
                  </Table.Tr>
                )}
              </UnitToggle>
            );
          })}
        </Table.Tbody>
      </Table>
    </div>
  );
}
