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
      key: translate("Requisition Number", "رقم طلب الشراء"),
      value: requisition.code,
      mono: true,
      copyText: requisition.code,
    },
    {
      key: translate("Requisition Date", "تاريخ طلب الشراء"),
      value: formatDateAndTime(requisition.createdAt, locale),
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
      key: translate("Requesting Party", "جهة الطلب"),
      value: getProductionSubDepartmentLabel(requisition.productionSubDepartment, locale),
    },
    {
      key: translate("Department Manager", "رئيس القسم"),
      value: <CreatorLink creator={requisition.productionSubDepartmentManager} />,
    },

    {
      key: translate("Editor", "المحرر"),
      value: <CreatorLink creator={requisition.createdBy} />,
    },

    {
      key: translate("Notes", "الملاحظات"),
      value: requisition.notes ? (
        <span className="font-normal whitespace-pre-wrap">{requisition.notes}</span>
      ) : (
        <EmptyValue />
      ),
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
