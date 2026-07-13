"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/hooks";
import { useDisclosure } from "@mantine/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useDataHandler from "@/hooks/use-data-handler";
import useHasPermission from "@/hooks/use-has-permission";
import customersApi from "@/lib/api/customers";
import handleRequest from "@/lib/helpers/handle-request";
import { type Customer, type CustomerAddress } from "@/types/customer";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { Button } from "@mantine/core";
import { Pencil } from "lucide-react";
import PermissionGuard from "@/components/guards/permission";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import CustomerModal from "@/components/global/customer-modal";
import AddressModal from "@/components/global/address-modal";
import AddressCard from "@/components/global/address-card";
import CustomerDetails from "./components/customer-details";

const PAGE_TITLE = { en: "Customer Data", ar: "ملف العميل" };

type PageData = { customer: Customer | null; addresses: CustomerAddress[] };

export default function Page() {
  const { locale, translate } = useI18n();

  const { id } = useParams<{ id: string }>();

  const canUpdateCustomer = useHasPermission(PERMISSIONS.UPDATE_CUSTOMER);

  const { privateRequest, loading, setLoading, error, setError, data, setData } = useDataHandler<PageData>({
    initialData: { customer: null, addresses: [] },
    initialLoading: true,
  });

  const { customer, addresses } = data;

  function setCustomer(value: React.SetStateAction<Customer | null>) {
    setData((prev) => ({ ...prev, customer: typeof value === "function" ? value(prev.customer) : value }));
  }

  function setAddresses(value: React.SetStateAction<CustomerAddress[]>) {
    setData((prev) => ({ ...prev, addresses: typeof value === "function" ? value(prev.addresses) : value }));
  }

  useDocumentTitle(`${customer?.name || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Customers", "العميلون")}`);

  function handleLoadData() {
    handleRequest(locale, setLoading, setError, async () => {
      const [customerResponse, addressesResponse] = await Promise.all([
        customersApi.get({ privateRequest, id }),
        customersApi.listAddresses({ privateRequest, id }),
      ]);

      setData({ customer: customerResponse, addresses: addressesResponse });
    });
  }

  async function handleSetDefaultAddress(addressId: string) {
    const response = await customersApi.setDefaultAddress({ privateRequest, id, addressId });
    setAddresses((prev) => [response, ...prev.filter((a) => a.id !== response.id).map((a) => ({ ...a, isDefault: false }))]);
  }

  useEffect(() => {
    handleLoadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========================= MODAL HANDLERS =========================

  const [updateModalOpened, { open: openUpdateModal, close: closeUpdateModal }] = useDisclosure(false);
  const [addressModalOpened, { open: openAddressModal, close: closeAddressModal }] = useDisclosure(false);

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: true,
        sideElements: customer && (
          <PermissionGuard permission={PERMISSIONS.UPDATE_CUSTOMER}>
            <Button onClick={openUpdateModal} variant="light" radius="md" leftSection={<Pencil size={15} />}>
              {translate("Edit", "تعديل")}
            </Button>
          </PermissionGuard>
        ),
      }}
    >
      {loading ? (
        <LoadingSection message={translate("Loading customer data", "جاري تحميل ملف العميل")} />
      ) : error ? (
        <ErrorSection
          errorTitle={translate("An error occurred while loading customer data", "حدث خطأ أثناء تحميل ملف العميل")}
          errorMessage={error}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: handleLoadData }}
        />
      ) : (
        customer && (
          <>
            <CustomerModal
              opened={updateModalOpened}
              close={closeUpdateModal}
              customerToUpdate={customer}
              setCustomerToUpdate={setCustomer}
              callback={(response) => setCustomer(response)}
            />

            <AddressModal
              opened={addressModalOpened}
              close={closeAddressModal}
              entityType="customer"
              entityId={customer.id}
              isFirstAddress={addresses.length === 0}
              callback={(response) =>
                setAddresses((prev) =>
                  response.isDefault ? [response, ...prev.map((a) => ({ ...a, isDefault: false }))] : [...prev, response],
                )
              }
            />

            <CustomerDetails customer={customer} />

            <section className="mt-4 flex flex-col gap-4">
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
                      onSetDefault={canUpdateCustomer ? handleSetDefaultAddress : undefined}
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
