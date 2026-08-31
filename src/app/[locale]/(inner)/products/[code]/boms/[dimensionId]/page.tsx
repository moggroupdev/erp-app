"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { toast } from "sonner";
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
import { getProductSourceTypeLabel } from "@/lib/constants/enums/product-source-types";
import { formatDimensionLabel, formatDimensionLabelText } from "@/lib/helpers/format-dimension-label";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import {
  getBomDisplayTotals,
  getFlattenedMaterialRows,
  getManufacturingCostRows,
  getMaterialCostPrice,
  type FlattenedBomRow,
  type ManufacturingCostRow,
  UNCATEGORIZED_ID,
} from "@/lib/helpers/bom-display";
import {
  COSTING_METHODS,
  COSTING_METHOD_LABELS_LIST,
  getCostingMethodLabel,
  isValidCostingMethod,
  type CostingMethod,
} from "@/lib/constants/enums/derived/costing-methods";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatDisplayQuantity, formatQuantity } from "@/lib/helpers/format-quantity";
import { toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";
import type { BomItemWithMaterial } from "@/types/bom";
import { ActionIcon, Badge, Button, Divider, Menu, SegmentedControl, Table } from "@mantine/core";
import { Calculator, EllipsisVertical, Layers, Pencil, Plus, Printer, Trash2, Wallet } from "lucide-react";
import PermissionGuard from "@/components/guards/permission";
import LayoutBox from "@/components/ui/layout-box";
import UnitToggle from "@/components/ui/unit-toggle";
import RefetchButton from "@/components/ui/refetch-button";
import PrintDocument from "@/components/ui/print-document";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import EntityDetails, { EmptyValue, type DetailRow } from "@/components/ui/entity-details";
import BomItemModal from "@/components/global/data-modals/bom-item-modal";
import BomPrintDocument from "@/components/documents/bom-print-document";
import DeleteModal from "@/components/ui/delete-modal";

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
  const queryClient = useQueryClient();
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
  const [itemToDelete, setItemToDelete] = useState<BomItemWithMaterial | null>(null);
  const [costingMethod, setCostingMethod] = useState<CostingMethod>(COSTING_METHODS.AVERAGE_PRICE);

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => bomsApi.deleteItem({ privateRequest, itemId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.boms.detail(dimensionId) });
      toast.success(translate("BOM item deleted successfully.", "تم حذف بند قائمة المواد بنجاح."));
      setItemToDelete(null);
    },
  });

  const deleteError = deleteMutation.error ? getErrorMessage(locale, deleteMutation.error) : "";

  function handleCostingMethodChange(value: string) {
    if (isValidCostingMethod(value)) setCostingMethod(value);
  }

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
      costingMethod,
    });
  }, [materialRows, manufacturingRows, bom?.product.pricingFactor, costingMethod]);

  const categoryBreakdown = useMemo((): CategoryBreakdown[] => {
    const uncategorizedTitle = translate("Uncategorized", "غير مصنف");
    const groups = new Map<string, CategoryBreakdown>();

    for (const item of materialRows) {
      const sub = materialCategoryHelpers.getMaterialCategorySubById(item.material.subCategoryId);
      const main = sub ? materialCategoryHelpers.getMaterialCategoryMainById(sub.mainCategoryId) : null;
      const mainCategoryId = main?.id ?? UNCATEGORIZED_ID;
      const title = main?.title ?? uncategorizedTitle;
      const lineCost = item.quantityRequired * getMaterialCostPrice(item.material, costingMethod);

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
  }, [materialRows, totals.totalMaterialCost, materialCategoryHelpers, translate, locale, costingMethod]);

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
          value: formatDimensionLabel(bom, translation.productDimensionUnit),
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
                title={`${translate("BOM", "قائمة المواد")} - ${bom.product.title} - ${formatDimensionLabelText(bom, translation.productDimensionUnit)}`}
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
                  costingMethod={costingMethod}
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

                <div className="flex flex-wrap items-center justify-between gap-3">
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

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">{translate("Costing", "أساس التكلفة")}</span>
                      <SegmentedControl
                        radius="md"
                        color="teal"
                        variant="light"
                        value={costingMethod}
                        onChange={handleCostingMethodChange}
                        data={COSTING_METHOD_LABELS_LIST.map((method) => ({
                          value: method.value,
                          label: translate(method.label.en, method.label.ar),
                        }))}
                      />
                    </div>

                    <PermissionGuard permission={PERMISSIONS.ADD_PRODUCT_BOM}>
                      <Button
                        component={Link}
                        href={getLocalizedHref(`/products/${code}/boms/${dimensionId}/create`)}
                        variant="light"
                        color="gray"
                        radius="md"
                        leftSection={<Plus size={15} />}
                      >
                        {translate("Create Department BOM", "إنشاء قائمة مواد لقسم")}
                      </Button>
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
                </div>

                <div className="flex flex-col gap-8">
                  {categoryBreakdown.map((group) => (
                    <div key={group.mainCategoryId} className="flex flex-col gap-3">
                      <h5 className="px-0.5 text-sm font-semibold text-gray-800">{group.title}</h5>

                      <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <Table className="w-full table-fixed text-nowrap" highlightOnHover verticalSpacing="xs">
                          <Table.Thead className="bg-gray-50">
                            <Table.Tr className="h-10">
                              <Table.Th w="12%" className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                {translate("Material Code", "كود")}
                              </Table.Th>
                              <Table.Th w="22%" className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                {translate("Material Name", "الصنف")}
                              </Table.Th>
                              <Table.Th w="12%" className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                {translate("Production Department", "قسم الانتاج")}
                              </Table.Th>
                              <Table.Th w="8%" className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                {translate("Unit", "الوحدة")}
                              </Table.Th>
                              <Table.Th w="8%" className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                {translate("Quantity", "الكمية")}
                              </Table.Th>
                              <Table.Th w="11%" className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                {translate("Unit Price (EGP)", "سعر الوحدة (ج.م)")}
                              </Table.Th>
                              <Table.Th w="11%" className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                {translate("Total (EGP)", "الإجمالي (ج.م)")}
                              </Table.Th>
                              <Table.Th w="11%" className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                {translate("Notes", "الملاحظات")}
                              </Table.Th>
                              <Table.Th w="5%" />
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {group.items.map((item) => {
                              const unitCost = getMaterialCostPrice(item.material, costingMethod);
                              const lineCost = item.quantityRequired * unitCost;
                              const zeroValueClass = "text-orange-500";

                              return (
                                <UnitToggle
                                  key={item.id}
                                  baseUnit={item.material.unitOfMeasurement}
                                  unitConversions={item.material.unitConversions}
                                >
                                  {({ unit, factor, toggleButton }) => (
                                    <Table.Tr className="text-gray-600">
                                      <Table.Td>
                                        <Link
                                          href={getLocalizedHref(`/warehouse/materials/${item.material.code}`)}
                                          className="font-mono text-xs text-gray-500 hover:underline"
                                        >
                                          {item.material.code}
                                        </Link>
                                      </Table.Td>
                                      <Table.Td>
                                        <Link
                                          href={getLocalizedHref(`/warehouse/materials/${item.material.code}`)}
                                          className="block truncate font-medium text-gray-800 hover:underline"
                                        >
                                          {item.material.title}
                                        </Link>
                                      </Table.Td>
                                      <Table.Td>
                                        <span className="text-sm text-gray-600">
                                          {item.sourceBomItem?.productionSubDepartment
                                            ? getProductionSubDepartmentLabel(
                                                item.sourceBomItem.productionSubDepartment,
                                                locale,
                                              )
                                            : "-"}
                                        </span>
                                      </Table.Td>
                                      <Table.Td>
                                        <div className="flex items-center gap-1">
                                          {getMaterialUnitLabel(unit, locale)}
                                          {toggleButton}
                                        </div>
                                      </Table.Td>
                                      <Table.Td
                                        className={`font-medium ${item.quantityRequired === 0 ? zeroValueClass : "text-gray-800"}`}
                                      >
                                        {formatDisplayQuantity(item.quantityRequired, factor)}
                                      </Table.Td>
                                      <Table.Td className={unitCost === 0 ? zeroValueClass : undefined}>
                                        {formatMoney(toDisplayUnitPrice(unitCost, factor))}
                                      </Table.Td>
                                      <Table.Td
                                        className={`font-medium ${lineCost === 0 ? zeroValueClass : "text-gray-800"}`}
                                      >
                                        {formatMoney(lineCost)}
                                      </Table.Td>
                                      <Table.Td className="text-gray-500">
                                        <div className="flex flex-col gap-0.5 overflow-hidden">
                                          {item.notes ? <span className="truncate">{item.notes}</span> : null}
                                          {item.parentManufacturedMaterialTitle && (
                                            <span className="truncate text-xs text-gray-400">
                                              {translate("Required for", "مطلوب لـ")}:{" "}
                                              <span className="font-medium text-gray-800">
                                                {item.parentManufacturedMaterialTitle}
                                              </span>
                                            </span>
                                          )}
                                          {!item.notes && !item.parentManufacturedMaterialTitle ? "-" : null}
                                        </div>
                                      </Table.Td>
                                      <Table.Td>
                                        {!item.parentManufacturedMaterialTitle && item.sourceBomItem && (
                                          <PermissionGuard permission={PERMISSIONS.UPDATE_PRODUCT_BOM}>
                                            <Menu position="bottom-end" withinPortal>
                                              <Menu.Target>
                                                <ActionIcon
                                                  variant="subtle"
                                                  color="gray"
                                                  size="sm"
                                                  radius="md"
                                                  aria-label={translate("Item actions", "إجراءات البند")}
                                                >
                                                  <EllipsisVertical size={14} />
                                                </ActionIcon>
                                              </Menu.Target>
                                              <Menu.Dropdown>
                                                <Menu.Item
                                                  leftSection={<Pencil size={14} />}
                                                  onClick={() => handleOpenUpdateModal(item.sourceBomItem!)}
                                                >
                                                  {translate("Edit", "تعديل")}
                                                </Menu.Item>
                                                <Menu.Item
                                                  leftSection={<Trash2 size={14} />}
                                                  color="red"
                                                  onClick={() => {
                                                    deleteMutation.reset();
                                                    setItemToDelete(item.sourceBomItem);
                                                  }}
                                                >
                                                  {translate("Delete", "حذف")}
                                                </Menu.Item>
                                              </Menu.Dropdown>
                                            </Menu>
                                          </PermissionGuard>
                                        )}
                                      </Table.Td>
                                    </Table.Tr>
                                  )}
                                </UnitToggle>
                              );
                            })}
                          </Table.Tbody>
                          <Table.Tfoot className="bg-gray-50">
                            <Table.Tr className="h-10 border-t border-b-0! border-gray-200 font-medium text-gray-800">
                              <Table.Td>{translate("Total", "الإجمالي")}</Table.Td>
                              <Table.Td colSpan={5} className="text-gray-500">
                                {group.itemCount} {translate("Items", "بند")}
                              </Table.Td>
                              <Table.Td className={group.totalCost === 0 ? "text-orange-500" : undefined}>
                                {formatMoney(group.totalCost)}
                              </Table.Td>
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
                      `Sum of quantity × ${getCostingMethodLabel(costingMethod, "en")} for all material rows`,
                      `مجموع الكمية × ${getCostingMethodLabel(costingMethod, "ar")} لكل صفوف المواد`,
                    )}
                    icon={<Wallet size={18} />}
                  />
                  <CalculationCard
                    label={translate("Total Outsourcing Cost", "إجمالي تكلفة التصنيع خارجيًا")}
                    value={formatMoney(totals.totalManufacturingCost, currency)}
                    hint={translate(
                      "Sum of quantity × unit price for all outsourcing rows",
                      "مجموع الكمية × سعر الوحدة لكل صفوف التصنيع الخارجي",
                    )}
                    icon={<Wallet size={18} />}
                  />
                  <CalculationCard
                    label={translate("Grand Total Cost", "إجمالي التكلفة الكلية")}
                    value={formatMoney(totals.grandTotalCost, currency)}
                    hint={translate(
                      "Total material cost + total outsourcing cost",
                      "إجمالي تكلفة المواد + إجمالي تكلفة التصنيع الخارجي",
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
                  existingItems={bomItems}
                />

                <DeleteModal
                  opened={!!itemToDelete}
                  onClose={() => {
                    setItemToDelete(null);
                    deleteMutation.reset();
                  }}
                  title={translate("Delete BOM item?", "حذف بند قائمة المواد؟")}
                  subTitle={
                    itemToDelete
                      ? translate(
                          `You're about to delete "${itemToDelete.material.title}" from this BOM.`,
                          `أنت على وشك حذف "${itemToDelete.material.title}" من قائمة المواد.`,
                        )
                      : ""
                  }
                  warning={translate("This action cannot be undone.", "هذا الإجراء لا يمكن التراجع عنه.")}
                  action={() => {
                    if (itemToDelete) deleteMutation.mutate(itemToDelete.id);
                  }}
                  loading={deleteMutation.isPending}
                  error={deleteError}
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
  const { translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Wallet size={16} />
        </div>
        <div className="flex items-center gap-2">
          <h4 className="text-lg font-semibold text-gray-900">{translate("Outsourcing Costs", "تكاليف التصنيع خارجيًا")}</h4>
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
                {translate(
                  `Unit Manufacturing Cost (${translation.currency})`,
                  `تكلفة التصنيع للوحدة (${translation.currency})`,
                )}
              </Table.Th>
              <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                {translate(
                  `Total Manufacturing Cost (${translation.currency})`,
                  `إجمالي تكلفة التصنيع (${translation.currency})`,
                )}
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.id} className="text-gray-600">
                <Table.Td>
                  <Link
                    href={getLocalizedHref(`/warehouse/materials/${row.materialCode}`)}
                    className="font-mono text-xs text-gray-500 hover:underline"
                  >
                    {row.materialCode}
                  </Link>
                </Table.Td>
                <Table.Td>
                  <Link
                    href={getLocalizedHref(`/warehouse/materials/${row.materialCode}`)}
                    className="font-medium text-gray-800 hover:underline"
                  >
                    {row.materialTitle}
                  </Link>
                </Table.Td>
                <Table.Td className="font-medium text-gray-800">{formatQuantity(row.quantityRequired)}</Table.Td>
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
