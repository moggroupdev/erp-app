"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Table } from "@mantine/core";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import RefetchButton from "@/components/ui/refetch-button";
import PrintDocument from "@/components/ui/print-document";
import CopyButton from "@/components/ui/copy-button";
import ProtectedLink from "@/components/ui/protected-link";
import { EmptyValue } from "@/components/ui/entity-details";
import ContractReviewPrintDocument from "@/components/documents/sales/contract-review-print-document";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import contractsApi from "@/lib/api/contracts";
import { queryKeys } from "@/lib/api/query-keys";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { staleTimes } from "@/lib/constants/stale-times";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatDimensionLabel } from "@/lib/helpers/format-dimension-label";
import { formatMoney } from "@/lib/helpers/format-money";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { useI18n } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/types";
import type { ContractItem, ContractProductUnit } from "@/types/contract";
import ContractDetails from "./components/contract-details";
import { contractItemTitle } from "../helpers";

const PAGE_TITLE = { en: "Contract Review Details", ar: "تفاصيل مراجعة العقد" };

type UnitColumnKey =
  | "supplierSerialNumber"
  | "producedAt"
  | "receivedAt"
  | "deliveredAt"
  | "installedAt"
  | "warrantyStartedAt"
  | "cancelledAt";

const UNIT_COLUMNS: {
  key: UnitColumnKey;
  width: string;
  label: { en: string; ar: string };
}[] = [
  { key: "supplierSerialNumber", width: "16%", label: { en: "Supplier serial", ar: "مسلسل المورد" } },
  { key: "producedAt", width: "14%", label: { en: "Production end", ar: "انتهاء الإنتاج" } },
  { key: "receivedAt", width: "14%", label: { en: "Received", ar: "الاستلام" } },
  { key: "deliveredAt", width: "14%", label: { en: "Delivered", ar: "التسليم" } },
  { key: "installedAt", width: "14%", label: { en: "Installed", ar: "التركيب" } },
  { key: "warrantyStartedAt", width: "14%", label: { en: "Warranty start", ar: "بداية الضمان" } },
  { key: "cancelledAt", width: "12%", label: { en: "Cancelled", ar: "الإلغاء" } },
];

function unitHasValue(unit: ContractProductUnit, key: UnitColumnKey) {
  const value = unit[key];
  return typeof value === "string" ? value.trim().length > 0 : !!value;
}

function visibleUnitColumns(units: ContractProductUnit[]) {
  return UNIT_COLUMNS.filter((column) => units.some((unit) => unitHasValue(unit, column.key)));
}

