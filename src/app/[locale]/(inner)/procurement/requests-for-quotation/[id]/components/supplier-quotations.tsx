"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, NumberInput, TextInput } from "@mantine/core";
import DateTimePickerInput from "@/components/ui/datetime-picker-input";
import DataSelect from "@/components/ui/data-select";
import ErrorAlert from "@/components/ui/error-alert";
import SelectSupplier from "@/components/global/selections/remote-based/select-supplier";
import usePrivateRequest from "@/hooks/use-private-request";
import requestForQuotationsApi from "@/lib/api/request-for-quotations";
import { queryKeys } from "@/lib/api/query-keys";
import { getMaterialUnitLabel, getMaterialUnitSelectOptions, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { isRawMaterial } from "@/lib/constants/enums/material-types";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { useI18n } from "@/lib/i18n/hooks";
import type { RequestForQuotationDetailed, SupplierQuotation } from "@/types/request-for-quotation";
import { getSupplierQuotationStatus, getSupplierQuotationStatusLabel } from "../../helpers";

function toIso(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

type PriceDraft = {
  unit: MaterialUnit;
  price: number | "";
  notes: string;
};

export default function SupplierQuotations({
  request,
  canUpdate,
}: {
  request: RequestForQuotationDetailed;
  canUpdate: boolean;
}) {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const editable = canUpdate && !!request.issuedAt && !request.closedAt && !request.cancelledAt;

  function refresh() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.requestForQuotations.detail(request.id) });
  }

  const invite = useMutation({
    mutationFn: () =>
      requestForQuotationsApi.inviteSupplier({
        privateRequest,
        id: request.id,
        supplierId: supplierId!,
      }),
    onSuccess: async () => {
      setSupplierId(null);
      setError("");
      await refresh();
    },
    onError: (err) => setError(getErrorMessage(locale, err)),
  });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-semibold">{translate("Supplier quotations", "عروض الموردين")}</h2>
        {editable && (
          <div className="flex min-w-72 flex-1 items-end gap-2">
            <SelectSupplier
              value={supplierId}
              setValue={setSupplierId}
              excludeIds={request.supplierQuotations.map((quotation) => quotation.supplierId)}
              placeholder={translate("Invite a supplier", "دعوة مورد")}
              className="flex-1"
            />
            <Button color="haze" disabled={!supplierId} loading={invite.isPending} onClick={() => invite.mutate()}>
              {translate("Invite", "دعوة")}
            </Button>
          </div>
        )}
      </div>
      {error && <ErrorAlert error={error} />}
      {request.supplierQuotations.length === 0 ? (
        <p className="text-sm text-gray-500">{translate("No suppliers invited yet.", "لم تتم دعوة موردين بعد.")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {request.supplierQuotations.map((quotation) => (
            <QuotationCard
              key={quotation.id}
              request={request}
              quotation={quotation}
              editable={editable}
              onError={setError}
              onSaved={refresh}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function QuotationCard({
  request,
  quotation,
  editable,
  onError,
  onSaved,
}: {
  request: RequestForQuotationDetailed;
  quotation: SupplierQuotation;
  editable: boolean;
  onError: (message: string) => void;
  onSaved: () => Promise<void>;
}) {
  const { locale, translate, translation } = useI18n();
  const privateRequest = usePrivateRequest();
  const status = getSupplierQuotationStatus(quotation);
  const statusMeta = getSupplierQuotationStatusLabel(status, translate);
  const invited = status === "invited";

  const [paymentTerms, setPaymentTerms] = useState(quotation.paymentTerms ?? "");
  const [deliveryTerms, setDeliveryTerms] = useState(quotation.deliveryTerms ?? "");
  const [deliveryPeriodDays, setDeliveryPeriodDays] = useState<number | "">(quotation.deliveryPeriodDays ?? "");
  const [validUntil, setValidUntil] = useState<string | null>(quotation.validUntil);
  const [notes, setNotes] = useState(quotation.notes ?? "");
  const [prices, setPrices] = useState<Record<string, PriceDraft>>(() => {
    const initial: Record<string, PriceDraft> = {};
    for (const item of request.items) {
      const existing = quotation.items.find((line) => line.requestForQuotationItemId === item.id);
      initial[item.id] = {
        unit: existing?.unitOfMeasurementSelected ?? item.unitOfMeasurementSelected,
        price: existing ? Number(existing.unitPrice) : "",
        notes: existing?.notes ?? "",
      };
    }
    return initial;
  });

  const submit = useMutation({
    mutationFn: () => {
      const items = request.items.flatMap((item) => {
        const draft = prices[item.id];
        if (!draft || draft.price === "") return [];
        return [
          {
            requestForQuotationItemId: item.id,
            unitOfMeasurementSelected: draft.unit,
            unitPrice: Number(draft.price),
            notes: draft.notes.trim() || null,
          },
        ];
      });
      if (items.length === 0 || deliveryPeriodDays === "" || !validUntil) {
        throw new Error(
          translate(
            "Enter a validity date, delivery days, and at least one price.",
            "أدخل تاريخ الصلاحية ومدة التوريد وسعراً واحداً على الأقل.",
          ),
        );
      }
      return requestForQuotationsApi.submitQuotation({
        privateRequest,
        id: request.id,
        quotationId: quotation.id,
        dto: {
          paymentTerms: paymentTerms.trim() || null,
          deliveryTerms: deliveryTerms.trim() || null,
          deliveryPeriodDays: Number(deliveryPeriodDays),
          validUntil: toIso(validUntil)!,
          notes: notes.trim() || null,
          items,
        },
      });
    },
    onSuccess: async () => {
      onError("");
      await onSaved();
    },
    onError: (err) => onError(getErrorMessage(locale, err)),
  });

  const decline = useMutation({
    mutationFn: () => requestForQuotationsApi.declineQuotation({ privateRequest, id: request.id, quotationId: quotation.id }),
    onSuccess: async () => {
      onError("");
      await onSaved();
    },
    onError: (err) => onError(getErrorMessage(locale, err)),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (deliveryPeriodDays === "" || !validUntil) {
        throw new Error(
          translate("A submitted quotation needs a validity date and delivery days.", "عرض السعر المقدم يحتاج تاريخ صلاحية ومدة توريد."),
        );
      }
      await requestForQuotationsApi.updateQuotation({
        privateRequest,
        id: request.id,
        quotationId: quotation.id,
        dto: {
          paymentTerms: paymentTerms.trim() || null,
          deliveryTerms: deliveryTerms.trim() || null,
          deliveryPeriodDays: Number(deliveryPeriodDays),
          validUntil: toIso(validUntil),
          notes: notes.trim() || null,
        },
      });
      for (const item of request.items) {
        const draft = prices[item.id];
        const existing = quotation.items.find((line) => line.requestForQuotationItemId === item.id);
        if (!draft || draft.price === "") {
          if (existing) {
            await requestForQuotationsApi.deleteQuotationItem({
              privateRequest,
              id: request.id,
              quotationId: quotation.id,
              itemId: existing.id,
            });
          }
          continue;
        }
        if (!existing) {
          await requestForQuotationsApi.addQuotationItem({
            privateRequest,
            id: request.id,
            quotationId: quotation.id,
            dto: {
              requestForQuotationItemId: item.id,
              unitOfMeasurementSelected: draft.unit,
              unitPrice: Number(draft.price),
              notes: draft.notes.trim() || null,
            },
          });
          continue;
        }
        await requestForQuotationsApi.updateQuotationItem({
          privateRequest,
          id: request.id,
          quotationId: quotation.id,
          itemId: existing.id,
          dto: {
            unitOfMeasurementSelected: draft.unit,
            unitPrice: Number(draft.price),
            notes: draft.notes.trim() || null,
          },
        });
      }
    },
    onSuccess: async () => {
      onError("");
      await onSaved();
    },
    onError: (err) => onError(getErrorMessage(locale, err)),
  });

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{quotation.supplier.name}</h3>
          <Badge variant="light" color={statusMeta.color} radius="md">
            {statusMeta.label}
          </Badge>
        </div>
        {editable && invited && (
          <Button
            variant="light"
            color="clay"
            loading={decline.isPending}
            onClick={() => {
              if (window.confirm(translate("Decline this supplier?", "رفض هذا المورد؟"))) decline.mutate();
            }}
          >
            {translate("Decline", "رفض")}
          </Button>
        )}
      </div>

      {status === "declined" ? (
        <p className="text-sm text-gray-500">{translate("This supplier declined to quote.", "رفض هذا المورد تقديم عرض.")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput
              label={translate("Payment terms", "شروط الدفع")}
              value={paymentTerms}
              onChange={(event) => setPaymentTerms(event.currentTarget.value)}
              disabled={!editable}
              radius="md"
            />
            <TextInput
              label={translate("Delivery terms", "شروط التوريد")}
              value={deliveryTerms}
              onChange={(event) => setDeliveryTerms(event.currentTarget.value)}
              disabled={!editable}
              radius="md"
            />
            <NumberInput
              label={translate("Delivery period (days)", "مدة التوريد (أيام)")}
              value={deliveryPeriodDays}
              onChange={(value) => setDeliveryPeriodDays(value === "" ? "" : Number(value))}
              min={1}
              disabled={!editable}
              radius="md"
            />
            <DateTimePickerInput
              label={translate("Valid until", "صالح حتى")}
              value={validUntil}
              onChange={setValidUntil}
              disabled={!editable}
            />
            <TextInput
              label={translate("Notes", "ملاحظات")}
              value={notes}
              onChange={(event) => setNotes(event.currentTarget.value)}
              disabled={!editable}
              radius="md"
              className="md:col-span-2"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-start text-gray-500">
                  <th className="py-1 font-medium">{translate("Material", "المادة")}</th>
                  <th className="py-1 font-medium">{translate("Requested", "المطلوب")}</th>
                  <th className="py-1 font-medium">{translate("Unit", "الوحدة")}</th>
                  <th className="py-1 font-medium">{translate(`Unit price (${translation.currency})`, `سعر الوحدة (${translation.currency})`)}</th>
                </tr>
              </thead>
              <tbody>
                {request.items.map((item) => {
                  const draft = prices[item.id];
                  const showUnits = isRawMaterial(item.material.materialType) && item.material.unitConversions.length > 0;
                  return (
                    <tr key={item.id} className="border-t border-gray-100">
                      <td className="py-2 pe-3">{item.material.title}</td>
                      <td className="py-2 pe-3">
                        {formatQuantity(item.quantityRequested)} {getMaterialUnitLabel(item.unitOfMeasurementSelected, locale)}
                      </td>
                      <td className="py-2 pe-3">
                        {editable && showUnits ? (
                          <DataSelect
                            value={draft?.unit ?? item.unitOfMeasurementSelected}
                            setValue={(next) => {
                              if (!next) return;
                              setPrices((current) => ({
                                ...current,
                                [item.id]: { ...current[item.id], unit: next as MaterialUnit },
                              }));
                            }}
                            data={getMaterialUnitSelectOptions(
                              item.material.unitOfMeasurement,
                              item.material.unitConversions,
                              locale,
                            )}
                          />
                        ) : (
                          getMaterialUnitLabel(draft?.unit ?? item.unitOfMeasurementSelected, locale)
                        )}
                      </td>
                      <td className="py-2">
                        <NumberInput
                          value={draft?.price ?? ""}
                          onChange={(value) =>
                            setPrices((current) => ({
                              ...current,
                              [item.id]: { ...current[item.id], price: value === "" ? "" : Number(value) },
                            }))
                          }
                          min={0}
                          hideControls
                          disabled={!editable}
                          radius="md"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {editable && (
            <div className="flex justify-end">
              {invited ? (
                <Button color="haze" loading={submit.isPending} onClick={() => submit.mutate()}>
                  {translate("Submit quotation", "تقديم عرض السعر")}
                </Button>
              ) : (
                <Button color="haze" variant="light" loading={save.isPending} onClick={() => save.mutate()}>
                  {translate("Save changes", "حفظ التعديلات")}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
