"use client";

import { useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { Badge, Button, Menu, Table } from "@mantine/core";
import { ArrowLeft, Ban, CircleCheck, ClipboardList, FileText, Lock, Package, Plus, Trash2 } from "lucide-react";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import RefetchButton from "@/components/ui/refetch-button";
import CopyButton from "@/components/ui/copy-button";
import ActionsMenu from "@/components/ui/actions-menu";
import ErrorAlert from "@/components/ui/error-alert";
import { CreatorLink } from "@/components/ui/entity-details";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import useHasPermission from "@/hooks/use-has-permission";
import requestForQuotationsApi from "@/lib/api/request-for-quotations";
import { queryKeys } from "@/lib/api/query-keys";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { staleTimes } from "@/lib/constants/stale-times";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import type { RequestForQuotationDetailed, RequestForQuotationStatus } from "@/types/request-for-quotation";
import { getRequestForQuotationStatus, getRequestForQuotationStatusLabel } from "../helpers";
import AddMaterialModal from "./components/add-material-modal";
import ComparisonTable from "./components/comparison-table";
import SupplierQuotations from "./components/supplier-quotations";

const PAGE_TITLE = { en: "Request for Quotation", ar: "طلب عرض سعر" };

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const href = useLocaleHref();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();
  const canUpdate = useHasPermission(PERMISSIONS.UPDATE_REQUEST_FOR_QUOTATION);

  const [error, setError] = useState("");
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);

  const {
    data: request,
    isFetching,
    error: loadError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.requestForQuotations.detail(id),
    queryFn: ({ signal }) => requestForQuotationsApi.get({ privateRequest, id, signal }),
    staleTime: staleTimes.requestForQuotations,
  });

  useDocumentTitle(request?.code ?? translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.requestForQuotations.all });
  }

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

  const deleteItem = useMutation({
    mutationFn: (itemId: string) => requestForQuotationsApi.deleteItem({ privateRequest, id, itemId }),
    onSuccess: refresh,
    onError: (err) => setError(getErrorMessage(locale, err)),
  });

  const status = request ? getRequestForQuotationStatus(request) : "open";
  const statusMeta = getRequestForQuotationStatusLabel(status, translate);
  const open = status === "open";
  const canAct = canUpdate && open;
  const statusBusy = close.isPending || cancel.isPending;

  function goBack() {
    router.push(href("/procurement/requests-for-quotation"));
  }

  return (
    <div className="flex min-h-full flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="light"
            color="dark"
            radius={20}
            p={0}
            h={40}
            w={40}
            onClick={goBack}
            aria-label={translation.back}
            title={translation.back}
          >
            <ArrowLeft size={18} style={{ transform: `rotateY(${translate("0deg", "180deg")})` }} />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate">{request?.code ?? translate(PAGE_TITLE.en, PAGE_TITLE.ar)}</h1>
              {request && (
                <Badge variant="light" color={statusMeta.color} radius="md">
                  {statusMeta.label}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">{translate(PAGE_TITLE.en, PAGE_TITLE.ar)}</p>
          </div>
        </div>
        <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} variant="white" />
      </header>

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

            <section className="overflow-hidden rounded-2xl bg-white">
              <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
                <span className="bg-haze-600 flex size-10 items-center justify-center rounded-2xl text-white">
                  <FileText size={18} />
                </span>
                <div>
                  <h4 className="text-base font-semibold text-gray-950">{translate("Request details", "بيانات الطلب")}</h4>
                  <p className="text-sm text-gray-500">
                    {translate("Who created it, and any note on the request.", "من أنشأه، وأي ملاحظة على الطلب.")}
                  </p>
                </div>
              </div>

              <RequestFacts request={request} />

              <RequestStatusBar
                status={status}
                canAct={canAct}
                busy={statusBusy}
                onClose={() => close.mutate()}
                onCancel={() => {
                  if (window.confirm(translate("Cancel this request?", "إلغاء هذا الطلب؟"))) cancel.mutate();
                }}
              />
            </section>

            <section className="overflow-hidden rounded-2xl bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="bg-haze-600 flex size-10 items-center justify-center rounded-2xl text-white">
                    <Package size={18} />
                  </span>
                  <div>
                    <h4 className="text-base font-semibold text-gray-950">{translate("Materials", "المواد")}</h4>
                    <p className="text-sm text-gray-500">
                      {translate("Quantities suppliers are asked to price.", "الكميات المطلوب تسعيرها من الموردين.")}
                    </p>
                  </div>
                </div>
                {open && canUpdate && (
                  <Button color="haze" radius="md" leftSection={<Plus size={14} />} onClick={openAdd}>
                    {translate("Add material", "إضافة مادة")}
                  </Button>
                )}
              </div>

              <div className="px-5 py-5">
                {request.items.length === 0 ? (
                  <div className="bg-haze-50/40 flex flex-col items-center justify-center gap-4 rounded-xl px-6 py-12 text-center">
                    <div className="bg-haze-50 text-haze-700 flex h-14 w-14 items-center justify-center rounded-2xl">
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
                          {open && canUpdate && <Table.Th className="w-12" />}
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
                            <Table.Td className="text-sm whitespace-pre-wrap text-gray-600">
                              {item.notes?.trim() ? item.notes : <span className="text-gray-400">-</span>}
                            </Table.Td>
                            {open && canUpdate && (
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

            </section>

            <SupplierQuotations request={request} canUpdate={canUpdate} />
            <ComparisonTable request={request} />

            {open && canUpdate && (
              <AddMaterialModal
                opened={addOpened}
                onClose={closeAdd}
                requestId={request.id}
                excludeCodes={request.items.map((item) => item.materialCode)}
              />
            )}
          </div>
        )
      )}
    </div>
  );
}

function RequestStatusBar({
  status,
  canAct,
  busy,
  onClose,
  onCancel,
}: {
  status: RequestForQuotationStatus;
  canAct: boolean;
  busy: boolean;
  onClose: () => void;
  onCancel: () => void;
}) {
  const { translate } = useI18n();

  const copy = {
    open: {
      surface: "bg-haze-50/70",
      icon: "bg-haze-600 text-white",
      Icon: CircleCheck,
      title: translate("Request is open", "الطلب مفتوح"),
      body: translate(
        "Close the request when you are done comparing, or cancel it if it is no longer needed.",
        "أغلق الطلب بعد انتهاء المقارنة، أو ألغه إذا لم يعد مطلوباً.",
      ),
    },
    closed: {
      surface: "bg-teal-50/70",
      icon: "bg-teal-600 text-white",
      Icon: Lock,
      title: translate("Request is closed", "الطلب مغلق"),
      body: translate(
        "Materials and quotations can no longer be changed.",
        "لم يعد بالإمكان تعديل المواد أو عروض الأسعار.",
      ),
    },
    cancelled: {
      surface: "bg-clay-50/70",
      icon: "bg-clay-600 text-white",
      Icon: Ban,
      title: translate("Request is cancelled", "الطلب ملغي"),
      body: translate("This request is no longer needed.", "لم يعد هذا الطلب مطلوباً."),
    },
  }[status];

  const Icon = copy.Icon;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 ${copy.surface}`}>
      <div className="flex min-w-0 items-start gap-3">
        <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${copy.icon}`}>
          <Icon size={16} />
        </span>
        <div>
          <p className="text-sm font-medium text-gray-950">{copy.title}</p>
          <p className="mt-0.5 max-w-xl text-sm text-gray-500">{copy.body}</p>
        </div>
      </div>

      {canAct && (
        <ActionsMenu>
          <Menu.Item color="teal" leftSection={<CircleCheck size={14} />} disabled={busy} onClick={onClose}>
            {translate("Close request", "إغلاق الطلب")}
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item color="clay" leftSection={<Ban size={14} />} disabled={busy} onClick={onCancel}>
            {translate("Cancel request", "إلغاء الطلب")}
          </Menu.Item>
        </ActionsMenu>
      )}
    </div>
  );
}

