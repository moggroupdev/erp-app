"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@mantine/core";
import { ArrowLeft, Building2, CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useUnsavedChangesWarning from "@/hooks/use-unsaved-changes-warning";
import usePrivateRequest from "@/hooks/use-private-request";
import legacyReceiptPermitsApi from "@/lib/api/legacy-receipt-permits";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { dateOnlyToTwoPmIso } from "@/lib/helpers/datetime-picker";
import { queryKeys } from "@/lib/api/query-keys";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import type { MaterialWithUnitConversionsSelection } from "@/types/material";
import type { LegacyReceiptPermitCreateResult } from "@/types/legacy-receipt-permit";
import ErrorAlert from "@/components/ui/error-alert";
import ProtectedLink from "@/components/ui/protected-link";
import SelectSupplier from "@/components/global/selections/remote-based/select-supplier";
import InvoicePdfSection, {
  emptyInvoice,
  type InvoiceFormState,
} from "./components/invoice-pdf-section";
import PermitBlock, {
  createEmptyItem,
  createEmptyPermit,
  type PermitDraft,
  type PermitItemDraft,
} from "./components/permit-block";
import TotalsSummary from "./components/totals-summary";

const PAGE_TITLE = { en: "Legacy Receipt Permits", ar: "أذونات الإضافة المرحلية" };

function PageHeading({ onBack, title }: { onBack: () => void; title: { en: string; ar: string } }) {
  const { translate, translation } = useI18n();

  return (
    <header className="flex items-center gap-3">
      <Button
        type="button"
        onClick={onBack}
        title={translation.back}
        aria-label={translation.back}
        variant="light"
        color="dark"
        radius={20}
        p={0}
        h={40}
        w={40}
      >
        <ArrowLeft size={18} style={{ transform: `rotateY(${translate("0deg", "180deg")})` }} />
      </Button>
      <h1>{translate(title.en, title.ar)}</h1>
    </header>
  );
}

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const router = useRouter();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<InvoiceFormState>(emptyInvoice);
  const [permits, setPermits] = useState<PermitDraft[]>([createEmptyPermit()]);
  const [validationError, setValidationError] = useState("");
  const [result, setResult] = useState<LegacyReceiptPermitCreateResult | null>(null);

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const isDirty =
    !!pdfFile ||
    !!supplierId ||
    !!invoice.invoiceNumber ||
    permits.some(
      (permit) =>
        !!permit.legacyNumber ||
        !!permit.receivedAt ||
        permit.items.some((item) => !!item.materialCode || item.quantity !== "" || item.unitPrice !== ""),
    );

  const confirmNavigation = useUnsavedChangesWarning(isDirty && !result);

  const itemsTotal = useMemo(() => {
    return permits.reduce((sum, permit) => {
      return (
        sum +
        permit.items.reduce((inner, item) => {
          const qty = typeof item.quantity === "number" ? item.quantity : 0;
          const price = typeof item.unitPrice === "number" ? item.unitPrice : 0;
          return inner + qty * price;
        }, 0)
      );
    }, 0);
  }, [permits]);

  const invoicePurchases = typeof invoice.totalPurchases === "number" ? invoice.totalPurchases : null;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!pdfFile) throw new Error(translate("Invoice PDF is required.", "ملف PDF للفاتورة مطلوب."));
      if (!supplierId) throw new Error(translate("Supplier is required.", "المورد مطلوب."));
      if (!invoice.invoiceNumber.trim()) {
        throw new Error(translate("Invoice number is required.", "رقم الفاتورة مطلوب."));
      }
      if (!invoice.issuedAt) {
        throw new Error(translate("Invoice issue date is required.", "تاريخ إصدار الفاتورة مطلوب."));
      }

      const issuedAtIso = dateOnlyToTwoPmIso(invoice.issuedAt);
      if (!issuedAtIso) {
        throw new Error(translate("Invalid invoice issue date.", "تاريخ إصدار الفاتورة غير صالح."));
      }

      const payloadPermits = permits.map((permit) => {
        const legacyNumber = permit.legacyNumber.trim();
        if (!legacyNumber) {
          throw new Error(translate("Each permit needs a number.", "كل إذن إضافة يحتاج رقمًا."));
        }
        if (!permit.receivedAt) {
          throw new Error(
            translate(
              `Permit \`${legacyNumber}\` needs a date.`,
              `إذن الإضافة \`${legacyNumber}\` يحتاج تاريخًا.`,
            ),
          );
        }
        const receivedAtIso = dateOnlyToTwoPmIso(permit.receivedAt);
        if (!receivedAtIso) {
          throw new Error(
            translate(
              `Invalid date for permit \`${legacyNumber}\`.`,
              `تاريخ إذن الإضافة \`${legacyNumber}\` غير صالح.`,
            ),
          );
        }

        const items = permit.items
          .filter((item) => item.materialCode)
          .map((item) => {
            if (!item.materialCode || !item.unitOfMeasurementSelected) {
              throw new Error(
                translate(
                  `Complete all material rows in permit \`${legacyNumber}\`.`,
                  `أكمل كل بنود المواد في إذن الإضافة \`${legacyNumber}\`.`,
                ),
              );
            }
            if (typeof item.quantity !== "number" || item.quantity <= 0) {
              throw new Error(
                translate(
                  `Quantity must be positive in permit \`${legacyNumber}\`.`,
                  `يجب أن تكون الكمية موجبة في إذن الإضافة \`${legacyNumber}\`.`,
                ),
              );
            }
            if (typeof item.unitPrice !== "number" || item.unitPrice <= 0) {
              throw new Error(
                translate(
                  `Unit price must be positive in permit \`${legacyNumber}\`.`,
                  `يجب أن يكون سعر الوحدة موجبًا في إذن الإضافة \`${legacyNumber}\`.`,
                ),
              );
            }
            return {
              materialCode: item.materialCode,
              unitOfMeasurementSelected: item.unitOfMeasurementSelected,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            };
          });

        if (items.length === 0) {
          throw new Error(
            translate(
              `Permit \`${legacyNumber}\` needs at least one item.`,
              `إذن الإضافة \`${legacyNumber}\` يحتاج بندًا واحدًا على الأقل.`,
            ),
          );
        }

        return { legacyNumber, receivedAt: receivedAtIso, items };
      });

      const legacyNumbers = payloadPermits.map((permit) => permit.legacyNumber);
      if (new Set(legacyNumbers).size !== legacyNumbers.length) {
        throw new Error(
          translate("Addition permit numbers must be unique.", "أرقام أذون الإضافة يجب أن تكون فريدة."),
        );
      }

      return await legacyReceiptPermitsApi.create({
        privateRequest,
        file: pdfFile,
        payload: {
          supplierId,
          invoice: {
            invoiceNumber: invoice.invoiceNumber.trim(),
            issuedAt: issuedAtIso,
            totalPurchases: typeof invoice.totalPurchases === "number" ? invoice.totalPurchases : null,
            totalDiscount: typeof invoice.totalDiscount === "number" ? invoice.totalDiscount : null,
            vatAmount: typeof invoice.vatAmount === "number" ? invoice.vatAmount : null,
            withholdingTaxAmount:
              typeof invoice.withholdingTaxAmount === "number" ? invoice.withholdingTaxAmount : null,
            totalAmount: typeof invoice.totalAmount === "number" ? invoice.totalAmount : null,
          },
          permits: payloadPermits,
        },
      });
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.materialPurchaseOrders.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.supplierInvoices.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventoryTransactions.all }),
      ]);
      setResult(data);
      setValidationError("");
      toast.success(
        translate("Legacy receipt entry saved successfully.", "تم حفظ إدخال إذن الإضافة المرحلي بنجاح."),
      );
    },
  });

  function resetForm() {
    setPdfFile(null);
    setSupplierId(null);
    setInvoice(emptyInvoice());
    setPermits([createEmptyPermit()]);
    setValidationError("");
    setResult(null);
    mutation.reset();
  }

  function handleInvoiceChange(patch: Partial<InvoiceFormState>) {
    setInvoice((prev) => ({ ...prev, ...patch }));
  }

  function updatePermit(key: string, patch: Partial<Omit<PermitDraft, "key" | "items">>) {
    setPermits((prev) => prev.map((permit) => (permit.key === key ? { ...permit, ...patch } : permit)));
  }

  function removePermit(key: string) {
    setPermits((prev) => (prev.length <= 1 ? prev : prev.filter((permit) => permit.key !== key)));
  }

  function addPermit() {
    setPermits((prev) => [...prev, createEmptyPermit()]);
  }

  function addItem(permitKey: string) {
    setPermits((prev) =>
      prev.map((permit) =>
        permit.key === permitKey ? { ...permit, items: [...permit.items, createEmptyItem()] } : permit,
      ),
    );
  }

  function updateItem(permitKey: string, itemKey: string, patch: Partial<PermitItemDraft>) {
    setPermits((prev) =>
      prev.map((permit) => {
        if (permit.key !== permitKey) return permit;
        return {
          ...permit,
          items: permit.items.map((item) => (item.key === itemKey ? { ...item, ...patch } : item)),
        };
      }),
    );
  }

  function removeItem(permitKey: string, itemKey: string) {
    setPermits((prev) =>
      prev.map((permit) => {
        if (permit.key !== permitKey) return permit;
        if (permit.items.length <= 1) return permit;
        return { ...permit, items: permit.items.filter((item) => item.key !== itemKey) };
      }),
    );
  }

  function handleMaterialSelect(
    permitKey: string,
    itemKey: string,
    material: MaterialWithUnitConversionsSelection | null,
  ) {
    if (!material) {
      updateItem(permitKey, itemKey, {
        materialCode: null,
        materialTitle: "",
        materialType: null,
        unitOfMeasurement: null,
        unitConversions: [],
        unitOfMeasurementSelected: null,
      });
      return;
    }

    updateItem(permitKey, itemKey, {
      materialCode: material.code,
      materialTitle: material.title,
      materialType: material.materialType,
      unitOfMeasurement: material.unitOfMeasurement,
      unitConversions: material.unitConversions ?? [],
      unitOfMeasurementSelected: material.unitOfMeasurement,
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");
    mutation.mutate(undefined, {
      onError: (err) => {
        setValidationError(getErrorMessage(locale, err));
      },
    });
  }

  if (result) {
    return (
      <div className="flex min-h-full flex-col gap-5">
        <PageHeading title={PAGE_TITLE} onBack={() => router.back()} />
        <section className="overflow-hidden rounded-2xl bg-white">
          <div className="flex flex-col gap-4 px-5 py-5">
            <div className="flex items-center gap-2 text-teal-800">
              <CheckCircle2 size={20} />
              <h2 className="text-lg font-semibold">{translate("Entry saved", "تم الحفظ")}</h2>
            </div>

            <div className="flex flex-col gap-2 text-sm text-gray-800">
              <div>
                {translate("Purchase order", "أمر التوريد")}:{" "}
                <ProtectedLink
                  permission={PERMISSIONS.READ_MATERIAL_PURCHASE_ORDERS}
                  href={`/procurement/material-orders/${result.materialPurchaseOrder.id}`}
                  className="font-mono font-semibold text-haze-700 hover:underline"
                >
                  {result.materialPurchaseOrder.code}
                </ProtectedLink>
              </div>
              <div>
                {translate("Supplier invoice", "فاتورة المورد")}:{" "}
                <ProtectedLink
                  permission={PERMISSIONS.READ_SUPPLIER_INVOICES}
                  href={`/procurement/supplier-invoices/${result.supplierInvoice.id}`}
                  className="font-mono font-semibold text-haze-700 hover:underline"
                >
                  {result.supplierInvoice.invoiceNumber}
                </ProtectedLink>
              </div>
              <div className="mt-1 font-medium">{translate("Addition permits", "أذون الإضافة")}:</div>
              <ul className="list-inside list-disc space-y-1">
                {result.permits.map((permit) => (
                  <li key={permit.inventoryTransaction.id}>
                    <span className="font-mono">{permit.legacyNumber}</span>
                    {" → "}
                    <ProtectedLink
                      permission={PERMISSIONS.READ_INVENTORY_TRANSACTIONS}
                      href={`/warehouse/transactions/${permit.inventoryTransaction.id}`}
                      className="font-mono text-haze-700 hover:underline"
                    >
                      {permit.inventoryTransaction.code}
                    </ProtectedLink>
                    <span className="text-gray-500"> ({permit.receipt.code})</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button color="haze" radius="md" onClick={resetForm}>
                {translate("New entry", "إدخال جديد")}
              </Button>
              <Button
                variant="light"
                color="dark"
                radius="md"
                component={Link}
                href={getLocalizedHref("/warehouse/transactions")}
              >
                {translate("Back to transactions", "العودة إلى حركات المخزون")}
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-5">
      <PageHeading
        title={PAGE_TITLE}
        onBack={() => {
          if (confirmNavigation()) router.back();
        }}
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="rounded-xl bg-haze-50 px-4 py-3 text-sm text-haze-800">
          {translate(
            "Temporary reverse entry: upload the supplier invoice PDF and enter one or more addition permits. The system creates the purchase order, receipts, inventory transactions, and invoice together.",
            "إدخال عكسي مؤقت: ارفع ملف PDF لفاتورة المورد وأدخل إذن إضافة واحدًا أو أكثر. ينشئ النظام أمر التوريد وسندات الاستلام وحركات المخزون والفاتورة معًا.",
          )}
        </div>

        <InvoicePdfSection
          file={pdfFile}
          onFileChange={setPdfFile}
          invoice={invoice}
          onInvoiceChange={handleInvoiceChange}
        />

        <section className="overflow-hidden rounded-2xl bg-white">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-haze-600 text-white">
              <Building2 size={18} />
            </span>
            <div>
              <h4 className="text-base font-semibold text-gray-950">
                {translate("Supplier", "المورد")}
              </h4>
              <p className="text-sm text-gray-500">
                {translate(
                  "Select the supplier shown on the invoice.",
                  "اختر المورد الظاهر في الفاتورة.",
                )}
              </p>
            </div>
          </div>
          <div className="px-5 py-5">
            <div className="w-[500px] max-w-full">
              <SelectSupplier
                value={supplierId}
                setValue={setSupplierId}
                label={translate("Supplier", "المورد")}
                placeholder={translate("Search by name or code...", "ابحث بالاسم أو الكود...")}
                withBrowseModal
                required
                radius="md"
              />
            </div>
          </div>
        </section>

        {permits.map((permit, index) => (
          <PermitBlock
            key={permit.key}
            permit={permit}
            index={index}
            locale={locale}
            canRemove={permits.length > 1}
            onUpdate={updatePermit}
            onRemove={removePermit}
            onAddItem={addItem}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            onMaterialSelect={handleMaterialSelect}
          />
        ))}

        <div>
          <Button
            type="button"
            variant="light"
            color="haze"
            radius="md"
            leftSection={<Plus size={15} />}
            onClick={addPermit}
          >
            {translate("Add another permit", "إضافة إذن آخر")}
          </Button>
        </div>

        <TotalsSummary itemsTotal={itemsTotal} invoicePurchases={invoicePurchases} />

        {(validationError || mutation.error) && (
          <ErrorAlert error={validationError || getErrorMessage(locale, mutation.error)} />
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="light"
            color="dark"
            radius="md"
            onClick={() => {
              if (confirmNavigation()) router.push(getLocalizedHref("/warehouse/transactions"));
            }}
          >
            {translation.cancel}
          </Button>
          <Button type="submit" color="haze" radius="md" loading={mutation.isPending}>
            {translate("Save reverse entry", "حفظ الإدخال العكسي")}
          </Button>
        </div>
      </form>
    </div>
  );
}
