"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, NumberInput, Table, TextInput } from "@mantine/core";
import { CircleCheck, ClipboardList, Package, Plus, Send, Trash2 } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import RefetchButton from "@/components/ui/refetch-button";
import DateTimePickerInput from "@/components/ui/datetime-picker-input";
import DataSelect from "@/components/ui/data-select";
import ErrorAlert from "@/components/ui/error-alert";
import EntityDetails, { CreatorLink, EmptyValue, type DetailRow } from "@/components/ui/entity-details";
import SelectMaterial from "@/components/global/selections/remote-based/select-material";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import useHasPermission from "@/hooks/use-has-permission";
import requestForQuotationsApi from "@/lib/api/request-for-quotations";
import { queryKeys } from "@/lib/api/query-keys";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { staleTimes } from "@/lib/constants/stale-times";
import { getMaterialUnitLabel, getMaterialUnitSelectOptions, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { isRawMaterial } from "@/lib/constants/enums/material-types";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { useI18n } from "@/lib/i18n/hooks";
import type { MaterialWithUnitConversionsSelection } from "@/types/material";
import {
  getRequestForQuotationStatus,
  getRequestForQuotationStatusLabel,
  isRequestDraft,
  isRequestIssued,
} from "../helpers";
import ComparisonTable from "./components/comparison-table";
import SupplierQuotations from "./components/supplier-quotations";

const PAGE_TITLE = { en: "Request for Quotation", ar: "طلب عرض سعر" };

function toIso(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export default function Page() {
  const { locale, translate } = useI18n();
  const { id } = useParams<{ id: string }>();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();
  const canUpdate = useHasPermission(PERMISSIONS.UPDATE_REQUEST_FOR_QUOTATION);
  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const [error, setError] = useState("");
  const [deadline, setDeadline] = useState<string | null>(null);
  const [newMaterial, setNewMaterial] = useState<MaterialWithUnitConversionsSelection | null>(null);
  const [newQuantity, setNewQuantity] = useState<number | "">("");
  const [newUnit, setNewUnit] = useState<MaterialUnit | null>(null);
  const [newNotes, setNewNotes] = useState("");

  const { data: request, isFetching, error: loadError, refetch } = useQuery({
    queryKey: queryKeys.requestForQuotations.detail(id),
    queryFn: ({ signal }) => requestForQuotationsApi.get({ privateRequest, id, signal }),
    staleTime: staleTimes.requestForQuotations,
  });

  const deadlineSeeded = useRef(false);

  useEffect(() => {
    if (!request || deadlineSeeded.current) return;
    setDeadline(request.responseDeadline);
    deadlineSeeded.current = true;
  }, [request]);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.requestForQuotations.all });
  }

  const issue = useMutation({
    mutationFn: () =>
      requestForQuotationsApi.issue({
        privateRequest,
        id,
        responseDeadline: toIso(deadline)!,
      }),
    onSuccess: async () => {
      setError("");
      await refresh();
    },
    onError: (err) => setError(getErrorMessage(locale, err)),
  });

  const close = useMutation({
    mutationFn: () => requestForQuotationsApi.close({ privateRequest, id }),
    onSuccess: refresh,
    onError: (err) => setError(getErrorMessage(locale, err)),
  });

  const cancel = useMutation({
    mutationFn: () => requestForQuotationsApi.cancel({ privateRequest, id }),
    onSuccess: refresh,
    onError: (err) => setError(getErrorMessage(locale, err)),
  });

  const addItem = useMutation({
    mutationFn: () => {
      if (!newMaterial || newQuantity === "" || !newUnit || Number(newQuantity) <= 0) {
        throw new Error(translate("Choose a material, unit, and a quantity greater than zero.", "اختر المادة والوحدة وكمية أكبر من صفر."));
      }
      return requestForQuotationsApi.addItem({
        privateRequest,
        id,
        dto: {
          materialCode: newMaterial.code,
          unitOfMeasurementSelected: newUnit,
          quantityRequested: Number(newQuantity),
          notes: newNotes.trim() || null,
        },
      });
    },
    onSuccess: async () => {
      setNewMaterial(null);
      setNewQuantity("");
      setNewUnit(null);
      setNewNotes("");
      setError("");
      await refresh();
    },
    onError: (err) => setError(getErrorMessage(locale, err)),
  });

  const deleteItem = useMutation({
    mutationFn: (itemId: string) => requestForQuotationsApi.deleteItem({ privateRequest, id, itemId }),
    onSuccess: refresh,
    onError: (err) => setError(getErrorMessage(locale, err)),
  });

  const status = request ? getRequestForQuotationStatus(request) : "draft";
  const statusMeta = getRequestForQuotationStatusLabel(status, translate);
  const draft = request ? isRequestDraft(request) : false;
  const issued = request ? isRequestIssued(request) : false;
  const showUnitChoices = !!newMaterial && isRawMaterial(newMaterial.materialType) && newMaterial.unitConversions.length > 0;

  const rows: DetailRow[] = request
    ? [
        { key: translate("Code", "الكود"), value: request.code, mono: true, copyText: request.code },
        {
          key: translate("Status", "الحالة"),
          value: (
            <Badge variant="light" color={statusMeta.color} radius="md">
              {statusMeta.label}
            </Badge>
          ),
        },
        {
          key: translate("Response deadline", "آخر موعد للرد"),
          value: request.responseDeadline ? formatDateAndTime(request.responseDeadline, locale) : <EmptyValue />,
        },
        {
          key: translate("Created", "تاريخ الإنشاء"),
          value: formatDateAndTime(request.createdAt, locale),
        },
        { key: translate("Created by", "أنشأه"), value: <CreatorLink creator={request.createdBy} /> },
        {
          key: translate("Notes", "الملاحظات"),
          value: request.notes ? <span className="whitespace-pre-wrap font-normal">{request.notes}</span> : <EmptyValue />,
        },
      ]
    : [];

  return (
    <LayoutBox
      header={{
        backLink: true,
        title: request?.code ?? translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        sideElements: <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />,
      }}
    >
      {isFetching && !request ? (
        <LoadingSection message={translate("Loading request...", "جاري تحميل الطلب...")} />
      ) : loadError ? (
        <ErrorSection
          errorTitle={translate("Error loading request", "خطأ في تحميل الطلب")}
          errorMessage={getErrorMessage(locale, loadError)}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : (
        request && (
          <div className="flex flex-col gap-6">
            {error && <ErrorAlert error={error} />}
            <EntityDetails title={request.code} icon={Package} rows={rows} />

            {canUpdate && (draft || issued) && (
              <section className="overflow-hidden rounded-2xl bg-white">
                <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-10 items-center justify-center rounded-2xl text-white ${draft ? "bg-haze-600" : "bg-teal-600"}`}
                    >
                      {draft ? <Send size={18} /> : <CircleCheck size={18} />}
                    </span>
                    <div>
                      <h4 className="text-base font-semibold text-gray-950">
                        {draft
                          ? translate("Issue this request", "إصدار هذا الطلب")
                          : translate("Close or cancel", "إغلاق أو إلغاء")}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {draft
                          ? translate(
                              "Set the reply deadline, then send the request to suppliers.",
                              "حدد آخر موعد للرد، ثم أرسل الطلب إلى الموردين.",
                            )
                          : translate(
                              "Close the request when comparison is done, or cancel it if it is no longer needed.",
                              "أغلق الطلب بعد انتهاء المقارنة، أو ألغه إذا لم يعد مطلوباً.",
                            )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-end gap-2">
                    {draft && (
                      <DateTimePickerInput
                        label={translate("Response deadline", "آخر موعد للرد")}
                        placeholder={translate("Select date and time", "اختر التاريخ والوقت")}
                        value={deadline}
                        onChange={setDeadline}
                        className="w-72 max-w-full"
                        required
                      />
                    )}
                    {draft && (
                      <Button color="haze" radius="md" loading={issue.isPending} disabled={!deadline} onClick={() => issue.mutate()}>
                        {translate("Issue", "إصدار")}
                      </Button>
                    )}
                    {issued && (
                      <Button color="teal" radius="md" loading={close.isPending} onClick={() => close.mutate()}>
                        {translate("Close", "إغلاق")}
                      </Button>
                    )}
                    <Button
                      color="clay"
                      variant="light"
                      radius="md"
                      loading={cancel.isPending}
                      onClick={() => {
                        if (window.confirm(translate("Cancel this request?", "إلغاء هذا الطلب؟"))) cancel.mutate();
                      }}
                    >
                      {translate("Cancel", "إلغاء")}
                    </Button>
                  </div>
                </div>
              </section>
            )}

            <section className="overflow-hidden rounded-2xl bg-white">
              <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-haze-600 text-white">
                  <Package size={18} />
                </span>
                <div>
                  <h4 className="text-base font-semibold text-gray-950">{translate("Materials", "المواد")}</h4>
                  <p className="text-sm text-gray-500">
                    {translate("Quantities suppliers are asked to price.", "الكميات المطلوب تسعيرها من الموردين.")}
                  </p>
                </div>
              </div>

              <div className="px-5 py-5">
                {request.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-haze-50/40 px-6 py-12 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-haze-50 text-haze-700">
                      <ClipboardList size={26} strokeWidth={1.75} />
                    </div>
                    <p className="max-w-md text-sm leading-7 text-gray-500">
                      {translate("No materials on this request yet.", "لا توجد مواد في هذا الطلب بعد.")}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table withColumnBorders className="w-full min-w-160" horizontalSpacing="xs" verticalSpacing="xs">
                      <Table.Thead className="bg-gray-50 whitespace-nowrap">
                        <Table.Tr className="h-9">
                          <Table.Th className="w-12 text-center! text-gray-500">#</Table.Th>
                          <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                            {translate("Material", "المادة")}
                          </Table.Th>
                          <Table.Th className="w-36 text-xs font-medium tracking-wide text-gray-500 uppercase">
                            {translate("Quantity", "الكمية")}
                          </Table.Th>
                          <Table.Th className="w-32 text-xs font-medium tracking-wide text-gray-500 uppercase">
                            {translate("Unit", "الوحدة")}
                          </Table.Th>
                          <Table.Th className="w-56 text-xs font-medium tracking-wide text-gray-500 uppercase">
                            {translate("Notes", "الملاحظات")}
                          </Table.Th>
                          {draft && canUpdate && <Table.Th className="w-12" />}
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {request.items.map((item, index) => (
                          <Table.Tr key={item.id}>
                            <Table.Td className="text-center text-xs font-medium text-gray-500">{index + 1}</Table.Td>
                            <Table.Td>
                              <div className="flex flex-col gap-0.5 py-0.5">
                                <span className="text-sm font-medium text-gray-800">{item.material.title}</span>
                                <span className="font-mono text-xs text-gray-400">{item.materialCode}</span>
                              </div>
                            </Table.Td>
                            <Table.Td className="text-sm text-gray-700">{formatQuantity(item.quantityRequested)}</Table.Td>
                            <Table.Td className="text-sm text-gray-700">
                              {getMaterialUnitLabel(item.unitOfMeasurementSelected, locale)}
                            </Table.Td>
                            <Table.Td className="text-sm text-gray-600">
                              {item.notes?.trim() ? item.notes : <span className="text-gray-400">-</span>}
                            </Table.Td>
                            {draft && canUpdate && (
                              <Table.Td>
                                <Button
                                  variant="subtle"
                                  color="clay"
                                  size="xs"
                                  radius="md"
                                  p={6}
                                  loading={deleteItem.isPending && deleteItem.variables === item.id}
                                  onClick={() => deleteItem.mutate(item.id)}
                                  title={translate("Remove material", "حذف المادة")}
                                  aria-label={translate("Remove material", "حذف المادة")}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </Table.Td>
                            )}
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </div>
                )}
              </div>

              {draft && canUpdate && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                  <p className="mb-3 text-sm font-medium text-gray-900">{translate("Add a material", "إضافة مادة")}</p>
                  <div className="grid items-end gap-3 md:grid-cols-[minmax(0,1.4fr)_8rem_10rem_minmax(0,1fr)_auto]">
                    <SelectMaterial
                      label={translate("Material", "المادة")}
                      value={newMaterial?.code ?? null}
                      setValue={(next) => {
                        const resolved = typeof next === "function" ? next(newMaterial?.code ?? null) : next;
                        if (!resolved) {
                          setNewMaterial(null);
                          setNewUnit(null);
                        }
                      }}
                      onMaterialSelect={(material) => {
                        setNewMaterial(material);
                        setNewUnit(material?.unitOfMeasurement ?? null);
                      }}
                      excludeCodes={request.items.map((item) => item.materialCode)}
                      placeholder={translate("Search by name or code...", "ابحث بالاسم أو الكود...")}
                      withBrowseModal
                    />
                    <NumberInput
                      label={translate("Quantity", "الكمية")}
                      value={newQuantity}
                      onChange={(value) => setNewQuantity(value === "" ? "" : Number(value))}
                      min={0}
                      allowNegative={false}
                      decimalScale={6}
                      hideControls
                      placeholder={translate("Enter quantity", "أدخل الكمية")}
                      radius="md"
                    />
                    {showUnitChoices ? (
                      <DataSelect
                        label={translate("Unit", "الوحدة")}
                        value={newUnit}
                        setValue={(next) => setNewUnit((next as MaterialUnit | null) ?? null)}
                        data={getMaterialUnitSelectOptions(newMaterial.unitOfMeasurement, newMaterial.unitConversions, locale)}
                        placeholder={translate("Select unit", "اختر الوحدة")}
                        searchable
                      />
                    ) : (
                      <TextInput
                        label={translate("Unit", "الوحدة")}
                        value={newUnit ? getMaterialUnitLabel(newUnit, locale) : ""}
                        placeholder={translate("Select a material first", "اختر المادة أولاً")}
                        readOnly
                        radius="md"
                      />
                    )}
                    <TextInput
                      label={translate("Notes", "الملاحظات")}
                      value={newNotes}
                      onChange={(event) => setNewNotes(event.currentTarget.value)}
                      placeholder={translate("Optional note", "ملاحظة اختيارية")}
                      radius="md"
                    />
                    <Button
                      color="haze"
                      radius="md"
                      leftSection={<Plus size={14} />}
                      loading={addItem.isPending}
                      onClick={() => addItem.mutate()}
                    >
                      {translate("Add", "إضافة")}
                    </Button>
                  </div>
                </div>
              )}
            </section>

            {!draft && <SupplierQuotations request={request} canUpdate={canUpdate} />}
            <ComparisonTable request={request} />
          </div>
        )
      )}
    </LayoutBox>
  );
}
