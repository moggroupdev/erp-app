"use client";

import ProtectedLink from "@/components/ui/protected-link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
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
import { ActionIcon, Badge, Button, Menu, Table } from "@mantine/core";
import { EllipsisVertical, GripVertical, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
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
import DeleteModal from "@/components/ui/delete-modal";

function restrictToVerticalAxis({ transform }: Parameters<Modifier>[0]) {
  return { ...transform, x: 0 };
}

function canUpdatePermit(user: ReturnType<typeof useUser>["user"]) {
  if (!user) return false;
  if (user.isAdmin) return true;
  return user.role?.permissions.includes(PERMISSIONS.UPDATE_LEGACY_ISSUE_PERMIT) ?? false;
}

function ItemRowCells({
  item,
  index,
  canReorder,
  isDragging,
  getMainCategoryTitle,
  onEdit,
  onDelete,
  dragHandleProps,
}: {
  item: LegacyIssuePermitItemDetailed;
  index: number;
  canReorder: boolean;
  isDragging?: boolean;
  getMainCategoryTitle: (subCategoryId: string | undefined) => string | null;
  onEdit?: (item: LegacyIssuePermitItemDetailed) => void;
  onDelete?: (item: LegacyIssuePermitItemDetailed) => void;
  dragHandleProps?: Record<string, unknown>;
}) {
  const { locale, translate } = useI18n();

  return (
    <>
      <Table.Td className="w-10">
        <button
          type="button"
          disabled={!canReorder}
          className={`group relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors ${
            canReorder ? "cursor-grab hover:bg-gray-100 hover:text-gray-700 active:cursor-grabbing" : "cursor-default"
          }`}
          title={canReorder ? translate("Reorder row", "إعادة ترتيب الصف") : undefined}
          {...(dragHandleProps ?? {})}
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
          <ProtectedLink permission={PERMISSIONS.READ_MATERIALS} href={`/warehouse/materials/${item.material.code}`} className="hover:underline">
            {item.material.title}
          </ProtectedLink>
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
      <Table.Td className="w-10">
        {onEdit && onDelete && (
          <PermissionGuard permission={PERMISSIONS.UPDATE_LEGACY_ISSUE_PERMIT}>
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
                <Menu.Item leftSection={<Trash2 size={14} />} color="clay" onClick={() => onDelete(item)}>
                  {translate("Delete", "حذف")}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </PermissionGuard>
        )}
      </Table.Td>
    </>
  );
}

function SortableItemRow({
  item,
  index,
  canReorder,
  getMainCategoryTitle,
  onEdit,
  onDelete,
}: {
  item: LegacyIssuePermitItemDetailed;
  index: number;
  canReorder: boolean;
  getMainCategoryTitle: (subCategoryId: string | undefined) => string | null;
  onEdit: (item: LegacyIssuePermitItemDetailed) => void;
  onDelete: (item: LegacyIssuePermitItemDetailed) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !canReorder,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : undefined,
  };

  return (
    <Table.Tr ref={setNodeRef} style={style} className={`text-gray-600 ${isDragging ? "bg-gray-100" : ""}`}>
      <ItemRowCells
        item={item}
        index={index}
        canReorder={canReorder}
        isDragging={isDragging}
        getMainCategoryTitle={getMainCategoryTitle}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandleProps={canReorder ? { ...attributes, ...listeners } : undefined}
      />
    </Table.Tr>
  );
}

function DragOverlayRow({
  item,
  index,
  getMainCategoryTitle,
  tableWidth,
  columnWidths,
}: {
  item: LegacyIssuePermitItemDetailed;
  index: number;
  getMainCategoryTitle: (subCategoryId: string | undefined) => string | null;
  tableWidth: number;
  columnWidths: number[];
}) {
  return (
    <Table className="bg-white text-nowrap" verticalSpacing="xs" style={{ width: tableWidth, tableLayout: "fixed" }}>
      {columnWidths.length > 0 && (
        <colgroup>
          {columnWidths.map((width, i) => (
            <col key={i} style={{ width }} />
          ))}
        </colgroup>
      )}
      <Table.Tbody>
        <Table.Tr className="bg-haze-50 text-gray-600 [&_td]:border-x-0 [&_td]:border-y-3 [&_td]:border-haze-600">
          <ItemRowCells item={item} index={index} canReorder isDragging getMainCategoryTitle={getMainCategoryTitle} />
        </Table.Tr>
      </Table.Tbody>
    </Table>
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overlayMetrics, setOverlayMetrics] = useState<{ tableWidth: number; columnWidths: number[] } | null>(null);
  const [itemToDelete, setItemToDelete] = useState<LegacyIssuePermitItemDetailed | null>(null);

  const canUpdate = canUpdatePermit(user);
  const canReorder = canUpdate && orderedItems.length > 1;
  const isDirty = orderedItems.length === items.length && orderedItems.some((item, index) => item.id !== items[index]?.id);

  const rowIds = useMemo(() => orderedItems.map((item) => item.id), [orderedItems]);
  const activeItem = useMemo(
    () => (activeId ? orderedItems.find((item) => item.id === activeId) : undefined),
    [activeId, orderedItems],
  );
  const activeIndex = useMemo(
    () => (activeId ? orderedItems.findIndex((item) => item.id === activeId) : -1),
    [activeId, orderedItems],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  function clearDragState() {
    setActiveId(null);
    setOverlayMetrics(null);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));

    const rowEl = (event.activatorEvent.target as HTMLElement | null)?.closest("tr");
    if (!rowEl) return;

    const cells = Array.from(rowEl.children) as HTMLElement[];
    setOverlayMetrics({
      tableWidth: rowEl.getBoundingClientRect().width,
      columnWidths: cells.map((cell) => cell.getBoundingClientRect().width),
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    clearDragState();
    if (!over || active.id === over.id) return;

    setOrderedItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id);
      const newIndex = prev.findIndex((item) => item.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function handleDragCancel() {
    clearDragState();
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

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) =>
      legacyIssuePermitsApi.deleteItem({ privateRequest, id: transactionId, itemId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.legacyIssuePermits.detail(transactionId) });
      toast.success(translate("Permit item deleted successfully.", "تم حذف بند إذن الصرف بنجاح."));
      setItemToDelete(null);
    },
  });

  function handleDelete(item: LegacyIssuePermitItemDetailed) {
    deleteMutation.reset();
    setItemToDelete(item);
  }

  const errorMessage = reorderMutation.error ? getErrorMessage(locale, reorderMutation.error) : "";
  const deleteError = deleteMutation.error ? getErrorMessage(locale, deleteMutation.error) : "";
  const deleteSubTitle = itemToDelete
    ? itemToDelete.material
      ? translate(
          `You're about to delete "${itemToDelete.material.title}" from this permit.`,
          `أنت على وشك حذف "${itemToDelete.material.title}" من هذا الإذن.`,
        )
      : translate(
          "You're about to delete this item from the permit.",
          "أنت على وشك حذف هذا البند من الإذن.",
        )
    : "";

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
            <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th className="w-10 text-center!">#</Table.Th>
                  <Table.Th>{translate("Material", "المادة")}</Table.Th>
                  <Table.Th>{translate("Code", "الكود")}</Table.Th>
                  <Table.Th>{translate("Category", "الفئة")}</Table.Th>
                  <Table.Th>{translate("Unit", "الوحدة")}</Table.Th>
                  <Table.Th>{translate("Quantity", "الكمية")}</Table.Th>
                  <Table.Th>{translate("Notes", "الملاحظات")}</Table.Th>
                  <Table.Th className="w-10" />
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
                    onDelete={handleDelete}
                  />
                ))}
              </Table.Tbody>
            </Table>
          </SortableContext>

          <DragOverlay dropAnimation={null} modifiers={[restrictToVerticalAxis]}>
            {activeItem && activeIndex >= 0 && overlayMetrics ? (
              <DragOverlayRow
                item={activeItem}
                index={activeIndex}
                getMainCategoryTitle={getMainCategoryTitle}
                tableWidth={overlayMetrics.tableWidth}
                columnWidths={overlayMetrics.columnWidths}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {errorMessage && <ErrorAlert error={errorMessage} />}

      {canUpdate && isDirty && (
        <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
          <Button
            variant="light"
            color="dark"
            radius="md"
            disabled={reorderMutation.isPending}
            onClick={() => {
              setOrderedItems(items);
              reorderMutation.reset();
            }}
          >
            {translate("Discard", "تجاهل")}
          </Button>
          <Button radius="md" loading={reorderMutation.isPending} onClick={() => reorderMutation.mutate()}>
            {translate("Save order", "حفظ الترتيب")}
          </Button>
        </div>
      )}

      <DeleteModal
        opened={!!itemToDelete}
        onClose={() => {
          setItemToDelete(null);
          deleteMutation.reset();
        }}
        title={translate("Delete item?", "حذف البند؟")}
        subTitle={deleteSubTitle}
        warning={translate("This action cannot be undone.", "هذا الإجراء لا يمكن التراجع عنه.")}
        action={() => {
          if (itemToDelete) deleteMutation.mutate(itemToDelete.id);
        }}
        loading={deleteMutation.isPending}
        error={deleteError}
      />
    </div>
  );
}
