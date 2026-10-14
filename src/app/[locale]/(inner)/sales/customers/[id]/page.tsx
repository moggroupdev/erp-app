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
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { Menu } from "@mantine/core";
import { MapPin, Pencil, UserRound } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import ActionsMenu from "@/components/ui/actions-menu";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import CustomerModal from "@/components/global/data-modals/customer-modal";
import AddressModal from "@/components/global/data-modals/address-modal";
import AddressCard from "@/components/global/address-card";
import ContactPersonModal from "@/components/global/data-modals/contact-person-modal";
import ContactPersonCard from "@/components/global/contact-person-card";
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

  const contactPersonsQuery = useQuery({
    queryKey: queryKeys.customers.contactPersons(id),
    queryFn: ({ signal }) => customersApi.listContactPersons({ privateRequest, id, signal }),
    staleTime: staleTimes.customers,
  });

  const customer = customerQuery.data || null;
  const addresses = addressesQuery.data || [];
  const contactPersons = contactPersonsQuery.data || [];

  const loading = customerQuery.isFetching || addressesQuery.isFetching || contactPersonsQuery.isFetching;
  const queryError = customerQuery.error || addressesQuery.error || contactPersonsQuery.error;
  const errorMessage = queryError ? getErrorMessage(locale, queryError) : "";

  useDocumentTitle(`${customer?.name || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Customers", "العملاء")}`);

  const setDefaultAddressMutation = useMutation({
    mutationFn: (addressId: string) => customersApi.setDefaultAddress({ privateRequest, id, addressId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.customers.addresses(id) }),
  });

  const setPrimaryContactMutation = useMutation({
    mutationFn: (contactPersonId: string) => customersApi.setPrimaryContactPerson({ privateRequest, id, contactPersonId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.customers.contactPersons(id) }),
  });

  function handleRetry() {
    customerQuery.refetch();
    addressesQuery.refetch();
    contactPersonsQuery.refetch();
  }

  // ========================= MODALS =========================

  const [updateModalOpened, { open: openUpdateModal, close: closeUpdateModal }] = useDisclosure(false);
  const [addressModalOpened, { open: openAddressModal, close: closeAddressModal }] = useDisclosure(false);
  const [contactModalOpened, { open: openContactModal, close: closeContactModal }] = useDisclosure(false);

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: true,
        sideElements: (
          <div className="flex items-center gap-3">
            <RefetchButton isFetching={loading} onRefetch={handleRetry} />
            <ActionsMenu>
              {customer && canUpdateCustomer && (
                <Menu.Item leftSection={<Pencil size={14} />} onClick={openUpdateModal}>
                  {translate("Edit customer", "تعديل العميل")}
                </Menu.Item>
              )}
            </ActionsMenu>
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

                <ActionsMenu>
                  {canUpdateCustomer && (
                    <Menu.Item leftSection={<MapPin size={14} />} onClick={openAddressModal}>
                      {translate("Add new address", "إضافة عنوان جديد")}
                    </Menu.Item>
                  )}
                </ActionsMenu>
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

            <section className="mt-4 flex flex-col gap-4">
              <ContactPersonModal
                opened={contactModalOpened}
                close={closeContactModal}
                entityType="customer"
                entityId={customer.id}
                isFirstContact={contactPersons.length === 0}
              />

              <div className="flex items-center justify-between gap-3">
                <h4 className="text-lg font-semibold text-gray-900">{translate("Contact Persons", "أشخاص الاتصال")}</h4>

                <ActionsMenu>
                  {canUpdateCustomer && (
                    <Menu.Item leftSection={<UserRound size={14} />} onClick={openContactModal}>
                      {translate("Add contact person", "إضافة شخص اتصال")}
                    </Menu.Item>
                  )}
                </ActionsMenu>
              </div>

              {contactPersons.length === 0 ? (
                <EmptySection message={translate("No contact persons added", "لا يوجد أشخاص اتصال مسجلون")} />
              ) : (
                <div className={`grid gap-3 ${contactPersons.length > 1 ? "md:grid-cols-2" : ""}`}>
                  {contactPersons.map((contactPerson) => (
                    <ContactPersonCard
                      key={contactPerson.id}
                      contactPerson={contactPerson}
                      onSetPrimary={
                        canUpdateCustomer
                          ? async (contactPersonId) => {
                              await setPrimaryContactMutation.mutateAsync(contactPersonId);
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
