"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Alert, Badge, Button, Checkbox, Loader, TextInput } from "@mantine/core";
import { CircleAlert, Info, Merge } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import customersApi from "@/lib/api/customers";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { getCustomerClassificationLabel } from "@/lib/constants/enums/customer-classifications";
import type {
  CustomerMergeFieldPlan,
  CustomerMergeFlagClearPlan,
  CustomerMergeReferenceGroupKey,
  CustomerWithCreator,
} from "@/types/customer";
import Modal from "@/components/ui/modal";
import ErrorAlert from "@/components/ui/error-alert";
import SelectCustomer from "@/components/global/selections/remote-based/select-customer";

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-2 text-sm last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-end font-medium text-gray-900">{value}</span>
    </div>
  );
}

function getCustomerMergeReferenceGroupLabel(
  key: CustomerMergeReferenceGroupKey,
  translate: (en: string, ar: string) => string,
) {
  switch (key) {
    case "customer_addresses":
      return translate("Addresses", "العناوين");
    case "customer_contact_persons":
      return translate("Contact persons", "أشخاص الاتصال");
    case "inquiries":
      return translate("Inquiries", "الاستفسارات");
    case "contracts":
      return translate("Contracts", "العقود");
    case "customer_receptions":
      return translate("Customer receptions", "استلامات العملاء");
    case "maintenance_orders":
      return translate("Maintenance orders", "أوامر الصيانة");
    case "legacy_issue_permits":
      return translate("Legacy issue permits", "أذونات الصرف القديمة");
    case "service_agreements_via_addresses":
      return translate("Service agreements (via addresses)", "اتفاقيات الخدمة (عبر العناوين)");
    case "contracts_delivery_address":
      return translate("Contract delivery addresses", "عناوين تسليم العقود");
    case "maintenance_orders_address":
      return translate("Maintenance order addresses", "عناوين أوامر الصيانة");
    case "maintenance_orders_service_agreement":
      return translate("Maintenance orders via service agreements", "أوامر الصيانة عبر اتفاقيات الخدمة");
    default:
      return key;
  }
}

function getUniqueFieldLabel(column: string, translate: (en: string, ar: string) => string) {
  switch (column) {
    case "phone":
      return translate("Phone", "الهاتف");
    case "email":
      return translate("Email", "البريد الإلكتروني");
    case "tax_number":
      return translate("Tax number", "الرقم الضريبي");
    case "commercial_registration_number":
      return translate("Commercial registration", "رقم السجل التجاري");
    default:
      return column;
  }
}

function getFillFieldLabel(label: string, translate: (en: string, ar: string) => string) {
  switch (label) {
    case "classification":
      return translate("Classification", "التصنيف");
    case "website":
      return translate("Website", "الموقع الالكتروني");
    case "notes":
      return translate("Notes", "الملاحظات");
    default:
      return label;
  }
}

function displayValue(value: string | null | undefined) {
  return value?.trim() ? value : "-";
}

