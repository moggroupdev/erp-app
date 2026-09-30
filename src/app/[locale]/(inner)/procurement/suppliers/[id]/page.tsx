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
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import ActionsMenu from "@/components/ui/actions-menu";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import SupplierModal from "@/components/global/data-modals/supplier-modal";
import AddressModal from "@/components/global/data-modals/address-modal";
import AddressCard from "@/components/global/address-card";
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

  const supplier = supplierQuery.data || null;
  const addresses = addressesQuery.data || [];

  const loading = supplierQuery.isFetching || addressesQuery.isFetching;
  const queryError = supplierQuery.error || addressesQuery.error;
  const errorMessage = queryError ? getErrorMessage(locale, queryError) : "";

  useDocumentTitle(`${supplier?.name || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Suppliers", "الموردون")}`);

  const setDefaultAddressMutation = useMutation({
    mutationFn: (addressId: string) => suppliersApi.setDefaultAddress({ privateRequest, id, addressId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.addresses(id) }),
  });

  function handleRetry() {
    supplierQuery.refetch();
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
          <div className="flex items-center gap-2">
            <RefetchButton isFetching={loading} onRefetch={handleRetry} />
            <ActionsMenu>
              {supplier && canUpdateSupplier && (
                <Menu.Item onClick={openUpdateModal}>{translate("Edit", "تعديل")}</Menu.Item>
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
                  {canUpdateSupplier && (
                    <Menu.Item onClick={openAddressModal}>{translate("Add New Address", "إضافة عنوان جديد")}</Menu.Item>
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
                        canUpdateSupplier
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

            <SupplierQuickLinks supplierId={supplier.id} />
          </>
        )
      )}
    </LayoutBox>
  );
}
