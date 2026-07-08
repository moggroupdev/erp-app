"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/hooks";
import { useDisclosure } from "@mantine/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useDataHandler from "@/hooks/use-data-handler";
import vendorsApi from "@/lib/api/vendors";
import handleRequest from "@/lib/helpers/handle-request";
import { type Vendor } from "@/types/vendor";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { Button } from "@mantine/core";
import { Pencil } from "lucide-react";
import PermissionGuard from "@/components/guards/permission";
import AdminLayoutBox from "@/components/ui/admin-layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import VendorModal from "@/components/global/vendor-modal";

export default function Page() {
  const { locale, translate } = useI18n();

  const { id } = useParams();

  const {
    privateRequest,
    loading,
    setLoading,
    error,
    setError,
    data: vendor,
    setData: setVendor,
  } = useDataHandler<Vendor | null>({ initialData: null, initialLoading: true });

  useDocumentTitle(`${vendor?.name || translate("Vendor Data", "بيانات المورد")} | ${translate("Vendors", "الموردون")}`);

  function handleLoadVendor() {
    handleRequest(locale, setLoading, setError, async () => {
      const response = await vendorsApi.get({ privateRequest, id: id as string });
      setVendor(response);
    });
  }

  useEffect(() => {
    handleLoadVendor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========== Handle Modals ==========

  const [updateModalOpened, { open: openUpdateModal, close: closeUpdateModal }] = useDisclosure(false);

  return (
    <AdminLayoutBox
      header={{
        title: translate("Vendor Data", "بيانات المورد"),
        backLink: true,
        sideElements: vendor && (
          <PermissionGuard permission={PERMISSIONS.UPDATE_VENDOR}>
            <Button onClick={openUpdateModal} variant="light" radius="md" leftSection={<Pencil />}>
              {translate("Edit", "تعديل")}
            </Button>
          </PermissionGuard>
        ),
      }}
    >
      {loading ? (
        <LoadingSection message={translate("Loading vendor data", "جاري تحميل بيانات المورد")} />
      ) : error ? (
        <ErrorSection
          errorTitle={translate("An error occurred while loading vendor data", "حدث خطأ أثناء تحميل بيانات المورد")}
          errorMessage={error}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: handleLoadVendor }}
        />
      ) : (
        vendor && (
          <>
            <section className="flex flex-1 flex-col gap-4 rounded-xl">
              {/* Vendor Header */}
              <header className="flex flex-col gap-3 rounded-lg bg-gray-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <p className="text-xs sm:text-sm">
                    {translate("Vendor ID", "معرف المورد")}: {vendor.id}
                  </p>
                </div>

                <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">{vendor.name}</h2>
              </header>

              {/* Contact Info */}
              <section className="flex flex-col gap-1.5 rounded-lg bg-gray-100 p-4">
                <h4>{translate("Contact Information", "معلومات الاتصال")}</h4>
                <p>
                  {translate("Phone", "الهاتف")}: {vendor.phone}
                </p>
                {vendor.email && (
                  <p>
                    {translate("Email", "البريد الإلكتروني")}: {vendor.email}
                  </p>
                )}
              </section>

              {/* Registration Date */}
              <section className="rounded-lg bg-gray-100 p-4">
                <p>
                  {translate("Registration Date", "تاريخ التسجيل")}: {formatDateAndTime(vendor.createdAt, locale)}
                </p>
              </section>
            </section>

            <VendorModal
              opened={updateModalOpened}
              close={closeUpdateModal}
              vendorToUpdate={vendor}
              setVendorToUpdate={setVendor}
              callback={(response) => setVendor(response)}
            />
          </>
        )
      )}
    </AdminLayoutBox>
  );
}
