"use client";

import { Badge } from "@mantine/core";
import { ClipboardList } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import { type MaterialPurchaseRequisitionDetailed } from "@/types/material-purchase-requisition";
import EntityDetails, { CreatorLink, EmptyValue, type DetailRow } from "@/components/ui/entity-details";
import { getRequisitionStatus, getRequisitionStatusLabel } from "../../helpers";

export default function RequisitionDetails({ requisition }: { requisition: MaterialPurchaseRequisitionDetailed }) {
  const { locale, translate } = useI18n();
  const status = getRequisitionStatusLabel(getRequisitionStatus(requisition), translate);

  const rows: DetailRow[] = [
    {
      key: translate("Requisition Code", "كود طلب الشراء"),
      value: requisition.code,
      mono: true,
      copyText: requisition.code,
    },
    {
      key: translate("Status", "الحالة"),
      value: (
        <Badge size="sm" variant="light" color={status.color} radius="md">
          {status.label}
        </Badge>
      ),
    },
    {
      key: translate("Production Sub-Department", "قسم الانتاج"),
      value: getProductionSubDepartmentLabel(requisition.productionSubDepartment, locale),
    },
    {
      key: translate("Department Manager", "مدير القسم"),
      value: <CreatorLink creator={requisition.productionSubDepartmentManager} />,
    },
    {
      key: translate("Notes", "الملاحظات"),
      value: requisition.notes ? (
        <span className="font-normal whitespace-pre-wrap">{requisition.notes}</span>
      ) : (
        <EmptyValue />
      ),
    },
    {
      key: translate("Created By", "أنشئ بواسطة"),
      value: <CreatorLink creator={requisition.createdBy} />,
    },
    {
      key: translate("Created At", "تاريخ الإنشاء"),
      value: formatDateAndTime(requisition.createdAt, locale),
    },
  ];

  return (
    <EntityDetails
      title={requisition.code}
      icon={ClipboardList}
      titleAside={
        <Badge size="lg" variant="light" color={status.color} radius="md">
          {status.label}
        </Badge>
      }
      rows={rows}
    />
  );
}
