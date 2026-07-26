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
import bomsApi from "@/lib/api/boms";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { getDimensionUnitLabel } from "@/lib/constants/enums/dimension-units";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { getProductSourceTypeLabel } from "@/lib/constants/enums/product-source-types";
import { formatMoney } from "@/lib/helpers/format-money";
import type { BomItemWithMaterial } from "@/types/bom";
import { Badge, Button, Divider, Table } from "@mantine/core";
import { Calculator, Layers, Pencil, Plus, Wallet } from "lucide-react";
import PermissionGuard from "@/components/guards/permission";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import MoneyViewer from "@/components/ui/money-viewer";
import EntityDetails, { EmptyValue, type DetailRow } from "@/components/ui/entity-details";
import AppendBomItemModal from "@/components/global/data-modals/append-bom-item-modal";
import UpdateBomItemModal from "@/components/global/data-modals/update-bom-item-modal";

const PAGE_TITLE = { en: "Bill of Materials", ar: "قائمة المواد" };

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const { code, dimensionId } = useParams<{ code: string; dimensionId: string }>();
  const privateRequest = usePrivateRequest();
  const { helpers: productCategoryHelpers } = useProductCategories();

  const bomQuery = useQuery({
    queryKey: queryKeys.boms.detail(dimensionId),
    queryFn: ({ signal }) => bomsApi.getByDimension({ privateRequest, dimensionId, signal }),
    staleTime: staleTimes.boms,
  });

  const bom = bomQuery.data || null;
  const loading = bomQuery.isFetching;
  const errorMessage = bomQuery.error ? getErrorMessage(locale, bomQuery.error) : "";

  useDocumentTitle(`${bom?.product.title || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("BOM", "قائمة المواد")}`);

  const [appendModalOpened, { open: openAppendModal, close: closeAppendModal }] = useDisclosure(false);
  const [updateModalOpened, { open: openUpdateModal, close: closeUpdateModal }] = useDisclosure(false);
  const [itemToUpdate, setItemToUpdate] = useState<BomItemWithMaterial | null>(null);

  function handleOpenUpdateModal(item: BomItemWithMaterial) {
    setItemToUpdate(item);
    openUpdateModal();
  }

  const items = bom?.standardBoms ?? [];
  const hasBom = items.length > 0;

  const totals = useMemo(() => {
    const totalMaterialCost = items.reduce((sum, item) => sum + item.quantityRequired * item.material.unitPrice, 0);
    const estimatedUnitPrice = totalMaterialCost * (bom?.product.pricingFactor ?? 0);
    return { totalMaterialCost, estimatedUnitPrice, itemCount: items.length };
  }, [items, bom?.product.pricingFactor]);

  const excludeMaterialCodes = useMemo(() => items.map((item) => item.materialCode), [items]);

  const currency = translation.currency;

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
          value: (() => {
            const sub = productCategoryHelpers.getProductCategorySubById(bom.product.subCategoryId);
            const main = sub ? productCategoryHelpers.getProductCategoryMainById(sub.mainCategoryId) : null;
            return main?.title || <EmptyValue />;
          })(),
        },
        {
          key: translate("Subcategory", "الفئة الفرعية"),
          value: productCategoryHelpers.getProductCategorySubById(bom.product.subCategoryId)?.title || <EmptyValue />,
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
        sideElements: <RefetchButton isFetching={loading} onRefetch={() => bomQuery.refetch()} />,
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

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <CalculationCard
                    label={translate("Total Material Cost", "إجمالي تكلفة المواد")}
                    value={<MoneyViewer amount={totals.totalMaterialCost} currency={currency} />}
                    hint={translate("Sum of quantity × unit price for all items", "مجموع الكمية × سعر الوحدة لكل البنود")}
                    icon={<Wallet size={18} />}
                  />
                  <CalculationCard
                    label={translate("Estimated Unit Price", "السعر التقديري للوحدة")}
                    value={<MoneyViewer amount={totals.estimatedUnitPrice} currency={currency} />}
                    hint={translate(
                      `Material cost × pricing factor (${bom.product.pricingFactor})`,
                      `تكلفة المواد × معامل التسعير (${bom.product.pricingFactor})`,
                    )}
                    icon={<Calculator size={18} />}
                  />
                </div>

                <Divider variant="dashed" />

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                      <Layers size={16} />
                    </div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-semibold text-gray-900">{translate("BOM Items", "بنود قائمة المواد")}</h4>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {items.length}
                      </span>
                    </div>
                  </div>

                  <PermissionGuard permission={PERMISSIONS.ADD_PRODUCT_BOM}>
                    <Button
                      onClick={openAppendModal}
                      variant="light"
                      color="teal"
                      radius="md"
                      leftSection={<Plus size={15} />}
                    >
                      {translate("Add Item", "إضافة بند")}
                    </Button>
                  </PermissionGuard>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
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
                          {translate("Line Cost (EGP)", "تكلفة البند (ج.م)")}
                        </Table.Th>
                        <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                          {translate("Notes", "الملاحظات")}
                        </Table.Th>
                        <Table.Th />
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {items.map((item) => {
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
                            <Table.Td className="max-w-48 truncate text-gray-500">{item.notes}</Table.Td>
                            <Table.Td w={0}>
                              <PermissionGuard permission={PERMISSIONS.UPDATE_PRODUCT_BOM}>
                                <Button
                                  onClick={() => handleOpenUpdateModal(item)}
                                  variant="light"
                                  color="gray"
                                  size="xs"
                                  radius="md"
                                  p={6}
                                >
                                  <Pencil size={12} />
                                </Button>
                              </PermissionGuard>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </div>

                <AppendBomItemModal
                  opened={appendModalOpened}
                  close={closeAppendModal}
                  dimensionId={dimensionId}
                  excludeMaterialCodes={excludeMaterialCodes}
                />

                <UpdateBomItemModal
                  opened={updateModalOpened}
                  close={closeUpdateModal}
                  dimensionId={dimensionId}
                  itemToUpdate={itemToUpdate}
                  setItemToUpdate={setItemToUpdate}
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
