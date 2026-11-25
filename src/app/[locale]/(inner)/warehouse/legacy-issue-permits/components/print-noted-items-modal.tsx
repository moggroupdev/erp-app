"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Select } from "@mantine/core";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import useHasPermission from "@/hooks/use-has-permission";
import legacyIssuePermitsApi from "@/lib/api/legacy-issue-permits";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import {
  getLegacyIssuePermitTypeLabel,
  type LegacyIssuePermitType,
} from "@/lib/constants/enums/legacy-issue-permit-types";
import {
  getProductionSubDepartmentLabel,
  type ProductionSubDepartment,
} from "@/lib/constants/enums/production-sub-departments";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { formatDate } from "@/lib/helpers/date-formaters";
import type { LegacyIssuePermitNotedItemsFilters } from "@/types/legacy-issue-permit";
import Modal from "@/components/ui/modal";
import PrintDocument from "@/components/ui/print-document";
import DatePickerInput from "@/components/ui/date-picker-input";
import SelectLegacyIssuePermitType from "@/components/global/selections/enum-based/select-legacy-issue-permit-type";
import SelectProductionSubDepartment from "@/components/global/selections/enum-based/select-production-sub-department";
import SelectCustomer from "@/components/global/selections/remote-based/select-customer";
import SelectUser from "@/components/global/selections/remote-based/select-user";
import LegacyIssuePermitNotedItemsPrintDocument from "@/components/documents/warehouse/legacy-issue-permit-noted-items-print-document";

type TriState = "all" | "true" | "false";

function triStateToBoolean(value: TriState): boolean | undefined {
  if (value === "all") return undefined;
  return value === "true";
}

