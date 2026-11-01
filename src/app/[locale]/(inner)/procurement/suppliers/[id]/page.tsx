"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import { useDisclosure } from "@mantine/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import useHasPermission from "@/hooks/use-has-permission";
import suppliersApi from "@/lib/api/suppliers";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { Menu } from "@mantine/core";
import { Ban, MapPin, Pencil, Undo2, UserRound } from "lucide-react";
import BlacklistConfirmModal from "@/components/ui/blacklist-confirm-modal";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import ActionsMenu from "@/components/ui/actions-menu";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import SupplierModal from "@/components/global/data-modals/supplier-modal";
import AddressModal from "@/components/global/data-modals/address-modal";
import AddressCard from "@/components/global/address-card";
import ContactPersonModal from "@/components/global/data-modals/contact-person-modal";
import ContactPersonCard from "@/components/global/contact-person-card";
import SupplierDetails from "./components/supplier-details";
import SupplierQuickLinks from "./components/quick-links";

const PAGE_TITLE = { en: "Supplier Data", ar: "ملف المورد" };

export default function Page() {
  const { locale, translate } = useI18n();
  const { id } = useParams<{ id: string }>();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();

  const canUpdateSupplier = useHasPermission(PERMISSIONS.UPDATE_SUPPLIER);

  const supplierQuery = useQuery({
    queryKey: queryKeys.suppliers.detail(id),
    queryFn: ({ signal }) => suppliersApi.get({ privateRequest, id, signal }),
    staleTime: staleTimes.suppliers,
  });

  const addressesQuery = useQuery({
    queryKey: queryKeys.suppliers.addresses(id),
    queryFn: ({ signal }) => suppliersApi.listAddresses({ privateRequest, id, signal }),
    staleTime: staleTimes.suppliers,
  });

  const contactPersonsQuery = useQuery({
    queryKey: queryKeys.suppliers.contactPersons(id),
    queryFn: ({ signal }) => suppliersApi.listContactPersons({ privateRequest, id, signal }),
    staleTime: staleTimes.suppliers,
  });

  const supplier = supplierQuery.data || null;
  const addresses = addressesQuery.data || [];
  const contactPersons = contactPersonsQuery.data || [];
  const isBlacklisted = !!supplier?.blacklistedAt;
  const canEditSupplier = canUpdateSupplier && !isBlacklisted;

  const loading = supplierQuery.isFetching || addressesQuery.isFetching || contactPersonsQuery.isFetching;
  const queryError = supplierQuery.error || addressesQuery.error || contactPersonsQuery.error;
  const errorMessage = queryError ? getErrorMessage(locale, queryError) : "";

  useDocumentTitle(`${supplier?.name || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Suppliers", "الموردون")}`);

  const setDefaultAddressMutation = useMutation({
    mutationFn: (addressId: string) => suppliersApi.setDefaultAddress({ privateRequest, id, addressId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.addresses(id) }),
  });

  const setPrimaryContactMutation = useMutation({
    mutationFn: (contactPersonId: string) => suppliersApi.setPrimaryContactPerson({ privateRequest, id, contactPersonId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.contactPersons(id) }),
  });

  function handleRetry() {
    supplierQuery.refetch();
    addressesQuery.refetch();
    contactPersonsQuery.refetch();
  }

  // ========================= MODALS =========================

  const [updateModalOpened, { open: openUpdateModal, close: closeUpdateModal }] = useDisclosure(false);
  const [addressModalOpened, { open: openAddressModal, close: closeAddressModal }] = useDisclosure(false);
  const [contactModalOpened, { open: openContactModal, close: closeContactModal }] = useDisclosure(false);
  const [blacklistConfirmOpened, { open: openBlacklistConfirm, close: closeBlacklistConfirm }] = useDisclosure(false);

  function handleOpenBlacklistConfirm() {
    blacklistMutation.reset();
    openBlacklistConfirm();
  }

  function handleCloseBlacklistConfirm() {
    closeBlacklistConfirm();
    blacklistMutation.reset();
  }

  const blacklistMutation = useMutation({
    mutationFn: () =>
      isBlacklisted
        ? suppliersApi.removeFromBlacklist({ privateRequest, id })
        : suppliersApi.addToBlacklist({ privateRequest, id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
      handleCloseBlacklistConfirm();
    },
  });

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: true,
        sideElements: (
          <div className="flex items-center gap-3">
            <RefetchButton isFetching={loading} onRefetch={handleRetry} />
            <ActionsMenu>
              {supplier && canEditSupplier && (
                <Menu.Item leftSection={<Pencil size={14} />} onClick={openUpdateModal}>
                  {translate("Edit supplier", "تعديل المورد")}
                </Menu.Item>
              )}
              {supplier && canUpdateSupplier && (
                <Menu.Item
                  color={isBlacklisted ? undefined : "clay"}
                  leftSection={isBlacklisted ? <Undo2 size={14} /> : <Ban size={14} />}
                  onClick={handleOpenBlacklistConfirm}
                >
                  {isBlacklisted
                    ? translate("Remove from blacklist", "إزالة من القائمة السوداء")
                    : translate("Add to blacklist", "إضافة إلى القائمة السوداء")}
                </Menu.Item>
              )}
            </ActionsMenu>
          </div>
        ),
      }}
    >
      {loading ? (
        <LoadingSection message={translate("Loading supplier data", "جاري تحميل ملف المورد")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("An error occurred while loading supplier data", "حدث خطأ أثناء تحميل ملف المورد")}
          errorMessage={errorMessage}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: handleRetry }}
        />
      ) : (
        supplier && (
          <>
            <SupplierModal
              opened={updateModalOpened}
              close={closeUpdateModal}
              supplierToUpdate={supplier}
              setSupplierToUpdate={() => {}}
            />

            <SupplierDetails supplier={supplier} />

            {/* Addresses Section */}
            <section className="mt-4 flex flex-col gap-4">
              <AddressModal
                opened={addressModalOpened}
                close={closeAddressModal}
                entityType="supplier"
                entityId={supplier.id}
                isFirstAddress={addresses.length === 0}
              />

              <div className="flex items-center justify-between gap-3">
                <h4 className="text-lg font-semibold text-gray-900">{translate("Addresses", "العناوين")}</h4>

                <ActionsMenu>
                  {canEditSupplier && (
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
                        canEditSupplier
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
                entityType="supplier"
                entityId={supplier.id}
                isFirstContact={contactPersons.length === 0}
              />

              <div className="flex items-center justify-between gap-3">
                <h4 className="text-lg font-semibold text-gray-900">{translate("Contact Persons", "أشخاص الاتصال")}</h4>

                <ActionsMenu>
                  {canEditSupplier && (
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
                        canEditSupplier
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

            <SupplierQuickLinks supplierId={supplier.id} />
          </>
        )
      )}

      {supplier && (
        <BlacklistConfirmModal
          opened={blacklistConfirmOpened}
          onClose={handleCloseBlacklistConfirm}
          action={isBlacklisted ? "remove" : "add"}
          name={supplier.name}
          onConfirm={() => blacklistMutation.mutate()}
          isPending={blacklistMutation.isPending}
          error={blacklistMutation.error ? getErrorMessage(locale, blacklistMutation.error) : undefined}
        />
      )}
    </LayoutBox>
  );
}
