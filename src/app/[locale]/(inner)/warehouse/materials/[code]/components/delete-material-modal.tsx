"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Alert, Button, Checkbox, Loader, TextInput } from "@mantine/core";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { getMaterialTypeLabel } from "@/lib/constants/enums/material-types";
import type { MaterialDeleteReferenceGroupKey, MaterialWithCreatorAndUnitConversions } from "@/types/material";
import Modal from "@/components/ui/modal";
import ErrorAlert from "@/components/ui/error-alert";

type ConfirmStep = "review" | "references" | "final";

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-2 text-sm last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-end font-medium text-gray-900">{value}</span>
    </div>
  );
}

function getGroupLabel(key: MaterialDeleteReferenceGroupKey, translate: (en: string, ar: string) => string) {
  switch (key) {
    case "unitConversions":
      return translate("Extra units", "وحدات إضافية");
    case "ownMmBomLines":
      return translate("Components in this item's recipe", "مكونات في وصفة هذا الصنف");
    case "componentOfMmBoms":
      return translate("Used inside other item recipes", "مستخدم داخل وصفات أصناف أخرى");
    case "productBomLines":
      return translate("Used in product recipes", "مستخدم في وصفات المنتجات");
    case "purchaseRequisitions":
      return translate("Purchase requests", "طلبات الشراء");
    case "purchaseOrders":
      return translate("Purchase orders", "أوامر التوريد");
    case "inventoryTransactions":
      return translate("Stock movements", "حركات المخزون");
    case "legacyIssuePermits":
      return translate("Old issue permits", "أذون الصرف القديمة");
    case "maintenanceOrders":
      return translate("Maintenance orders", "أوامر الصيانة");
    case "outsourcingOrders":
      return translate("Outsourcing orders", "أوامر التصنيع الخارجي");
    case "requestForQuotations":
      return translate("Quotation requests", "طلبات عروض الأسعار");
    case "supplierQuotations":
      return translate("Supplier quotations", "عروض أسعار الموردين");
  }
}