function RequestFacts({ request }: { request: RequestForQuotationDetailed }) {
  const { locale, translate } = useI18n();

  const facts: { label: string; value: ReactNode }[] = [
    {
      label: translate("Code", "الكود"),
      value: (
        <span className="flex items-center gap-1.5 font-mono">
          {request.code}
          <CopyButton text={request.code} />
        </span>
      ),
    },
  ];

  facts.push(
    {
      label: translate("Created", "تاريخ الإنشاء"),
      value: formatDateAndTime(request.createdAt, locale),
    },
    {
      label: translate("Created by", "أنشأه"),
      value: <CreatorLink creator={request.createdBy} />,
    },
  );

  if (request.closedAt) {
    facts.push({
      label: translate("Closed", "تاريخ الإغلاق"),
      value: formatDateAndTime(request.closedAt, locale),
    });
  }
  if (request.cancelledAt) {
    facts.push({
      label: translate("Cancelled", "تاريخ الإلغاء"),
      value: <span className="text-clay-700">{formatDateAndTime(request.cancelledAt, locale)}</span>,
    });
  }

  return (
    <div className="flex flex-col gap-5 px-5 py-5">
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">{fact.label}</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div>
        <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{translate("Notes", "الملاحظات")}</p>
        <p className="mt-1 text-sm whitespace-pre-wrap text-gray-800">
          {request.notes?.trim() ? request.notes : <span className="text-gray-400">-</span>}
        </p>
      </div>
    </div>
  );
}
