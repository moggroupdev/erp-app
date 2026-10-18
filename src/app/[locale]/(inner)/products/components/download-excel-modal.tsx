"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button, Checkbox } from "@mantine/core";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import productsApi, { type ProductExcelColumnOptions } from "@/lib/api/products";
import getErrorMessage from "@/lib/helpers/get-error-message";
import Modal from "@/components/ui/modal";

const COLUMN_OPTIONS = [
  { key: "reviewEstimate", en: "Review estimate in Excel", ar: "مراجعة المقايسة في الأكسيل" },
  { key: "addedToDatabase", en: "Added to the database", ar: "الإضافة في قاعدة البيانات" },
  { key: "design", en: "Design", ar: "التصميم" },
  { key: "completionDate", en: "Completion date", ar: "تاريخ الانتهاء" },
  { key: "notes", en: "Notes", ar: "ملاحظات" },
] as const satisfies readonly { key: keyof ProductExcelColumnOptions; en: string; ar: string }[];

const EMPTY_COLUMNS: ProductExcelColumnOptions = {};

export default function DownloadProductsExcelModal({ opened, close }: { opened: boolean; close: () => void }) {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();
  const [columns, setColumns] = useState<ProductExcelColumnOptions>(EMPTY_COLUMNS);

  const downloadMutation = useMutation({
    mutationFn: () => productsApi.downloadExcel({ privateRequest, columns }),
    onSuccess: () => {
      close();
      setTimeout(() => setColumns(EMPTY_COLUMNS), 250);
    },
    onError: (error) => toast.error(getErrorMessage(locale, error)),
  });

  function handleClose() {
    if (downloadMutation.isPending) return;
    close();
    setTimeout(() => setColumns(EMPTY_COLUMNS), 250);
  }

  function toggleColumn(key: keyof ProductExcelColumnOptions, checked: boolean) {
    setColumns((current) => ({ ...current, [key]: checked }));
  }

  return (
    <Modal opened={opened} onClose={handleClose} title={translate("Download Excel File", "تنزيل ملف إكسل")}>
      <div className="flex flex-col gap-3">
        <p className="-mt-1 text-sm text-gray-500">
          {translate(
            "Choose extra columns to add. They are left empty so you can fill them in the sheet.",
            "اختر الأعمدة الإضافية. تُترك فارغة لتعبئتها في الملف.",
          )}
        </p>

        {COLUMN_OPTIONS.map((option) => (
          <Checkbox
            key={option.key}
            checked={!!columns[option.key]}
            onChange={(event) => toggleColumn(option.key, event.currentTarget.checked)}
            label={translate(option.en, option.ar)}
            radius="md"
          />
        ))}

        <Button
          onClick={() => downloadMutation.mutate()}
          loading={downloadMutation.isPending}
          leftSection={<Download size={16} />}
          radius="md"
          fullWidth
        >
          {translate("Download", "تنزيل")}
        </Button>
      </div>
    </Modal>
  );
}
