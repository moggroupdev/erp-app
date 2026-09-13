"use client";

import { useRef, useState } from "react";
import { Button, FileButton, Table } from "@mantine/core";
import Link from "next/link";
import { FileText, Upload } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatDate } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import getErrorMessage from "@/lib/helpers/get-error-message";
import parseSupplierInvoicePdf, { type ParsedSupplierInvoice } from "@/lib/helpers/parse-supplier-invoice-pdf";
import { type SupplierInvoice } from "@/types/material-purchase-order";
import CopyButton from "@/components/ui/copy-button";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import ErrorAlert from "@/components/ui/error-alert";
import UploadInvoiceConfirmModal from "./upload-invoice-confirm-modal";

type OrderInvoicesSectionProps = {
  invoices: SupplierInvoice[] | undefined;
  isFetching: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  /** When set, footer compares summed invoice purchases against this order total. */
  orderTotalAmount?: number;
  /** When set with canAdd, enables uploading a new invoice from PDF. */
  materialPurchaseOrderId?: string;
  canAdd?: boolean;
};

function sumNullableField(
  invoices: SupplierInvoice[],
  field: "totalPurchases" | "totalDiscount" | "vatAmount" | "withholdingTaxAmount" | "totalAmount",
): number | null {
  const withValues = invoices.filter((invoice) => invoice[field] != null);
  if (withValues.length === 0) return null;
  return withValues.reduce((sum, invoice) => sum + Number(invoice[field]), 0);
}

function formatSum(value: number | null) {
  return value != null ? formatMoney(value) : <span className="text-gray-400">-</span>;
}

function InvoicePurchasesFooter({ invoices, orderTotalAmount }: { invoices: SupplierInvoice[]; orderTotalAmount: number }) {
  const { translate } = useI18n();
  const totalPurchases = sumNullableField(invoices, "totalPurchases");
  const totalDiscount = sumNullableField(invoices, "totalDiscount");
  const vatAmount = sumNullableField(invoices, "vatAmount");
  const withholdingTaxAmount = sumNullableField(invoices, "withholdingTaxAmount");
  const totalAmount = sumNullableField(invoices, "totalAmount");

  const hasMismatch =
    totalPurchases != null &&
    Math.abs(orderTotalAmount - totalPurchases) >=
      Math.max(Math.abs(orderTotalAmount), Math.abs(totalPurchases)) * 0.01;

  return (
    <Table.Tfoot className="bg-gray-50">
      <Table.Tr className="h-10 border-t border-b-0! border-gray-200 text-gray-700">
        <Table.Th colSpan={2}>{translate("Sum of invoice amounts", "مجموع مبالغ الفواتير")}</Table.Th>
        <Table.Th className={hasMismatch ? "font-semibold text-orange-600" : undefined}>
          {formatSum(totalPurchases)}
        </Table.Th>
        <Table.Th>{formatSum(totalDiscount)}</Table.Th>
        <Table.Th>{formatSum(vatAmount)}</Table.Th>
        <Table.Th>{formatSum(withholdingTaxAmount)}</Table.Th>
        <Table.Th>{formatSum(totalAmount)}</Table.Th>
      </Table.Tr>
      <Table.Tr className="h-10 border-t border-b-0! border-gray-200 text-gray-700">
        <Table.Th colSpan={2}>
          {hasMismatch
            ? translate("Calculated items total (mismatch)", "إجمالي الأصناف المحسوب (غير متطابق)")
            : translate("Calculated items total", "إجمالي الأصناف المحسوب")}
        </Table.Th>
        <Table.Th className={hasMismatch ? "font-semibold text-orange-600" : undefined}>
          {formatMoney(orderTotalAmount)}
        </Table.Th>
        <Table.Th colSpan={4} />
      </Table.Tr>
    </Table.Tfoot>
  );
}

