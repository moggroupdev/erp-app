"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Loader, TextInput } from "@mantine/core";
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

type UploadInvoiceConfirmModalBaseProps = {
  opened: boolean;
  onClose: () => void;
  file: File | null;
  parsed: ParsedSupplierInvoice | null;
};

type CreateModeProps = UploadInvoiceConfirmModalBaseProps & {
  mode: "create";
  materialPurchaseOrderId: string;
};

type UpdateModeProps = UploadInvoiceConfirmModalBaseProps & {
  mode: "update";
  supplierInvoiceId: string;
  existingInvoiceNumber?: string;
  hasExistingPdf?: boolean;
};

type UploadInvoiceConfirmModalProps = CreateModeProps | UpdateModeProps;

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-2 text-sm last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-end font-medium text-gray-900">{value}</span>
    </div>
  );
}

function EmptyValue() {
  return <span className="text-gray-400">-</span>;
}

function ConfirmInvoiceNumberModal({
  opened,
  onClose,
  newInvoiceNumber,
  existingInvoiceNumber,
  onConfirm,
  loading,
  error,
}: {
  opened: boolean;
  onClose: () => void;
  newInvoiceNumber: string;
  existingInvoiceNumber: string;
  onConfirm: () => void;
  loading: boolean;
  error: string;
}) {
  const { translate, translation } = useI18n();
  const [confirmedInvoiceNumber, setConfirmedInvoiceNumber] = useState("");
  const matches = confirmedInvoiceNumber.trim() === newInvoiceNumber;

  useEffect(() => {
    if (!opened) setConfirmedInvoiceNumber("");
  }, [opened, newInvoiceNumber]);

  function handleClose() {
    if (loading) return;
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!matches || loading) return;
    onConfirm();
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={translate("Confirm invoice number change", "تأكيد تغيير رقم الفاتورة")}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Alert color="orange" radius="md" icon={<AlertCircle size={15} />}>
          {translate(
            `The invoice number will change from ${existingInvoiceNumber} to ${newInvoiceNumber}.`,
            `سيتغير رقم الفاتورة من ${existingInvoiceNumber} إلى ${newInvoiceNumber}.`,
          )}
        </Alert>

        <TextInput
          label={translate("Type the new invoice number to confirm", "اكتب رقم الفاتورة الجديد للتأكيد")}
          description={translate(
            `Enter “${newInvoiceNumber}” exactly to allow saving.`,
            `أدخل «${newInvoiceNumber}» كما هو للسماح بالحفظ.`,
          )}
          placeholder={newInvoiceNumber}
          value={confirmedInvoiceNumber}
          onChange={(e) => setConfirmedInvoiceNumber(e.currentTarget.value)}
          radius="md"
          autoComplete="off"
          data-autofocus
          error={
            confirmedInvoiceNumber.length > 0 && !matches
              ? translate("Does not match the new invoice number.", "لا يطابق رقم الفاتورة الجديد.")
              : undefined
          }
        />

        <div className="flex gap-2">
          <Button variant="light" color="dark" radius="md" onClick={handleClose} disabled={loading} fullWidth>
            {translation.cancel}
          </Button>
          <Button type="submit" color="teal" loading={loading} disabled={!matches || loading} radius="md" fullWidth>
            {translate("Confirm and save", "تأكيد وحفظ")}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}

