"use client";

import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useI18n } from "@/lib/i18n/hooks";
import useHasPermission from "@/hooks/use-has-permission";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatBaseQuantityForDisplay } from "@/lib/helpers/format-quantity";
import { formatConversionLabel, toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";
import type { MaterialUnitConversionSummary, MaterialWithCreatorAndUnitConversions } from "@/types/material";
import { ActionIcon, Badge, Menu, Table } from "@mantine/core";
import { EllipsisVertical, Pencil, Plus, Ruler } from "lucide-react";
import PermissionGuard from "@/components/guards/permission";
import EmptySection from "@/components/ui/sections/empty";
import ActionsMenu from "@/components/ui/actions-menu";
import MaterialUnitConversionModal from "./material-unit-conversion-modal";

export default function MaterialUnitConversionsSection({ material }: { material: MaterialWithCreatorAndUnitConversions }) {
  const { locale, translate, translation } = useI18n();
  const canAddUnit = useHasPermission(PERMISSIONS.ADD_MATERIAL_UNIT_CONVERSION);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingConversion, setEditingConversion] = useState<MaterialUnitConversionSummary | null>(null);

  const units = material.unitConversions;

  function handleOpenAdd() {
    setEditingConversion(null);
    openModal();
  }

  function handleOpenEdit(row: MaterialUnitConversionSummary) {
    setEditingConversion(row);
    openModal();
  }

  return (
    <section className="mt-4 flex flex-col gap-4">
      <MaterialUnitConversionModal
        opened={modalOpened}
        close={closeModal}
        materialCode={material.code}
        baseUnit={material.unitOfMeasurement}
        existingConversions={units}
        existingConversion={editingConversion}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-haze-50 text-haze-600">
            <Ruler size={16} />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="text-lg font-semibold text-gray-900">{translate("Alternate Units", "وحدات القياس البديلة")}</h4>
            <p className="text-xs text-gray-500">
              {translate(
                `Define other units and how they convert to the base unit.`,
                `عرّف وحدات أخرى وكيفية تحويلها إلى الوحدة الأساسية.`,
              )}
            </p>
          </div>
        </div>

        <ActionsMenu>
          {canAddUnit && (
            <Menu.Item leftSection={<Plus size={14} />} onClick={handleOpenAdd}>
              {translate("Add alternate unit", "إضافة وحدة بديلة")}
            </Menu.Item>
          )}
        </ActionsMenu>
      </div>

      {units.length === 0 ? (
        <EmptySection message={translate("No alternate units defined yet.", "لا توجد وحدات قياس بديلة بعد.")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <Table className="text-nowrap" highlightOnHover verticalSpacing="sm">
            <Table.Thead className="bg-gray-50">
              <Table.Tr className="h-10">
                <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Unit", "الوحدة")}
                </Table.Th>
                <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Conversion to Base", "التحويل إلى الوحدة الأساسية")}
                </Table.Th>
                <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Quantity", "الكمية")}
                </Table.Th>
                <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate(`Unit Price (${translation.currency})`, `سعر الوحدة (${translation.currency})`)}
                </Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {units.map((row) => {
                const factor = Number(row.conversionFactorToBase);
                const altLabel = getMaterialUnitLabel(row.unit, locale);
                const baseLabel = getMaterialUnitLabel(material.unitOfMeasurement, locale);

                return (
                  <Table.Tr key={row.id} className="text-gray-600">
                    <Table.Td>
                      <Badge size="sm" variant="light" color="haze" radius="md">
                        {altLabel}
                      </Badge>
                    </Table.Td>
                    <Table.Td className="font-medium text-gray-800">
                      {formatConversionLabel(factor, altLabel, baseLabel)}
                    </Table.Td>
                    <Table.Td>{formatBaseQuantityForDisplay(material.quantity, factor)}</Table.Td>
                    <Table.Td>{formatMoney(toDisplayUnitPrice(material.unitPrice, factor))}</Table.Td>
                    <Table.Td w={0}>
                      <PermissionGuard permission={PERMISSIONS.UPDATE_MATERIAL_UNIT_CONVERSION}>
                        <Menu position="bottom-end" withinPortal>
                          <Menu.Target>
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              size="sm"
                              radius="md"
                              aria-label={translate("Unit actions", "إجراءات الوحدة")}
                            >
                              <EllipsisVertical size={14} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item leftSection={<Pencil size={14} />} onClick={() => handleOpenEdit(row)}>
                              {translate("Edit", "تعديل")}
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </PermissionGuard>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </div>
      )}
    </section>
  );
}