export default function OrderInvoicesSection({
  invoices,
  isFetching,
  errorMessage,
  onRetry,
  orderTotalAmount,
  materialPurchaseOrderId,
  canAdd = false,
}: OrderInvoicesSectionProps) {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const resetFileRef = useRef<() => void>(null);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedSupplierInvoice | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [confirmOpened, setConfirmOpened] = useState(false);

  const showUpload = canAdd && !!materialPurchaseOrderId;

  async function handleFileSelect(file: File | null) {
    if (!file) return;
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
        getErrorMessage(locale, err) ||
          translate("Failed to read the PDF file.", "فشل قراءة ملف PDF."),
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
    <section className="mt-8 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-lg font-semibold text-gray-900">{translate("Invoices", "الفواتير")}</h4>

        {showUpload && (
          <FileButton resetRef={resetFileRef} onChange={handleFileSelect} accept="application/pdf,.pdf">
            {(props) => (
              <Button
                {...props}
                variant="filled"
                color="teal"
                size="sm"
                radius="md"
                leftSection={<Upload size={15} />}
                loading={isParsing}
              >
                {translate("Upload invoice", "رفع فاتورة")}
              </Button>
            )}
          </FileButton>
        )}
      </div>

      {parseError && <ErrorAlert error={parseError} fade />}

      {isFetching ? (
        <LoadingSection message={translate("Loading invoices...", "جاري تحميل الفواتير...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading invoices", "خطأ في تحميل الفواتير")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: onRetry }}
        />
      ) : !invoices || invoices.length === 0 ? (
        <EmptySection message={translate("No invoices for this order", "لا توجد فواتير لهذا الأمر")} />
      ) : (
        <div className="overflow-x-auto">
          <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{translate("Invoice Number", "رقم الفاتورة")}</Table.Th>
                <Table.Th>{translate("Issue Date", "تاريخ الإصدار")}</Table.Th>
                <Table.Th>
                  {translate(`Total Purchases (${translation.currency})`, `إجمالي المشتريات (${translation.currency})`)}
                </Table.Th>
                <Table.Th>{translate(`Discount (${translation.currency})`, `الخصم (${translation.currency})`)}</Table.Th>
                <Table.Th>
                  {translate(`VAT (${translation.currency})`, `ضريبة القيمة المضافة (${translation.currency})`)}
                </Table.Th>
                <Table.Th>
                  {translate(`Withholding Tax (${translation.currency})`, `ضريبة الخصم (${translation.currency})`)}
                </Table.Th>
                <Table.Th>
                  {translate(`Total Amount (${translation.currency})`, `الإجمالي (${translation.currency})`)}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {invoices.map((invoice) => (
                <Table.Tr key={invoice.id} className="text-gray-600">
                  <Table.Td className="font-semibold text-gray-800">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={getLocalizedHref(`/procurement/supplier-invoices/${invoice.id}`)}
                        className="font-mono hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                      <CopyButton text={invoice.invoiceNumber} />
                      {invoice.pdfFilename && (
                        <span title={translate("PDF attached", "ملف PDF مرفق")} className="text-teal-700">
                          <FileText size={14} strokeWidth={1.75} />
                        </span>
                      )}
                    </div>
                  </Table.Td>
                  <Table.Td>
                    {invoice.issuedAt ? formatDate(invoice.issuedAt, locale) : <span className="text-gray-400">-</span>}
                  </Table.Td>
                  <Table.Td>
                    {invoice.totalPurchases != null ? (
                      formatMoney(invoice.totalPurchases)
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {invoice.totalDiscount != null ? (
                      formatMoney(invoice.totalDiscount)
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {invoice.vatAmount != null ? formatMoney(invoice.vatAmount) : <span className="text-gray-400">-</span>}
                  </Table.Td>
                  <Table.Td>
                    {invoice.withholdingTaxAmount != null ? (
                      formatMoney(invoice.withholdingTaxAmount)
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {invoice.totalAmount != null ? (
                      formatMoney(invoice.totalAmount)
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
            {orderTotalAmount != null && <InvoicePurchasesFooter invoices={invoices} orderTotalAmount={orderTotalAmount} />}
          </Table>
        </div>
      )}

      {showUpload && (
        <UploadInvoiceConfirmModal
          mode="create"
          opened={confirmOpened}
          onClose={handleConfirmClose}
          materialPurchaseOrderId={materialPurchaseOrderId!}
          file={pendingFile}
          parsed={isParsing ? null : parsed}
        />
      )}
    </section>
  );
}
