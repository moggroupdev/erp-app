"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { useDisclosure } from "@mantine/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import useHasPermission from "@/hooks/use-has-permission";
import productsApi from "@/lib/api/products";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { formatDimensionLabel } from "@/lib/helpers/format-dimension-label";
import { queryKeys } from "@/lib/api/query-keys";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { isManufactured } from "@/lib/constants/enums/product-source-types";
import type { ProductDimension, ProductWithCreator } from "@/types/product";
import { Badge, Button, FloatingPosition, Table, Tooltip } from "@mantine/core";
import { Box, Plus, Star } from "lucide-react";
import PermissionGuard from "@/components/guards/permission";
import EmptySection from "@/components/ui/sections/empty";
import Modal from "@/components/ui/modal";
import ErrorAlert from "@/components/ui/error-alert";
import ProductDimensionModal from "@/components/global/data-modals/product-dimension-modal";

export default function ProductDimensionsSection({
  product,
  dimensions,
}: {
  product: ProductWithCreator;
  dimensions: ProductDimension[];
}) {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();

  const canUpdateProduct = useHasPermission(PERMISSIONS.UPDATE_PRODUCT);
  const manufactured = isManufactured(product.sourceType);

  const [dimensionModalOpened, { open: openDimensionModal, close: closeDimensionModal }] = useDisclosure(false);
  const [defaultModalOpened, { open: openDefaultModal, close: closeDefaultModal }] = useDisclosure(false);
  const [pendingDefaultDimensionId, setPendingDefaultDimensionId] = useState<string | null>(null);

  const setDefaultDimensionMutation = useMutation({
    mutationFn: (dimensionId: string) =>
      productsApi.setDefaultDimension({ privateRequest, code: product.code, dimensionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.dimensions(product.code) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(product.code) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });

  const setDefaultErrorMessage = setDefaultDimensionMutation.error
    ? getErrorMessage(locale, setDefaultDimensionMutation.error)
    : "";

  const pendingDefaultDimension = dimensions.find((dimension) => dimension.id === pendingDefaultDimensionId) ?? null;

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

  return (
    <section className="mt-4 flex flex-col gap-4">
      <ProductDimensionModal
        opened={dimensionModalOpened}
        close={closeDimensionModal}
        productCode={product.code}
        isFirstDimension={dimensions.length === 0}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
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
          <Button
            onClick={openDimensionModal}
            variant="light"
            color="blue"
            radius="md"
            leftSection={<Plus size={15} />}
          >
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
                  {translate("Diameter", "القطر")}
                </Table.Th>
                <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Height", "الارتفاع")} ({translation.productDimensionUnit})
                </Table.Th>
                <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Default", "افتراضي")}
                </Table.Th>
                {manufactured && <Table.Th />}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {dimensions.map((dimension) => (
                <Table.Tr key={dimension.id} className={dimension.isDefault ? "bg-blue-50/60" : "text-gray-600"}>
                  <Table.Td className="text-gray-600">{product.title}</Table.Td>
                  <Table.Td className="font-medium text-gray-800">{dimension.length ?? "-"}</Table.Td>
                  <Table.Td className="font-medium text-gray-800">{dimension.depth ?? "-"}</Table.Td>
                  <Table.Td className="font-medium text-gray-800">{dimension.diameter ?? "-"}</Table.Td>
                  <Table.Td className="font-medium text-gray-800">{dimension.height}</Table.Td>
                  <Table.Td>
                    {dimension.isDefault ? (
                      <Badge
                        size="sm"
                        variant="light"
                        color="blue"
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
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-blue-100 hover:text-blue-600"
                          >
                            <Star size={14} />
                          </button>
                        </Tooltip>
                      )
                    )}
                  </Table.Td>
                  {manufactured && (
                    <Table.Td w={0}>
                      <Button
                        component={Link}
                        href={getLocalizedHref(`/products/${product.code}/boms/${dimension.id}`)}
                        variant="light"
                        color="blue"
                        size="xs"
                        radius="md"
                      >
                        {translate("View BOM", "عرض قائمة المواد")}
                      </Button>
                    </Table.Td>
                  )}
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
                {formatDimensionLabel(pendingDefaultDimension, translation.productDimensionUnit)}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="light" color="dark" radius="md" onClick={handleCloseDefaultModal} fullWidth>
              {translation.cancel}
            </Button>
            <Button type="submit" color="blue" loading={setDefaultDimensionMutation.isPending} radius="md" fullWidth>
              {translation.confirm}
            </Button>
          </div>

          {setDefaultErrorMessage && <ErrorAlert error={setDefaultErrorMessage} />}
        </form>
      </Modal>
    </section>
  );
}
