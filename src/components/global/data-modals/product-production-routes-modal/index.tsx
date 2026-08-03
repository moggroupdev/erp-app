import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import productsApi from "@/lib/api/products";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import {
  isValidProductionSubDepartment,
  type ProductionSubDepartment,
} from "@/lib/constants/enums/production-sub-departments";
import type { ProductProductionRoute } from "@/types/product";
import { Button, Divider, NumberInput } from "@mantine/core";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import SelectProductionSubDepartment from "@/components/global/selections/enum-based/select-production-sub-department";

type RouteDraftRow = { key: string; productionSubDepartment: string | null; completionPercentage: number | "" };

function createRowKey() {
  return `route-row-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createEmptyRow(): RouteDraftRow {
  return { key: createRowKey(), productionSubDepartment: null, completionPercentage: "" };
}

function toDraftRows(routes: ProductProductionRoute[]): RouteDraftRow[] {
  if (routes.length === 0) return [createEmptyRow()];

  return [...routes]
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
    .map((route) => ({
      key: createRowKey(),
      productionSubDepartment: route.productionSubDepartment,
      completionPercentage: Number(route.completionPercentage),
    }));
}

function SortableStepCard({
  row,
  index,
  excludeValues,
  canRemove,
  onUpdate,
  onRemove,
}: {
  row: RouteDraftRow;
  index: number;
  excludeValues: string[];
  canRemove: boolean;
  onUpdate: (key: string, patch: Partial<RouteDraftRow>) => void;
  onRemove: (key: string) => void;
}) {
  const { translate } = useI18n();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.key });

  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : undefined };

  return (
    <div ref={setNodeRef} style={style} className="relative flex items-center gap-3">
      <div className="relative flex flex-col items-center">
        <div
          className={`flex-center z-10 h-12 w-12 shrink-0 rounded-full text-sm font-bold shadow-sm ring-4 ring-white ${
            isDragging
              ? "bg-blue-600 text-white"
              : row.productionSubDepartment
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-500 ring-gray-50"
          }`}
        >
          {index + 1}
        </div>
      </div>

      <div
        className={`flex flex-1 items-center gap-2 rounded-xl bg-gray-50 p-3.5 transition-colors ${isDragging ? "" : ""}`}
      >
        <button
          type="button"
          className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </button>

        <SelectProductionSubDepartment
          value={row.productionSubDepartment}
          setValue={(value) =>
            onUpdate(row.key, {
              productionSubDepartment: typeof value === "function" ? value(row.productionSubDepartment) : value,
            })
          }
          placeholder={translate("Select department", "اختر القسم")}
          excludeValues={excludeValues}
          required
          searchable
          flex={1}
        />

        <NumberInput
          value={row.completionPercentage}
          onChange={(value) =>
            onUpdate(row.key, {
              completionPercentage: value === "" || value === undefined ? "" : Number(value),
            })
          }
          placeholder={translate("Share %", "الحصة %")}
          min={0.01}
          max={100}
          decimalScale={2}
          allowNegative={false}
          required
          radius="md"
        />

        <button
          type="button"
          onClick={() => onRemove(row.key)}
          disabled={!canRemove}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

export default function ProductProductionRoutesModal({
  opened,
  close,
  productCode,
  existingRoutes,
}: {
  opened: boolean;
  close: () => void;
  productCode: string;
  existingRoutes: ProductProductionRoute[];
}) {
  const { locale, translate, translation } = useI18n();

  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [validationError, setValidationError] = useState("");
  const [rows, setRows] = useState<RouteDraftRow[]>([createEmptyRow()]);

  const isEdit = existingRoutes.length > 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (opened) setRows(toDraftRows(existingRoutes));
    // Seed only when the modal opens; ignore later existingRoutes refetches while editing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const totalPercentage = useMemo(
    () =>
      rows.reduce((sum, row) => {
        const value = typeof row.completionPercentage === "number" ? row.completionPercentage : 0;
        return sum + value;
      }, 0),
    [rows],
  );

  const roundedTotal = Number(totalPercentage.toFixed(2));
  const isComplete = roundedTotal === 100;
  const progressWidth = Math.min(roundedTotal, 100);
  const rowIds = useMemo(() => rows.map((row) => row.key), [rows]);

  const usedSubDepartments = useMemo(
    () => rows.map((row) => row.productionSubDepartment).filter((value): value is string => !!value),
    [rows],
  );

  const mutation = useMutation({
    mutationFn: async () => {
      return await productsApi.setProductionRoutes({
        privateRequest,
        code: productCode,
        dto: {
          routes: rows.map((row, index) => ({
            productionSubDepartment: row.productionSubDepartment as ProductionSubDepartment,
            sequenceOrder: index + 1,
            completionPercentage: Number(row.completionPercentage),
          })),
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.productionRoutes(productCode) });
      handleClose();
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function updateRow(key: string, patch: Partial<RouteDraftRow>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    setValidationError("");
  }

  function addRow() {
    setRows((prev) => [...prev, createEmptyRow()]);
    setValidationError("");
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.key !== key)));
    setValidationError("");
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setRows((prev) => {
      const oldIndex = prev.findIndex((row) => row.key === active.id);
      const newIndex = prev.findIndex((row) => row.key === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
    setValidationError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    for (const row of rows) {
      if (!row.productionSubDepartment || !isValidProductionSubDepartment(row.productionSubDepartment)) {
        return setValidationError(
          translate("Please select a production sub-department for every step.", "يرجى اختيار قسم فرعي للإنتاج لكل خطوة."),
        );
      }

      const percentage = Number(row.completionPercentage);
      if (Number.isNaN(percentage) || percentage <= 0 || percentage > 100) {
        return setValidationError(
          translate(
            "Each completion percentage must be greater than 0 and at most 100.",
            "يجب أن تكون كل نسبة إنجاز أكبر من 0 ولا تتجاوز 100.",
          ),
        );
      }
    }

    const seen = new Set<string>();
    for (const row of rows) {
      const subDepartment = row.productionSubDepartment!;
      if (seen.has(subDepartment)) {
        return setValidationError(
          translate(
            "Each production sub-department can only appear once.",
            "لا يمكن تكرار القسم الفرعي للإنتاج أكثر من مرة.",
          ),
        );
      }
      seen.add(subDepartment);
    }

    if (roundedTotal !== 100) {
      return setValidationError(
        translate(
          `Completion percentages must sum to 100% (current total: ${roundedTotal}%).`,
          `يجب أن مجموع نسب الإنجاز يساوي 100% (المجموع الحالي: ${roundedTotal}%).`,
        ),
      );
    }

    mutation.mutate();
  }

  function handleClose() {
    close();
    setTimeout(() => {
      setRows([createEmptyRow()]);
      setValidationError("");
      mutation.reset();
    }, 250);
  }

  const title = isEdit
    ? translate("Edit Production Routes", "تعديل مسارات الإنتاج")
    : translate("Set Production Routes", "تعيين مسارات الإنتاج");

  const isReadyToSubmit = rows.every((row) => row.productionSubDepartment && row.completionPercentage !== "");

  return (
    <Modal opened={opened} onClose={handleClose} title={title} size="xl">
      <p className="text-sm text-gray-600">
        {translate("Production path from first step to finished product", "مسار الإنتاج من أول خطوة حتى المنتج النهائي")}
      </p>

      <Divider variant="dashed" className="my-4" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
            <div className="relative flex flex-col gap-2">
              {rows.map((row, index) => (
                <SortableStepCard
                  key={row.key}
                  row={row}
                  index={index}
                  excludeValues={usedSubDepartments.filter((value) => value !== row.productionSubDepartment)}
                  canRemove={rows.length > 1}
                  onUpdate={updateRow}
                  onRemove={removeRow}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <button
          type="button"
          onClick={addRow}
          className="group flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50/70 px-4 py-3 text-sm! font-medium text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-gray-500 transition-colors group-hover:text-blue-600">
            <Plus size={12} />
          </span>
          {translate("Add next step", "إضافة الخطوة التالية")}
        </button>

        {/* Progress Bar */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-linear-to-br from-gray-50 via-white to-blue-50/40 p-4">
          <div className="mb-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-gray-600">
                {translate("Path completion: Percentages must reach 100%.", "اكتمال المسار: يجب أن تصل النسب إلى 100%.")}
              </p>
            </div>
            <div
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isComplete ? "bg-blue-500 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"
              }`}
            >
              {roundedTotal} %
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-gray-200/80">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isComplete ? "bg-blue-500" : roundedTotal > 100 ? "bg-red-500" : "bg-yellow-500"
              }`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleClose} variant="light" color="dark" radius="md" fullWidth>
            {translation.cancel}
          </Button>
          <Button
            type="submit"
            loading={mutation.isPending}
            disabled={!isReadyToSubmit || !isComplete}
            radius="md"
            fullWidth
          >
            {title}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
