"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import { useDisclosure } from "@mantine/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import useHasPermission from "@/hooks/use-has-permission";
import vendorsApi from "@/lib/api/vendors";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
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
import VendorModal from "@/components/global/data-modals/vendor-modal";
import AddressModal from "@/components/global/data-modals/address-modal";
import AddressCard from "@/components/global/address-card";
import VendorDetails from "./components/vendor-details";

const PAGE_TITLE = { en: "Vendor Data", ar: "ملف المورد" };

export default function Page() {
  const { locale, translate } = useI18n();
  const { id } = useParams<{ id: string }>();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();

  const canUpdateVendor = useHasPermission(PERMISSIONS.UPDATE_VENDOR);

  const vendorQuery = useQuery({
    queryKey: queryKeys.vendors.detail(id),
    queryFn: ({ signal }) => vendorsApi.get({ privateRequest, id, signal }),
    staleTime: staleTimes.vendors,
  });

  const addressesQuery = useQuery({
    queryKey: queryKeys.vendors.addresses(id),
    queryFn: ({ signal }) => vendorsApi.listAddresses({ privateRequest, id, signal }),
    staleTime: staleTimes.vendors,
  });

  const vendor = vendorQuery.data || null;
  const addresses = addressesQuery.data || [];

  const loading = vendorQuery.isFetching || addressesQuery.isFetching;
  const queryError = vendorQuery.error || addressesQuery.error;
  const errorMessage = queryError ? getErrorMessage(locale, queryError) : "";

  useDocumentTitle(`${vendor?.name || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Vendors", "الموردون")}`);

  const setDefaultAddressMutation = useMutation({
    mutationFn: (addressId: string) => vendorsApi.setDefaultAddress({ privateRequest, id, addressId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.vendors.addresses(id) }),
  });

  function handleRetry() {
    vendorQuery.refetch();
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
            {vendor && (
              <PermissionGuard permission={PERMISSIONS.UPDATE_VENDOR}>
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
        <LoadingSection message={translate("Loading vendor data", "جاري تحميل ملف المورد")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("An error occurred while loading vendor data", "حدث خطأ أثناء تحميل ملف المورد")}
          errorMessage={errorMessage}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: handleRetry }}
        />
      ) : (
        vendor && (
          <>
            <VendorModal
              opened={updateModalOpened}
              close={closeUpdateModal}
              vendorToUpdate={vendor}
              setVendorToUpdate={() => {}}
            />

            <VendorDetails vendor={vendor} />

            {/* Addresses Section */}
            <section className="mt-4 flex flex-col gap-4">
              <AddressModal
                opened={addressModalOpened}
                close={closeAddressModal}
                entityType="vendor"
                entityId={vendor.id}
                isFirstAddress={addresses.length === 0}
              />

              <div className="flex items-center justify-between gap-3">
                <h4 className="text-lg font-semibold text-gray-900">{translate("Addresses", "العناوين")}</h4>

                <PermissionGuard permission={PERMISSIONS.UPDATE_VENDOR}>
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
                        canUpdateVendor
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
