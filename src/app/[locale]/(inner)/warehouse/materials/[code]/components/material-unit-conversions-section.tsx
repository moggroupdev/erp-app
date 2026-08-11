"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import useHasPermission from "@/hooks/use-has-permission";
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import type { MaterialWithCreator } from "@/types/material";
import { Badge, Button, Table } from "@mantine/core";
import { Plus, Ruler, Trash2 } from "lucide-react";
import PermissionGuard from "@/components/guards/permission";
import EmptySection from "@/components/ui/sections/empty";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import MaterialUnitConversionModal from "./material-unit-conversion-modal";

export default function MaterialUnitConversionsSection({ material }: { material: MaterialWithCreator }) {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();
  const canUpdate = useHasPermission(PERMISSIONS.UPDATE_MATERIAL);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const unitsQuery = useQuery({
    queryKey: queryKeys.materials.units(material.code),
    queryFn: ({ signal }) => materialsApi.listUnits({ privateRequest, code: material.code, signal }),
    staleTime: staleTimes.materials,
  });

  const units = unitsQuery.data ?? [];
  const existingUnitValues = useMemo(() => units.map((row) => row.unit), [units]);

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await materialsApi.removeUnit({ privateRequest, code: material.code, id });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.materials.units(material.code) });
      toast.success(translate("Alternate unit removed successfully.", "تم حذف وحدة القياس البديلة بنجاح."));
    },
    onError: (error) => {
      toast.error(getErrorMessage(locale, error));
    },
  });

  return (
    <section className="mt-4 flex flex-col gap-4">
      <MaterialUnitConversionModal
        opened={modalOpened}
        close={closeModal}
        materialCode={material.code}
        baseUnit={material.unitOfMeasurement}
        existingUnits={existingUnitValues}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Ruler size={16} />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="text-lg font-semibold text-gray-900">
              {translate("Alternate Units", "وحدات القياس البديلة")}
            </h4>
            <p className="text-xs text-gray-500">
              {translate(
                `Base unit: ${getMaterialUnitLabel(material.unitOfMeasurement, locale)}. Define other units and how they convert to the base unit.`,
                `الوحدة الأساسية: ${getMaterialUnitLabel(material.unitOfMeasurement, locale)}. عرّف وحدات أخرى وكيفية تحويلها إلى الوحدة الأساسية.`,
              )}
            </p>
          </div>
        </div>

        {units.length > 0 && (
          <PermissionGuard permission={PERMISSIONS.UPDATE_MATERIAL}>
            <Button onClick={openModal} variant="light" color="indigo" radius="md" leftSection={<Plus size={15} />}>
              {translate("Add Unit", "إضافة وحدة")}
            </Button>
          </PermissionGuard>
        )}
      </div>

      {unitsQuery.isFetching ? (
        <LoadingSection message={translate("Loading alternate units", "جاري تحميل وحدات القياس البديلة")} />
      ) : unitsQuery.error ? (
        <ErrorSection
          errorTitle={translate("Failed to load alternate units", "فشل تحميل وحدات القياس البديلة")}
          errorMessage={getErrorMessage(locale, unitsQuery.error)}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => unitsQuery.refetch() }}
        />
      ) : units.length === 0 ? (
        <EmptySection message={translate("No alternate units defined yet.", "لا توجد وحدات قياس بديلة بعد.")}>
          <PermissionGuard permission={PERMISSIONS.UPDATE_MATERIAL}>
            <Button onClick={openModal} variant="light" color="indigo" radius="md" leftSection={<Plus size={15} />}>
              {translate("Add Unit", "إضافة وحدة")}
            </Button>
          </PermissionGuard>
        </EmptySection>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <Table className="text-nowrap" highlightOnHover>
            <Table.Thead className="bg-gray-50">
              <Table.Tr className="h-10">
                <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Unit", "الوحدة")}
                </Table.Th>
                <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Conversion to Base", "التحويل إلى الوحدة الأساسية")}
                </Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {units.map((row) => (
                <Table.Tr key={row.id} className="text-gray-600">
                  <Table.Td>
                    <Badge size="sm" variant="light" color="indigo" radius="md">
                      {getMaterialUnitLabel(row.unit, locale)}
                    </Badge>
                  </Table.Td>
                  <Table.Td className="font-medium text-gray-800">
                    {translate(
                      `1 ${getMaterialUnitLabel(row.unit, locale)} = ${row.conversionFactorToBase} ${getMaterialUnitLabel(material.unitOfMeasurement, locale)}`,
                      `1 ${getMaterialUnitLabel(row.unit, locale)} = ${row.conversionFactorToBase} ${getMaterialUnitLabel(material.unitOfMeasurement, locale)}`,
                    )}
                  </Table.Td>
                  <Table.Td w={0}>
                    {canUpdate && (
                      <Button
                        onClick={() => removeMutation.mutate(row.id)}
                        loading={removeMutation.isPending && removeMutation.variables === row.id}
                        variant="light"
                        color="red"
                        size="xs"
                        radius="md"
                        p={6}
                      >
                        <Trash2 size={12} />
                      </Button>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}
    </section>
  );
}
