import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import mmBomsApi from "@/lib/api/mm-boms";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import type { MmBomItemWithMaterial } from "@/types/mm-bom";
import { Badge, Button, NumberInput, Textarea } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import SelectMaterial from "@/components/global/selections/query-based/select-material";

export default function MmBomItemModal({
  opened,
  close,
  manufacturedMaterialCode,
  itemToUpdate,
  setItemToUpdate,
  excludeMaterialCodes = [],
}: {
  opened: boolean;
  close: () => void;
  manufacturedMaterialCode: string;
  itemToUpdate: MmBomItemWithMaterial | null;
  setItemToUpdate: React.Dispatch<React.SetStateAction<MmBomItemWithMaterial | null>>;
  excludeMaterialCodes?: string[];
}) {
  const { locale, translate, translation } = useI18n();

  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [validationError, setValidationError] = useState("");

  const [materialCode, setMaterialCode] = useState<string | null>(null);
  const [quantityRequired, setQuantityRequired] = useState<number | string>("");
  const [notes, setNotes] = useState("");

  const isUpdate = !!itemToUpdate;

  const allExcludeCodes = useMemo(
    () => [...excludeMaterialCodes, manufacturedMaterialCode],
    [excludeMaterialCodes, manufacturedMaterialCode],
  );

  function reset() {
    setMaterialCode(null);
    setQuantityRequired("");
    setNotes("");
  }

  useEffect(() => {
    if (itemToUpdate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuantityRequired(itemToUpdate.quantityRequired);
      setNotes(itemToUpdate.notes || "");
    } else reset();
  }, [itemToUpdate]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (itemToUpdate) {
        return await mmBomsApi.updateItem({
          privateRequest,
          itemId: itemToUpdate.id,
          dto: {
            quantityRequired: Number(quantityRequired),
            notes: notes.trim() || null,
          },
        });
      }

      return await mmBomsApi.appendItem({
        privateRequest,
        manufacturedMaterialCode,
        dto: {
          materialCode: materialCode!,
          quantityRequired: Number(quantityRequired),
          notes: notes.trim() || null,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.mmBoms.detail(manufacturedMaterialCode) });
      handleClose();
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (!isUpdate && !materialCode) {
      return setValidationError(translate("Please select a material.", "يرجى اختيار مادة."));
    }

    const normalizedQuantity = Number(quantityRequired);
    if (Number.isNaN(normalizedQuantity) || normalizedQuantity <= 0) {
      return setValidationError(translate("Quantity must be a positive number.", "يجب أن تكون الكمية رقماً موجباً."));
    }

    mutation.mutate();
  }

  function handleClose() {
    close();
    setTimeout(() => {
      setValidationError("");
      mutation.reset();
      setItemToUpdate(null);
      reset();
    }, 250);
  }

  const title = isUpdate
    ? translate("Edit BOM Item", "تعديل بند قائمة المواد")
    : translate("Add BOM Item", "إضافة بند لقائمة المواد");

  const isDataChanged = itemToUpdate
    ? Number(quantityRequired) !== itemToUpdate.quantityRequired || (notes.trim() || null) !== itemToUpdate.notes
    : true;

  const isReadyToSubmit =
    quantityRequired !== "" && Number(quantityRequired) > 0 && isDataChanged && (isUpdate || !!materialCode);

  return (
    <Modal opened={opened} onClose={handleClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {isUpdate && itemToUpdate ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3">
            <p className="truncate text-sm font-medium text-gray-800">{itemToUpdate.material.title}</p>
            <Badge size="sm" variant="light" color="gray" radius="md" className="font-mono">
              {itemToUpdate.material.code}
            </Badge>
          </div>
        ) : (
          <SelectMaterial
            value={materialCode}
            setValue={setMaterialCode}
            excludeCodes={allExcludeCodes}
            label={translate("Material", "المادة")}
            placeholder={translate("Search material by name or code", "ابحث عن مادة بالاسم أو الكود")}
            required
            withBrowseModal
          />
        )}

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
