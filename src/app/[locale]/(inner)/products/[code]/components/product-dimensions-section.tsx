"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { useDisclosure } from "@mantine/hooks";
import useHasPermission from "@/hooks/use-has-permission";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { isManufactured } from "@/lib/constants/enums/product-source-types";
import type { ProductDimension, ProductWithCreator } from "@/types/product";
import { ActionIcon, Badge, Button, FloatingPosition, Menu, Table, Tooltip } from "@mantine/core";
import { Box, Pencil, Plus, Star } from "lucide-react";
import EmptySection from "@/components/ui/sections/empty";
import ActionsMenu from "@/components/ui/actions-menu";
import { EmptyValue } from "@/components/ui/entity-details";
import ProductDimensionModal from "@/components/global/data-modals/product-dimension-modal";

export default function ProductDimensionsSection({
  product,
  dimensions,
}: {
  product: ProductWithCreator;
  dimensions: ProductDimension[];
}) {
  const { translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();

  const canUpdateProduct = useHasPermission(PERMISSIONS.UPDATE_PRODUCT);
  const manufactured = isManufactured(product.sourceType);

  const [dimensionModalOpened, { open: openDimensionModal, close: closeDimensionModal }] = useDisclosure(false);
  const [dimensionToUpdate, setDimensionToUpdate] = useState<ProductDimension | null>(null);

  // Schema: each row is (length + depth) XOR diameter. Show only columns that appear in the list.
  const showLengthDepth = dimensions.some((d) => d.length != null && d.depth != null);
  const showDiameter = dimensions.some((d) => d.diameter != null);

  function handleOpenCreateModal() {
    setDimensionToUpdate(null);
    openDimensionModal();
  }

  function handleOpenEditModal(dimension: ProductDimension) {
    setDimensionToUpdate(dimension);
    openDimensionModal();
  }

  return (
    <section className="mt-4 flex flex-col gap-4">
      <ProductDimensionModal
        opened={dimensionModalOpened}
        close={closeDimensionModal}
        productCode={product.code}
        isFirstDimension={dimensions.length === 0}
        dimensionToUpdate={dimensionToUpdate}
        setDimensionToUpdate={setDimensionToUpdate}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-haze-50 text-haze-600">
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

        <ActionsMenu>
          {canUpdateProduct && (
            <Menu.Item leftSection={<Plus size={14} />} onClick={handleOpenCreateModal}>
              {translate("Add New Dimension", "إضافة مقاس جديد")}
            </Menu.Item>
          )}
        </ActionsMenu>
      </div>

      {dimensions.length === 0 ? (
        <EmptySection message={translate("No dimensions added", "لا توجد مقاسات مسجلة")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="bg-gray-50">
              <Table.Tr>
                <Table.Th />
                {showLengthDepth && (
                  <>
                    <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                      {translate("Length", "الطول")}
                    </Table.Th>
                    <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                      {translate("Depth", "العمق")}
                    </Table.Th>
                  </>
                )}
                {showDiameter && (
                  <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Diameter", "القطر")}
                  </Table.Th>
                )}
                <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Height", "الارتفاع")} ({translation.productDimensionUnit})
                </Table.Th>
                <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Notes", "الملاحظات")}
                </Table.Th>
                <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Standard", "نمطي")}
                </Table.Th>
                {(manufactured || canUpdateProduct) && <Table.Th />}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {dimensions.map((dimension) => (
                <Table.Tr key={dimension.id} className={dimension.isStandard ? "bg-haze-50/60" : "text-gray-600"}>
                  <Table.Td className="text-gray-600">{product.title}</Table.Td>
                  {showLengthDepth && (
                    <>
                      <Table.Td className="font-medium text-gray-800">{dimension.length ?? "-"}</Table.Td>
                      <Table.Td className="font-medium text-gray-800">{dimension.depth ?? "-"}</Table.Td>
                    </>
                  )}
                  {showDiameter && (
                    <Table.Td className="font-medium text-gray-800">{dimension.diameter ?? "-"}</Table.Td>
                  )}
                  <Table.Td className="font-medium text-gray-800">{dimension.height}</Table.Td>
                  <Table.Td className="max-w-48 truncate text-gray-600" title={dimension.notes || undefined}>
                    {dimension.notes || <EmptyValue />}
                  </Table.Td>
                  <Table.Td>
                    {dimension.isStandard ? (
                      <Badge
                        size="sm"
                        variant="light"
                        color="haze"
                        radius="md"
                        leftSection={<Star size={12} className="fill-current" />}
                      >
                        {translate("Standard", "نمطي")}
                      </Badge>
                    ) : (
                      <EmptyValue />
                    )}
                  </Table.Td>
                  {(manufactured || canUpdateProduct) && (
                    <Table.Td w={0}>
                      <div className="flex items-center justify-end gap-1.5">
                        {canUpdateProduct && (
                          <Tooltip
                            withArrow
                            offset={10}
                            label={translate("Edit dimension", "تعديل المقاس")}
                            position={translate("right", "left") as FloatingPosition}
                          >
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              size="sm"
                              radius="md"
                              onClick={() => handleOpenEditModal(dimension)}
                              aria-label={translate("Edit dimension", "تعديل المقاس")}
                            >
                              <Pencil size={14} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        {manufactured && (
                          <Button
                            component={Link}
                            href={getLocalizedHref(`/products/${product.code}/boms/${dimension.id}`)}
                            variant="light"
                            color="haze"
                            size="xs"
                            radius="md"
                          >
                            {translate("View BOM", "عرض قائمة المواد")}
                          </Button>
                        )}
                      </div>
                    </Table.Td>
                  )}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}
    </section>
  );
}
