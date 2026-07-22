import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import bomsApi from "@/lib/api/boms";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { Button, NumberInput, Textarea } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import SelectMaterial from "@/components/global/selections/query-based/select-material";

export default function AppendBomItemModal({
  opened,
  close,
  dimensionId,
  excludeMaterialCodes = [],
}: {
  opened: boolean;
  close: () => void;
  dimensionId: string;
  excludeMaterialCodes?: string[];
}) {
  const { locale, translate, translation } = useI18n();

  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [validationError, setValidationError] = useState("");

  const [materialCode, setMaterialCode] = useState<string | null>(null);
  const [quantityRequired, setQuantityRequired] = useState<number | string>("");
  const [notes, setNotes] = useState("");

  function reset() {
    setMaterialCode(null);
    setQuantityRequired("");
    setNotes("");
  }

  const mutation = useMutation({
    mutationFn: async () => {
      return await bomsApi.appendItem({
        privateRequest,
        dimensionId,
        dto: {
          materialCode: materialCode!,
          quantityRequired: Number(quantityRequired),
          notes: notes.trim() || null,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.boms.detail(dimensionId) });
      handleClose();
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (!materialCode) return setValidationError(translate("Please select a material.", "يرجى اختيار مادة."));

    const normalizedQuantity = Number(quantityRequired);
    if (Number.isNaN(normalizedQuantity) || normalizedQuantity <= 0) {
      return setValidationError(
        translate("Quantity must be a positive number.", "يجب أن تكون الكمية رقماً موجباً."),
      );
    }

    mutation.mutate();
  }

  function handleClose() {
    close();
    setTimeout(() => {
      reset();
      setValidationError("");
      mutation.reset();
    }, 250);
  }

  const title = translate("Add BOM Item", "إضافة بند لقائمة المواد");

  const isReadyToSubmit = !!materialCode && quantityRequired !== "" && Number(quantityRequired) > 0;

  return (
    <Modal opened={opened} onClose={handleClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <SelectMaterial
          value={materialCode}
          setValue={setMaterialCode}
          excludeCodes={excludeMaterialCodes}
          label={translate("Material", "المادة")}
          placeholder={translate("Search material by name or code", "ابحث عن مادة بالاسم أو الكود")}
          required
        />

        <NumberInput
          value={quantityRequired}
          onChange={setQuantityRequired}
          label={translate("Quantity Required", "الكمية المطلوبة")}
          placeholder={translate("Enter quantity", "أدخل الكمية")}
          min={0}
          allowNegative={false}
          decimalScale={4}
          required
          radius="md"
        />

        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          label={translate("Notes (Optional)", "الملاحظات (اختياري)")}
          placeholder={translate("Enter notes", "أدخل الملاحظات")}
          radius="md"
          autosize
        />

        <div className="flex gap-2">
          <Button onClick={handleClose} variant="light" color="dark" radius="md" fullWidth>
            {translation.cancel}
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!isReadyToSubmit} radius="md" fullWidth>
            {title}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