export default function DeleteMaterialModal({
  opened,
  close,
  material,
}: {
  opened: boolean;
  close: () => void;
  material: MaterialWithCreatorAndUnitConversions;
}) {
  const { locale, translate, translation } = useI18n();
  const router = useRouter();
  const getLocalizedHref = useLocaleHref();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();

  const [step, setStep] = useState<ConfirmStep>("review");
  const [acknowledged, setAcknowledged] = useState(false);
  const [typedCode, setTypedCode] = useState("");
  const [permanent, setPermanent] = useState(false);
  const didDefaultPermanent = useRef(false);

  const codeMatches = typedCode.trim() === material.code.trim();

  useEffect(() => {
    if (!opened) {
      setStep("review");
      setAcknowledged(false);
      setTypedCode("");
      setPermanent(false);
      didDefaultPermanent.current = false;
    }
  }, [opened]);

  const impactQuery = useQuery({
    queryKey: queryKeys.materials.deleteImpact(material.code),
    queryFn: ({ signal }) => materialsApi.getDeleteImpact({ privateRequest, code: material.code, signal }),
    enabled: opened,
  });

  const impact = impactQuery.data;
  const impactLoading = impactQuery.isFetching && !impact;
  const canChoosePermanent = !!impact?.canHardDelete;
  const hasLinks = !!impact && impact.totalReferenceCount > 0;

  useEffect(() => {
    if (!opened || !impact) return;
    if (!impact.canHardDelete) {
      setPermanent(false);
      return;
    }
    // Pre-select complete removal once when the material has no links.
    if (!didDefaultPermanent.current) {
      setPermanent(true);
      didDefaultPermanent.current = true;
    }
  }, [opened, impact]);

  const mutation = useMutation({
    mutationFn: async () => {
      await materialsApi.delete({
        privateRequest,
        code: material.code,
        dto: {
          confirmationCode: typedCode.trim(),
          permanent,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.materials.all });
      toast.success(
        permanent
          ? translate("Item permanently deleted", "تم حذف الصنف نهائيًا")
          : translate("Item deleted", "تم حذف الصنف"),
      );
      close();
      router.push(getLocalizedHref("/warehouse/materials"));
    },
  });

  const mutationError = mutation.error ? getErrorMessage(locale, mutation.error) : "";
  const impactError = impactQuery.error ? getErrorMessage(locale, impactQuery.error) : "";

  function handleClose() {
    if (mutation.isPending) return;
    close();
  }

  const stepTitle =
    step === "review"
      ? translate("Review deletion", "مراجعة الحذف")
      : step === "references"
        ? translate("Where this item is used", "أين يُستخدم هذا الصنف")
        : translate("Confirm deletion", "تأكيد الحذف");

  const stepIndex = step === "review" ? 1 : step === "references" ? 2 : 3;

  return (
    <Modal opened={opened} onClose={handleClose} title={stepTitle} size="lg">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
          {translate(`Step ${stepIndex} of 3`, `الخطوة ${stepIndex} من 3`)}
        </p>

        {step === "review" && (
          <>
            <div className="rounded-xl border border-gray-100 px-4 py-1">
              <SummaryRow label={translate("Code", "الكود")} value={<span className="font-mono">{material.code}</span>} />
              <SummaryRow label={translate("Title", "العنوان")} value={material.title} />
              <SummaryRow label={translate("Type", "النوع")} value={getMaterialTypeLabel(material.materialType, locale)} />
            </div>

            <Checkbox
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.currentTarget.checked)}
              color="clay"
              label={translate(
                "I understand this cannot be undone from the app.",
                "أفهم أنه لا يمكن التراجع عن هذا من التطبيق.",
              )}
            />

            <Checkbox
              checked={permanent}
              onChange={(e) => setPermanent(e.currentTarget.checked)}
              color="clay"
              disabled={impactLoading || !!impactError || !canChoosePermanent}
              label={translate(
                "Permanently delete this item (only when it is not used anywhere)",
                "حذف الصنف نهائيًا (فقط عندما لا يُستخدم في أي موضع)",
              )}
              description={
                !impactLoading && !impactError && !canChoosePermanent
                  ? translate(
                      "Unavailable while this item is still used in other documents.",
                      "غير متاح طالما أن هذا الصنف ما زال مستخدمًا في مستندات أخرى.",
                    )
                  : undefined
              }
            />

            <div className="flex gap-2">
              <Button variant="light" color="dark" radius="md" onClick={handleClose} fullWidth>
                {translation.cancel}
              </Button>
              <Button
                color="clay"
                radius="md"
                disabled={!acknowledged || impactLoading || !!impactError || !impact}
                onClick={() => setStep("references")}
                fullWidth
              >
                {translate("Continue", "متابعة")}
              </Button>
            </div>
          </>
        )}

        {step === "references" && (
          <>
            {impactLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
                <Loader size="sm" color="haze" />
                {translate("Loading usage details", "جاري تحميل تفاصيل الاستخدام")}
              </div>
            ) : impactError ? (
              <ErrorAlert error={impactError} />
            ) : impact && impact.totalReferenceCount === 0 ? (
              <Alert color="teal" radius="md" icon={<AlertCircle size={15} />}>
                {translate(
                  "This item is not used in any documents. You can hide it or permanently delete it.",
                  "هذا الصنف غير مستخدم في أي مستندات. يمكنك إخفاءه أو حذفه نهائيًا.",
                )}
              </Alert>
            ) : (
              impact && (
                <>
                  <Alert color="ochre" radius="md" icon={<AlertTriangle size={15} />}>
                    {permanent
                      ? translate(
                          "Permanent deletion is not possible while the item is still used below. Go back and turn off permanent deletion, or clear these links first.",
                          "لا يمكن حذف الصنف نهائيًا طالما أنه ما زال مستخدمًا أدناه. ارجع وأوقف الحذف النهائي، أو أزل هذه الروابط أولاً.",
                        )
                      : translate(
                          `This item is used in ${impact.totalReferenceCount} place(s). Hiding it keeps those documents unchanged.`,
                          `هذا الصنف مستخدم في ${impact.totalReferenceCount} موضع. إخفاؤه يبقي تلك المستندات كما هي.`,
                        )}
                  </Alert>

                  <div className="max-h-72 space-y-3 overflow-y-auto rounded-xl border border-gray-100 px-4 py-3">
                    {impact.groups.map((group) => (
                      <div key={group.key} className="text-sm">
                        <p className="font-medium text-gray-900">
                          {getGroupLabel(group.key, translate)}
                          <span className="ms-2 text-gray-500">({group.count})</span>
                        </p>
                        <p className="mt-1 font-mono text-xs break-all text-gray-600">
                          {group.samples.join(locale === "ar" ? "، " : ", ")}
                          {group.count > group.samples.length
                            ? translate(
                                ` and ${group.count - group.samples.length} more`,
                                ` و${group.count - group.samples.length} أخرى`,
                              )
                            : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )
            )}

            <div className="flex gap-2">
              <Button variant="light" color="dark" radius="md" onClick={() => setStep("review")} fullWidth>
                {translate("Back", "رجوع")}
              </Button>
              <Button
                color="clay"
                radius="md"
                disabled={impactLoading || !!impactError || !impact || (permanent && !canChoosePermanent)}
                onClick={() => setStep("final")}
                fullWidth
              >
                {translate("Continue", "متابعة")}
              </Button>
            </div>
          </>
        )}

        {step === "final" && (
          <>
            <Alert color="clay" radius="md" icon={<AlertTriangle size={15} />}>
              {permanent
                ? translate(
                    "This will permanently delete the item. Other documents will not be deleted.",
                    "سيؤدي هذا إلى حذف الصنف نهائيًا. لن تُحذف المستندات الأخرى.",
                  )
                : translate(
                    "The item will be hidden from lists and search. Existing documents will not change.",
                    "سيُخفى الصنف من القوائم والبحث، وتبقى المستندات الحالية دون تغيير.",
                  )}
            </Alert>

            <TextInput
              label={translate("Type the item code to confirm", "اكتب كود الصنف للتأكيد")}
              description={translate(
                `Enter “${material.code}” exactly to continue.`,
                `أدخل «${material.code}» كما هو للمتابعة.`,
              )}
              placeholder={material.code}
              value={typedCode}
              onChange={(e) => setTypedCode(e.currentTarget.value)}
              radius="md"
              autoComplete="off"
              data-autofocus
              error={
                typedCode.length > 0 && !codeMatches
                  ? translate("Does not match the item code.", "لا يطابق كود الصنف.")
                  : undefined
              }
            />

            {impact?.alreadyDeleted && !permanent && (
              <Alert color="ochre" radius="md" icon={<AlertCircle size={15} />}>
                {translate(
                  "This item is already hidden. Choose permanent deletion if it is not used anywhere.",
                  "هذا الصنف مخفي بالفعل. اختر حذف الصنف نهائيًا إن لم يكن مستخدمًا في أي موضع.",
                )}
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                variant="light"
                color="dark"
                radius="md"
                onClick={() => setStep("references")}
                disabled={mutation.isPending}
                fullWidth
              >
                {translate("Back", "رجوع")}
              </Button>
              <Button
                color="clay"
                radius="md"
                loading={mutation.isPending}
                disabled={!codeMatches || (permanent && !canChoosePermanent) || (!!impact?.alreadyDeleted && !permanent)}
                onClick={() => mutation.mutate()}
                fullWidth
              >
                {permanent
                  ? translate("Permanently delete item", "حذف الصنف نهائيًا")
                  : translate("Delete item", "حذف الصنف")}
              </Button>
            </div>

            {mutationError && <ErrorAlert error={mutationError} />}
          </>
        )}
      </div>
    </Modal>
  );
}
