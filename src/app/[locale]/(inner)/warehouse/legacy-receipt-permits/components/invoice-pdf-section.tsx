"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, FileButton, Loader, NumberInput, TextInput, Button } from "@mantine/core";
import { AlertCircle, FileText, Upload } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import getErrorMessage from "@/lib/helpers/get-error-message";
import parseSupplierInvoicePdf, { type ParsedSupplierInvoice } from "@/lib/helpers/parse-supplier-invoice-pdf";
import DatePickerInput from "@/components/ui/date-picker-input";
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
    <section className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900">
          {translate("Supplier invoice PDF", "ملف PDF لفاتورة المورد")}
        </h3>
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

      {parseError && <ErrorAlert error={parseError} fade />}

      {isParsing ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
          <Loader size="sm" color="haze" />
          {translate("Reading PDF…", "جاري قراءة PDF…")}
        </div>
      ) : file ? (
        <>
          {missingFields.length > 0 && (
            <Alert color="ochre" radius="md" icon={<AlertCircle size={15} />}>
              {translate("Some fields could not be read:", "تعذر قراءة بعض الحقول:")}{" "}
              {missingFields.map((key) => missingLabels[key] || key).join(locale === "ar" ? "، " : ", ")}
            </Alert>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText size={15} className="text-teal-700" />
            <span className="truncate">{file.name}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextInput
              label={translate("Invoice Number", "رقم الفاتورة")}
              value={invoice.invoiceNumber}
              onChange={(e) => onInvoiceChange({ invoiceNumber: e.currentTarget.value })}
              radius="md"
              required
            />
            <DatePickerInput
              label={translate("Issue Date", "تاريخ الإصدار")}
              value={invoice.issuedAt}
              onChange={(value) => onInvoiceChange({ issuedAt: value })}
              required
            />
            <NumberInput
              label={translate(`Total Purchases (${translation.currency})`, `إجمالي المشتريات (${translation.currency})`)}
              value={invoice.totalPurchases}
              onChange={(value) => onInvoiceChange({ totalPurchases: typeof value === "number" ? value : "" })}
              min={0}
              decimalScale={5}
              hideControls
              radius="md"
            />
            <NumberInput
              label={translate(`Discount (${translation.currency})`, `الخصم (${translation.currency})`)}
              value={invoice.totalDiscount}
              onChange={(value) => onInvoiceChange({ totalDiscount: typeof value === "number" ? value : "" })}
              min={0}
              decimalScale={5}
              hideControls
              radius="md"
            />
            <NumberInput
              label={translate(`VAT (${translation.currency})`, `ضريبة القيمة المضافة (${translation.currency})`)}
              value={invoice.vatAmount}
              onChange={(value) => onInvoiceChange({ vatAmount: typeof value === "number" ? value : "" })}
              min={0}
              decimalScale={5}
              hideControls
              radius="md"
            />
            <NumberInput
              label={translate(`Withholding Tax (${translation.currency})`, `ضريبة الخصم (${translation.currency})`)}
              value={invoice.withholdingTaxAmount}
              onChange={(value) => onInvoiceChange({ withholdingTaxAmount: typeof value === "number" ? value : "" })}
              min={0}
              decimalScale={5}
              hideControls
              radius="md"
            />
            <NumberInput
              label={translate(`Total Amount (${translation.currency})`, `الإجمالي (${translation.currency})`)}
              value={invoice.totalAmount}
              onChange={(value) => onInvoiceChange({ totalAmount: typeof value === "number" ? value : "" })}
              min={0}
              decimalScale={5}
              hideControls
              radius="md"
              className="md:col-span-2"
            />
          </div>

          {pdfObjectUrl && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              <iframe
                title={translate("Invoice PDF preview", "معاينة ملف PDF للفاتورة")}
                src={pdfObjectUrl}
                className="h-[min(40vh,360px)] w-full bg-white"
              />
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-500">
          {translate(
            "Upload the supplier invoice PDF. Fields are filled from the file and stay editable.",
            "ارفع ملف PDF لفاتورة المورد. تُملأ الحقول من الملف وتبقى قابلة للتعديل.",
          )}
        </p>
      )}
    </section>
  );
}
