"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Table } from "@mantine/core";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import RefetchButton from "@/components/ui/refetch-button";
import CopyButton from "@/components/ui/copy-button";
import ProtectedLink from "@/components/ui/protected-link";
import { EmptyValue } from "@/components/ui/entity-details";
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
import type { ContractProductUnit } from "@/types/contract";
import ContractDetails from "./components/contract-details";
import { contractItemTitle } from "../helpers";

const PAGE_TITLE = { en: "Contract", ar: "عقد" };

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
    contract ? translate(`${PAGE_TITLE.en} ${contract.code}`, `${PAGE_TITLE.ar} ${contract.code}`) : translate(PAGE_TITLE.en, PAGE_TITLE.ar),
    "dashboard",
  );

  const itemsWithUnits = contract?.items.filter((item) => item.productUnits.length > 0) ?? [];

  return (
    <LayoutBox
      header={{
        backLink: true,
        title: contract?.code || translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        sideElements: <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />,
      }}
    >
      {isFetching ? (
        <LoadingSection message={translate("Loading contract...", "جاري تحميل العقد...")} />
      ) : error ? (
        <ErrorSection
          errorTitle={translate("Error loading contract", "خطأ في تحميل العقد")}
          errorMessage={getErrorMessage(locale, error)}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : (
        contract && (
          <>
            <ContractDetails contract={contract} />

            <section className="mt-4 flex flex-col gap-4">
              <h4 className="text-lg font-semibold text-gray-900">{translate("Items", "البنود")}</h4>
              {contract.items.length === 0 ? (
                <EmptySection message={translate("No items on this contract", "لا توجد بنود في هذا العقد")} />
              ) : (
                <div className="overflow-x-auto">
                  <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{translate("Product", "المنتج")}</Table.Th>
                        <Table.Th>{translate("Code", "الكود")}</Table.Th>
                        <Table.Th>{translate("Dimensions", "الأبعاد")}</Table.Th>
                        <Table.Th>{translate("Quantity", "الكمية")}</Table.Th>
                        <Table.Th>
                          {translate(`Unit price (${translation.currency})`, `سعر الوحدة (${translation.currency})`)}
                        </Table.Th>
                        <Table.Th>
                          {translate(`Line amount (${translation.currency})`, `قيمة البند (${translation.currency})`)}
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {contract.items.map((item) => {
                        const title = contractItemTitle(item);
                        return (
                          <Table.Tr key={item.id} className={item.cancelledAt ? "text-gray-400" : "text-gray-600"}>
                            <Table.Td className={item.cancelledAt ? "font-semibold text-gray-400" : "font-semibold text-gray-800"}>
                              <div className="flex items-center gap-2">
                                <span>{title}</span>
                                {item.cancelledAt ? (
                                  <span className="text-clay-600 text-xs font-bold">{translate("Cancelled", "ملغي")}</span>
                                ) : null}
                              </div>
                            </Table.Td>
                            <Table.Td>
                              <div className="flex items-center gap-1.5">
                                <ProtectedLink
                                  permission={PERMISSIONS.READ_PRODUCTS}
                                  href={`/products/${item.product.code}`}
                                  className="font-mono hover:underline"
                                >
                                  {item.product.code}
                                </ProtectedLink>
                                <CopyButton text={item.product.code} />
                              </div>
                            </Table.Td>
                            <Table.Td>{formatDimensionLabel(item.productDimension, translation.productDimensionUnit)}</Table.Td>
                            <Table.Td>{item.quantity}</Table.Td>
                            <Table.Td>{formatMoney(item.unitPrice)}</Table.Td>
                            <Table.Td className={item.cancelledAt ? "font-semibold text-gray-400" : "font-semibold text-gray-800"}>
                              {formatMoney(item.quantity * item.unitPrice)}
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </div>
              )}
            </section>

            <section className="mt-4 flex flex-col gap-4">
              <h4 className="text-lg font-semibold text-gray-900">{translate("Product units", "وحدات المنتج")}</h4>
              {itemsWithUnits.length === 0 ? (
                <EmptySection message={translate("No product units on this contract", "لا توجد وحدات منتج في هذا العقد")} />
              ) : (
                itemsWithUnits.map((item) => (
                  <div key={item.id} className="flex flex-col gap-2">
                    <h5 className="text-sm font-semibold text-gray-800">{contractItemTitle(item)}</h5>
                    <div className="overflow-x-auto">
                      <Table className="w-full table-fixed text-nowrap" verticalSpacing="xs" highlightOnHover>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th w="14%">{translate("Serial", "الرقم المسلسل")}</Table.Th>
                            <Table.Th w="14%">{translate("Supplier serial", "مسلسل المورد")}</Table.Th>
                            <Table.Th w="12%">{translate("Produced", "الإنتاج")}</Table.Th>
                            <Table.Th w="12%">{translate("Received", "الاستلام")}</Table.Th>
                            <Table.Th w="12%">{translate("Delivered", "التسليم")}</Table.Th>
                            <Table.Th w="12%">{translate("Installed", "التركيب")}</Table.Th>
                            <Table.Th w="14%">{translate("Warranty start", "بداية الضمان")}</Table.Th>
                            <Table.Th w="10%">{translate("Cancelled", "الإلغاء")}</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {item.productUnits.map((unit) => (
                            <UnitRow key={unit.id} unit={unit} locale={locale} />
                          ))}
                        </Table.Tbody>
                      </Table>
                    </div>
                  </div>
                ))
              )}
            </section>
          </>
        )
      )}
    </LayoutBox>
  );
}

function UnitRow({ unit, locale }: { unit: ContractProductUnit; locale: Locale }) {
  return (
    <Table.Tr className={unit.cancelledAt ? "text-gray-400" : "text-gray-600"}>
      <Table.Td className="font-mono font-semibold text-gray-800">{unit.serialNumber}</Table.Td>
      <Table.Td className="font-mono">{unit.supplierSerialNumber || <EmptyValue />}</Table.Td>
      <Table.Td>
        <UnitDate value={unit.producedAt} locale={locale} />
      </Table.Td>
      <Table.Td>
        <UnitDate value={unit.receivedAt} locale={locale} />
      </Table.Td>
      <Table.Td>
        <UnitDate value={unit.deliveredAt} locale={locale} />
      </Table.Td>
      <Table.Td>
        <UnitDate value={unit.installedAt} locale={locale} />
      </Table.Td>
      <Table.Td>
        <UnitDate value={unit.warrantyStartedAt} locale={locale} />
      </Table.Td>
      <Table.Td>
        <UnitDate value={unit.cancelledAt} locale={locale} />
      </Table.Td>
    </Table.Tr>
  );
}
