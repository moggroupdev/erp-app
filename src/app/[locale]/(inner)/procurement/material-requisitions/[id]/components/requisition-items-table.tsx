"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ActionIcon, Badge, Menu, Table } from "@mantine/core";
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import materialPurchaseRequisitionsApi from "@/lib/api/material-purchase-requisitions";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import type { MaterialPurchaseRequisitionItemDetailed } from "@/types/material-purchase-requisition";
import PermissionGuard from "@/components/guards/permission";
import { EmptyValue } from "@/components/ui/entity-details";
import CopyButton from "@/components/ui/copy-button";
import DeleteModal from "@/components/ui/delete-modal";

export default function RequisitionItemsTable({
  requisitionId,
  items,
  editable,
  getMainCategoryTitle,
  onEdit,
}: {
  requisitionId: string;
  items: MaterialPurchaseRequisitionItemDetailed[];
  editable: boolean;
  getMainCategoryTitle: (subCategoryId: string | undefined) => string | null;
  onEdit: (item: MaterialPurchaseRequisitionItemDetailed) => void;
}) {
  const { locale, translate } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [itemToDelete, setItemToDelete] = useState<MaterialPurchaseRequisitionItemDetailed | null>(null);

  const canDelete = editable && items.length > 1;

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) =>
      materialPurchaseRequisitionsApi.deleteItem({ privateRequest, id: requisitionId, itemId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.materialPurchaseRequisitions.detail(requisitionId) });
      toast.success(translate("Requisition item deleted successfully.", "تم حذف بند طلب الشراء بنجاح."));
      setItemToDelete(null);
    },
  });

  const deleteError = deleteMutation.error ? getErrorMessage(locale, deleteMutation.error) : "";

  return (
    <>
      <div className="overflow-x-auto">
        <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{translate("Material", "المادة")}</Table.Th>
              <Table.Th>{translate("Code", "الكود")}</Table.Th>
              <Table.Th>{translate("Category", "الفئة")}</Table.Th>
              <Table.Th>{translate("Unit", "الوحدة")}</Table.Th>
              <Table.Th>{translate("Quantity Requested", "الكمية المطلوبة")}</Table.Th>
              <Table.Th>{translate("Quantity Allocated", "الكمية المخصصة")}</Table.Th>
              <Table.Th>{translate("Quantity Remaining", "الكمية المتبقية")}</Table.Th>
              <Table.Th>{translate("Notes", "الملاحظات")}</Table.Th>
              {editable && <Table.Th className="w-10" />}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((item) => (
              <Table.Tr key={item.id} className="text-gray-600">
                <Table.Td className="font-semibold text-gray-800">
                  <Link
                    href={getLocalizedHref(`/warehouse/materials/${item.material.code}`)}
                    className="hover:underline"
                  >
                    {item.material.title}
                  </Link>
                </Table.Td>
                <Table.Td>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono">{item.materialCode}</span>
                    <CopyButton text={item.materialCode} />
                  </div>
                </Table.Td>
                <Table.Td>{getMainCategoryTitle(item.material.subCategoryId) || <EmptyValue />}</Table.Td>
                <Table.Td>
                  <div className="flex items-center gap-1.5">
                    {getMaterialUnitLabel(item.unitOfMeasurementSelected, locale)}
                    {item.unitOfMeasurementSelected !== item.material.unitOfMeasurement && (
                      <Badge size="xs" variant="light" color="gray" radius="md">
                        {translate("Selected", "مختارة")}
                      </Badge>
                    )}
                  </div>
                </Table.Td>
                <Table.Td>{formatQuantity(item.quantityRequested)}</Table.Td>
                <Table.Td>{formatQuantity(item.quantityAllocated)}</Table.Td>
                <Table.Td>{formatQuantity(item.quantityRemaining)}</Table.Td>
                <Table.Td className="max-w-xs truncate">{item.notes || <EmptyValue />}</Table.Td>
                {editable && (
                  <Table.Td>
                    <PermissionGuard permission={PERMISSIONS.UPDATE_MATERIAL_PURCHASE_REQUISITION}>
                      <Menu position="bottom-end" withinPortal>
                        <Menu.Target>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            radius="md"
                            aria-label={translate("Item actions", "إجراءات البند")}
                          >
                            <EllipsisVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item leftSection={<Pencil size={14} />} onClick={() => onEdit(item)}>
                            {translate("Edit", "تعديل")}
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<Trash2 size={14} />}
                            color="red"
                            disabled={!canDelete}
                            title={
                              canDelete
                                ? undefined
                                : translate(
                                    "A requisition must keep at least one item.",
                                    "يجب أن يحتفظ طلب الشراء ببند واحد على الأقل.",
                                  )
                            }
                            onClick={() => {
                              deleteMutation.reset();
                              setItemToDelete(item);
                            }}
                          >
                            {translate("Delete", "حذف")}
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </PermissionGuard>
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>

      <DeleteModal
        opened={!!itemToDelete}
        onClose={() => {
          setItemToDelete(null);
          deleteMutation.reset();
        }}
        title={translate("Delete item?", "حذف البند؟")}
        subTitle={
          itemToDelete
            ? translate(
                `You're about to delete "${itemToDelete.material.title}" from this requisition.`,
                `أنت على وشك حذف "${itemToDelete.material.title}" من طلب الشراء.`,
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
    </>
  );
}
