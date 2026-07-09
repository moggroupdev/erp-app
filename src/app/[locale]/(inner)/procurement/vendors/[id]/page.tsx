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
import { Button } from "@mantine/core";
import { Pencil } from "lucide-react";
import PermissionGuard from "@/components/guards/permission";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import VendorModal from "@/components/global/vendor-modal";
import VendorDetails from "./components/vendor-details";

const PAGE_TITLE = { en: "Vendor Data", ar: "ملف المورد" };

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

  useDocumentTitle(`${vendor?.name || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Vendors", "الموردون")}`);

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
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: handleLoadVendor }}
        />
      ) : (
        vendor && (
          <>
            <VendorDetails vendor={vendor} />

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
    </LayoutBox>
  );
}