export default function UploadInvoiceConfirmModal(props: UploadInvoiceConfirmModalProps) {
  const { opened, onClose, file, parsed, mode } = props;
  const { locale, translate, translation } = useI18n();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);
  const [numberConfirmOpened, setNumberConfirmOpened] = useState(false);

  const isUpdate = mode === "update";
  const hasExistingPdf = isUpdate && !!props.hasExistingPdf;
  const existingInvoiceNumber = isUpdate ? props.existingInvoiceNumber : undefined;
  const invoiceNumberChanged =
    !!parsed?.invoiceNumber && !!existingInvoiceNumber && parsed.invoiceNumber !== existingInvoiceNumber;

  useEffect(() => {
    if (!file) {
      setPdfObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPdfObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!opened) setNumberConfirmOpened(false);
  }, [opened]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file || !parsed) throw new Error("Missing file or parsed data");
      const fields = {
        invoiceNumber: parsed.invoiceNumber,
        issuedAt: parsed.issuedAt,
        totalPurchases: parsed.totalPurchases,
        totalDiscount: parsed.totalDiscount,
        vatAmount: parsed.vatAmount,
        withholdingTaxAmount: parsed.withholdingTaxAmount,
        totalAmount: parsed.totalAmount,
      };

      if (mode === "create") {
        return await supplierInvoicesApi.createFromPdf({
          privateRequest,
          materialPurchaseOrderId: props.materialPurchaseOrderId,
          file,
          fields,
        });
      }

      return await supplierInvoicesApi.uploadPdf({
        privateRequest,
        id: props.supplierInvoiceId,
        file,
        fields,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.supplierInvoices.all });
      toast.success(
        isUpdate
          ? translate("Invoice PDF saved successfully.", "تم حفظ ملف PDF للفاتورة بنجاح.")
          : translate("Invoice uploaded successfully.", "تم رفع الفاتورة بنجاح."),
      );
      handleClose();
    },
  });

  const error = mutation.error ? getErrorMessage(locale, mutation.error) : "";
  const canConfirm = !!parsed?.invoiceNumber && !!file && !mutation.isPending;

  function handleClose() {
    if (mutation.isPending) return;
    setNumberConfirmOpened(false);
    onClose();
    setTimeout(() => mutation.reset(), 250);
  }

  function handleNumberConfirmClose() {
    if (mutation.isPending) return;
    setNumberConfirmOpened(false);
    mutation.reset();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canConfirm) return;

    if (invoiceNumberChanged) {
      mutation.reset();
      setNumberConfirmOpened(true);
      return;
    }

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

  const title = isUpdate
    ? hasExistingPdf
      ? translate("Confirm PDF replacement", "تأكيد استبدال ملف PDF")
      : translate("Confirm PDF upload", "تأكيد رفع ملف PDF")
    : translate("Confirm invoice upload", "تأكيد رفع الفاتورة");

  const description = isUpdate
    ? hasExistingPdf
      ? translate(
          "Review the extracted invoice data before saving. The selected file will replace the current PDF and update this invoice.",
          "راجع بيانات الفاتورة المستخرجة قبل الحفظ. سيحل الملف المحدد محل ملف PDF الحالي ويحدّث هذه الفاتورة.",
        )
      : translate(
          "Review the extracted invoice data before saving. The PDF will be attached and this invoice will be updated.",
          "راجع بيانات الفاتورة المستخرجة قبل الحفظ. سيتم إرفاق ملف PDF وتحديث هذه الفاتورة.",
        )
    : translate(
        "Review the extracted invoice data before saving. The PDF will be attached to this purchase order.",
        "راجع بيانات الفاتورة المستخرجة قبل الحفظ. سيتم إرفاق ملف PDF بأمر التوريد هذا.",
      );

  const submitLabel = isUpdate ? translate("Save PDF", "حفظ PDF") : translate("Save invoice", "حفظ الفاتورة");

  return (
    <>
      <Modal opened={opened && !numberConfirmOpened} onClose={handleClose} title={title} size="lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-gray-600">{description}</p>

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

              {invoiceNumberChanged && (
                <Alert color="orange" radius="md" icon={<AlertCircle size={15} />}>
                  {translate(
                    `The invoice number in the PDF (${parsed.invoiceNumber}) differs from the current number (${existingInvoiceNumber}). Saving will require confirming the new number.`,
                    `رقم الفاتورة في الملف (${parsed.invoiceNumber}) يختلف عن الرقم الحالي (${existingInvoiceNumber}). سيتطلب الحفظ تأكيد الرقم الجديد.`,
                  )}
                </Alert>
              )}

              <div className="rounded-xl border border-gray-200 px-4 py-1">
                <FieldRow label={translate("Invoice Number", "رقم الفاتورة")} value={parsed.invoiceNumber || <EmptyValue />} />
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
              {submitLabel}
            </Button>
          </div>

          {error && !numberConfirmOpened && <ErrorAlert error={error} />}
        </form>
      </Modal>

      {invoiceNumberChanged && parsed?.invoiceNumber && existingInvoiceNumber && (
        <ConfirmInvoiceNumberModal
          opened={numberConfirmOpened}
          onClose={handleNumberConfirmClose}
          newInvoiceNumber={parsed.invoiceNumber}
          existingInvoiceNumber={existingInvoiceNumber}
          onConfirm={() => mutation.mutate()}
          loading={mutation.isPending}
          error={error}
        />
      )}
    </>
  );
}
