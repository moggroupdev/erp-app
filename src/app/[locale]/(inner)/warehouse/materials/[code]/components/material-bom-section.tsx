"use client";

import { useMemo, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useI18n } from "@/lib/i18n/hooks";
import useMaterialCategories from "@/hooks/reference/use-material-categories";
import { formatEnteredQuantityForDisplay } from "@/lib/helpers/format-quantity";
import { getMaterialLineCost } from "@/lib/helpers/bom-display";
import { COSTING_METHODS } from "@/lib/constants/enums/derived/costing-methods";
import { formatMoney } from "@/lib/helpers/format-money";
import { toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import type { MaterialWithCreator } from "@/types/material";
import type { MmBom, MmBomItemWithMaterial } from "@/types/mm-bom";
import { Badge, Button, Table } from "@mantine/core";
import { Layers, Pencil, Plus } from "lucide-react";
import PermissionGuard from "@/components/guards/permission";
import EmptySection from "@/components/ui/sections/empty";
import UnitToggle from "@/components/ui/unit-toggle";
import { EmptyValue } from "@/components/ui/entity-details";
import MmBomItemModal from "@/components/global/data-modals/mm-bom-item-modal";

export default function MaterialBomSection({
  material,
  bom,
}: {
  material: MaterialWithCreator;
  bom: MmBom | null;
}) {
  const { locale, translate } = useI18n();
  const { helpers: materialCategoryHelpers } = useMaterialCategories();

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [itemToUpdate, setItemToUpdate] = useState<MmBomItemWithMaterial | null>(null);

  function handleOpenAppendModal() {
    setItemToUpdate(null);
    openModal();
  }

  function handleOpenUpdateModal(item: MmBomItemWithMaterial) {
    setItemToUpdate(item);
    openModal();
  }

  const items = bom?.manufacturedMaterialBoms ?? [];
  const hasBom = items.length > 0;

  const totalMaterialCost = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          getMaterialLineCost(
            item.quantityRequired,
            item.unitOfMeasurementSelected,
            { ...item.material, lastPurchasePrice: null },
            COSTING_METHODS.AVERAGE_PRICE,
          ),
        0,
      ),
    [items],
  );

  const excludeMaterialCodes = useMemo(() => items.map((item) => item.materialCode), [items]);

  return (
    <PermissionGuard permission={PERMISSIONS.READ_MANUFACTURED_MATERIAL_BOMS}>
      <section className="mt-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Layers size={16} />
            </div>
            <div className="flex items-start gap-2">
              <div className="flex flex-col gap-1">
                <h4 className="text-lg font-semibold text-gray-900">{translate("Bill of Materials", "قائمة المواد")}</h4>
                <p className="text-xs text-gray-500">
                  {translate(
                    "The required bill of materials required to produce this manufactured material.",
                    "قائمة المواد المطلوبة لإنتاج هذه المادة المصنعة.",
                  )}
                </p>
              </div>
            </div>
          </div>

          {hasBom && (
            <PermissionGuard permission={PERMISSIONS.ADD_MANUFACTURED_MATERIAL_BOM}>
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
          )}
        </div>

        {!hasBom ? (
          <EmptySection
            message={translate(
              "No BOM defined for this manufactured material yet.",
              "لا توجد قائمة مواد لهذه المادة المصنعة بعد.",
            )}
          >
            <PermissionGuard permission={PERMISSIONS.ADD_MANUFACTURED_MATERIAL_BOM}>
              <Button
                onClick={handleOpenAppendModal}
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
                    {translate("Main Category", "الفئة الرئيسية")}
                  </Table.Th>
                  <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Subcategory", "الفئة الفرعية")}
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
                {items.map((item) => {
                  const enteredUnit = item.unitOfMeasurementSelected ?? item.material.unitOfMeasurement;
                  const lineCost = getMaterialLineCost(
                    item.quantityRequired,
                    item.unitOfMeasurementSelected,
                    { ...item.material, lastPurchasePrice: null },
                    COSTING_METHODS.AVERAGE_PRICE,
                  );
                  const subCategory = materialCategoryHelpers.getMaterialCategorySubById(item.material.subCategoryId);
                  const mainCategory = subCategory
                    ? materialCategoryHelpers.getMaterialCategoryMainById(subCategory.mainCategoryId)
                    : null;

                  return (
                    <UnitToggle
                      key={`${item.id}:${item.unitOfMeasurementSelected ?? item.material.unitOfMeasurement}`}
                      baseUnit={item.material.unitOfMeasurement}
                      unitConversions={item.material.unitConversions}
                      defaultUnit={item.unitOfMeasurementSelected ?? item.material.unitOfMeasurement}
                    >
                      {({ unit, factor, toggleButton }) => (
                    <Table.Tr className="text-gray-600">
                      <Table.Td>
                        <span className="font-mono text-xs text-gray-500">{item.material.code}</span>
                      </Table.Td>
                      <Table.Td>
                        <span className="font-medium text-gray-800">{item.material.title}</span>
                      </Table.Td>
                      <Table.Td>{mainCategory?.title || <EmptyValue />}</Table.Td>
                      <Table.Td>{subCategory?.title || <EmptyValue />}</Table.Td>
                      <Table.Td>
                        <div className="flex items-center gap-1">
                          <Badge size="sm" variant="light" color="gray" radius="md">
                            {getMaterialUnitLabel(unit, locale)}
                          </Badge>
                          {toggleButton}
                        </div>
                      </Table.Td>
                      <Table.Td className="font-medium text-gray-800">
                        {formatEnteredQuantityForDisplay(item.quantityRequired, enteredUnit, unit, item.material)}
                      </Table.Td>
                      <Table.Td>{formatMoney(toDisplayUnitPrice(item.material.unitPrice, factor))}</Table.Td>
                      <Table.Td className="font-medium text-gray-800">{formatMoney(lineCost)}</Table.Td>
                      <Table.Td className="max-w-48 truncate text-gray-500">{item.notes}</Table.Td>
                      <Table.Td w={0}>
                        <PermissionGuard permission={PERMISSIONS.UPDATE_MANUFACTURED_MATERIAL_BOM}>
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
                      )}
                    </UnitToggle>
                  );
                })}
              </Table.Tbody>
              <Table.Tfoot className="bg-gray-50">
                <Table.Tr className="h-10 border-t border-b-0! border-gray-200 font-medium text-gray-800">
                  <Table.Td>{translate("Total", "الإجمالي")}</Table.Td>
                  <Table.Td colSpan={6} className="text-gray-500">
                    {items.length} {translate("Items", "بند")}
                  </Table.Td>
                  <Table.Td>{formatMoney(totalMaterialCost)}</Table.Td>
                  <Table.Td />
                  <Table.Td />
                </Table.Tr>
              </Table.Tfoot>
            </Table>
          </div>
        )}

        <MmBomItemModal
          opened={modalOpened}
          close={closeModal}
          manufacturedMaterialCode={material.code}
          itemToUpdate={itemToUpdate}
          setItemToUpdate={setItemToUpdate}
          excludeMaterialCodes={excludeMaterialCodes}
        />
      </section>
    </PermissionGuard>
  );
}
