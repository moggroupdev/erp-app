"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, TextInput } from "@mantine/core";
import { PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import inventoryTransactionsApi from "@/lib/api/inventory-transactions";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import Modal from "@/components/ui/modal";
import ErrorAlert from "@/components/ui/error-alert";

type CreateInventoryTransactionModalProps = {
  opened: boolean;
  onClose: () => void;
  receiptId: string;
  receiptCode: string;
};

export default function CreateInventoryTransactionModal({
  opened,
  onClose,
  receiptId,
  receiptCode,
}: CreateInventoryTransactionModalProps) {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();
  const [legacyNumber, setLegacyNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      inventoryTransactionsApi.createFromMaterialPurchaseReceipt({
        privateRequest,
        receiptId,
        legacyNumber: legacyNumber.trim(),
      }),
    onSuccess: async (transaction) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.materialPurchaseOrders.receipts.detail(receiptId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.materialPurchaseOrders.receipts.all() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventoryTransactions.all }),
      ]);
      toast.success(
        translate(
          `Inventory receipt ${transaction.code} created.`,
          `تم إنشاء إذن الإضافة ${transaction.code}.`,
        ),
      );
      setLegacyNumber("");
      setErrorMessage("");
      onClose();
    },
    onError: (error) => {
      setErrorMessage(getErrorMessage(locale, error));
    },
  });

  function handleClose() {
    if (mutation.isPending) return;
    setLegacyNumber("");
    setErrorMessage("");
    onClose();
  }

  function handleSubmit() {
    setErrorMessage("");

    if (!legacyNumber.trim()) {
      setErrorMessage(
        translate("Transaction number is required.", "رقم الإذن مطلوب."),
      );
      return;
    }

    mutation.mutate();
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={translate("Create inventory receipt", "إنشاء إذن إضافة")}
      centerTitle
    >
      <p className="mb-4 text-sm text-gray-600">
        {translate(
          `Create an inventory receipt (اذن إضافة) for accepted quantities on materials receipt ${receiptCode}.`,
          `إنشاء إذن إضافة للكميات المقبولة في سند الاستلام ${receiptCode}.`,
        )}
      </p>

      <TextInput
        value={legacyNumber}
        onChange={(e) => {
          setLegacyNumber(e.currentTarget.value);
          setErrorMessage("");
        }}
        label={translate("Transaction Number", "رقم الإذن")}
        placeholder={translate("Required", "مطلوب")}
        radius="md"
        required
        className="mb-4"
        disabled={mutation.isPending}
      />

      {errorMessage && <ErrorAlert error={errorMessage} />}

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="default" radius="md" onClick={handleClose} disabled={mutation.isPending}>
          {translate("Cancel", "إلغاء")}
        </Button>
        <Button
          color="teal"
          radius="md"
          leftSection={<PackagePlus size={15} />}
          loading={mutation.isPending}
          onClick={handleSubmit}
        >
          {translate("Create اذن إضافة", "إنشاء إذن إضافة")}
        </Button>
      </div>
    </Modal>
  );
}
