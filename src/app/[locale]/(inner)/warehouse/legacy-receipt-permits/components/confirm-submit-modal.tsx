"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Checkbox, TextInput } from "@mantine/core";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { formatDate } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import Modal from "@/components/ui/modal";
import ErrorAlert from "@/components/ui/error-alert";
import { hasTotalsMismatch } from "./totals-summary";

export type ConfirmPermitSummary = {
  legacyNumber: string;
  receivedAt: string | null;
  itemCount: number;
  itemsTotal: number;
};

type ConfirmSubmitModalProps = {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  error: string;
  invoiceNumber: string;
  issuedAt: string | null;
  supplierName: string;
  invoicePurchases: number | null;
  itemsTotal: number;
  permits: ConfirmPermitSummary[];
};

type ConfirmStep = "review" | "mismatch" | "final";

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-2 text-sm last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-end font-medium text-gray-900">{value}</span>
    </div>
  );
}

export default function ConfirmSubmitModal({
  opened,
  onClose,
  onConfirm,
  loading,
  error,
  invoiceNumber,
  issuedAt,
  supplierName,
  invoicePurchases,
  itemsTotal,
  permits,
}: ConfirmSubmitModalProps) {
  const { locale, translate, translation } = useI18n();
  const mismatch = invoicePurchases != null && hasTotalsMismatch(invoicePurchases, itemsTotal);

  const [step, setStep] = useState<ConfirmStep>("review");
  const [acknowledgedImmutable, setAcknowledgedImmutable] = useState(false);
  const [typedInvoiceNumber, setTypedInvoiceNumber] = useState("");

  const invoiceNumberMatches = typedInvoiceNumber.trim() === invoiceNumber.trim();

  useEffect(() => {
    if (!opened) {
      setStep("review");
      setAcknowledgedImmutable(false);
      setTypedInvoiceNumber("");
    }
  }, [opened]);

  function handleClose() {
    if (loading) return;
    onClose();
  }

  function goNextFromReview() {
    if (!acknowledgedImmutable) return;
    setStep(mismatch ? "mismatch" : "final");
  }

  function goNextFromMismatch() {
    if (!invoiceNumberMatches) return;
    setStep("final");
  }

  const stepTitle =
    step === "review"
      ? translate("Review entry", "مراجعة الإدخال")
      : step === "mismatch"
        ? translate("Totals mismatch", "اختلاف الإجماليات")
        : translate("Final confirmation", "التأكيد النهائي");

  const stepIndex = step === "review" ? 1 : step === "mismatch" ? 2 : mismatch ? 3 : 2;
  const stepCount = mismatch ? 3 : 2;

  return (
    <Modal opened={opened} onClose={handleClose} title={stepTitle} size="lg">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
          {translate(`Step ${stepIndex} of ${stepCount}`, `الخطوة ${stepIndex} من ${stepCount}`)}
        </p>

        {step === "review" && (
          <>
            <Alert color="ochre" radius="md" icon={<AlertTriangle size={15} />}>
              {translate(
                "This reverse entry cannot be edited or undone from the app after you save. Review every value carefully.",
                "لا يمكن تعديل هذا الإدخال العكسي أو التراجع عنه من التطبيق بعد الحفظ. راجع كل القيم بعناية.",
              )}
            </Alert>

            <div className="rounded-xl border border-gray-100 px-4 py-1">
              <SummaryRow label={translate("Supplier", "المورد")} value={supplierName || "-"} />
              <SummaryRow label={translate("Invoice Number", "رقم الفاتورة")} value={invoiceNumber || "-"} />
              <SummaryRow
                label={translate("Issue Date", "تاريخ الإصدار")}
                value={issuedAt ? formatDate(issuedAt, locale) : "-"}
              />
              <SummaryRow
                label={translate(
                  `Invoice purchases (${translation.currency})`,
                  `إجمالي مشتريات الفاتورة (${translation.currency})`,
                )}
                value={invoicePurchases != null ? formatMoney(invoicePurchases) : "-"}
              />
              <SummaryRow
                label={translate(
                  `Items total (${translation.currency})`,
                  `إجمالي الأصناف (${translation.currency})`,
                )}
                value={formatMoney(itemsTotal)}
              />
              <SummaryRow
                label={translate("Addition permits", "أذون الإضافة")}
                value={permits.length}
              />
            </div>

            <div className="rounded-xl border border-gray-100 px-4 py-3">
              <p className="mb-2 text-sm font-medium text-gray-900">
                {translate("Permits summary", "ملخص الأذون")}
              </p>
              <ul className="space-y-1.5 text-sm text-gray-700">
                {permits.map((permit) => (
                  <li key={permit.legacyNumber} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono">{permit.legacyNumber}</span>
                    <span className="text-gray-500">
                      {permit.receivedAt ? formatDate(permit.receivedAt, locale) : "-"}
                      {" · "}
                      {translate(`${permit.itemCount} items`, `${permit.itemCount} بند`)}
                      {" · "}
                      {formatMoney(permit.itemsTotal)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <Checkbox
              checked={acknowledgedImmutable}
              onChange={(e) => setAcknowledgedImmutable(e.currentTarget.checked)}
              color="haze"
              label={translate(
                "I understand this data cannot be changed later.",
                "أفهم أن هذه البيانات لا يمكن تغييرها لاحقًا.",
              )}
            />

            <div className="flex gap-2">
              <Button variant="light" color="dark" radius="md" onClick={handleClose} fullWidth>
                {translation.cancel}
              </Button>
              <Button
                color="haze"
                radius="md"
                disabled={!acknowledgedImmutable}
                onClick={goNextFromReview}
                fullWidth
              >
                {translate("Continue", "متابعة")}
              </Button>
            </div>
          </>
        )}

        {step === "mismatch" && (
          <>
            <Alert color="clay" radius="md" icon={<AlertCircle size={15} />}>
              {translate(
                "Invoice purchases and items total differ by 1% or more. You must confirm this mismatch before saving, because the entry cannot be fixed later.",
                "إجمالي مشتريات الفاتورة وإجمالي الأصناف يختلفان بنسبة 1% أو أكثر. يجب تأكيد هذا الاختلاف قبل الحفظ، لأنه لا يمكن تصحيح الإدخال لاحقًا.",
              )}
            </Alert>

            <div className="rounded-xl border border-clay-200 bg-clay-50/40 px-4 py-1">
              <SummaryRow
                label={translate(
                  `Invoice purchases (${translation.currency})`,
                  `إجمالي مشتريات الفاتورة (${translation.currency})`,
                )}
                value={invoicePurchases != null ? formatMoney(invoicePurchases) : "-"}
              />
              <SummaryRow
                label={translate(
                  `Items total (${translation.currency})`,
                  `إجمالي الأصناف (${translation.currency})`,
                )}
                value={formatMoney(itemsTotal)}
              />
            </div>

            <TextInput
              label={translate(
                "Type the invoice number to acknowledge the mismatch",
                "اكتب رقم الفاتورة لتأكيد الاختلاف",
              )}
              description={translate(
                `Enter “${invoiceNumber}” exactly to continue.`,
                `أدخل «${invoiceNumber}» كما هو للمتابعة.`,
              )}
              placeholder={invoiceNumber}
              value={typedInvoiceNumber}
              onChange={(e) => setTypedInvoiceNumber(e.currentTarget.value)}
              radius="md"
              autoComplete="off"
              data-autofocus
              error={
                typedInvoiceNumber.length > 0 && !invoiceNumberMatches
                  ? translate("Does not match the invoice number.", "لا يطابق رقم الفاتورة.")
                  : undefined
              }
            />

            <div className="flex gap-2">
              <Button
                variant="light"
                color="dark"
                radius="md"
                onClick={() => setStep("review")}
                fullWidth
              >
                {translate("Back", "رجوع")}
              </Button>
              <Button
                color="clay"
                radius="md"
                disabled={!invoiceNumberMatches}
                onClick={goNextFromMismatch}
                fullWidth
              >
                {translate("Acknowledge and continue", "تأكيد ومتابعة")}
              </Button>
            </div>
          </>
        )}

        {step === "final" && (
          <>
            <Alert color="haze" radius="md" icon={<AlertTriangle size={15} />}>
              {translate(
                "Last step: saving will create the purchase order, receipts, inventory transactions, and supplier invoice together. This cannot be undone from the app.",
                "الخطوة الأخيرة: سينشئ الحفظ أمر التوريد وسندات الاستلام وحركات المخزون وفاتورة المورد معًا. لا يمكن التراجع عن ذلك من التطبيق.",
              )}
            </Alert>

            {mismatch && (
              <Alert color="ochre" radius="md" icon={<AlertCircle size={15} />}>
                {translate(
                  "You already acknowledged the totals mismatch.",
                  "لقد أكدت بالفعل اختلاف الإجماليات.",
                )}
              </Alert>
            )}

            <div className="rounded-xl border border-gray-100 px-4 py-1">
              <SummaryRow label={translate("Invoice Number", "رقم الفاتورة")} value={invoiceNumber} />
              <SummaryRow label={translate("Supplier", "المورد")} value={supplierName || "-"} />
              <SummaryRow
                label={translate("Addition permits", "أذون الإضافة")}
                value={permits.map((p) => p.legacyNumber).join(locale === "ar" ? "، " : ", ")}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="light"
                color="dark"
                radius="md"
                onClick={() => setStep(mismatch ? "mismatch" : "review")}
                disabled={loading}
                fullWidth
              >
                {translate("Back", "رجوع")}
              </Button>
              <Button color="haze" radius="md" loading={loading} onClick={onConfirm} fullWidth>
                {translate("Confirm and save", "تأكيد وحفظ")}
              </Button>
            </div>

            {error && <ErrorAlert error={error} />}
          </>
        )}
      </div>
    </Modal>
  );
}