function UnitDate({ value, locale }: { value: string | null; locale: Locale }) {
  if (!value) return <EmptyValue />;
  return <>{formatDateAndTime(value, locale)}</>;
}

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const { id } = useParams<{ id: string }>();
  const privateRequest = usePrivateRequest();

  const {
    data: contract,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.contracts.detail(id),
    queryFn: ({ signal }) => contractsApi.get({ privateRequest, id, signal }),
    staleTime: staleTimes.contracts,
  });

  useDocumentTitle(
    contract
      ? translate(`${PAGE_TITLE.en} ${contract.code}`, `${PAGE_TITLE.ar} ${contract.code}`)
      : translate(PAGE_TITLE.en, PAGE_TITLE.ar),
    "dashboard",
  );

  return (
    <LayoutBox
      header={{
        backLink: true,
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        sideElements: (
          <div className="flex items-center gap-3">
            <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
            {contract ? (
              <PrintDocument
                title={translate(`${PAGE_TITLE.en} - ${contract.code}`, `${PAGE_TITLE.ar} - ${contract.code}`)}
                buttonLabel={translate("Print contract review", "طباعة مراجعة العقد")}
                buttonType="button"
                paperWidth={210}
                paperHeight={297}
                paperMarginX={12}
                paperMarginTop={12}
                paperMarginBottom={14}
              >
                <ContractReviewPrintDocument contract={contract} />
              </PrintDocument>
            ) : null}
          </div>
        ),
      }}
    >
      {isFetching ? (
        <LoadingSection message={translate("Loading contract review...", "جاري تحميل مراجعة العقد...")} />
      ) : error ? (
        <ErrorSection
          errorTitle={translate("Error loading contract review", "خطأ في تحميل مراجعة العقد")}
          errorMessage={getErrorMessage(locale, error)}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : (
        contract && (
          <div className="flex flex-col gap-4">
            <ContractDetails contract={contract} />

            <section className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-semibold text-gray-900">{translate("Items", "البنود")}</h2>
                {contract.items.length > 0 ? (
                  <span className="text-xs font-medium text-gray-500 tabular-nums">
                    {translate(`${contract.items.length} lines`, `${contract.items.length} بنود`)}
                    {" · "}
                    {formatMoney(Number(contract.totalAmount))} {translation.currency}
                  </span>
                ) : null}
              </div>

              {contract.items.length === 0 ? (
                <EmptySection message={translate("No items on this contract review", "لا توجد بنود في مراجعة العقد هذه")} />
              ) : (
                <div className="flex flex-col gap-3">
                  {contract.items.map((item, index) => (
                    <ContractItemCard
                      key={item.id}
                      item={item}
                      index={index}
                      locale={locale}
                      currency={translation.currency}
                      dimensionUnit={translation.productDimensionUnit}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )
      )}
    </LayoutBox>
  );
}

function ContractItemCard({
  item,
  index,
  locale,
  currency,
  dimensionUnit,
}: {
  item: ContractItem;
  index: number;
  locale: Locale;
  currency: string;
  dimensionUnit: string;
}) {
  const { translate } = useI18n();
  const title = contractItemTitle(item);
  const cancelled = !!item.cancelledAt;
  const lineAmount = item.quantity * item.unitPrice;
  const units = item.productUnits;
  const columns = visibleUnitColumns(units);
  const serialWidth = columns.length === 0 ? "100%" : "18%";

  return (
    <article
      className={[
        "overflow-hidden rounded-xl border",
        cancelled ? "border-gray-200 bg-gray-50/60" : "border-gray-200 bg-white",
      ].join(" ")}
    >
      <header
        className={[
          "flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5",
          cancelled ? "border-gray-200 bg-gray-100/80" : "border-gray-200 bg-gray-50",
        ].join(" ")}
      >
        <h3
          className={[
            "flex min-w-0 items-center gap-2 text-sm font-semibold",
            cancelled ? "text-gray-500" : "text-gray-900",
          ].join(" ")}
        >
          <span
            className={[
              "inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md px-1.5 text-xs font-semibold tabular-nums",
              cancelled ? "bg-gray-200 text-gray-600" : "bg-haze-100 text-haze-700",
            ].join(" ")}
          >
            {index + 1}
          </span>
          <span className="truncate">{title}</span>
          {cancelled ? (
            <span className="bg-clay-100 text-clay-700 shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold">
              {translate("Cancelled", "ملغي")}
            </span>
          ) : null}
        </h3>
        <span
          className={[
            "shrink-0 text-sm font-semibold tabular-nums",
            cancelled ? "text-gray-400 line-through" : "text-gray-900",
          ].join(" ")}
        >
          {formatMoney(lineAmount)}
        </span>
      </header>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <ProtectedLink
              permission={PERMISSIONS.READ_PRODUCTS}
              href={`/products/${item.product.code}`}
              className="font-mono font-medium text-gray-800 hover:underline"
            >
              {item.product.code}
            </ProtectedLink>
            <CopyButton text={item.product.code} />
          </div>
          <span>{formatDimensionLabel(item.productDimension, dimensionUnit)}</span>
          <span className="tabular-nums">
            {item.quantity} × {formatMoney(item.unitPrice)} {currency}
          </span>
          {units.length > 0 ? (
            <span className="text-xs font-medium text-gray-500 tabular-nums">
              {translate(`${units.length} units`, `${units.length} وحدات`)}
            </span>
          ) : null}
        </div>

        {item.notes?.trim() ? <p className="text-sm whitespace-pre-wrap text-gray-700">{item.notes.trim()}</p> : null}

        {item.cancellationReason?.trim() ? (
          <p className="text-clay-700 text-xs whitespace-pre-wrap">
            {translate("Cancellation reason", "سبب الإلغاء")}: {item.cancellationReason.trim()}
          </p>
        ) : null}

        {units.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <Table className="w-full table-fixed text-nowrap" verticalSpacing="xs" highlightOnHover>
              <Table.Thead>
                <Table.Tr className="bg-gray-50">
                  <Table.Th w={serialWidth}>{translate("Serial", "الرقم المسلسل")}</Table.Th>
                  {columns.map((column) => (
                    <Table.Th key={column.key} w={column.width}>
                      {translate(column.label.en, column.label.ar)}
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {units.map((unit) => (
                  <UnitRow key={unit.id} unit={unit} locale={locale} columns={columns} />
                ))}
              </Table.Tbody>
            </Table>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function UnitRow({ unit, locale, columns }: { unit: ContractProductUnit; locale: Locale; columns: typeof UNIT_COLUMNS }) {
  const cancelled = !!unit.cancelledAt;

  return (
    <Table.Tr className={cancelled ? "text-gray-400" : "text-gray-600"}>
      <Table.Td className={cancelled ? "font-mono font-semibold text-gray-400" : "font-mono font-semibold text-gray-800"}>
        {unit.serialNumber}
      </Table.Td>
      {columns.map((column) => (
        <Table.Td key={column.key} className={column.key === "supplierSerialNumber" ? "font-mono" : undefined}>
          {column.key === "supplierSerialNumber" ? (
            unit.supplierSerialNumber || <EmptyValue />
          ) : (
            <UnitDate value={unit[column.key]} locale={locale} />
          )}
        </Table.Td>
      ))}
    </Table.Tr>
  );
}
