"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import useProductCategories from "@/hooks/reference/use-product-categories";
import useMaterialCategories from "@/hooks/reference/use-material-categories";
import bomsApi from "@/lib/api/boms";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { getDimensionUnitLabel } from "@/lib/constants/enums/dimension-units";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { getProductSourceTypeLabel } from "@/lib/constants/enums/product-source-types";
import {
  getBomDisplayTotals,
  getFlattenedMaterialRows,
  getManufacturingCostRows,
  type FlattenedBomRow,
  type ManufacturingCostRow,
  UNCATEGORIZED_ID,
} from "@/lib/helpers/bom-display";
import { formatMoney } from "@/lib/helpers/format-money";
import type { BomItemWithMaterial } from "@/types/bom";
import { Badge, Button, Divider, Table } from "@mantine/core";
import { Calculator, Layers, Pencil, Plus, Printer, Wallet } from "lucide-react";
import PermissionGuard from "@/components/guards/permission";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import PrintDocument from "@/components/ui/print-document";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import EntityDetails, { EmptyValue, type DetailRow } from "@/components/ui/entity-details";
import BomItemModal from "@/components/global/data-modals/bom-item-modal";
import BomPrintDocument from "@/components/documents/bom-print-document";

const PAGE_TITLE = { en: "Bill of Materials", ar: "قائمة المواد" };

