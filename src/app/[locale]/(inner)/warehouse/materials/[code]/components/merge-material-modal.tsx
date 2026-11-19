"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Alert, Button, Checkbox, Loader, TextInput } from "@mantine/core";
import { CircleAlert, Info, Merge } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { getMaterialTypeLabel } from "@/lib/constants/enums/material-types";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import type { MaterialMergeFigures, MaterialWithCreatorAndUnitConversions } from "@/types/material";
import Modal from "@/components/ui/modal";
import ErrorAlert from "@/components/ui/error-alert";
import SelectMaterial from "@/components/global/selections/remote-based/select-material";
import { getMaterialReferenceGroupLabel } from "./material-reference-group-label";

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-2 text-sm last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-end font-medium text-gray-900">{value}</span>
    </div>
  );
}

function formatFigure(value: number | null | undefined) {
  if (value == null) return "-";
  return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function FigureChangeRow({
  label,
  before,
  after,
}: {
  label: string;
  before: number | null | undefined;
  after: number | null | undefined;
}) {
  const changed = formatFigure(before) !== formatFigure(after);
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-2 text-sm last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className={`text-end font-medium ${changed ? "text-gray-900" : "text-gray-600"}`}>
        {formatFigure(before)}
        {changed ? ` → ${formatFigure(after)}` : ""}
      </span>
    </div>
  );
}