export default function PrintNotedItemsModal({
  opened,
  close,
}: {
  opened: boolean;
  close: () => void;
}) {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();
  const canReadCustomers = useHasPermission(PERMISSIONS.READ_CUSTOMERS);
  const canReadUsers = useHasPermission(PERMISSIONS.READ_USERS);
  const canLookupUsers = useHasPermission(PERMISSIONS.LOOKUP_USERS);
  const canSelectCreator = canReadUsers || canLookupUsers;
  const printDate = formatDate(new Date(), locale);

  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [permitType, setPermitType] = useState<string | null>(null);
  const [productionSubDepartment, setProductionSubDepartment] = useState<string | null>(null);
  const [sstFilter, setSstFilter] = useState<TriState>("all");
  const [cancelledFilter, setCancelledFilter] = useState<TriState>("all");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerLabel, setCustomerLabel] = useState<string | null>(null);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [creatorLabel, setCreatorLabel] = useState<string | null>(null);

  const dateRangeInvalid = Boolean(from && to && from > to);

  const filters: LegacyIssuePermitNotedItemsFilters = useMemo(
    () => ({
      from: from || undefined,
      to: to || undefined,
      permitType: (permitType as LegacyIssuePermitType) || undefined,
      productionSubDepartment: (productionSubDepartment as ProductionSubDepartment) || undefined,
      isSst: triStateToBoolean(sstFilter),
      isCancelled: triStateToBoolean(cancelledFilter),
      customerId: canReadCustomers ? customerId || undefined : undefined,
      creatorId: canSelectCreator ? creatorId || undefined : undefined,
    }),
    [
      from,
      to,
      permitType,
      productionSubDepartment,
      sstFilter,
      cancelledFilter,
      customerId,
      creatorId,
      canReadCustomers,
      canSelectCreator,
    ],
  );

  const printQueryParams = removeEmptyParams({
    from: filters.from,
    to: filters.to,
    permitType: filters.permitType,
    productionSubDepartment: filters.productionSubDepartment,
    isSst: filters.isSst,
    isCancelled: filters.isCancelled,
    customerId: filters.customerId,
    creatorId: filters.creatorId,
  });

  const appliedFilters = useMemo(() => {
    const items: { label: string; value: string }[] = [];
    if (filters.from || filters.to) {
      const fromLabel = filters.from ? formatDate(filters.from, locale) : "…";
      const toLabel = filters.to ? formatDate(filters.to, locale) : "…";
      items.push({
        label: translate("Date range", "نطاق التاريخ"),
        value: translate(`from ${fromLabel} to ${toLabel}`, `من ${fromLabel} إلى ${toLabel}`),
      });
    }
    if (filters.permitType) {
      items.push({
        label: translate("Permit Type", "نوع الإذن"),
        value: getLegacyIssuePermitTypeLabel(filters.permitType, locale),
      });
    }
    if (filters.productionSubDepartment) {
      items.push({
        label: translate("Production Department", "قسم الانتاج"),
        value: getProductionSubDepartmentLabel(filters.productionSubDepartment, locale),
      });
    }
    if (filters.isSst !== undefined) {
      items.push({
        label: translate("SST", "SST"),
        value: filters.isSst ? translate("SST only", "SST فقط") : translate("Normal only", "عادي فقط"),
      });
    }
    if (filters.isCancelled !== undefined) {
      items.push({
        label: translate("Cancelled", "ملغي"),
        value: filters.isCancelled
          ? translate("Cancelled only", "ملغى فقط")
          : translate("Active only", "نشط فقط"),
      });
    }
    if (filters.customerId && customerLabel) {
      items.push({
        label: translate("Customer", "العميل"),
        value: customerLabel,
      });
    }
    if (filters.creatorId && creatorLabel) {
      items.push({
        label: translate("Creator", "المحرر"),
        value: creatorLabel,
      });
    }
    return items;
  }, [filters, customerLabel, creatorLabel, locale, translate]);

  const { data: itemsToPrint, refetch: fetchItemsToPrint } = useQuery({
    queryKey: queryKeys.legacyIssuePermits.notedItems(printQueryParams),
    queryFn: ({ signal }) =>
      legacyIssuePermitsApi.listNotedItems({ privateRequest, filters, signal }),
    staleTime: staleTimes.legacyIssuePermits,
    enabled: false,
  });

  function handleClose() {
    close();
    setTimeout(() => {
      setFrom(null);
      setTo(null);
      setPermitType(null);
      setProductionSubDepartment(null);
      setSstFilter("all");
      setCancelledFilter("all");
      setCustomerId(null);
      setCustomerLabel(null);
      setCreatorId(null);
      setCreatorLabel(null);
    }, 250);
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={translate("Print Items with Notes", "طباعة البنود ذات الملاحظات")}
    >
      <div className="flex flex-col gap-3">
        <p className="-mt-1 text-sm text-gray-500">
          {translate(
            "Print every permit line that has notes. Leave filters empty to include all noted items.",
            "طباعة كل بنود الأذونات التي تحتوي على ملاحظات. اترك الفلاتر فارغة لتضمين كل البنود ذات الملاحظات.",
          )}
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DatePickerInput
            value={from}
            onChange={setFrom}
            label={translate("From", "من")}
            placeholder={translate("Select start date", "اختر تاريخ البداية")}
            clearable
            maxDate={to ?? undefined}
          />
          <DatePickerInput
            value={to}
            onChange={setTo}
            label={translate("To", "إلى")}
            placeholder={translate("Select end date", "اختر تاريخ النهاية")}
            clearable
            minDate={from ?? undefined}
          />
        </div>

        <SelectLegacyIssuePermitType
          value={permitType}
          setValue={setPermitType}
          label={translate("Permit Type", "نوع الإذن")}
          placeholder={translate("All types", "كل الأنواع")}
          clearable
          searchable
          radius="md"
        />

        <SelectProductionSubDepartment
          value={productionSubDepartment}
          setValue={setProductionSubDepartment}
          label={translate("Production Department", "قسم الانتاج")}
          placeholder={translate("All departments", "كل الأقسام")}
          clearable
          searchable
          radius="md"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            value={sstFilter}
            onChange={(value) => setSstFilter((value as TriState) || "all")}
            label={translate("SST", "SST")}
            data={[
              { value: "all", label: translate("All", "الكل") },
              { value: "false", label: translate("Normal only", "عادي فقط") },
              { value: "true", label: translate("SST only", "SST فقط") },
            ]}
            allowDeselect={false}
            radius="md"
          />
          <Select
            value={cancelledFilter}
            onChange={(value) => setCancelledFilter((value as TriState) || "all")}
            label={translate("Cancelled", "ملغي")}
            data={[
              { value: "all", label: translate("All", "الكل") },
              { value: "false", label: translate("Active only", "نشط فقط") },
              { value: "true", label: translate("Cancelled only", "ملغى فقط") },
            ]}
            allowDeselect={false}
            radius="md"
          />
        </div>

        {canReadCustomers && (
          <SelectCustomer
            value={customerId}
            setValue={setCustomerId}
            onCustomerSelect={(customer) =>
              setCustomerLabel(customer ? `${customer.code} - ${customer.name}` : null)
            }
            label={translate("Customer", "العميل")}
            placeholder={translate("All customers", "كل العملاء")}
            clearable
            searchable
            radius="md"
          />
        )}

        {canSelectCreator && (
          <SelectUser
            value={creatorId}
            setValue={setCreatorId}
            lookup={!canReadUsers && canLookupUsers}
            onUserSelect={(user) => setCreatorLabel(user?.name ?? null)}
            label={translate("Creator", "المحرر")}
            placeholder={translate("All creators", "كل المحررين")}
            clearable
            searchable
            radius="md"
          />
        )}

        {dateRangeInvalid && (
          <p className="text-sm text-clay-600">
            {translate(
              "The start date must be on or before the end date.",
              "يجب أن يكون تاريخ البداية قبل تاريخ النهاية أو مساوياً له.",
            )}
          </p>
        )}

        <PrintDocument
          title={translate(`Items with Notes - ${printDate}`, `بنود بملاحظات - ${printDate}`)}
          buttonLabel={translate("Print", "طباعة")}
          paperWidth={210}
          paperHeight={297}
          onBeforePrint={async () => {
            await fetchItemsToPrint();
          }}
          renderTrigger={({ onClick, loading, label, icon }) => (
            <Button
              onClick={onClick}
              leftSection={icon}
              color="dark"
              variant="light"
              radius="md"
              fullWidth
              disabled={dateRangeInvalid || loading}
            >
              {label}
            </Button>
          )}
        >
          {itemsToPrint && (
            <LegacyIssuePermitNotedItemsPrintDocument
              items={itemsToPrint}
              appliedFilters={appliedFilters}
            />
          )}
        </PrintDocument>
      </div>
    </Modal>
  );
}
