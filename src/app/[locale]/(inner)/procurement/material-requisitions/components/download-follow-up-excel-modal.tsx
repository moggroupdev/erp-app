"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Button, Checkbox } from "@mantine/core";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import reportsApi from "@/lib/api/reports";
import getErrorMessage from "@/lib/helpers/get-error-message";
import Modal from "@/components/ui/modal";
import DatePickerInput from "@/components/ui/date-picker-input";

function getCurrentMonthDateRange() {
  return {
    from: dayjs().startOf("month").format("YYYY-MM-DD"),
    to: dayjs().endOf("month").format("YYYY-MM-DD"),
  };
}

export default function DownloadFollowUpExcelModal({
  opened,
  close,
}: {
  opened: boolean;
  close: () => void;
}) {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [approvedOnly, setApprovedOnly] = useState(false);

  useEffect(() => {
    if (!opened) return;
    const range = getCurrentMonthDateRange();
    setFrom(range.from);
    setTo(range.to);
    setApprovedOnly(false);
  }, [opened]);

  const downloadMutation = useMutation({
    mutationFn: () =>
      reportsApi.purchasingMaterials.downloadRequisitionFollowUpExcel({
        privateRequest,
        from: from!,
        to: to!,
        approvedOnly,
      }),
    onSuccess: () => {
      close();
    },
    onError: (error) => toast.error(getErrorMessage(locale, error)),
  });

  function handleClose() {
    if (downloadMutation.isPending) return;
    close();
  }

  const canDownload = Boolean(from && to && from <= to);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={translate("Download Follow-up Excel", "تنزيل تقرير المتابعة إكسل")}
    >
      <div className="flex flex-col gap-3">
        <p className="-mt-1 text-sm text-gray-500">
          {translate(
            "Choose the date range for purchase requisition lines. A sheet is created for each production department that has items.",
            "اختر نطاق التاريخ لبنود طلبات الشراء. يتم إنشاء ورقة لكل قسم إنتاج يحتوي على بنود.",
          )}
        </p>

        <DatePickerInput
          value={from}
          onChange={setFrom}
          label={translate("From", "من")}
          placeholder={translate("Select start date", "اختر تاريخ البداية")}
          clearable={false}
          maxDate={to ?? undefined}
        />
        <DatePickerInput
          value={to}
          onChange={setTo}
          label={translate("To", "إلى")}
          placeholder={translate("Select end date", "اختر تاريخ النهاية")}
          clearable={false}
          minDate={from ?? undefined}
        />

        <Checkbox
          checked={approvedOnly}
          onChange={(event) => setApprovedOnly(event.currentTarget.checked)}
          label={translate("Approved requisitions only", "طلبات الشراء المعتمدة فقط")}
          description={translate(
            "When unchecked, all requisitions in the date range are included.",
            "عند إلغاء التحديد، يتم تضمين كل طلبات الشراء في نطاق التاريخ.",
          )}
          radius="md"
        />

        <Button
          onClick={() => downloadMutation.mutate()}
          loading={downloadMutation.isPending}
          disabled={!canDownload}
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
