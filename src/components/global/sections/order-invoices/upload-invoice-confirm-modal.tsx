"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Loader } from "@mantine/core";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import supplierInvoicesApi from "@/lib/api/supplier-invoices";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { formatDate } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { queryKeys } from "@/lib/api/query-keys";
import type { ParsedSupplierInvoice } from "@/lib/helpers/parse-supplier-invoice-pdf";
import Modal from "@/components/ui/modal";
import ErrorAlert from "@/components/ui/error-alert";

type UploadInvoiceConfirmModalProps = {
  opened: boolean;
  onClose: () => void;
  materialPurchaseOrderId: string;
  file: File | null;
  parsed: ParsedSupplierInvoice | null;
};

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-2 text-sm last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-end">{value}</span>
    </div>
  );
}

function EmptyValue() {
  return <span className="text-gray-400">-</span>;
}

export default function UploadInvoiceConfirmModal({
  opened,
  onClose,
  materialPurchaseOrderId,
  file,
  parsed,
}: UploadInvoiceConfirmModalProps) {
  const { locale, translate, translation } = useI18n();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPdfObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPdfObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file || !parsed) throw new Error("Missing file or parsed data");
      return await supplierInvoicesApi.createFromPdf({
        privateRequest,
        materialPurchaseOrderId,
        file,
        fields: {
          invoiceNumber: parsed.invoiceNumber,
          issuedAt: parsed.issuedAt,
          totalPurchases: parsed.totalPurchases,
          totalDiscount: parsed.totalDiscount,
          vatAmount: parsed.vatAmount,
          withholdingTaxAmount: parsed.withholdingTaxAmount,
          totalAmount: parsed.totalAmount,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.supplierInvoices.all });
      toast.success(translate("Invoice uploaded successfully.", "تم رفع الفاتورة بنجاح."));
      handleClose();
    },
  });

  const error = mutation.error ? getErrorMessage(locale, mutation.error) : "";
  const canConfirm = !!parsed?.invoiceNumber && !!file && !mutation.isPending;

  function handleClose() {
    if (mutation.isPending) return;
    onClose();
    setTimeout(() => mutation.reset(), 250);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canConfirm) return;
    mutation.mutate();
  }

  const missingLabels: Record<string, string> = {
    invoiceNumber: translate("Invoice Number", "رقم الفاتورة"),
    issuedAt: translate("Issue Date", "تاريخ الإصدار"),
    totalPurchases: translate("Total Purchases", "إجمالي المشتريات"),
    totalDiscount: translate("Discount", "الخصم"),
    vatAmount: translate("VAT", "ضريبة القيمة المضافة"),
    withholdingTaxAmount: translate("Withholding Tax", "ضريبة الخصم"),
    totalAmount: translate("Total Amount", "الإجمالي"),
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={translate("Confirm invoice upload", "تأكيد رفع الفاتورة")}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <p className="text-sm text-gray-600">
          {translate(
            "Review the extracted invoice data before saving. The PDF will be attached to this purchase order.",
            "راجع بيانات الفاتورة المستخرجة قبل الحفظ. سيتم إرفاق ملف PDF بأمر التوريد هذا.",
          )}
        </p>

        {!parsed ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
            <Loader size="sm" color="teal" />
            {translate("Reading PDF…", "جاري قراءة PDF…")}
          </div>
        ) : (
          <>
            {parsed.missingFields.length > 0 && (
              <Alert color="orange" radius="md" icon={<AlertCircle size={15} />}>
                {translate("Some fields could not be read:", "تعذر قراءة بعض الحقول:")}{" "}
                {parsed.missingFields.map((key) => missingLabels[key] || key).join(locale === "ar" ? "، " : ", ")}
              </Alert>
            )}

            <div className="rounded-xl border border-gray-200 px-4 py-1">
              <FieldRow
                label={translate("Invoice Number", "رقم الفاتورة")}
                value={parsed.invoiceNumber || <EmptyValue />}
              />
              <FieldRow
                label={translate("Issue Date", "تاريخ الإصدار")}
                value={parsed.issuedAt ? formatDate(parsed.issuedAt, locale) : <EmptyValue />}
              />
              <FieldRow
                label={translate(`Total Purchases (${translation.currency})`, `إجمالي المشتريات (${translation.currency})`)}
                value={parsed.totalPurchases != null ? formatMoney(parsed.totalPurchases) : <EmptyValue />}
              />
              <FieldRow
                label={translate(`Discount (${translation.currency})`, `الخصم (${translation.currency})`)}
                value={parsed.totalDiscount != null ? formatMoney(parsed.totalDiscount) : <EmptyValue />}
              />
              <FieldRow
                label={translate(`VAT (${translation.currency})`, `ضريبة القيمة المضافة (${translation.currency})`)}
                value={parsed.vatAmount != null ? formatMoney(parsed.vatAmount) : <EmptyValue />}
              />
              <FieldRow
                label={translate(`Withholding Tax (${translation.currency})`, `ضريبة الخصم (${translation.currency})`)}
                value={
                  parsed.withholdingTaxAmount != null ? formatMoney(parsed.withholdingTaxAmount) : <EmptyValue />
                }
              />
              <FieldRow
                label={translate(`Total Amount (${translation.currency})`, `الإجمالي (${translation.currency})`)}
                value={parsed.totalAmount != null ? formatMoney(parsed.totalAmount) : <EmptyValue />}
              />
            </div>

            {pdfObjectUrl && (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-slate-50">
                <iframe
                  title={translate("Invoice PDF preview", "معاينة ملف PDF للفاتورة")}
                  src={pdfObjectUrl}
                  className="h-[min(40vh,360px)] w-full bg-white"
                />
              </div>
            )}
          </>
        )}

        <div className="flex gap-2">
          <Button variant="light" color="dark" radius="md" onClick={handleClose} disabled={mutation.isPending} fullWidth>
            {translation.cancel}
          </Button>
          <Button type="submit" color="teal" loading={mutation.isPending} disabled={!canConfirm} radius="md" fullWidth>
            {translate("Save invoice", "حفظ الفاتورة")}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