export default function MergeCustomerModal({
  opened,
  close,
  customer,
}: {
  opened: boolean;
  close: () => void;
  customer: CustomerWithCreator;
}) {
  const { locale, translate, translation } = useI18n();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();

  const [removeId, setRemoveId] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [typedCode, setTypedCode] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!opened) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemoveId(null);
    setAcknowledged(false);
    setTypedCode("");
    setValidationError("");
  }, [opened]);

  useEffect(() => {
    setAcknowledged(false);
    setTypedCode("");
    setValidationError("");
  }, [removeId]);

  const previewQuery = useQuery({
    queryKey: queryKeys.customers.mergePreview(customer.id, removeId),
    queryFn: ({ signal }) =>
      customersApi.previewMerge({
        privateRequest,
        id: customer.id,
        removeId: removeId as string,
        signal,
      }),
    enabled: opened && !!removeId,
  });

  const preview = removeId ? previewQuery.data : undefined;
  const previewLoading = !!removeId && previewQuery.isFetching;
  const previewError = removeId && previewQuery.error ? getErrorMessage(locale, previewQuery.error) : "";
  const removeCode = preview?.removed?.code ?? null;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!removeId) throw new Error("No customer selected");
      return await customersApi.merge({
        privateRequest,
        id: customer.id,
        dto: {
          removeId,
          confirmationCode: typedCode.trim(),
        },
      });
    },
    onSuccess: async () => {
      // Clear selection and close first so the preview query is disabled before
      // invalidate refetches (the removed customer no longer exists).
      setRemoveId(null);
      setAcknowledged(false);
      setTypedCode("");
      setValidationError("");
      close();
      toast.success(translate("Customers merged successfully", "تم دمج العملاء بنجاح"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.legacyIssuePermits.all }),
      ]);
      mutation.reset();
    },
  });

  const mutationError = mutation.error ? getErrorMessage(locale, mutation.error) : "";
  const error = validationError || mutationError || previewError;

  const codeMatches = !!removeCode && typedCode.trim() === removeCode.trim();
  const canSubmit =
    !!removeId &&
    !!preview &&
    preview.canMerge &&
    !previewLoading &&
    acknowledged &&
    codeMatches &&
    !mutation.isPending;

  function handleClose() {
    if (mutation.isPending) return;
    close();
    setTimeout(() => {
      setRemoveId(null);
      setAcknowledged(false);
      setTypedCode("");
      setValidationError("");
      mutation.reset();
    }, 250);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (!removeId) {
      return setValidationError(translate("Please select the duplicate customer.", "يرجى اختيار العميل المكرر."));
    }
    if (!preview?.canMerge) {
      return setValidationError(translate("This merge cannot proceed.", "لا يمكن متابعة هذا الدمج."));
    }
    if (!acknowledged) {
      return setValidationError(
        translate("Please confirm that you understand the merge impact.", "يرجى تأكيد فهمك لتأثير الدمج."),
      );
    }
    if (!codeMatches) {
      return setValidationError(
        translate("Please type the duplicate customer code exactly.", "يرجى كتابة كود العميل المكرر بدقة."),
      );
    }

    mutation.mutate();
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={translate("Merge duplicate into this customer", "دمج عميل مكرر في هذا العميل")}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="rounded-xl border border-gray-100 px-4 py-1">
          <SummaryRow label={translate("Keep", "الإبقاء")} value={<span className="font-mono">{customer.code}</span>} />
          <SummaryRow label={translate("Name", "الاسم")} value={customer.name} />
          <SummaryRow label={translate("Phone", "الهاتف")} value={displayValue(customer.phone)} />
          <SummaryRow label={translate("Email", "البريد الإلكتروني")} value={displayValue(customer.email)} />
          {customer.blacklistedAt ? (
            <SummaryRow
              label={translate("Status", "الحالة")}
              value={
                <Badge color="clay" variant="light" radius="sm">
                  {translate("Blacklisted", "في القائمة السوداء")}
                </Badge>
              }
            />
          ) : null}
        </div>

        <SelectCustomer
          value={removeId}
          setValue={setRemoveId}
          label={translate("Duplicate to remove", "المكرر المراد إزالته")}
          placeholder={translate("Search customer to merge away", "ابحث عن العميل لإزالته")}
          required
        />

        {removeId && previewLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader size="sm" />
            {translate("Checking merge impact...", "جاري التحقق من تأثير الدمج...")}
          </div>
        )}

        {preview?.removed?.code && (
          <div className="rounded-xl border border-gray-100 px-4 py-1">
            <SummaryRow
              label={translate("Remove", "الإزالة")}
              value={<span className="font-mono">{preview.removed.code}</span>}
            />
            <SummaryRow label={translate("Name", "الاسم")} value={preview.removed.name} />
            <SummaryRow label={translate("Phone", "الهاتف")} value={displayValue(preview.removed.phone)} />
            <SummaryRow label={translate("Email", "البريد الإلكتروني")} value={displayValue(preview.removed.email)} />
            {preview.removed.blacklistedAt ? (
              <SummaryRow
                label={translate("Status", "الحالة")}
                value={
                  <Badge color="clay" variant="light" radius="sm">
                    {translate("Blacklisted", "في القائمة السوداء")}
                  </Badge>
                }
              />
            ) : null}
          </div>
        )}

        {preview && preview.blockers.length > 0 && (
          <Alert color="clay" icon={<CircleAlert size={16} />} radius="md">
            <ul className="list-disc space-y-1 ps-4 text-sm">
              {preview.blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </Alert>
        )}

        {preview && preview.canMerge && (
          <>
            {(preview.referenceCounts.length > 0 || preview.followCounts.length > 0) && (
              <div className="rounded-xl border border-gray-100 px-4 py-3">
                <p className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Usage moved to this customer", "الاستخدامات التي ستُنقل إلى هذا العميل")}
                </p>
                <ul className="space-y-1 text-sm">
                  {preview.referenceCounts.map((row) => (
                    <li key={row.key} className="flex items-center justify-between gap-3">
                      <span>{getCustomerMergeReferenceGroupLabel(row.key, translate)}</span>
                      <span className="font-medium tabular-nums">{row.count}</span>
                    </li>
                  ))}
                  {preview.followCounts.map((row) => (
                    <li key={row.key} className="flex items-center justify-between gap-3">
                      <span>{getCustomerMergeReferenceGroupLabel(row.key, translate)}</span>
                      <span className="font-medium tabular-nums">{row.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {preview.flagClear && <FlagClearSection flagClear={preview.flagClear} translate={translate} />}

            {preview.fieldPlan && (
              <FieldPlanSection fieldPlan={preview.fieldPlan} locale={locale} translate={translate} />
            )}

            <Checkbox
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.currentTarget.checked)}
              color="clay"
              label={translate(
                "I understand the duplicate will be permanently removed and all its usage moved to this customer",
                "أفهم أنه سيتم حذف المكرر نهائياً ونقل كل استخداماته إلى هذا العميل",
              )}
              radius="md"
            />

            <TextInput
              label={translate("Type the duplicate code to confirm", "اكتب كود المكرر للتأكيد")}
              placeholder={removeCode ?? undefined}
              value={typedCode}
              onChange={(e) => setTypedCode(e.currentTarget.value)}
              radius="md"
              required
            />
          </>
        )}

        <div className="flex gap-2">
          <Button onClick={handleClose} variant="light" color="dark" radius="md" fullWidth disabled={mutation.isPending}>
            {translation.cancel}
          </Button>
          <Button
            type="submit"
            color="clay"
            radius="md"
            loading={mutation.isPending}
            disabled={!canSubmit}
            fullWidth
            leftSection={<Merge size={14} />}
          >
            {translate("Merge customers", "دمج العملاء")}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}

function FlagClearSection({
  flagClear,
  translate,
}: {
  flagClear: CustomerMergeFlagClearPlan;
  translate: (en: string, ar: string) => string;
}) {
  if (!flagClear.clearRemovedDefaultAddress && !flagClear.clearRemovedPrimaryContact) return null;

  return (
    <div className="rounded-xl border border-gray-100 px-4 py-3">
      <p className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
        {translate("Flags to clear on duplicate", "العلامات التي ستُزال من المكرر")}
      </p>
      <ul className="space-y-1 text-sm text-gray-700">
        {flagClear.clearRemovedDefaultAddress ? (
          <li>{translate("Clear default address on the duplicate", "إزالة العنوان الافتراضي من المكرر")}</li>
        ) : null}
        {flagClear.clearRemovedPrimaryContact ? (
          <li>{translate("Clear primary contact on the duplicate", "إزالة شخص الاتصال الأساسي من المكرر")}</li>
        ) : null}
      </ul>
    </div>
  );
}

function FieldPlanSection({
  fieldPlan,
  locale,
  translate,
}: {
  fieldPlan: CustomerMergeFieldPlan;
  locale: "en" | "ar";
  translate: (en: string, ar: string) => string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 px-4 py-3">
      <p className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
        {translate("Kept customer fields after merge", "حقول العميل المُبقى بعد الدمج")}
      </p>
      <ul className="space-y-1 text-sm text-gray-700">
        <li>
          {translate("Name stays", "الاسم يبقى")}: {fieldPlan.nameKept}
          {fieldPlan.nameDropped
            ? ` (${translate(`dropped removed "${fieldPlan.nameDropped}"`, `يُسقط اسم المكرر "${fieldPlan.nameDropped}"`)})`
            : ""}
        </li>
        {fieldPlan.uniqueFields.map((field) => (
          <li key={field.dbColumn}>
            {getUniqueFieldLabel(field.dbColumn, translate)}:{" "}
            {field.fill
              ? `${translate("(empty)", "(فارغ)")} → ${displayValue(field.removeValue)}`
              : displayValue(field.keepValue)}
          </li>
        ))}
        {fieldPlan.fillFields.map((field) => {
          const label = getFillFieldLabel(field.label, translate);
          let valueText = displayValue(field.keepValue);
          if (field.label === "classification" && field.keepValue) {
            valueText = getCustomerClassificationLabel(field.keepValue as never, locale);
          }
          if (field.fill) {
            const filled =
              field.label === "classification" && field.removeValue
                ? getCustomerClassificationLabel(field.removeValue as never, locale)
                : displayValue(field.removeValue);
            valueText = `${translate("(empty)", "(فارغ)")} → ${filled}`;
          } else if (field.drop) {
            const dropped =
              field.label === "classification" && field.removeValue
                ? getCustomerClassificationLabel(field.removeValue as never, locale)
                : displayValue(field.removeValue);
            valueText = `${displayValue(field.keepValue)} (${translate(`dropped removed=${dropped}`, `يُسقط المكرر=${dropped}`)})`;
          }
          return (
            <li key={field.label}>
              {label}: {valueText}
            </li>
          );
        })}
        {fieldPlan.copyBlacklist ? (
          <li>
            <Alert color="ochre" icon={<Info size={16} />} radius="md" className="mt-1">
              {translate(
                "Blacklist status will be copied from the duplicate to this customer",
                "ستُنسخ حالة القائمة السوداء من المكرر إلى هذا العميل",
              )}
            </Alert>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
