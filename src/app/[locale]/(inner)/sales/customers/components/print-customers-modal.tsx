"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@mantine/core";
import { Ban, Search, Tags } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import customersApi, { type CustomersPrintFilters } from "@/lib/api/customers";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import {
  getCustomerClassificationLabel,
  type CustomerClassification,
} from "@/lib/constants/enums/customer-classifications";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { formatDate } from "@/lib/helpers/date-formaters";
import Modal from "@/components/ui/modal";
import PrintDocument from "@/components/ui/print-document";
import PrintAppliedFiltersPanel, { type PrintFilterItem } from "@/components/ui/print-applied-filters-panel";
import CustomersListPrintDocument from "@/components/documents/sales/customers-list-print-document";

export default function PrintCustomersModal({
  opened,
  close,
  filters = {},
}: {
  opened: boolean;
  close: () => void;
  filters?: CustomersPrintFilters;
}) {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();
  const printDate = formatDate(new Date(), locale);

  const [ignoreFilters, setIgnoreFilters] = useState(false);

  const appliedFilters = removeEmptyParams({
    keyword: filters.keyword,
    classification: filters.classification,
    blacklisted: filters.blacklisted ? "true" : "",
  });
  const hasFilters = Object.keys(appliedFilters).length > 0;
  const printFilters = ignoreFilters ? {} : filters;
  const printQueryParams = {
    limit: "list-all-to-print",
    ...(ignoreFilters ? {} : appliedFilters),
  };

  const filterItems: PrintFilterItem[] = [
    filters.keyword ? { key: "keyword", label: translate("Search", "البحث"), value: filters.keyword, Icon: Search } : null,
    filters.classification
      ? {
          key: "classification",
          label: translate("Classification", "التصنيف"),
          value: getCustomerClassificationLabel(filters.classification as CustomerClassification, locale),
          Icon: Tags,
        }
      : null,
    filters.blacklisted
      ? {
          key: "blacklisted",
          label: translate("Status", "الحالة"),
          value: translate("Blacklisted", "القائمة السوداء"),
          Icon: Ban,
        }
      : null,
  ].filter((item): item is PrintFilterItem => item !== null);

  const { data: customersToPrint, refetch: fetchCustomersToPrint } = useQuery({
    queryKey: queryKeys.customers.list(printQueryParams),
    queryFn: ({ signal }) => customersApi.listAllToPrint({ privateRequest, signal, filters: printFilters }),
    staleTime: staleTimes.customers,
    enabled: false,
  });

  function handleClose() {
    close();
    setTimeout(() => {
      setIgnoreFilters(false);
    }, 250);
  }

  return (
    <Modal opened={opened} onClose={handleClose} title={translate("Print Customers List", "طباعة قائمة العملاء")}>
      <div className="flex flex-col gap-3">
        <p className="-mt-1 text-sm text-gray-500">
          {hasFilters && !ignoreFilters
            ? translate(
                "The printed list will match the filters below.",
                "ستطابق القائمة المطبوعة الفلاتر أدناه.",
              )
            : translate(
                "Print the full customers list, sorted by name.",
                "طباعة قائمة العملاء كاملة، مرتبة حسب الاسم.",
              )}
        </p>

        <PrintAppliedFiltersPanel
          filterItems={filterItems}
          ignoreFilters={ignoreFilters}
          onIgnoreFiltersChange={setIgnoreFilters}
          ignoreLabel={translate("Ignore applied filters and print all customers", "تجاهل الفلاتر المطبقة وطباعة كل العملاء")}
        />

        <PrintDocument
          title={translate(`Customers List - ${printDate}`, `قائمة العملاء - ${printDate}`)}
          buttonLabel={translate("Print", "طباعة")}
          onBeforePrint={async () => {
            await fetchCustomersToPrint();
          }}
          renderTrigger={({ onClick, loading, label, icon }) => (
            <Button
              onClick={onClick}
              leftSection={icon}
              color="dark"
              variant="light"
              radius="md"
              fullWidth
              disabled={loading}
            >
              {label}
            </Button>
          )}
        >
          {customersToPrint && (
            <CustomersListPrintDocument
              customers={customersToPrint}
              appliedFilters={
                ignoreFilters ? [] : filterItems.map(({ label, value }) => ({ label, value }))
              }
            />
          )}
        </PrintDocument>
      </div>
    </Modal>
  );
}
