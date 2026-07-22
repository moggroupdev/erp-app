"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import { useDisclosure } from "@mantine/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import useHasPermission from "@/hooks/use-has-permission";
import productsApi from "@/lib/api/products";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { getDimensionUnitLabel } from "@/lib/constants/enums/dimension-units";
import { Badge, Button, FloatingPosition, Table, Tooltip } from "@mantine/core";
import { Box, Pencil, Star } from "lucide-react";
import PermissionGuard from "@/components/guards/permission";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import Modal from "@/components/ui/modal";
import ErrorAlert from "@/components/ui/error-alert";
import ProductModal from "@/components/global/data-modals/product-modal";
import ProductDimensionModal from "@/components/global/data-modals/product-dimension-modal";
import ProductDetails from "./components/product-details";

const PAGE_TITLE = { en: "Product Details", ar: "تفاصيل المنتج" };

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const { code } = useParams<{ code: string }>();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();

  const canUpdateProduct = useHasPermission(PERMISSIONS.UPDATE_PRODUCT);

  const productQuery = useQuery({
    queryKey: queryKeys.products.detail(code),
    queryFn: ({ signal }) => productsApi.get({ privateRequest, code, signal }),
    staleTime: staleTimes.products,
  });

  const dimensionsQuery = useQuery({
    queryKey: queryKeys.products.dimensions(code),
    queryFn: ({ signal }) => productsApi.listDimensions({ privateRequest, code, signal }),
    staleTime: staleTimes.products,
  });

  const product = productQuery.data || null;
  const dimensions = dimensionsQuery.data || [];

  const loading = productQuery.isFetching || dimensionsQuery.isFetching;
  const queryError = productQuery.error || dimensionsQuery.error;
  const errorMessage = queryError ? getErrorMessage(locale, queryError) : "";

  useDocumentTitle(`${product?.title || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Products", "المنتجات")}`);

  const setDefaultDimensionMutation = useMutation({
    mutationFn: (dimensionId: string) => productsApi.setDefaultDimension({ privateRequest, code, dimensionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.dimensions(code) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(code) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });

  function handleRetry() {
    productQuery.refetch();
    dimensionsQuery.refetch();
  }

  // ========================= MODALS =========================

  const [updateModalOpened, { open: openUpdateModal, close: closeUpdateModal }] = useDisclosure(false);
  const [dimensionModalOpened, { open: openDimensionModal, close: closeDimensionModal }] = useDisclosure(false);
  const [defaultModalOpened, { open: openDefaultModal, close: closeDefaultModal }] = useDisclosure(false);
  const [pendingDefaultDimensionId, setPendingDefaultDimensionId] = useState<string | null>(null);

  const setDefaultErrorMessage = setDefaultDimensionMutation.error
    ? getErrorMessage(locale, setDefaultDimensionMutation.error)
    : "";

  function handleOpenDefaultModal(dimensionId: string) {
    setPendingDefaultDimensionId(dimensionId);
    openDefaultModal();
  }

  function handleCloseDefaultModal() {
    closeDefaultModal();
    setPendingDefaultDimensionId(null);
    setDefaultDimensionMutation.reset();
  }

  function handleConfirmSetDefault(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingDefaultDimensionId) return;
    setDefaultDimensionMutation.mutate(pendingDefaultDimensionId, { onSuccess: handleCloseDefaultModal });
  }

  const pendingDefaultDimension = dimensions.find((dimension) => dimension.id === pendingDefaultDimensionId) ?? null;

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: true,
        sideElements: (
          <div className="flex gap-2">
            <RefetchButton isFetching={loading} onRefetch={handleRetry} />
            {product && (
              <PermissionGuard permission={PERMISSIONS.UPDATE_PRODUCT}>
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
        <LoadingSection message={translate("Loading product data", "جاري تحميل ملف المنتج")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("An error occurred while loading product data", "حدث خطأ أثناء تحميل ملف المنتج")}
          errorMessage={errorMessage}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: handleRetry }}
        />
      ) : (
        product && (
          <>
            <ProductModal
              opened={updateModalOpened}
              close={closeUpdateModal}
              productToUpdate={product}
              setProductToUpdate={() => {}}
            />

            <ProductDetails product={product} />

            <section className="mt-4 flex flex-col gap-4">
              <ProductDimensionModal
                opened={dimensionModalOpened}
                close={closeDimensionModal}
                productCode={product.code}
                isFirstDimension={dimensions.length === 0}
              />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                    <Box size={16} />
                  </div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-semibold text-gray-900">{translate("Dimensions", "المقاسات")}</h4>
                    {dimensions.length > 0 && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {dimensions.length}
                      </span>
                    )}
                  </div>
                </div>

                <PermissionGuard permission={PERMISSIONS.UPDATE_PRODUCT}>
                  <Button onClick={openDimensionModal} variant="light" color="teal" radius="md">
                    {translate("Add New Dimension", "إضافة مقاس جديد")}
                  </Button>
                </PermissionGuard>
              </div>

              {dimensions.length === 0 ? (
                <EmptySection message={translate("No dimensions added", "لا توجد مقاسات مسجلة")} />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
                    <Table.Thead className="bg-gray-50">
                      <Table.Tr>
                        <Table.Th />
                        <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                          {translate("Length", "الطول")}
                        </Table.Th>
                        <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                          {translate("Depth", "العمق")}
                        </Table.Th>
                        <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                          {translate("Height", "الارتفاع")}
                        </Table.Th>
                        <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                          {translate("Unit", "الوحدة")}
                        </Table.Th>
                        <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                          {translate("Default", "افتراضي")}
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {dimensions.map((dimension) => (
                        <Table.Tr key={dimension.id} className={dimension.isDefault ? "bg-teal-50/60" : "text-gray-600"}>
                          <Table.Td className="text-gray-600">{product.title}</Table.Td>
                          <Table.Td className="font-medium text-gray-800">{dimension.length}</Table.Td>
                          <Table.Td className="font-medium text-gray-800">{dimension.depth}</Table.Td>
                          <Table.Td className="font-medium text-gray-800">{dimension.height}</Table.Td>
                          <Table.Td>
                            <Badge size="sm" variant="light" color="gray" radius="md">
                              {getDimensionUnitLabel(dimension.dimensionUnit, locale)}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            {dimension.isDefault ? (
                              <Badge
                                size="sm"
                                variant="light"
                                color="teal"
                                radius="md"
                                leftSection={<Star size={12} className="fill-current" />}
                              >
                                {translate("Default", "افتراضي")}
                              </Badge>
                            ) : (
                              canUpdateProduct && (
                                <Tooltip
                                  withArrow
                                  offset={10}
                                  label={translate("Set as default dimension", "تعيين كمقاس افتراضي")}
                                  position={translate("right", "left") as FloatingPosition}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDefaultModal(dimension.id)}
                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-teal-100 hover:text-teal-600"
                                    aria-label={translate("Set as default dimension", "تعيين كمقاس افتراضي")}
                                  >
                                    <Star size={14} />
                                  </button>
                                </Tooltip>
                              )
                            )}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              )}

              <Modal
                opened={defaultModalOpened}
                onClose={handleCloseDefaultModal}
                title={translate("Set as default dimension", "تعيين كمقاس افتراضي")}
              >
                <form onSubmit={handleConfirmSetDefault} className="flex flex-col gap-3">
                  <p className="text-sm">
                    {translate(
                      "Are you sure you want to set this dimension as the default?",
                      "هل أنت متأكد من تعيين هذا المقاس كمقاس افتراضي؟",
                    )}
                  </p>

                  {pendingDefaultDimension && (
                    <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                      <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                        {translate("Selected dimension", "المقاس المحدد")}
                      </span>
                      <p className="mt-1 text-sm font-medium text-gray-800">
                        {pendingDefaultDimension.length} × {pendingDefaultDimension.depth} × {pendingDefaultDimension.height}{" "}
                        {getDimensionUnitLabel(pendingDefaultDimension.dimensionUnit, locale)}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="light" color="dark" radius="md" onClick={handleCloseDefaultModal} fullWidth>
                      {translation.cancel}
                    </Button>
                    <Button type="submit" color="teal" loading={setDefaultDimensionMutation.isPending} radius="md" fullWidth>
                      {translation.confirm}
                    </Button>
                  </div>

                  {setDefaultErrorMessage && <ErrorAlert error={setDefaultErrorMessage} />}
                </form>
              </Modal>
            </section>
          </>
        )
      )}
    </LayoutBox>
  );
}
