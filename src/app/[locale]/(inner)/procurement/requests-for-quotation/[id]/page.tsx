"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, NumberInput, Table } from "@mantine/core";
import { Plus, Trash2, ClipboardList } from "lucide-react";
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
      if (!newMaterial || newQuantity === "" || !newUnit) {
        throw new Error(translate("Choose a material, unit, and quantity.", "اختر المادة والوحدة والكمية."));
      }
      return requestForQuotationsApi.addItem({
        privateRequest,
        id,
        dto: {
          materialCode: newMaterial.code,
          unitOfMeasurementSelected: newUnit,
          quantityRequested: Number(newQuantity),
          notes: null,
        },
      });
    },
    onSuccess: async () => {
      setNewMaterial(null);
      setNewQuantity("");
      setNewUnit(null);
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
          key: translate("Notes", "ملاحظات"),
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
            <EntityDetails title={request.code} icon={ClipboardList} rows={rows} />

            {canUpdate && (draft || issued) && (
              <div className="flex flex-wrap items-end gap-3">
                {draft && (
                  <DateTimePickerInput
                    label={translate("Response deadline", "آخر موعد للرد")}
                    value={deadline}
                    onChange={setDeadline}
                    className="min-w-64"
                  />
                )}
                {draft && (
                  <Button color="haze" loading={issue.isPending} disabled={!deadline} onClick={() => issue.mutate()}>
                    {translate("Issue", "إصدار")}
                  </Button>
                )}
                {issued && (
                  <Button color="teal" variant="light" loading={close.isPending} onClick={() => close.mutate()}>
                    {translate("Close", "إغلاق")}
                  </Button>
                )}
                <Button
                  color="clay"
                  variant="light"
                  loading={cancel.isPending}
                  onClick={() => {
                    if (window.confirm(translate("Cancel this request?", "إلغاء هذا الطلب؟"))) cancel.mutate();
                  }}
                >
                  {translate("Cancel", "إلغاء")}
                </Button>
              </div>
            )}

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">{translate("Materials", "المواد")}</h2>
              <div className="overflow-x-auto">
                <Table verticalSpacing="xs" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{translate("Material", "المادة")}</Table.Th>
                      <Table.Th>{translate("Code", "الكود")}</Table.Th>
                      <Table.Th>{translate("Quantity", "الكمية")}</Table.Th>
                      <Table.Th>{translate("Unit", "الوحدة")}</Table.Th>
                      {draft && canUpdate && <Table.Th />}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {request.items.map((item) => (
                      <Table.Tr key={item.id}>
                        <Table.Td>{item.material.title}</Table.Td>
                        <Table.Td className="font-mono">{item.materialCode}</Table.Td>
                        <Table.Td>{formatQuantity(item.quantityRequested)}</Table.Td>
                        <Table.Td>{getMaterialUnitLabel(item.unitOfMeasurementSelected, locale)}</Table.Td>
                        {draft && canUpdate && (
                          <Table.Td>
                            <Button
                              variant="subtle"
                              color="clay"
                              px={8}
                              loading={deleteItem.isPending}
                              onClick={() => deleteItem.mutate(item.id)}
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
              {draft && canUpdate && (
                <div className="grid items-end gap-3 md:grid-cols-[1fr_8rem_10rem_auto]">
                  <SelectMaterial
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
                    placeholder={translate("Add a material", "إضافة مادة")}
                  />
                  <NumberInput
                    value={newQuantity}
                    onChange={(value) => setNewQuantity(value === "" ? "" : Number(value))}
                    min={0}
                    placeholder={translate("Qty", "الكمية")}
                    radius="md"
                  />
                  {newMaterial && isRawMaterial(newMaterial.materialType) && newMaterial.unitConversions.length > 0 ? (
                    <DataSelect
                      value={newUnit}
                      setValue={(next) => setNewUnit((next as MaterialUnit | null) ?? null)}
                      data={getMaterialUnitSelectOptions(newMaterial.unitOfMeasurement, newMaterial.unitConversions, locale)}
                    />
                  ) : (
                    <span className="pb-2 text-sm text-gray-600">
                      {newUnit ? getMaterialUnitLabel(newUnit, locale) : translate("Unit", "الوحدة")}
                    </span>
                  )}
                  <Button color="haze" variant="light" leftSection={<Plus size={14} />} loading={addItem.isPending} onClick={() => addItem.mutate()}>
                    {translate("Add", "إضافة")}
                  </Button>
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
