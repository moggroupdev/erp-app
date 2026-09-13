"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import productsApi from "@/lib/api/products";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { Button, NumberInput } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";

export default function ProductPricingFactorModal({
  opened,
  close,
  productCode,
  currentValue,
}: {
  opened: boolean;
  close: () => void;
  productCode: string;
  currentValue: number | null;
}) {
  const { locale, translate, translation } = useI18n();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();

  const [validationError, setValidationError] = useState("");
  const [pricingFactor, setPricingFactor] = useState<number | string>("");

  useEffect(() => {
    if (!opened) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPricingFactor(currentValue ?? "");
    setValidationError("");
  }, [opened, currentValue]);

  const mutation = useMutation({
    mutationFn: async () => {
      return await productsApi.setPricingFactor({
        privateRequest,
        code: productCode,
        dto: { pricingFactor: Number(pricingFactor) },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      toast.success(translate("Pricing factor saved successfully.", "تم حفظ معامل التسعير بنجاح."));
      handleClose();
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    const value = Number(pricingFactor);
    if (Number.isNaN(value) || value <= 0) {
      return setValidationError(
        translate("Pricing factor must be a positive number.", "يجب أن يكون معامل التسعير رقماً موجباً."),
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

  const isReadyToSubmit = pricingFactor !== "" && !Number.isNaN(Number(pricingFactor)) && Number(pricingFactor) > 0;

  return (
    <Modal opened={opened} onClose={handleClose} title={translate("Set Pricing Factor", "تعيين معامل التسعير")} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <NumberInput
          value={pricingFactor}
          onChange={setPricingFactor}
          label={translate("Pricing Factor", "معامل التسعير")}
          placeholder={translate("Enter pricing factor", "أدخل معامل التسعير")}
          min={0}
          allowNegative={false}
          decimalScale={6}
          required
          radius="md"
        />

        <div className="flex gap-2">
          <Button onClick={handleClose} variant="light" color="dark" radius="md" fullWidth>
            {translation.cancel}
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!isReadyToSubmit} radius="md" fullWidth>
            {translate("Save Pricing Factor", "حفظ معامل التسعير")}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