type CategoryBreakdown = {
  mainCategoryId: string;
  title: string;
  itemCount: number;
  totalCost: number;
  sharePercent: number;
  items: FlattenedBomRow[];
};

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const { code, dimensionId } = useParams<{ code: string; dimensionId: string }>();
  const privateRequest = usePrivateRequest();
  const { helpers: productCategoryHelpers } = useProductCategories();
  const { helpers: materialCategoryHelpers } = useMaterialCategories();

  const bomQuery = useQuery({
    queryKey: queryKeys.boms.detail(dimensionId),
    queryFn: ({ signal }) => bomsApi.getByDimension({ privateRequest, dimensionId, signal }),
    staleTime: staleTimes.boms,
  });

  const bom = bomQuery.data || null;
  const loading = bomQuery.isFetching;
  const errorMessage = bomQuery.error ? getErrorMessage(locale, bomQuery.error) : "";

  useDocumentTitle(`${bom?.product.title || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("BOM", "قائمة المواد")}`);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [itemToUpdate, setItemToUpdate] = useState<BomItemWithMaterial | null>(null);

  function handleOpenAppendModal() {
    setItemToUpdate(null);
    openModal();
  }

  function handleOpenUpdateModal(item: BomItemWithMaterial) {
    setItemToUpdate(item);
    openModal();
  }

  const bomItems = bom?.standardBoms ?? [];
  const hasBom = bomItems.length > 0;

  const materialRows = useMemo(() => getFlattenedMaterialRows(bomItems), [bomItems]);
  const manufacturingRows = useMemo(() => getManufacturingCostRows(bomItems), [bomItems]);

  const totals = useMemo(() => {
    return getBomDisplayTotals({
      materialRows,
      manufacturingRows,
      pricingFactor: bom?.product.pricingFactor ?? 0,
    });
  }, [materialRows, manufacturingRows, bom?.product.pricingFactor]);

  const categoryBreakdown = useMemo((): CategoryBreakdown[] => {
    const uncategorizedTitle = translate("Uncategorized", "غير مصنف");
    const groups = new Map<string, CategoryBreakdown>();

    for (const item of materialRows) {
      const sub = materialCategoryHelpers.getMaterialCategorySubById(item.material.subCategoryId);
      const main = sub ? materialCategoryHelpers.getMaterialCategoryMainById(sub.mainCategoryId) : null;
      const mainCategoryId = main?.id ?? UNCATEGORIZED_ID;
      const title = main?.title ?? uncategorizedTitle;
      const lineCost = item.quantityRequired * item.material.unitPrice;

      const existing = groups.get(mainCategoryId);
      if (existing) {
        existing.itemCount += 1;
        existing.totalCost += lineCost;
        existing.items.push(item);
      } else {
        groups.set(mainCategoryId, {
          mainCategoryId,
          title,
          itemCount: 1,
          totalCost: lineCost,
          sharePercent: 0,
          items: [item],
        });
      }
    }

    const totalCost = totals.totalMaterialCost;
    const rows = Array.from(groups.values()).map((group) => ({
      ...group,
      items: [...group.items].sort(
        (a, b) =>
          a.material.title.localeCompare(b.material.title, locale) || a.material.code.localeCompare(b.material.code, locale),
      ),
      sharePercent: totalCost > 0 ? (group.totalCost / totalCost) * 100 : 0,
    }));

    rows.sort((a, b) => b.totalCost - a.totalCost || a.title.localeCompare(b.title, locale));
    return rows;
  }, [materialRows, totals.totalMaterialCost, materialCategoryHelpers, translate, locale]);

  const excludeMaterialCodes = useMemo(() => bomItems.map((item) => item.materialCode), [bomItems]);

  const currency = translation.currency;

  const productSubCategory = bom ? productCategoryHelpers.getProductCategorySubById(bom.product.subCategoryId) : null;
  const productMainCategory = productSubCategory
    ? productCategoryHelpers.getProductCategoryMainById(productSubCategory.mainCategoryId)
    : null;

  const detailRows: DetailRow[] = bom
    ? [
        {
          key: translate("Product Code", "كود المنتج"),
          value: bom.product.code,
          mono: true,
          copyText: bom.product.code,
        },
        {
          key: translate("Dimension", "المقاس"),
          value: `${bom.length} × ${bom.depth} × ${bom.height} ${getDimensionUnitLabel(bom.dimensionUnit, locale)}`,
        },
        {
          key: translate("Default Dimension", "المقاس الافتراضي"),
          value: bom.isDefault ? (
            <Badge size="sm" variant="light" color="teal" radius="md">
              {translate("Default", "افتراضي")}
            </Badge>
          ) : (
            <EmptyValue />
          ),
        },
        {
          key: translate("Main Category", "الفئة الرئيسية"),
          value: productMainCategory?.title || <EmptyValue />,
        },
        {
          key: translate("Subcategory", "الفئة الفرعية"),
          value: productSubCategory?.title || <EmptyValue />,
        },
        {
          key: translate("Source Type", "نوع المصدر"),
          value: getProductSourceTypeLabel(bom.product.sourceType, locale),
        },
        {
          key: translate("Pricing Factor", "معامل التسعير"),
          value: bom.product.pricingFactor,
        },
      ]
    : [];

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: true,
        sideElements: (
          <div className="flex items-center gap-2">
            {bom && hasBom && (
              <PrintDocument
                title={`${translate("BOM", "قائمة المواد")} - ${bom.product.title} - ${bom.length}×${bom.depth}×${bom.height} ${getDimensionUnitLabel(bom.dimensionUnit, locale)}`}
                buttonLabel={translate("Print", "طباعة")}
                buttonType="button"
                paperWidth={210}
                paperHeight={297}
                icon={<Printer size={14} />}
              >
                <BomPrintDocument
                  bom={bom}
                  totals={totals}
                  categoryBreakdown={categoryBreakdown}
                  mainCategoryTitle={productMainCategory?.title || null}
                />
              </PrintDocument>
            )}
            <RefetchButton isFetching={loading} onRefetch={() => bomQuery.refetch()} />
          </div>
        ),
      }}
    >
      {loading ? (
        <LoadingSection message={translate("Loading BOM data", "جاري تحميل قائمة المواد")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("An error occurred while loading the BOM", "حدث خطأ أثناء تحميل قائمة المواد")}
          errorMessage={errorMessage}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => bomQuery.refetch() }}
        />
      ) : (
        bom && (
          <>
            <EntityDetails title={bom.product.title} icon={Layers} rows={detailRows} />

            {!hasBom ? (
              <EmptySection
                message={translate("No BOM defined for this dimension yet.", "لا توجد قائمة مواد لهذا المقاس بعد.")}
              >
                <PermissionGuard permission={PERMISSIONS.ADD_PRODUCT_BOM}>
                  <Button
                    component={Link}
                    href={getLocalizedHref(`/products/${code}/boms/${dimensionId}/create`)}
                    variant="light"
                    color="teal"
                    radius="md"
                    leftSection={<Plus size={15} />}
                  >
                    {translate("Create BOM", "إنشاء قائمة مواد")}
                  </Button>
                </PermissionGuard>
              </EmptySection>
            ) : (
              <section className="flex flex-col gap-4">
                <Divider variant="dashed" />

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                      <Layers size={16} />
                    </div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-semibold text-gray-900">{translate("BOM Items", "بنود قائمة المواد")}</h4>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {materialRows.length}
                      </span>
                    </div>
                  </div>

                  <PermissionGuard permission={PERMISSIONS.ADD_PRODUCT_BOM}>
                    <Button
                      onClick={handleOpenAppendModal}
                      variant="light"
                      color="teal"
                      radius="md"
                      leftSection={<Plus size={15} />}
                    >
                      {translate("Add Item", "إضافة بند")}
                    </Button>
                  </PermissionGuard>
                </div>

                <div className="flex flex-col gap-8">
                  {categoryBreakdown.map((group) => (
                    <div key={group.mainCategoryId} className="flex flex-col gap-3">
                      <h5 className="px-0.5 text-sm font-semibold text-gray-800">{group.title}</h5>

                      <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <Table className="text-nowrap" highlightOnHover>
                          <Table.Thead className="bg-gray-50">
                            <Table.Tr className="h-10">
                              <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                {translate("Material Code", "كود المادة")}
                              </Table.Th>
                              <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                {translate("Material Name", "اسم المادة")}
                              </Table.Th>
                              <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                {translate("Unit", "الوحدة")}
                              </Table.Th>
                              <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                {translate("Quantity", "الكمية")}
                              </Table.Th>
                              <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                {translate("Unit Price (EGP)", "سعر الوحدة (ج.م)")}
                              </Table.Th>
                              <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                {translate("Total (EGP)", "الإجمالي (ج.م)")}
                              </Table.Th>
                              <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                {translate("Notes", "الملاحظات")}
                              </Table.Th>
                              <Table.Th />
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {group.items.map((item) => {
                              const lineCost = item.quantityRequired * item.material.unitPrice;

                              return (
                                <Table.Tr key={item.id} className="text-gray-600">
                                  <Table.Td>
                                    <span className="font-mono text-xs text-gray-500">{item.material.code}</span>
                                  </Table.Td>
                                  <Table.Td>
                                    <span className="font-medium text-gray-800">{item.material.title}</span>
                                  </Table.Td>
                                  <Table.Td>
                                    <Badge size="sm" variant="light" color="gray" radius="md">
                                      {getMaterialUnitLabel(item.material.unitOfMeasurement, locale)}
                                    </Badge>
                                  </Table.Td>
                                  <Table.Td className="font-medium text-gray-800">{item.quantityRequired}</Table.Td>
                                  <Table.Td>{formatMoney(item.material.unitPrice)}</Table.Td>
                                  <Table.Td className="font-medium text-gray-800">{formatMoney(lineCost)}</Table.Td>
                                  <Table.Td className="max-w-48 text-gray-500">
                                    <div className="flex flex-col gap-0.5">
                                      {item.notes ? <span className="truncate">{item.notes}</span> : null}
                                      {item.parentManufacturedMaterialTitle && (
                                        <span className="text-xs text-gray-400">
                                          {translate("Required for", "مطلوب لـ")}:{" "}
                                          <span className="font-medium text-gray-800">
                                            {item.parentManufacturedMaterialTitle}
                                          </span>
                                        </span>
                                      )}
                                      {!item.notes && !item.parentManufacturedMaterialTitle ? "-" : null}
                                    </div>
                                  </Table.Td>
                                  <Table.Td w={0}>
                                    {!item.parentManufacturedMaterialTitle && (
                                      <PermissionGuard permission={PERMISSIONS.UPDATE_PRODUCT_BOM}>
                                        <Button
                                          onClick={() => item.sourceBomItem && handleOpenUpdateModal(item.sourceBomItem)}
                                          variant="light"
                                          color="gray"
                                          size="xs"
                                          radius="md"
                                          p={6}
                                        >
                                          <Pencil size={12} />
                                        </Button>
                                      </PermissionGuard>
                                    )}
                                  </Table.Td>
                                </Table.Tr>
                              );
                            })}
                          </Table.Tbody>
                          <Table.Tfoot className="bg-gray-50">
                            <Table.Tr className="h-10 border-t border-b-0! border-gray-200 font-medium text-gray-800">
                              <Table.Td>{translate("Total", "الإجمالي")}</Table.Td>
                              <Table.Td colSpan={4} className="text-gray-500">
                                {group.itemCount} {translate("Items", "بند")}
                              </Table.Td>
                              <Table.Td>{formatMoney(group.totalCost)}</Table.Td>
                              <Table.Td
                                className="text-gray-500"
                                title={translate("Share Percentage", "النسبة المئوية للإجمالي")}
                              >
                                {group.sharePercent.toFixed(1)}%
                              </Table.Td>
                              <Table.Td />
                            </Table.Tr>
                          </Table.Tfoot>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>

                {manufacturingRows.length > 0 && (
                  <>
                    <Divider variant="dashed" />

                    <ManufacturingCostsSection
                      rows={manufacturingRows}
                      totalManufacturingCost={totals.totalManufacturingCost}
                    />
                  </>
                )}

                <Divider variant="dashed" />

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <CalculationCard
                    label={translate("Total Material Cost", "إجمالي تكلفة المواد")}
                    value={formatMoney(totals.totalMaterialCost, currency)}
                    hint={translate(
                      "Sum of quantity × unit price for all material rows",
                      "مجموع الكمية × سعر الوحدة لكل صفوف المواد",
                    )}
                    icon={<Wallet size={18} />}
                  />
                  <CalculationCard
                    label={translate("Total Manufacturing Cost", "إجمالي تكلفة التصنيع")}
                    value={formatMoney(totals.totalManufacturingCost, currency)}
                    hint={translate(
                      "Manufactured material quantity × temporary unit manufacturing cost",
                      "كمية المادة المصنعة × تكلفة التصنيع المؤقتة للوحدة",
                    )}
                    icon={<Wallet size={18} />}
                  />
                  <CalculationCard
                    label={translate("Grand Total Cost", "إجمالي التكلفة الكلية")}
                    value={formatMoney(totals.grandTotalCost, currency)}
                    hint={translate(
                      "Total material cost + total manufacturing cost",
                      "إجمالي تكلفة المواد + إجمالي تكلفة التصنيع",
                    )}
                    icon={<Wallet size={18} />}
                  />
                  <CalculationCard
                    label={translate("Estimated Product Price", "السعر التقديري للمنتج")}
                    value={formatMoney(totals.estimatedUnitPrice, currency)}
                    hint={translate(
                      "Material cost + manufacturing cost, then multiplied by pricing factor",
                      "تكلفة المواد + تكلفة التصنيع ثم تضرب في معامل التسعير",
                    )}
                    icon={<Calculator size={18} />}
                  />
                </div>

                <Divider variant="dashed" />

                <BomItemModal
                  opened={modalOpened}
                  close={closeModal}
                  dimensionId={dimensionId}
                  itemToUpdate={itemToUpdate}
                  setItemToUpdate={setItemToUpdate}
                  excludeMaterialCodes={excludeMaterialCodes}
                />
              </section>
            )}
          </>
        )
      )}
    </LayoutBox>
  );
}

function CalculationCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 overflow-hidden rounded-2xl border border-gray-200 bg-linear-to-br from-white to-teal-50/40 p-4 sm:p-5">
      <div className="flex h-10 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">{icon}</div>
      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
      <p className="text-xl font-semibold text-gray-900">{value}</p>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function ManufacturingCostsSection({
  rows,
  totalManufacturingCost,
}: {
  rows: ManufacturingCostRow[];
  totalManufacturingCost: number;
}) {
  const { translate } = useI18n();

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Wallet size={16} />
        </div>
        <div className="flex items-center gap-2">
          <h4 className="text-lg font-semibold text-gray-900">{translate("Manufacturing Costs", "تكاليف التصنيع")}</h4>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{rows.length}</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <Table className="text-nowrap" highlightOnHover>
          <Table.Thead className="bg-gray-50">
            <Table.Tr className="h-10">
              <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                {translate("Material Code", "كود المادة")}
              </Table.Th>
              <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                {translate("Manufactured Material", "المادة المصنعة")}
              </Table.Th>
              <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                {translate("Quantity", "الكمية")}
              </Table.Th>
              <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                {translate("Unit Manufacturing Cost", "تكلفة التصنيع للوحدة")}
              </Table.Th>
              <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                {translate("Total Manufacturing Cost", "إجمالي تكلفة التصنيع")}
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.id} className="text-gray-600">
                <Table.Td>
                  <span className="font-mono text-xs text-gray-500">{row.materialCode}</span>
                </Table.Td>
                <Table.Td>
                  <span className="font-medium text-gray-800">{row.materialTitle}</span>
                </Table.Td>
                <Table.Td className="font-medium text-gray-800">{row.quantityRequired}</Table.Td>
                <Table.Td>{formatMoney(row.unitManufacturingCost)}</Table.Td>
                <Table.Td className="font-medium text-gray-800">{formatMoney(row.totalManufacturingCost)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
          <Table.Tfoot className="bg-gray-50">
            <Table.Tr className="h-10 border-t border-b-0! border-gray-200 font-medium text-gray-800">
              <Table.Td>{translate("Total", "الإجمالي")}</Table.Td>
              <Table.Td colSpan={3} className="text-gray-500">
                {rows.length} {translate("Items", "بند")}
              </Table.Td>
              <Table.Td>{formatMoney(totalManufacturingCost)}</Table.Td>
            </Table.Tr>
          </Table.Tfoot>
        </Table>
      </div>
    </section>
  );
}
