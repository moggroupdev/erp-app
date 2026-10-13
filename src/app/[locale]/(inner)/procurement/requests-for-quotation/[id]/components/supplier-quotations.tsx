"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Collapse, NumberInput, Table, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ChevronDown, Users } from "lucide-react";
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
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { useI18n } from "@/lib/i18n/hooks";
import type { RequestForQuotationDetailed, SupplierQuotation } from "@/types/request-for-quotation";
import RfqFixedTable from "../../components/rfq-fixed-table";
import {
  RFQ_QUOTATION_LINE_COLUMN_MIN_WIDTH,
  columnMinWidthStyle,
  quotationLineTableColumnWidths,
  rfqTableHeaderClass,
} from "../../table-layout";

const quotationLineColumnWidths = quotationLineTableColumnWidths();

const cellField = {
  variant: "unstyled" as const,
  size: "xs" as const,
  radius: 0,
  styles: { input: { minHeight: 0, height: "1.25rem", padding: 0, minWidth: 0, lineHeight: 1.25 } },
};

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

function sameText(draft: string, saved: string | null) {
  return draft.trim() === (saved ?? "").trim();
}

function samePeriod(draft: number | "", saved: number | null) {
  if (draft === "") return saved == null;
  return Number(draft) === Number(saved);
}

function samePrice(draft: number | "", saved: number | null) {
  if (draft === "") return saved == null;
  if (saved == null) return false;
  return Math.abs(Number(draft) - Number(saved)) < 1e-6;
}