export default function MergeMaterialModal({
  opened,
  close,
  material,
}: {
  opened: boolean;
  close: () => void;
  material: MaterialWithCreatorAndUnitConversions;
}) {
  const { locale, translate, translation } = useI18n();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();

  const [removeCode, setRemoveCode] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [typedCode, setTypedCode] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!opened) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemoveCode(null);
    setAcknowledged(false);
    setTypedCode("");
    setValidationError("");
  }, [opened]);

  useEffect(() => {
    setAcknowledged(false);
    setTypedCode("");
    setValidationError("");
  }, [removeCode]);

  const previewQuery = useQuery({
    queryKey: queryKeys.materials.mergePreview(material.code, removeCode),
    queryFn: ({ signal }) =>
      materialsApi.previewMerge({
        privateRequest,
        code: material.code,
        removeCode: removeCode as string,
        signal,
      }),
    enabled: opened && !!removeCode,
  });

  const preview = removeCode ? previewQuery.data : undefined;
  const previewLoading = !!removeCode && previewQuery.isFetching;
  const previewError = removeCode && previewQuery.error ? getErrorMessage(locale, previewQuery.error) : "";

  const mutation = useMutation({
    mutationFn: async () => {
      if (!removeCode) throw new Error("No material selected");
      return await materialsApi.merge({
        privateRequest,
        code: material.code,
        dto: {
          removeCode,
          confirmationCode: typedCode.trim(),
        },
      });
    },
    onSuccess: async () => {
      // Clear selection and close first so the preview query is disabled before
      // invalidate refetches (the removed material no longer exists).
      setRemoveCode(null);
      setAcknowledged(false);
      setTypedCode("");
      setValidationError("");
      close();
      toast.success(translate("Materials merged successfully", "تم دمج المواد بنجاح"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.materials.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.boms.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.mmBoms.all }),
      ]);
      mutation.reset();
    },
  });

  const mutationError = mutation.error ? getErrorMessage(locale, mutation.error) : "";
  const error = validationError || mutationError || previewError;

  const codeMatches = !!removeCode && typedCode.trim() === removeCode.trim();
  const canSubmit =
    !!removeCode &&
    !!preview &&
    preview.canMerge &&
    !previewLoading &&
    acknowledged &&
    codeMatches &&
    !mutation.isPending;

  function handleClose() {
    if (mutation.isPending) return;
    close();
    setTimeout(() => {
      setRemoveCode(null);
      setAcknowledged(false);
      setTypedCode("");
      setValidationError("");
      mutation.reset();
    }, 250);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (!removeCode) {
      return setValidationError(translate("Please select the duplicate material.", "يرجى اختيار المادة المكررة."));
    }
    if (!preview?.canMerge) {
      return setValidationError(translate("This merge cannot proceed.", "لا يمكن متابعة هذا الدمج."));
    }
    if (!acknowledged) {
      return setValidationError(
        translate("Please confirm that you understand the merge impact.", "يرجى تأكيد فهمك لتأثير الدمج."),
      );
    }
    if (!codeMatches) {
      return setValidationError(
        translate("Please type the duplicate material code exactly.", "يرجى كتابة كود المادة المكررة بدقة."),
      );
    }

    mutation.mutate();
  }

  const figuresBefore = preview?.figuresBefore;
  const figuresAfter = preview?.figuresAfter;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={translate("Merge duplicate into this item", "دمج صنف مكرر في هذا الصنف")}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="rounded-xl border border-gray-100 px-4 py-1">
          <SummaryRow label={translate("Keep", "الإبقاء")} value={<span className="font-mono">{material.code}</span>} />
          <SummaryRow label={translate("Title", "العنوان")} value={material.title} />
          <SummaryRow label={translate("Type", "النوع")} value={getMaterialTypeLabel(material.materialType, locale)} />
          <SummaryRow
            label={translate("Base unit", "وحدة القياس الأساسية")}
            value={getMaterialUnitLabel(material.unitOfMeasurement, locale)}
          />
        </div>

        <SelectMaterial
          value={removeCode}
          setValue={setRemoveCode}
          excludeCodes={[material.code]}
          withBrowseModal
          label={translate("Duplicate to remove", "المكرر المراد إزالته")}
          placeholder={translate("Search material to merge away", "ابحث عن المادة لإزالتها")}
          required
        />

        {removeCode && previewLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader size="sm" />
            {translate("Checking merge impact...", "جاري التحقق من تأثير الدمج...")}
          </div>
        )}

        {preview?.removed?.code && (
          <div className="rounded-xl border border-gray-100 px-4 py-1">
            <SummaryRow
              label={translate("Remove", "الإزالة")}
              value={<span className="font-mono">{preview.removed.code}</span>}
            />
            {preview.removed.title ? (
              <SummaryRow label={translate("Title", "العنوان")} value={preview.removed.title} />
            ) : null}
            {preview.removed.materialType ? (
              <SummaryRow
                label={translate("Type", "النوع")}
                value={getMaterialTypeLabel(preview.removed.materialType, locale)}
              />
            ) : null}
            {preview.removed.unitOfMeasurement ? (
              <SummaryRow
                label={translate("Base unit", "وحدة القياس الأساسية")}
                value={getMaterialUnitLabel(preview.removed.unitOfMeasurement, locale)}
              />
            ) : null}
          </div>
        )}

        {preview && preview.blockers.length > 0 && (
          <Alert color="clay" icon={<CircleAlert size={16} />} radius="md">
            <ul className="list-disc space-y-1 ps-4 text-sm">
              {preview.blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </Alert>
        )}

        {preview && preview.canMerge && (
          <>
            {preview.legacyCodeWarning && (
              <Alert color="ochre" icon={<Info size={16} />} radius="md">
                {preview.legacyCodeWarning}
              </Alert>
            )}

            <div className="rounded-xl border border-gray-100 px-4 py-1">
              <p className="pt-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
                {translate("Kept figures after merge", "أرقام الصنف المُبقى بعد الدمج")}
              </p>
              <FigureRows
                before={figuresBefore}
                after={figuresAfter}
                translate={translate}
              />
            </div>

            {preview.referenceCounts.length > 0 && (
              <div className="rounded-xl border border-gray-100 px-4 py-3">
                <p className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Usage moved to this item", "الاستخدامات التي ستُنقل إلى هذا الصنف")}
                </p>
                <ul className="space-y-1 text-sm">
                  {preview.referenceCounts.map((row) => (
                    <li key={row.key} className="flex items-center justify-between gap-3">
                      <span>{getMaterialReferenceGroupLabel(row.key, translate)}</span>
                      <span className="font-medium tabular-nums">{row.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {preview.conversionPlan &&
              (preview.conversionPlan.actions.length > 0 || preview.conversionPlan.addRemovedBase) && (
                <div className="rounded-xl border border-gray-100 px-4 py-3">
                  <p className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Unit conversions", "تحويلات الوحدات")}
                  </p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {preview.conversionPlan.actions.map((action) =>
                      action.kind === "drop" ? (
                        <li key={action.id}>
                          {translate(`Drop unit ${action.unit}`, `إسقاط الوحدة ${action.unit}`)}
                        </li>
                      ) : (
                        <li key={action.id}>
                          {translate(
                            `Move unit ${action.unit}: ${action.oldFactor} → ${action.newFactor}`,
                            `نقل الوحدة ${action.unit}: ${action.oldFactor} → ${action.newFactor}`,
                          )}
                        </li>
                      ),
                    )}
                    {preview.conversionPlan.addRemovedBase && preview.removed.unitOfMeasurement && (
                      <li>
                        {translate(
                          `Add base unit ${preview.removed.unitOfMeasurement} (factor ${preview.factor})`,
                          `إضافة الوحدة الأساسية ${preview.removed.unitOfMeasurement} (عامل ${preview.factor})`,
                        )}
                      </li>
                    )}
                  </ul>
                </div>
              )}

            <Checkbox
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.currentTarget.checked)}
              color="clay"
              label={translate(
                "I understand the duplicate will be permanently removed and all its usage moved to this item",
                "أفهم أنه سيتم حذف المكرر نهائياً ونقل كل استخداماته إلى هذا الصنف",
              )}
              radius="md"
            />

            <TextInput
              label={translate("Type the duplicate code to confirm", "اكتب كود المكرر للتأكيد")}
              placeholder={removeCode ?? undefined}
              value={typedCode}
              onChange={(e) => setTypedCode(e.currentTarget.value)}
              radius="md"
              required
            />
          </>
        )}

        <div className="flex gap-2">
          <Button onClick={handleClose} variant="light" color="dark" radius="md" fullWidth disabled={mutation.isPending}>
            {translation.cancel}
          </Button>
          <Button
            type="submit"
            color="clay"
            radius="md"
            loading={mutation.isPending}
            disabled={!canSubmit}
            fullWidth
            leftSection={<Merge size={14} />}
          >
            {translate("Merge materials", "دمج المواد")}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}

function FigureRows({
  before,
  after,
  translate,
}: {
  before: MaterialMergeFigures | null | undefined;
  after: MaterialMergeFigures | null | undefined;
  translate: (en: string, ar: string) => string;
}) {
  return (
    <>
      <FigureChangeRow label={translate("Quantity", "الكمية")} before={before?.quantity} after={after?.quantity} />
      <FigureChangeRow label={translate("Unit price", "سعر الوحدة")} before={before?.unitPrice} after={after?.unitPrice} />
      <FigureChangeRow
        label={translate("Opening quantity", "الكمية الافتتاحية")}
        before={before?.openingQuantity}
        after={after?.openingQuantity}
      />
      <FigureChangeRow
        label={translate("Opening unit price", "سعر الوحدة الافتتاحي")}
        before={before?.openingUnitPrice}
        after={after?.openingUnitPrice}
      />
      <FigureChangeRow
        label={translate("Minimum stock", "حد المخزون الأدنى")}
        before={before?.minimumStock}
        after={after?.minimumStock}
      />
      <FigureChangeRow
        label={translate("Market unit price", "سعر السوق")}
        before={before?.marketUnitPrice}
        after={after?.marketUnitPrice}
      />
      <FigureChangeRow
        label={translate("Market manufacturing cost", "تكلفة التصنيع السوقية")}
        before={before?.marketManufacturingCost}
        after={after?.marketManufacturingCost}
      />
    </>
  );
}
