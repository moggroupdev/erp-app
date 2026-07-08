"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/hooks";
import { useDisclosure } from "@mantine/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useDataHandler from "@/hooks/use-data-handler";
import customersApi from "@/lib/api/customers";
import handleRequest from "@/lib/helpers/handle-request";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { Customer } from "@/types/customer";
import { Button } from "@mantine/core";
import { Pencil, Plus } from "lucide-react";
import PermissionGuard from "@/components/guards/permission";
import AdminLayoutBox from "@/components/ui/admin-layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import CustomerModal from "@/components/global/customer-modal";

export default function Page() {
  const { locale, translate, translation } = useI18n();

  const { id } = useParams();

  const {
    privateRequest,
    loading,
    setLoading,
    error,
    setError,
    data: customer,
    setData: setCustomer,
  } = useDataHandler<Customer | null>({ initialData: null, initialLoading: true });

  useDocumentTitle(`${customer?.name || translate("Customer Data", "ملف العميل")} | ${translation.dashboard}`);

  function handleLoadCustomer() {
    handleRequest(locale, setLoading, setError, async () => {
      const response = await customersApi.get({ privateRequest, id: id as string });
      setCustomer(response);
    });
  }

  useEffect(() => {
    handleLoadCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========== Handle Modals ==========

  const [updateModalOpened, { open: openUpdateModal, close: closeUpdateModal }] = useDisclosure(false);
  const [addressModalOpened, { open: openAddressModal, close: closeAddressModal }] = useDisclosure(false);

  return (
    <AdminLayoutBox
      header={{
        title: translate("Customer Data", "ملف العميل"),
        backLink: true,
        sideElements: (
          <PermissionGuard permission={PERMISSIONS.UPDATE_CUSTOMER}>
            <Button onClick={openUpdateModal} variant="light" radius="md" leftSection={<Pencil />}>
              {translate("Edit", "تعديل")}
            </Button>
          </PermissionGuard>
        ),
      }}
    >
      {loading ? (
        <LoadingSection message={translate("Loading customer data", "جاري تحميل بيانات العميل")} />
      ) : error ? (
        <ErrorSection
          errorTitle={translate("An error occurred while loading customer data", "حدث خطأ أثناء تحميل بيانات العميل")}
          errorMessage={error}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: handleLoadCustomer }}
        />
      ) : (
        customer && (
          <>
            <section className="flex flex-1 flex-col gap-4 rounded-xl">
              {/* Customer Header */}
              <header className="flex flex-col gap-3 rounded-lg bg-gray-100 p-4">
                <p className="text-xs sm:text-sm">
                  {translate("Customer ID", "معرف العميل")}: {customer.id}
                </p>

                <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">{customer.name}</h2>
              </header>

              {/* Contact Info */}
              {(customer.phone || customer.email) && (
                <section className="flex flex-col gap-1.5 rounded-lg bg-gray-100 p-4">
                  <h4>{translate("Contact Information", "معلومات الاتصال")}</h4>
                  {customer.phone && (
                    <p>
                      {translate("Phone", "الهاتف")}: {customer.phone}
                    </p>
                  )}

                  {customer.email && (
                    <p>
                      {translate("Email", "البريد الإلكتروني")}: {customer.email}
                    </p>
                  )}
                </section>
              )}

              {/* Registration Date */}
              <section className="rounded-lg bg-gray-100 p-4">
                <p>
                  {translate("Registration Date", "تاريخ التسجيل")}: {formatDateAndTime(customer.createdAt, locale)}
                </p>
              </section>

              {/* Customer Addresses */}
              <section className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4>{translate("Addresses", "العناوين")}</h4>

                  <PermissionGuard permission={PERMISSIONS.ADD_CUSTOMER}>
                    <Button
                      onClick={openAddressModal}
                      variant="light"
                      color="teal"
                      radius="md"
                      leftSection={<Plus />}
                    >
                      {translate("Add New Address", "إضافة عنوان جديد")}
                    </Button>
                  </PermissionGuard>
                </div>
              </section>
            </section>

            <CustomerModal
              opened={updateModalOpened}
              close={closeUpdateModal}
              customerToUpdate={customer}
              setCustomerToUpdate={setCustomer}
              callback={(response) => setCustomer(response)}
            />
          </>
        )
      )}
    </AdminLayoutBox>
  );
}
