"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, FileButton, Loader, Button } from "@mantine/core";
import { AlertCircle, FileText, Upload } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { formatDate } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import parseSupplierInvoicePdf, { type ParsedSupplierInvoice } from "@/lib/helpers/parse-supplier-invoice-pdf";
import { EmptyValue } from "@/components/ui/entity-details";
import ErrorAlert from "@/components/ui/error-alert";

export type InvoiceFormState = {
  invoiceNumber: string;
  issuedAt: string | null;
  totalPurchases: number | "";
  totalDiscount: number | "";
  vatAmount: number | "";
  withholdingTaxAmount: number | "";
  totalAmount: number | "";
};

type InvoicePdfSectionProps = {
  file: File | null;
  onFileChange: (file: File | null) => void;
  invoice: InvoiceFormState;
  onInvoiceChange: (patch: Partial<InvoiceFormState>) => void;
};

function emptyInvoice(): InvoiceFormState {
  return {
    invoiceNumber: "",
    issuedAt: null,
    totalPurchases: "",
    totalDiscount: "",
    vatAmount: "",
    withholdingTaxAmount: "",
    totalAmount: "",
  };
}

export function invoiceFormFromParsed(parsed: ParsedSupplierInvoice): InvoiceFormState {
  return {
    invoiceNumber: parsed.invoiceNumber || "",
    issuedAt: parsed.issuedAt,
    totalPurchases: parsed.totalPurchases ?? "",
    totalDiscount: parsed.totalDiscount ?? "",
    vatAmount: parsed.vatAmount ?? "",
    withholdingTaxAmount: parsed.withholdingTaxAmount ?? "",
    totalAmount: parsed.totalAmount ?? "",
  };
}

export { emptyInvoice };

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-2 text-sm last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-end font-medium text-gray-900">{value}</span>
    </div>
  );
}

function moneyOrEmpty(value: number | "") {
  return typeof value === "number" ? formatMoney(value) : <EmptyValue />;
}

export default function InvoicePdfSection({ file, onFileChange, invoice, onInvoiceChange }: InvoicePdfSectionProps) {
  const { locale, translate, translation } = useI18n();
  const resetFileRef = useRef<() => void>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [missingFields, setMissingFields] = useState<string[]>([]);
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

  async function handleFileSelect(selected: File | null) {
    if (!selected) return;
    setParseError("");
    setMissingFields([]);
    setIsParsing(true);
    onFileChange(selected);

    try {
      const parsed = await parseSupplierInvoicePdf(selected);
      onInvoiceChange(invoiceFormFromParsed(parsed));
      setMissingFields(parsed.missingFields);
    } catch (err) {
      setParseError(
        getErrorMessage(locale, err) || translate("Failed to read the PDF file.", "فشل قراءة ملف PDF."),
      );
      onFileChange(null);
      onInvoiceChange(emptyInvoice());
      resetFileRef.current?.();
    } finally {
      setIsParsing(false);
    }
  }

  function handleClear() {
    onFileChange(null);
    onInvoiceChange(emptyInvoice());
    setMissingFields([]);
    setParseError("");
    resetFileRef.current?.();
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
    <section className="overflow-hidden rounded-2xl bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-haze-600 text-white">
            <FileText size={18} />
          </span>
          <div>
            <h4 className="text-base font-semibold text-gray-950">
              {translate("Supplier invoice PDF", "ملف PDF لفاتورة المورد")}
            </h4>
            <p className="text-sm text-gray-500">
              {translate(
                "Upload the invoice PDF. Fields are filled automatically from the file.",
                "ارفع ملف PDF للفاتورة. تُملأ الحقول تلقائيًا من الملف.",
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FileButton resetRef={resetFileRef} onChange={handleFileSelect} accept="application/pdf,.pdf">
            {(props) => (
              <Button {...props} color="haze" radius="md" leftSection={<Upload size={15} />} loading={isParsing}>
                {file
                  ? translate("Replace PDF", "استبدال PDF")
                  : translate("Upload invoice PDF", "رفع ملف PDF للفاتورة")}
              </Button>
            )}
          </FileButton>
          {file && (
            <Button variant="light" color="dark" radius="md" onClick={handleClear} disabled={isParsing}>
              {translate("Clear", "مسح")}
            </Button>
          )}
        </div>
      </div>

      <div className="px-5 py-5">
        {parseError && <ErrorAlert error={parseError} fade />}

        {isParsing ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Loader size="sm" color="haze" />
            {translate("Reading PDF…", "جاري قراءة PDF…")}
          </div>
        ) : file ? (
          <div className="flex flex-col gap-4">
            {missingFields.length > 0 && (
              <Alert color="ochre" radius="md" icon={<AlertCircle size={15} />}>
                {translate("Some fields could not be read:", "تعذر قراءة بعض الحقول:")}{" "}
                {missingFields.map((key) => missingLabels[key] || key).join(locale === "ar" ? "، " : ", ")}
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="flex min-h-0 flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText size={15} className="text-haze-700" />
                  <span className="truncate">{file.name}</span>
                </div>
                {pdfObjectUrl && (
                  <div className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                    <iframe
                      title={translate("Invoice PDF preview", "معاينة ملف PDF للفاتورة")}
                      src={pdfObjectUrl}
                      className="h-[min(52vh,520px)] w-full bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-100 px-4 py-1">
                <FieldRow
                  label={translate("Invoice Number", "رقم الفاتورة")}
                  value={invoice.invoiceNumber || <EmptyValue />}
                />
                <FieldRow
                  label={translate("Issue Date", "تاريخ الإصدار")}
                  value={invoice.issuedAt ? formatDate(invoice.issuedAt, locale) : <EmptyValue />}
                />
                <FieldRow
                  label={translate(
                    `Total Purchases (${translation.currency})`,
                    `إجمالي المشتريات (${translation.currency})`,
                  )}
                  value={moneyOrEmpty(invoice.totalPurchases)}
                />
                <FieldRow
                  label={translate(`Discount (${translation.currency})`, `الخصم (${translation.currency})`)}
                  value={moneyOrEmpty(invoice.totalDiscount)}
                />
                <FieldRow
                  label={translate(
                    `VAT (${translation.currency})`,
                    `ضريبة القيمة المضافة (${translation.currency})`,
                  )}
                  value={moneyOrEmpty(invoice.vatAmount)}
                />
                <FieldRow
                  label={translate(
                    `Withholding Tax (${translation.currency})`,
                    `ضريبة الخصم (${translation.currency})`,
                  )}
                  value={moneyOrEmpty(invoice.withholdingTaxAmount)}
                />
                <FieldRow
                  label={translate(`Total Amount (${translation.currency})`, `الإجمالي (${translation.currency})`)}
                  value={moneyOrEmpty(invoice.totalAmount)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-haze-50 px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-haze-100 text-haze-700">
              <Upload size={26} strokeWidth={1.75} />
            </div>
            <div className="flex max-w-md flex-col gap-1.5">
              <h5 className="text-base font-semibold text-gray-900">
                {translate("No invoice PDF yet", "لا يوجد ملف فاتورة بعد")}
              </h5>
              <p className="text-sm leading-[1.75] text-gray-500">
                {translate(
                  "Upload the supplier invoice PDF to fill invoice fields automatically.",
                  "ارفع ملف PDF لفاتورة المورد لملء بيانات الفاتورة تلقائيًا.",
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
