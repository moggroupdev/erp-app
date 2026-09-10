"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, FileButton, Loader } from "@mantine/core";
import { Building2, CalendarDays, Download, FileText, Link2, Upload } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useHasPermission from "@/hooks/use-has-permission";
import usePrivateRequest from "@/hooks/use-private-request";
import supplierInvoicesApi from "@/lib/api/supplier-invoices";
import { queryKeys } from "@/lib/api/query-keys";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import parseSupplierInvoicePdf, { type ParsedSupplierInvoice } from "@/lib/helpers/parse-supplier-invoice-pdf";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { type SupplierInvoiceDetailed } from "@/types/material-purchase-order";
import CopyButton from "@/components/ui/copy-button";
import ErrorAlert from "@/components/ui/error-alert";
import { CreatorLink } from "@/components/ui/entity-details";
import UploadInvoiceConfirmModal from "@/components/global/sections/order-invoices/upload-invoice-confirm-modal";

type LedgerTone = "base" | "deduction" | "tax" | "total";

function MoneyCell({ value, signed = false, tone = "base" }: { value: number | null; signed?: boolean; tone?: LedgerTone }) {
  if (value == null) {
    return <span className="font-mono text-gray-300">-</span>;
  }

  const amount = formatMoney(value);
  const display = signed && value !== 0 ? `− ${amount}` : amount;

  const toneClass =
    tone === "total"
      ? "text-xl font-bold text-teal-950 sm:text-2xl"
      : tone === "deduction"
        ? "font-medium text-rose-700/80"
        : tone === "tax"
          ? "font-semibold text-gray-900"
          : "font-medium text-gray-900";

  return <span className={`font-mono tracking-tight tabular-nums ${toneClass}`}>{display}</span>;
}

function InfoRow({ icon: Icon, label, children }: { icon: typeof Building2; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
        <Icon size={15} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-gray-500 uppercase">{label}</p>
        <div className="mt-0.5 text-sm font-semibold text-gray-900 sm:text-[15px]">{children}</div>
      </div>
    </div>
  );
}

