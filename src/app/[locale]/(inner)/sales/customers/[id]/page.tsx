"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import { useDisclosure } from "@mantine/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import useHasPermission from "@/hooks/use-has-permission";
import customersApi from "@/lib/api/customers";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query/keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { Button } from "@mantine/core";
import { Pencil } from "lucide-react";
import PermissionGuard from "@/components/guards/permission";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import CustomerModal from "@/components/global/customer-modal";
import AddressModal from "@/components/global/address-modal";
import AddressCard from "@/components/global/address-card";
import CustomerDetails from "./components/customer-details";

const PAGE_TITLE = { en: "Customer Data", ar: "ملف العميل" };

export default function Page() {
  const { locale, translate } = useI18n();
  const { id } = useParams<{ id: string }>();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();

  const canUpdateCustomer = useHasPermission(PERMISSIONS.UPDATE_CUSTOMER);

  const customerQuery = useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: ({ signal }) => customersApi.get({ privateRequest, id, signal }),
    staleTime: staleTimes.customers,
  });

  const addressesQuery = useQuery({
    queryKey: queryKeys.customers.addresses(id),
    queryFn: ({ signal }) => customersApi.listAddresses({ privateRequest, id, signal }),
    staleTime: staleTimes.customers,
  });

  const customer = customerQuery.data || null;
  const addresses = addressesQuery.data || [];

  const loading = customerQuery.isFetching || addressesQuery.isFetching;
  const queryError = customerQuery.error || addressesQuery.error;
  const errorMessage = queryError ? getErrorMessage(locale, queryError) : "";

  useDocumentTitle(`${customer?.name || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Customers", "العملاء")}`);

  const setDefaultAddressMutation = useMutation({
    mutationFn: (addressId: string) => customersApi.setDefaultAddress({ privateRequest, id, addressId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.customers.addresses(id) }),
  });

  function handleRetry() {
    customerQuery.refetch();
    addressesQuery.refetch();
  }

  // ========================= MODALS =========================

  const [updateModalOpened, { open: openUpdateModal, close: closeUpdateModal }] = useDisclosure(false);
  const [addressModalOpened, { open: openAddressModal, close: closeAddressModal }] = useDisclosure(false);

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: true,
        sideElements: (
          <div className="flex gap-2">
            <RefetchButton isFetching={loading} onRefetch={handleRetry} />
            {customer && (
              <PermissionGuard permission={PERMISSIONS.UPDATE_CUSTOMER}>
                <Button onClick={openUpdateModal} variant="light" radius="md" leftSection={<Pencil size={15} />}>
                  {translate("Edit", "تعديل")}
                </Button>
              </PermissionGuard>
            )}
          </div>
        ),
      }}
    >
      {loading ? (
        <LoadingSection message={translate("Loading customer data", "جاري تحميل ملف العميل")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("An error occurred while loading customer data", "حدث خطأ أثناء تحميل ملف العميل")}
          errorMessage={errorMessage}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: handleRetry }}
        />
      ) : (
        customer && (
          <>
            <CustomerModal
              opened={updateModalOpened}
              close={closeUpdateModal}
              customerToUpdate={customer}
              setCustomerToUpdate={() => {}}
            />

            <CustomerDetails customer={customer} />

            {/* Addresses Section */}
            <section className="mt-4 flex flex-col gap-4">
              <AddressModal
                opened={addressModalOpened}
                close={closeAddressModal}
                entityType="customer"
                entityId={customer.id}
                isFirstAddress={addresses.length === 0}
              />

              <div className="flex items-center justify-between gap-3">
                <h4 className="text-lg font-semibold text-gray-900">{translate("Addresses", "العناوين")}</h4>

                <PermissionGuard permission={PERMISSIONS.UPDATE_CUSTOMER}>
                  <Button onClick={openAddressModal} variant="light" color="teal" radius="md">
                    {translate("Add New Address", "إضافة عنوان جديد")}
                  </Button>
                </PermissionGuard>
              </div>

              {addresses.length === 0 ? (
                <EmptySection message={translate("No addresses added", "لا توجد عناوين مسجلة")} />
              ) : (
                <div className={`grid gap-3 ${addresses.length > 1 ? "md:grid-cols-2" : ""}`}>
                  {addresses.map((address) => (
                    <AddressCard
                      key={address.id}
                      address={address}
                      onSetDefault={
                        canUpdateCustomer
                          ? async (addressId) => {
                              await setDefaultAddressMutation.mutateAsync(addressId);
                            }
                          : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )
      )}
    </LayoutBox>
  );
}
