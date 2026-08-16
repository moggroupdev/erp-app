"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { Badge, Button, Table } from "@mantine/core";
import { GripVertical, Pencil } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import { useUser } from "@/contexts/user/hook";
import legacyIssuePermitsApi from "@/lib/api/legacy-issue-permits";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import type { LegacyIssuePermitItemDetailed } from "@/types/legacy-issue-permit";
import PermissionGuard from "@/components/guards/permission";
import ErrorAlert from "@/components/ui/error-alert";
import { EmptyValue } from "@/components/ui/entity-details";
import CopyButton from "@/components/ui/copy-button";

function restrictToVerticalAxis({ transform }: Parameters<Modifier>[0]) {
  return { ...transform, x: 0 };
}

function canUpdatePermit(user: ReturnType<typeof useUser>["user"]) {
  if (!user) return false;
  if (user.isAdmin) return true;
  return user.role?.permissions.includes(PERMISSIONS.UPDATE_LEGACY_ISSUE_PERMIT) ?? false;
}

function SortableItemRow({
  item,
  index,
  canReorder,
  getMainCategoryTitle,
  onEdit,
}: {
  item: LegacyIssuePermitItemDetailed;
  index: number;
  canReorder: boolean;
  getMainCategoryTitle: (subCategoryId: string | undefined) => string | null;
  onEdit: (item: LegacyIssuePermitItemDetailed) => void;
}) {
  const { locale, translate } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !canReorder,
  });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : undefined };

  return (
    <Table.Tr ref={setNodeRef} style={style} className="text-gray-600">
      <Table.Td className="w-10">
        <button
          type="button"
          disabled={!canReorder}
          className={`group relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors ${
            canReorder ? "cursor-grab hover:bg-gray-100 hover:text-gray-700 active:cursor-grabbing" : "cursor-default"
          }`}
          title={canReorder ? translate("Reorder row", "إعادة ترتيب الصف") : undefined}
          {...(canReorder ? attributes : {})}
          {...(canReorder ? listeners : {})}
        >
          <span
            className={`text-xs font-medium text-gray-500 ${
              canReorder ? (isDragging ? "opacity-0" : "group-hover:opacity-0") : ""
            }`}
          >
            {index + 1}
          </span>
          {canReorder && (
            <GripVertical
              size={16}
              className={`absolute ${isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
            />
          )}
        </button>
      </Table.Td>
      <Table.Td className="font-semibold text-gray-800">
        {item.material ? (
          <Link href={getLocalizedHref(`/warehouse/materials/${item.material.code}`)} className="hover:underline">
            {item.material.title}
          </Link>
        ) : (
          <EmptyValue />
        )}
      </Table.Td>
      <Table.Td>
        {item.materialCode ? (
          <div className="flex items-center gap-1.5">
            <span className="font-mono">{item.materialCode}</span>
            <CopyButton text={item.materialCode} />
          </div>
        ) : (
          <EmptyValue />
        )}
      </Table.Td>
      <Table.Td>{getMainCategoryTitle(item.material?.subCategoryId) || <EmptyValue />}</Table.Td>
      <Table.Td>
        {item.unitOfMeasurementSelected ? (
          <div className="flex items-center gap-1.5">
            {getMaterialUnitLabel(item.unitOfMeasurementSelected, locale)}
            {item.material && item.unitOfMeasurementSelected !== item.material.unitOfMeasurement && (
              <Badge size="xs" variant="light" color="gray" radius="md">
                {translate("Selected", "مختارة")}
              </Badge>
            )}
          </div>
        ) : (
          <EmptyValue />
        )}
      </Table.Td>
      <Table.Td>{item.quantity == null ? <EmptyValue /> : formatQuantity(item.quantity)}</Table.Td>
      <Table.Td className="max-w-xs truncate">{item.notes || <EmptyValue />}</Table.Td>
      <Table.Td>
        <PermissionGuard permission={PERMISSIONS.UPDATE_LEGACY_ISSUE_PERMIT}>
          <Button
            variant="subtle"
            color="gray"
            size="xs"
            radius="md"
            p={6}
            onClick={() => onEdit(item)}
            title={translate("Edit item", "تعديل البند")}
          >
            <Pencil size={14} />
          </Button>
        </PermissionGuard>
      </Table.Td>
    </Table.Tr>
  );
}

export default function LegacyIssueItemsTable({
  transactionId,
  items,
  getMainCategoryTitle,
  onEdit,
}: {
  transactionId: string;
  items: LegacyIssuePermitItemDetailed[];
  getMainCategoryTitle: (subCategoryId: string | undefined) => string | null;
  onEdit: (item: LegacyIssuePermitItemDetailed) => void;
}) {
  const { locale, translate } = useI18n();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [orderedItems, setOrderedItems] = useState(items);

  const canUpdate = canUpdatePermit(user);
  const canReorder = canUpdate && orderedItems.length > 1;
  const isDirty = orderedItems.length === items.length && orderedItems.some((item, index) => item.id !== items[index]?.id);

  const rowIds = useMemo(() => orderedItems.map((item) => item.id), [orderedItems]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id);
      const newIndex = prev.findIndex((item) => item.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  const reorderMutation = useMutation({
    mutationFn: () =>
      legacyIssuePermitsApi.reorderItems({
        privateRequest,
        id: transactionId,
        dto: { itemIds: orderedItems.map((item) => item.id) },
      }),
    onSuccess: () => {
      toast.success(translate("Item order updated successfully.", "تم تحديث ترتيب البنود بنجاح."));
      queryClient.invalidateQueries({ queryKey: queryKeys.legacyIssuePermits.detail(transactionId) });
    },
  });

  const errorMessage = reorderMutation.error ? getErrorMessage(locale, reorderMutation.error) : "";

  return (
    <div className="flex flex-col gap-3">
      {errorMessage && <ErrorAlert error={errorMessage} />}

      {canUpdate && isDirty && (
        <div className="flex justify-end">
          <Button radius="md" loading={reorderMutation.isPending} onClick={() => reorderMutation.mutate()}>
            {translate("Save order", "حفظ الترتيب")}
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
            <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th className="w-10" />
                  <Table.Th>{translate("Material", "المادة")}</Table.Th>
                  <Table.Th>{translate("Code", "الكود")}</Table.Th>
                  <Table.Th>{translate("Category", "الفئة")}</Table.Th>
                  <Table.Th>{translate("Unit", "الوحدة")}</Table.Th>
                  <Table.Th>{translate("Quantity", "الكمية")}</Table.Th>
                  <Table.Th>{translate("Notes", "الملاحظات")}</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {orderedItems.map((item, index) => (
                  <SortableItemRow
                    key={item.id}
                    item={item}
                    index={index}
                    canReorder={canReorder}
                    getMainCategoryTitle={getMainCategoryTitle}
                    onEdit={onEdit}
                  />
                ))}
              </Table.Tbody>
            </Table>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
