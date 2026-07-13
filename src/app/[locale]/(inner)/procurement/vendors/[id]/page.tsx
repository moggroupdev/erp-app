"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/hooks";
import { useDisclosure } from "@mantine/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useDataHandler from "@/hooks/use-data-handler";
import vendorsApi from "@/lib/api/vendors";
import handleRequest from "@/lib/helpers/handle-request";
import { type Vendor, type VendorAddress } from "@/types/vendor";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { Button } from "@mantine/core";
import { Pencil } from "lucide-react";
import PermissionGuard from "@/components/guards/permission";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import VendorModal from "@/components/global/vendor-modal";
import AddressCard from "@/components/global/address-card";
import VendorDetails from "./components/vendor-details";

const PAGE_TITLE = { en: "Vendor Data", ar: "ملف المورد" };

type PageData = { vendor: Vendor | null; addresses: VendorAddress[] };

export default function Page() {
  const { locale, translate } = useI18n();

  const { id } = useParams<{ id: string }>();

  const { privateRequest, loading, setLoading, error, setError, data, setData } = useDataHandler<PageData>({
    initialData: { vendor: null, addresses: [] },
    initialLoading: true,
  });

  const { vendor, addresses } = data;

  function setVendor(value: React.SetStateAction<Vendor | null>) {
    setData((prev) => ({ ...prev, vendor: typeof value === "function" ? value(prev.vendor) : value }));
  }

  useDocumentTitle(`${vendor?.name || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Vendors", "الموردون")}`);

  function handleLoadData() {
    handleRequest(locale, setLoading, setError, async () => {
      const [vendorResponse, addressesResponse] = await Promise.all([
        vendorsApi.get({ privateRequest, id }),
        vendorsApi.getAddresses({ privateRequest, id }),
      ]);

      setData({ vendor: vendorResponse, addresses: addressesResponse });
    });
  }

  useEffect(() => {
    handleLoadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========================= MODAL HANDLERS =========================

  const [updateModalOpened, { open: openUpdateModal, close: closeUpdateModal }] = useDisclosure(false);

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: true,
        sideElements: vendor && (
          <PermissionGuard permission={PERMISSIONS.UPDATE_VENDOR}>
            <Button onClick={openUpdateModal} variant="light" radius="md" leftSection={<Pencil size={15} />}>
              {translate("Edit", "تعديل")}
            </Button>
          </PermissionGuard>
        ),
      }}
    >
      {loading ? (
        <LoadingSection message={translate("Loading vendor data", "جاري تحميل ملف المورد")} />
      ) : error ? (
        <ErrorSection
          errorTitle={translate("An error occurred while loading vendor data", "حدث خطأ أثناء تحميل ملف المورد")}
          errorMessage={error}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: handleLoadData }}
        />
      ) : (
        vendor && (
          <>
            <VendorModal
              opened={updateModalOpened}
              close={closeUpdateModal}
              vendorToUpdate={vendor}
              setVendorToUpdate={setVendor}
              callback={(response) => setVendor(response)}
            />

            <VendorDetails vendor={vendor} />

            <section className="mt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-lg font-semibold text-gray-900">{translate("Addresses", "العناوين")}</h4>

                <PermissionGuard permission={PERMISSIONS.UPDATE_VENDOR}>
                  <Button variant="light" color="teal" radius="md">
                    {translate("Add New Address", "إضافة عنوان جديد")}
                  </Button>
                </PermissionGuard>
              </div>

              {addresses.length === 0 ? (
                <EmptySection message={translate("No addresses added", "لا توجد عناوين مسجلة")} />
              ) : (
                <div className={`grid gap-3 ${addresses.length > 1 ? "md:grid-cols-2" : ""}`}>
                  {addresses.map((address) => (
                    <AddressCard key={address.id} address={address} />
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