function quotationIsDirty({
  quotation,
  items,
  paymentTerms,
  deliveryTerms,
  deliveryPeriodDays,
  validUntil,
  notes,
  prices,
}: {
  quotation: SupplierQuotation;
  items: RequestForQuotationDetailed["items"];
  paymentTerms: string;
  deliveryTerms: string;
  deliveryPeriodDays: number | "";
  validUntil: string | null;
  notes: string;
  prices: Record<string, PriceDraft>;
}) {
  if (
    !sameText(paymentTerms, quotation.paymentTerms) ||
    !sameText(deliveryTerms, quotation.deliveryTerms) ||
    !samePeriod(deliveryPeriodDays, quotation.deliveryPeriodDays) ||
    toIso(validUntil) !== toIso(quotation.validUntil) ||
    !sameText(notes, quotation.notes)
  ) {
    return true;
  }

  return items.some((item) => {
    const existing = quotation.items.find((line) => line.requestForQuotationItemId === item.id);
    const draft = prices[item.id] ?? {
      unit: existing?.unitOfMeasurementSelected ?? item.unitOfMeasurementSelected,
      price: existing ? Number(existing.unitPrice) : "",
      notes: existing?.notes ?? "",
    };
    const priced = draft.price !== "";
    if (!priced && !existing) return false;
    if (!samePrice(draft.price, existing ? Number(existing.unitPrice) : null)) return true;
    if (draft.unit !== (existing?.unitOfMeasurementSelected ?? item.unitOfMeasurementSelected)) return true;
    return !sameText(draft.notes, existing?.notes ?? null);
  });
}

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

  const editable = canUpdate && !request.closedAt && !request.cancelledAt;

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
    <section className="overflow-hidden rounded-2xl bg-white">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="bg-haze-600 flex size-10 items-center justify-center rounded-2xl text-white">
            <Users size={18} />
          </span>
          <div>
            <h4 className="text-base font-semibold text-gray-950">{translate("Supplier quotations", "عروض الموردين")}</h4>
            <p className="text-sm text-gray-500">
              {translate(
                "Add suppliers, then record the prices and terms they offer.",
                "أضف الموردين، ثم سجّل الأسعار والشروط التي يعرضونها.",
              )}
            </p>
          </div>
        </div>
        {editable && (
          <div className="flex w-full max-w-md items-end gap-2">
            <SelectSupplier
              value={supplierId}
              setValue={setSupplierId}
              excludeIds={request.supplierQuotations.map((quotation) => quotation.supplierId)}
              label={translate("Supplier", "المورد")}
              placeholder={translate("Search by name or code...", "ابحث بالاسم أو الكود...")}
              className="min-w-0 flex-1"
            />
            <Button
              color="haze"
              radius="md"
              disabled={!supplierId}
              loading={invite.isPending}
              onClick={() => invite.mutate()}
            >
              {translate("Add", "إضافة")}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 px-5 py-5">
        {error && <ErrorAlert error={error} />}
        {request.supplierQuotations.length === 0 ? (
          <div className="bg-haze-50/40 flex flex-col items-center justify-center gap-3 rounded-xl px-6 py-10 text-center">
            <div className="bg-haze-50 text-haze-700 flex h-14 w-14 items-center justify-center rounded-2xl">
              <Users size={26} strokeWidth={1.75} />
            </div>
            <p className="max-w-md text-sm leading-7 text-gray-500">
              {translate("No suppliers added yet.", "لم يُضف موردون بعد.")}
            </p>
          </div>
        ) : (
          request.supplierQuotations.map((quotation) => (
            <QuotationCard
              key={quotation.id}
              request={request}
              quotation={quotation}
              editable={editable}
              onError={setError}
              onSaved={refresh}
            />
          ))
        )}
      </div>
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
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();
  const [opened, { toggle }] = useDisclosure(false);

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

  const locked = !!request.closedAt || !!request.cancelledAt;
  const dirty = quotationIsDirty({
    quotation,
    items: request.items,
    paymentTerms,
    deliveryTerms,
    deliveryPeriodDays,
    validUntil,
    notes,
    prices,
  });

  const save = useMutation({
    mutationFn: async () => {
      await requestForQuotationsApi.updateQuotation({
        privateRequest,
        id: request.id,
        quotationId: quotation.id,
        dto: {
          paymentTerms: paymentTerms.trim() || null,
          deliveryTerms: deliveryTerms.trim() || null,
          deliveryPeriodDays: deliveryPeriodDays === "" ? null : Number(deliveryPeriodDays),
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
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/40">
      <div className={`flex items-center gap-2 bg-white px-3 py-2 ${opened ? "border-b border-gray-100" : ""}`}>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={opened}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-start transition-colors hover:bg-gray-50"
        >
          <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${opened ? "rotate-180" : ""}`} />
          <h3 className="truncate text-sm font-semibold text-gray-950">{quotation.supplier.name}</h3>
        </button>
      </div>

      <Collapse in={opened}>
        {locked ? (
          <QuotationSummary request={request} quotation={quotation} />
        ) : (
          <div className="flex flex-col gap-4 px-4 py-4">
            <div className="grid gap-3 md:grid-cols-2">
              <TextInput
                label={translate("Payment terms", "شروط الدفع")}
                placeholder={translate("e.g. 30 days after delivery", "مثال: خلال 30 يوماً من التسليم")}
                value={paymentTerms}
                onChange={(event) => setPaymentTerms(event.currentTarget.value)}
                disabled={!editable}
                radius="md"
              />
              <TextInput
                label={translate("Delivery terms", "شروط التوريد")}
                placeholder={translate("e.g. Delivered to our factories", "مثال: التسليم في مصانعنا")}
                value={deliveryTerms}
                onChange={(event) => setDeliveryTerms(event.currentTarget.value)}
                disabled={!editable}
                radius="md"
              />
              <NumberInput
                label={translate("Delivery period (days)", "مدة التوريد (أيام)")}
                placeholder={translate("Enter days", "أدخل عدد الأيام")}
                value={deliveryPeriodDays}
                onChange={(value) => setDeliveryPeriodDays(value === "" ? "" : Number(value))}
                min={1}
                allowDecimal={false}
                allowNegative={false}
                hideControls
                disabled={!editable}
                radius="md"
              />
              <DateTimePickerInput
                label={translate("Valid until", "صالح حتى")}
                placeholder={translate("Select date and time", "اختر التاريخ والوقت")}
                value={validUntil}
                onChange={setValidUntil}
                disabled={!editable}
                clearable={editable}
              />
              <TextInput
                label={translate("Notes", "الملاحظات")}
                placeholder={translate("Optional note about this quotation", "ملاحظة اختيارية عن هذا العرض")}
                value={notes}
                onChange={(event) => setNotes(event.currentTarget.value)}
                disabled={!editable}
                radius="md"
                className="md:col-span-2"
              />
            </div>

            <RfqFixedTable
              columnWidths={quotationLineColumnWidths}
              verticalSpacing={10}
              scrollClassName="rounded-xl bg-white"
            >
              <QuotationLineTableHead />
              <Table.Tbody>
                  {request.items.map((item) => {
                    const draft = prices[item.id];
                    const showUnits = isRawMaterial(item.material.materialType) && item.material.unitConversions.length > 0;
                    return (
                      <Table.Tr key={item.id}>
                        <Table.Td className="font-mono text-xs text-gray-500">{item.materialCode}</Table.Td>
                        <Table.Td className="text-sm font-medium wrap-break-word text-gray-800">{item.material.title}</Table.Td>
                        <Table.Td className="focus-within:bg-haze-50/60 transition-colors">
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
                              searchable
                              placeholder={translate("Select unit", "اختر الوحدة")}
                              {...cellField}
                              styles={{
                                input: {
                                  minHeight: 0,
                                  height: "1.25rem",
                                  padding: 0,
                                  minWidth: 0,
                                  lineHeight: 1.25,
                                  cursor: "pointer",
                                },
                              }}
                            />
                          ) : (
                            <span className="text-sm text-gray-700">
                              {getMaterialUnitLabel(draft?.unit ?? item.unitOfMeasurementSelected, locale)}
                            </span>
                          )}
                        </Table.Td>
                        <Table.Td className="text-sm text-gray-700">{formatQuantity(item.quantityRequested)}</Table.Td>
                        <Table.Td className="focus-within:bg-haze-50/60 transition-colors">
                          <NumberInput
                            value={draft?.price ?? ""}
                            onChange={(value) =>
                              setPrices((current) => ({
                                ...current,
                                [item.id]: { ...current[item.id], price: value === "" ? "" : Number(value) },
                              }))
                            }
                            min={0}
                            allowNegative={false}
                            decimalScale={6}
                            hideControls
                            disabled={!editable}
                            placeholder={translate("Enter price", "أدخل السعر")}
                            aria-label={translate("Unit price", "سعر الوحدة")}
                            {...cellField}
                          />
                        </Table.Td>
                        <Table.Td className="focus-within:bg-haze-50/60 transition-colors">
                          <TextInput
                            value={draft?.notes ?? ""}
                            onChange={(event) =>
                              setPrices((current) => ({
                                ...current,
                                [item.id]: { ...current[item.id], notes: event.currentTarget.value },
                              }))
                            }
                            disabled={!editable}
                            placeholder={translate("Optional note", "ملاحظة اختيارية")}
                            aria-label={translate("Line notes", "ملاحظات البند")}
                            {...cellField}
                          />
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
            </RfqFixedTable>

            {editable && (
              <div className="flex justify-end">
                <Button color="haze" radius="md" loading={save.isPending} disabled={!dirty} onClick={() => save.mutate()}>
                  {translate("Save changes", "حفظ التعديلات")}
                </Button>
              </div>
            )}
          </div>
        )}
      </Collapse>
    </article>
  );
}

function QuotationSummary({ request, quotation }: { request: RequestForQuotationDetailed; quotation: SupplierQuotation }) {
  const { locale, translate } = useI18n();

  const facts: { label: string; value: string | null; wide?: boolean }[] = [
    {
      label: translate("Payment terms", "شروط الدفع"),
      value: quotation.paymentTerms?.trim() || null,
    },
    {
      label: translate("Delivery terms", "شروط التوريد"),
      value: quotation.deliveryTerms?.trim() || null,
    },
    {
      label: translate("Delivery period (days)", "مدة التوريد (أيام)"),
      value: quotation.deliveryPeriodDays != null ? String(quotation.deliveryPeriodDays) : null,
    },
    {
      label: translate("Valid until", "صالح حتى"),
      value: quotation.validUntil ? formatDateAndTime(quotation.validUntil, locale) : null,
    },
    {
      label: translate("Notes", "الملاحظات"),
      value: quotation.notes?.trim() || null,
      wide: true,
    },
  ];

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {facts.map((fact) => (
          <div key={fact.label} className={fact.wide ? "sm:col-span-2" : undefined}>
            <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">{fact.label}</dt>
            <dd className="mt-1 text-sm whitespace-pre-wrap text-gray-900">
              {fact.value ? fact.value : <span className="text-gray-400">-</span>}
            </dd>
          </div>
        ))}
      </dl>

      <RfqFixedTable columnWidths={quotationLineColumnWidths} verticalSpacing={10} scrollClassName="rounded-xl bg-white">
        <QuotationLineTableHead />
        <Table.Tbody>
            {request.items.map((item) => {
              const line = quotation.items.find((entry) => entry.requestForQuotationItemId === item.id);
              const unit = line?.unitOfMeasurementSelected ?? item.unitOfMeasurementSelected;
              return (
                <Table.Tr key={item.id}>
                  <Table.Td className="font-mono text-xs text-gray-500">{item.materialCode}</Table.Td>
                  <Table.Td className="text-sm font-medium wrap-break-word text-gray-800">{item.material.title}</Table.Td>
                  <Table.Td className="text-sm text-gray-700">{getMaterialUnitLabel(unit, locale)}</Table.Td>
                  <Table.Td className="text-sm text-gray-700">{formatQuantity(item.quantityRequested)}</Table.Td>
                  <Table.Td className="text-sm text-gray-800">
                    {line ? formatMoney(Number(line.unitPrice)) : <span className="text-gray-400">-</span>}
                  </Table.Td>
                  <Table.Td className="text-sm whitespace-pre-wrap wrap-break-word text-gray-600">
                    {line?.notes?.trim() ? line.notes : <span className="text-gray-400">-</span>}
                  </Table.Td>
                </Table.Tr>
              );
            })}
        </Table.Tbody>
      </RfqFixedTable>
    </div>
  );
}

function QuotationLineTableHead() {
  const { translate } = useI18n();
  const columns = RFQ_QUOTATION_LINE_COLUMN_MIN_WIDTH;

  return (
    <Table.Thead className="bg-gray-50">
      <Table.Tr className="h-8">
        <Table.Th style={columnMinWidthStyle(columns.code)} className={rfqTableHeaderClass}>
          {translate("Code", "الكود")}
        </Table.Th>
        <Table.Th style={columnMinWidthStyle(columns.item)} className={rfqTableHeaderClass}>
          {translate("Item", "الصنف")}
        </Table.Th>
        <Table.Th style={columnMinWidthStyle(columns.unit)} className={rfqTableHeaderClass}>
          {translate("Unit", "الوحدة")}
        </Table.Th>
        <Table.Th style={columnMinWidthStyle(columns.quantity)} className={rfqTableHeaderClass}>
          {translate("Quantity", "الكمية")}
        </Table.Th>
        <Table.Th style={columnMinWidthStyle(columns.unitPrice)} className={rfqTableHeaderClass}>
          {translate("Unit price", "سعر الوحدة")}
        </Table.Th>
        <Table.Th style={columnMinWidthStyle(columns.notes)} className={rfqTableHeaderClass}>
          {translate("Notes", "الملاحظات")}
        </Table.Th>
      </Table.Tr>
    </Table.Thead>
  );
}