function LedgerRow({
  label,
  hint,
  value,
  signed = false,
  tone = "base",
  currency,
}: {
  label: string;
  hint?: string;
  value: number | null;
  signed?: boolean;
  tone?: LedgerTone;
  currency?: string;
}) {
  const isTotal = tone === "total";

  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-3 py-3 sm:px-4 ${
        isTotal ? "mt-2 rounded-lg bg-teal-50/70" : "border-b border-dashed border-gray-200"
      }`}
    >
      <div className="min-w-0">
        <p className={`text-sm ${isTotal ? "font-semibold text-teal-950" : "font-medium text-gray-800"}`}>{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-gray-400">{hint}</p>}
      </div>

      <span className="flex min-w-28 items-baseline justify-end gap-2 sm:min-w-36">
        <MoneyCell value={value} signed={signed} tone={tone} />
        {isTotal && currency && <span className="text-xs font-semibold text-teal-800">{currency}</span>}
      </span>
    </div>
  );
}

function orderMeta(invoice: SupplierInvoiceDetailed, translate: (en: string, ar: string) => string) {
  if (invoice.materialPurchaseOrder) {
    return {
      type: translate("Material Purchase Order", "أمر توريد خامات"),
      short: "MPO",
    };
  }
  if (invoice.productPurchaseOrder) {
    return {
      type: translate("Product Purchase Order", "أمر توريد منتجات"),
      short: "PPO",
    };
  }
  if (invoice.outsourcingOrder) {
    return {
      type: translate("Outsourcing Order", "أمر تصنيع خارجي"),
      short: "OSO",
    };
  }
  return null;
}

function LinkedOrder({ invoice }: { invoice: SupplierInvoiceDetailed }) {
  const getLocalizedHref = useLocaleHref();

  if (invoice.materialPurchaseOrder) {
    return (
      <Link
        href={getLocalizedHref(`/procurement/material-orders/${invoice.materialPurchaseOrder.id}`)}
        className="font-mono hover:underline"
      >
        {invoice.materialPurchaseOrder.code}
      </Link>
    );
  }

  if (invoice.productPurchaseOrder) {
    return <span className="font-mono">{invoice.productPurchaseOrder.code}</span>;
  }

  if (invoice.outsourcingOrder) {
    return <span className="font-mono">{invoice.outsourcingOrder.code}</span>;
  }

  return <span className="font-normal text-gray-400">-</span>;
}

function InvoicePdfSection({ invoice }: { invoice: SupplierInvoiceDetailed }) {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();
  const canUpdate = useHasPermission(PERMISSIONS.UPDATE_SUPPLIER_INVOICE);
  const resetFileRef = useRef<() => void>(null);
  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedSupplierInvoice | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [confirmOpened, setConfirmOpened] = useState(false);

  const hasPdf = !!invoice.pdfFilename;

  const {
    data: pdfBlob,
    isPending: isPdfLoading,
    error: pdfQueryError,
  } = useQuery({
    queryKey: queryKeys.supplierInvoices.pdf(invoice.id, invoice.pdfFilename),
    queryFn: ({ signal }) => supplierInvoicesApi.getPdfBlob({ privateRequest, id: invoice.id, signal }),
    enabled: hasPdf,
  });

  useEffect(() => {
    if (!pdfBlob) {
      setPdfObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(pdfBlob);
    setPdfObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pdfBlob]);

  const downloadMutation = useMutation({
    mutationFn: () =>
      supplierInvoicesApi.downloadPdf({
        privateRequest,
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        supplierName: invoice.supplier.name,
      }),
  });

  const downloadError = downloadMutation.error ? getErrorMessage(locale, downloadMutation.error) : "";
  const previewError = pdfQueryError ? getErrorMessage(locale, pdfQueryError) : "";

  async function handleFileSelect(file: File | null) {
    if (!file) return;
    downloadMutation.reset();
    setParseError("");
    setParsed(null);
    setPendingFile(file);
    setConfirmOpened(true);
    setIsParsing(true);

    try {
      const result = await parseSupplierInvoicePdf(file);
      setParsed(result);
    } catch (err) {
      setParseError(
        getErrorMessage(locale, err) || translate("Failed to read the PDF file.", "فشل قراءة ملف PDF."),
      );
      setConfirmOpened(false);
      setPendingFile(null);
      resetFileRef.current?.();
    } finally {
      setIsParsing(false);
    }
  }

  function handleConfirmClose() {
    setConfirmOpened(false);
    setPendingFile(null);
    setParsed(null);
    setParseError("");
    resetFileRef.current?.();
  }

  return (
    <section className="border-t border-gray-200 px-5 py-5 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
            <FileText size={15} strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-gray-500 uppercase">
              {translate("Invoice PDF", "ملف PDF للفاتورة")}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-gray-900">
              {hasPdf
                ? translate("A PDF file is attached to this invoice.", "يوجد ملف PDF مرفق بهذه الفاتورة.")
                : translate("No PDF attached yet.", "لا يوجد ملف PDF مرفق بعد.")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasPdf && (
            <Button
              variant="light"
              color="teal"
              size="sm"
              radius="md"
              leftSection={<Download size={15} />}
              loading={downloadMutation.isPending}
              onClick={() => downloadMutation.mutate()}
            >
              {translate("Download PDF", "تنزيل PDF")}
            </Button>
          )}

          {canUpdate && (
            <FileButton resetRef={resetFileRef} onChange={handleFileSelect} accept="application/pdf,.pdf">
              {(props) => (
                <Button
                  {...props}
                  variant={hasPdf ? "default" : "filled"}
                  color="teal"
                  size="sm"
                  radius="md"
                  leftSection={<Upload size={15} />}
                  loading={isParsing}
                >
                  {hasPdf
                    ? translate("Replace PDF", "استبدال PDF")
                    : translate("Upload PDF", "رفع PDF")}
                </Button>
              )}
            </FileButton>
          )}
        </div>
      </div>

      {(parseError || downloadError || previewError) && (
        <div className="mt-3">
          <ErrorAlert error={parseError || downloadError || previewError} fade />
        </div>
      )}

      {hasPdf && (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-slate-50">
          {isPdfLoading && (
            <div className="flex h-[min(70vh,720px)] items-center justify-center gap-2 text-sm text-gray-500">
              <Loader size="sm" color="teal" />
              {translate("Loading PDF…", "جاري تحميل PDF…")}
            </div>
          )}

          {!isPdfLoading && pdfObjectUrl && (
            <iframe
              title={translate("Invoice PDF preview", "معاينة ملف PDF للفاتورة")}
              src={pdfObjectUrl}
              className="h-[min(70vh,720px)] w-full bg-white"
            />
          )}
        </div>
      )}

      {canUpdate && (
        <UploadInvoiceConfirmModal
          mode="update"
          opened={confirmOpened}
          onClose={handleConfirmClose}
          supplierInvoiceId={invoice.id}
          existingInvoiceNumber={invoice.invoiceNumber}
          hasExistingPdf={hasPdf}
          file={pendingFile}
          parsed={isParsing ? null : parsed}
        />
      )}
    </section>
  );
}

export default function InvoiceDetails({ invoice }: { invoice: SupplierInvoiceDetailed }) {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const currency = translation.currency;
  const linked = orderMeta(invoice, translate);

  return (
    <article className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="pointer-events-none absolute inset-y-0 start-0 w-1.5 bg-teal-800" />

      {/* Masthead */}
      <header className="relative border-b border-gray-200 px-5 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-6">
        <div className="pointer-events-none absolute -end-10 -top-16 h-48 w-48 rounded-full bg-teal-50/80" />
        <div className="pointer-events-none absolute end-16 -top-8 h-28 w-28 rounded-full bg-slate-100/90" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-col gap-4">
            <span className="block w-fit rounded-lg bg-teal-800 px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-white uppercase">
              {translate("Tax Invoice", "فاتورة ضريبية")}
            </span>

            <div>
              <p className="mb-1 text-[11px] font-semibold tracking-[0.14em] text-gray-400 uppercase">
                {translate("Invoice Number", "رقم الفاتورة")}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-mono text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                  {invoice.invoiceNumber}
                </h2>
                <CopyButton text={invoice.invoiceNumber} />
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
              <CalendarDays size={14} className="text-teal-800/70" strokeWidth={1.75} />
              <span className="text-gray-500">{translate("Issued On", "صدرت في")}</span>
              <span className="font-semibold text-gray-900">
                {invoice.issuedAt ? formatDate(invoice.issuedAt, locale) : "-"}
              </span>
            </span>
          </div>

          <div className="relative w-full overflow-hidden rounded-xl border border-teal-800/20 bg-linear-to-br from-teal-900 to-teal-800 px-5 py-4 text-white lg:max-w-xs lg:min-w-64">
            <div className="pointer-events-none absolute -end-6 -bottom-8 h-24 w-24 rounded-full bg-white/10" />
            <p className="text-[11px] font-semibold tracking-[0.14em] text-teal-100/90 uppercase">
              {translate("Amount Due", "المبلغ المستحق")}
            </p>
            <p className="mt-2 font-mono text-3xl font-bold tracking-tight text-white tabular-nums">
              {invoice.totalAmount != null ? formatMoney(invoice.totalAmount) : "-"}
            </p>
            <p className="mt-1 text-xs font-medium text-teal-100/80">{currency}</p>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* Parties */}
        <section className="flex flex-col gap-5 border-b border-gray-200 px-5 py-6 sm:px-8 lg:border-e lg:border-b-0">
          <h3 className="text-[11px] font-semibold tracking-[0.14em] text-gray-400 uppercase">
            {translate("Document Parties", "أطراف المستند")}
          </h3>

          <div className="flex flex-col gap-5">
            <InfoRow icon={Building2} label={translate("Supplier", "المورد")}>
              <Link href={getLocalizedHref(`/procurement/suppliers/${invoice.supplier.id}`)} className="hover:underline">
                {invoice.supplier.name}
              </Link>
            </InfoRow>

            <InfoRow icon={Link2} label={translate("Linked Order", "الأمر المرتبط")}>
              <div className="flex flex-col gap-0.5">
                <LinkedOrder invoice={invoice} />
                {linked && <span className="text-xs font-normal text-gray-400">{linked.type}</span>}
              </div>
            </InfoRow>
          </div>

          <div className="mt-auto rounded-lg bg-slate-50/80 px-4 py-3 text-gray-500">
            <p className="text-xs">
              {translate("Entered by", "أدخل بواسطة")}{" "}
              <span className="font-medium text-gray-700">
                <CreatorLink creator={invoice.createdBy} />
              </span>
            </p>
            <p className="mt-2 text-xs">
              {translate("Recorded at", "تاريخ التسجيل")}{" "}
              <span className="font-medium text-gray-700">{formatDateAndTime(invoice.createdAt, locale)}</span>
            </p>
          </div>
        </section>

        {/* Ledger */}
        <section className="px-5 py-6 sm:px-8">
          <div className="mb-4">
            <h3 className="text-[11px] font-semibold tracking-[0.14em] text-gray-400 uppercase">
              {translate("Financial Ledger", "دفتر المبالغ")}
            </h3>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200">
            <div className="hidden grid-cols-[minmax(0,1fr)_auto] gap-x-4 border-b border-gray-200 bg-slate-50 px-4 py-2 text-[10px] font-semibold tracking-wide text-gray-400 uppercase sm:grid">
              <span>{translate("Description", "البيان")}</span>
              <span className="min-w-28 text-end sm:min-w-36">{translate("Amount", "المبلغ")}</span>
            </div>

            <LedgerRow
              label={translate("Total Purchases", "إجمالي المشتريات")}
              hint={translate("Gross taxable base", "الأساس الخاضع للضريبة")}
              value={invoice.totalPurchases}
            />
            <LedgerRow
              label={translate("Discount", "الخصم")}
              hint={translate("Deducted from purchases", "يُخصم من المشتريات")}
              value={invoice.totalDiscount}
              signed
              tone="deduction"
            />
            <LedgerRow
              label={translate("VAT", "ضريبة القيمة المضافة")}
              hint={translate("Value added tax", "ضريبة القيمة المضافة")}
              value={invoice.vatAmount}
              tone="tax"
            />
            <LedgerRow
              label={translate("Withholding Tax", "ضريبة الخصم")}
              hint={translate("Tax withheld at source", "ضريبة مخصومة من المصدر")}
              value={invoice.withholdingTaxAmount}
              signed
              tone="deduction"
            />
            <div className="p-2">
              <LedgerRow
                label={translate("Total Amount Due", "إجمالي المبلغ المستحق")}
                value={invoice.totalAmount}
                tone="total"
                currency={currency}
              />
            </div>
          </div>
        </section>
      </div>

      <InvoicePdfSection invoice={invoice} />
    </article>
  );
}
