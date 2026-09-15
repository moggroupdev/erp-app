"use client";

import Link from "next/link";
import { useDisclosure } from "@mantine/hooks";
import { Button, Table } from "@mantine/core";
import { ClipboardList } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import {
  getProductionSubDepartmentLabel,
  type ProductionSubDepartment,
} from "@/lib/constants/enums/production-sub-departments";
import type { MaterialPurchaseOrderItemRequisitionAllocation } from "@/types/material-purchase-order";
import Modal from "@/components/ui/modal";

export default function ItemRequisitionAllocationsModal({
  materialTitle,
  allocations,
}: {
  materialTitle: string;
  allocations: MaterialPurchaseOrderItemRequisitionAllocation[];
}) {
  const { locale, translate } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const [opened, { open, close }] = useDisclosure(false);

  if (allocations.length === 0) {
    return <span className="text-sm text-gray-300">-</span>;
  }

  return (
    <>
      <Button
        type="button"
        variant="light"
        color="teal"
        size="compact-xs"
        radius="md"
        leftSection={<ClipboardList size={13} />}
        onClick={open}
        className="bg-teal-800/12! text-teal-900! hover:bg-teal-800/18! [&_svg]:text-teal-800!"
      >
        {translate("Requisitions", "طلبات الشراء")} ({allocations.length})
      </Button>

      <Modal
        opened={opened}
        onClose={close}
        title={translate("Linked requisitions", "طلبات الشراء المرتبطة")}
        size="lg"
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            {materialTitle} · {translate("Allocated quantities from material purchase requisitions.", "الكميات المخصصة من طلبات شراء المواد.")}
          </p>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <Table className="text-nowrap" verticalSpacing="sm" horizontalSpacing="sm">
              <Table.Thead className="bg-gray-50">
                <Table.Tr>
                  <Table.Th>{translate("Requisition Number", "رقم طلب الشراء")}</Table.Th>
                  <Table.Th>{translate("Department", "القسم")}</Table.Th>
                  <Table.Th>{translate("Quantity allocated", "الكمية المخصصة")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {allocations.map((allocation) => (
                  <Table.Tr key={allocation.id} className="text-gray-600">
                    <Table.Td>
                      <Link
                        href={getLocalizedHref(`/procurement/material-requisitions/${allocation.requisition.id}`)}
                        className="font-mono font-medium text-teal-800 hover:underline"
                      >
                        {allocation.requisition.code}
                      </Link>
                    </Table.Td>
                    <Table.Td>
                      {getProductionSubDepartmentLabel(
                        allocation.requisition.productionSubDepartment as ProductionSubDepartment,
                        locale,
                      )}
                    </Table.Td>
                    <Table.Td className="font-medium text-gray-800">
                      {formatQuantity(allocation.quantityAllocated)}{" "}
                      {getMaterialUnitLabel(allocation.unitOfMeasurementSelected, locale)}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>

          <Button variant="light" color="dark" radius="md" onClick={close} fullWidth>
            {translate("Close", "إغلاق")}
          </Button>
        </div>
      </Modal>
    </>
  );
}
