"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { Button, NumberInput } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";

export default function MaterialMarketPriceModal({
  opened,
  close,
  materialCode,
  currentValue,
}: {
  opened: boolean;
  close: () => void;
  materialCode: string;
  currentValue: number | null;
}) {
  const { locale, translate, translation } = useI18n();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();

  const [validationError, setValidationError] = useState("");
  const [marketUnitPrice, setMarketUnitPrice] = useState<number | string>("");

  useEffect(() => {
    if (!opened) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMarketUnitPrice(currentValue ?? "");
    setValidationError("");
  }, [opened, currentValue]);

  const mutation = useMutation({
    mutationFn: async () => {
      return await materialsApi.setMarketPrice({
        privateRequest,
        code: materialCode,
        dto: { marketUnitPrice: Number(marketUnitPrice) },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.materials.all });
      toast.success(translate("Market price saved successfully.", "تم حفظ سعر السوق بنجاح."));
      handleClose();
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    const value = Number(marketUnitPrice);
    if (Number.isNaN(value) || value < 0) {
      return setValidationError(
        translate("Market price must be a non-negative number.", "يجب أن يكون سعر السوق رقماً غير سالب."),
      );
    }

    mutation.mutate();
  }

  function handleClose() {
    close();
    setTimeout(() => {
      setValidationError("");
      mutation.reset();
    }, 250);
  }

  const isReadyToSubmit = marketUnitPrice !== "" && !Number.isNaN(Number(marketUnitPrice)) && Number(marketUnitPrice) >= 0;

  return (
    <Modal opened={opened} onClose={handleClose} title={translate("Set Market Price", "تعيين سعر السوق")} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <NumberInput
          value={marketUnitPrice}
          onChange={setMarketUnitPrice}
          label={translate("Market Price", "سعر السوق")}
          placeholder={translate("Enter market price", "أدخل سعر السوق")}
          min={0}
          allowNegative={false}
          decimalScale={6}
          required
          radius="md"
          suffix={` ${translation.currency}`}
        />

        <div className="flex gap-2">
          <Button onClick={handleClose} variant="light" color="dark" radius="md" fullWidth>
            {translation.cancel}
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!isReadyToSubmit} radius="md" fullWidth>
            {translate("Save Market Price", "حفظ سعر السوق")}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
