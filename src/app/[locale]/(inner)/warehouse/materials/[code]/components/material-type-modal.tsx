"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { isManufacturedMaterial, type MaterialType } from "@/lib/constants/enums/material-types";
import type { MmSourcingType } from "@/lib/constants/enums/mm-sourcing-types";
import type { MaterialWithCreatorAndUnitConversions } from "@/types/material";
import { Alert, Button, Checkbox, Loader } from "@mantine/core";
import { CircleAlert, Info } from "lucide-react";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import SelectMaterialType from "@/components/global/selections/enum-based/select-material-type";
import SelectMmSourcingType from "@/components/global/selections/enum-based/select-mm-sourcing-type";

export default function MaterialTypeModal({
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

  const [validationError, setValidationError] = useState("");
  const [targetType, setTargetType] = useState<string | null>(null);
  const [defaultMmSourcingType, setDefaultMmSourcingType] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!opened) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTargetType(null);
    setDefaultMmSourcingType(null);
    setConfirmed(false);
    setValidationError("");
  }, [opened]);

  const impactQuery = useQuery({
    queryKey: queryKeys.materials.typeChangeImpact(material.code, targetType),
    queryFn: ({ signal }) =>
      materialsApi.previewTypeChange({
        privateRequest,
        code: material.code,
        targetType: targetType as MaterialType,
        signal,
      }),
    enabled: opened && !!targetType && targetType !== material.materialType,
  });

  const impact = impactQuery.data;
  const enteringManufactured = !!targetType && isManufacturedMaterial(targetType as MaterialType);
  const leavingManufactured = isManufacturedMaterial(material.materialType) && !enteringManufactured;
  const needsConfirmation = !!(leavingManufactured && impact && !impact.blocked && impact.affectedBomLines.length > 0);

  useEffect(() => {
    setConfirmed(false);
    setDefaultMmSourcingType(null);
    setValidationError("");
  }, [targetType]);

  const mutation = useMutation({
    mutationFn: async () => {
      return await materialsApi.setType({
        privateRequest,
        code: material.code,
        dto: {
          materialType: targetType as MaterialType,
          ...(enteringManufactured ? { defaultMmSourcingType: defaultMmSourcingType as MmSourcingType } : {}),
          ...(needsConfirmation ? { confirmed: true } : {}),
        },
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.materials.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.boms.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.mmBoms.all }),
      ]);
      toast.success(translate("Material type updated successfully.", "تم تحديث نوع المادة بنجاح."));
      handleClose();
    },
  });

  const error =
    validationError ||
    (mutation.error ? getErrorMessage(locale, mutation.error) : "") ||
    (impactQuery.error ? getErrorMessage(locale, impactQuery.error) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (!targetType) {
      return setValidationError(translate("Please select a material type.", "يرجى اختيار نوع المادة."));
    }
    if (targetType === material.materialType) {
      return setValidationError(
        translate("Please select a different material type.", "يرجى اختيار نوع مادة مختلف."),
      );
    }
    if (impact?.blocked) {
      return setValidationError(impact.blockReason || translate("This change is not allowed.", "هذا التغيير غير مسموح."));
    }
    if (enteringManufactured && !defaultMmSourcingType) {
      return setValidationError(
        translate("Please select the default manufacturing source for BOMs.", "يرجى اختيار مصدر التصنيع الافتراضي لقوائم المواد."),
      );
    }
    if (needsConfirmation && !confirmed) {
      return setValidationError(
        translate("Please confirm that you understand the impact on product BOMs.", "يرجى تأكيد فهمك لتأثير التغيير على قوائم مواد المنتجات."),
      );
    }

    mutation.mutate();
  }

  function handleClose() {
    close();
    setTimeout(() => {
      setValidationError("");
      setTargetType(null);
      setDefaultMmSourcingType(null);
      setConfirmed(false);
      mutation.reset();
    }, 250);
  }

  const isReadyToSubmit =
    !!targetType &&
    targetType !== material.materialType &&
    !!impact &&
    !impact.blocked &&
    !impactQuery.isFetching &&
    (!enteringManufactured || !!defaultMmSourcingType) &&
    (!needsConfirmation || confirmed);

  const uniqueProducts = impact
    ? [...new Map(impact.affectedBomLines.map((line) => [line.productCode, line])).values()]
    : [];

  return (
    <Modal opened={opened} onClose={handleClose} title={translate("Change Material Type", "تغيير نوع المادة")} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <SelectMaterialType
          value={targetType}
          setValue={setTargetType}
          label={translate("New Material Type", "نوع المادة الجديد")}
          placeholder={translate("Select material type", "اختر نوع المادة")}
          required
        />

        {targetType && targetType !== material.materialType && impactQuery.isFetching && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader size="sm" />
            {translate("Checking impact...", "جاري التحقق من التأثير...")}
          </div>
        )}

        {impact?.blocked && impact.blockReason && (
          <Alert color="red" icon={<CircleAlert size={16} />} radius="md">
            {impact.blockReason}
          </Alert>
        )}

        {impact && !impact.blocked && enteringManufactured && (
          <>
            <SelectMmSourcingType
              value={defaultMmSourcingType}
              setValue={setDefaultMmSourcingType}
              label={translate("Default Manufacturing Source for BOMs", "مصدر التصنيع الافتراضي لقوائم المواد")}
              placeholder={translate("Select manufacturing source", "اختر مصدر التصنيع")}
              required
            />
            {impact.affectedBomLines.length > 0 && (
              <Alert color="blue" icon={<Info size={16} />} radius="md">
                {translate(
                  `Applies to ${impact.affectedBomLines.length} existing product BOM line(s).`,
                  `ينطبق على ${impact.affectedBomLines.length} بند(بنود) قائمة مواد منتجات موجودة.`,
                )}
              </Alert>
            )}
          </>
        )}

        {impact && !impact.blocked && needsConfirmation && (
          <div className="flex flex-col gap-2">
            <Alert color="yellow" icon={<Info size={16} />} radius="md">
              {translate(
                "This material is used in the following product BOMs. Manufacturing source will be cleared on those lines.",
                "هذه المادة مستخدمة في قوائم مواد المنتجات التالية. سيتم مسح مصدر التصنيع من تلك البنود.",
              )}
            </Alert>
            <ul className="max-h-40 overflow-y-auto rounded-md border border-gray-200 px-3 py-2 text-sm">
              {uniqueProducts.map((line) => (
                <li key={line.productCode} className="py-0.5">
                  <span className="font-medium">{line.productCode}</span>
                  {" - "}
                  {line.productTitle}
                </li>
              ))}
            </ul>
            <Checkbox
              checked={confirmed}
              onChange={(e) => setConfirmed(e.currentTarget.checked)}
              label={translate(
                "I understand that the manufacturing source will be cleared on these BOM lines",
                "أفهم أنه سيتم مسح مصدر التصنيع من بنود قوائم المواد هذه",
              )}
              radius="md"
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleClose} variant="light" color="dark" radius="md" fullWidth>
            {translation.cancel}
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!isReadyToSubmit} radius="md" fullWidth>
            {translate("Change Type", "تغيير النوع")}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
