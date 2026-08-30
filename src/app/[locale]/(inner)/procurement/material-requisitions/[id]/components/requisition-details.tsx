"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge, Button } from "@mantine/core";
import { CheckCircle, ClipboardList } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import useHasPermission from "@/hooks/use-has-permission";
import materialPurchaseRequisitionsApi from "@/lib/api/material-purchase-requisitions";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import { queryKeys } from "@/lib/api/query-keys";
import { PERMISSIONS, type Permission } from "@/lib/constants/enums/permissions";
import { type MaterialPurchaseRequisitionDetailed } from "@/types/material-purchase-requisition";
import EntityDetails, { CreatorLink, EmptyValue, type DetailRow } from "@/components/ui/entity-details";
import Modal from "@/components/ui/modal";
import ErrorAlert from "@/components/ui/error-alert";
import { getRequisitionStatus, getRequisitionStatusLabel, isRequisitionTerminal } from "../../helpers";

type ConfirmAction = "planning" | "purchasingManager" | "director";
type ApproverRef = MaterialPurchaseRequisitionDetailed["planningApprovedBy"];

function ApprovalFieldValue({
  approvedAt,
  approvedBy,
  canShowButton,
  permission,
  buttonLabel,
  onApprove,
}: {
  approvedAt: Date | null;
  approvedBy: ApproverRef;
  canShowButton: boolean;
  permission: Permission;
  buttonLabel: string;
  onApprove: () => void;
}) {
  const { locale } = useI18n();
  const hasPermission = useHasPermission(permission);

  if (approvedAt) {
    return (
      <span className="flex items-center gap-1.5">
        <CheckCircle size={16} className="shrink-0 text-teal-600" />
        <span>
          {approvedBy ? (
            <>
              <CreatorLink creator={approvedBy} />
              {" · "}
            </>
          ) : null}
          {formatDateAndTime(approvedAt, locale)}
        </span>
      </span>
    );
  }

  if (canShowButton && hasPermission) {
    return (
      <button onClick={onApprove} className="flex items-center gap-1 text-sm font-semibold! text-blue-500 hover:underline">
        {buttonLabel}
      </button>
    );
  }

  return <EmptyValue />;
}

export default function RequisitionDetails({ requisition }: { requisition: MaterialPurchaseRequisitionDetailed }) {
  const { locale, translate, translation } = useI18n();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const status = getRequisitionStatusLabel(getRequisitionStatus(requisition), translate);
  const terminal = isRequisitionTerminal(requisition);

  const approveMutation = useMutation({
    mutationFn: async (action: ConfirmAction) => {
      if (action === "planning") {
        return materialPurchaseRequisitionsApi.approvePlanning({ privateRequest, id: requisition.id });
      }
      if (action === "purchasingManager") {
        return materialPurchaseRequisitionsApi.approvePurchasingManager({ privateRequest, id: requisition.id });
      }
      return materialPurchaseRequisitionsApi.approveDirector({ privateRequest, id: requisition.id });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.materialPurchaseRequisitions.all });
      toast.success(translate("Approval recorded successfully.", "تم تسجيل الاعتماد بنجاح."));
      setConfirmAction(null);
    },
  });

  const approveError = approveMutation.error ? getErrorMessage(locale, approveMutation.error) : "";

  const confirmCopy: Record<ConfirmAction, { title: string; body: string }> = {
    planning: {
      title: translate("Approve as Planning?", "اعتماد التخطيط والمتابعة؟"),
      body: translate(
        "Record planning & follow-up approval for this requisition.",
        "تسجيل اعتماد التخطيط والمتابعة لهذا الطلب.",
      ),
    },
    purchasingManager: {
      title: translate("Approve as Purchasing Manager?", "اعتماد مدير المشتريات؟"),
      body: translate("Record purchasing manager approval for this requisition.", "تسجيل اعتماد مدير المشتريات لهذا الطلب."),
    },
    director: {
      title: translate("Approve as Director?", "اعتماد المدير؟"),
      body: translate("Record director approval for this requisition.", "تسجيل اعتماد المدير لهذا الطلب."),
    },
  };

  function openApprove(action: ConfirmAction) {
    approveMutation.reset();
    setConfirmAction(action);
  }

  const rows: DetailRow[] = [
    {
      key: translate("Requisition Code", "كود طلب الشراء"),
      value: requisition.code,
      mono: true,
      copyText: requisition.code,
    },
    {
      key: translate("Status", "الحالة"),
      value: <span className={status.className}>{status.label}</span>,
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
    {
      key: translate("Planning Approval", "اعتماد التخطيط والمتابعة"),
      value: (
        <ApprovalFieldValue
          approvedAt={requisition.planningApprovedAt}
          approvedBy={requisition.planningApprovedBy}
          canShowButton={!terminal}
          permission={PERMISSIONS.APPROVE_MATERIAL_PURCHASE_REQUISITION_PLANNING}
          buttonLabel={translate("Approve", "اعتماد")}
          onApprove={() => openApprove("planning")}
        />
      ),
    },
    {
      key: translate("Purchasing Manager Approval", "اعتماد مدير المشتريات"),
      value: (
        <ApprovalFieldValue
          approvedAt={requisition.purchasingManagerApprovedAt}
          approvedBy={requisition.purchasingManagerApprovedBy}
          canShowButton={!terminal}
          permission={PERMISSIONS.APPROVE_MATERIAL_PURCHASE_REQUISITION_PURCHASING_MANAGER}
          buttonLabel={translate("Approve", "اعتماد")}
          onApprove={() => openApprove("purchasingManager")}
        />
      ),
    },
    {
      key: translate("Director Approval", "اعتماد المدير"),
      value: (
        <ApprovalFieldValue
          approvedAt={requisition.directorApprovedAt}
          approvedBy={requisition.directorApprovedBy}
          canShowButton={!terminal}
          permission={PERMISSIONS.APPROVE_MATERIAL_PURCHASE_REQUISITION_DIRECTOR}
          buttonLabel={translate("Approve", "اعتماد")}
          onApprove={() => openApprove("director")}
        />
      ),
    },
    ...(requisition.rejectedAt
      ? ([
          {
            key: translate("Rejected At", "تاريخ الرفض"),
            value: (
              <span>
                {formatDateAndTime(requisition.rejectedAt, locale)}
                {requisition.rejectedBy ? (
                  <>
                    {" · "}
                    <CreatorLink creator={requisition.rejectedBy} />
                  </>
                ) : null}
              </span>
            ),
          },
          {
            key: translate("Rejection Reason", "سبب الرفض"),
            value: requisition.rejectionReason ? (
              <span className="font-normal whitespace-pre-wrap">{requisition.rejectionReason}</span>
            ) : (
              <EmptyValue />
            ),
          },
        ] satisfies DetailRow[])
      : []),
    ...(requisition.cancelledAt
      ? ([
          {
            key: translate("Cancelled At", "تاريخ الإلغاء"),
            value: formatDateAndTime(requisition.cancelledAt, locale),
          },
        ] satisfies DetailRow[])
      : []),
  ];

  return (
    <>
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

      <Modal
        opened={!!confirmAction}
        onClose={() => {
          setConfirmAction(null);
          approveMutation.reset();
        }}
        title={confirmAction ? confirmCopy[confirmAction].title : ""}
      >
        {confirmAction && (
          <div className="flex flex-col gap-3">
            <p>{confirmCopy[confirmAction].body}</p>
            <div className="flex gap-2">
              <Button
                variant="light"
                color="dark"
                radius="md"
                onClick={() => {
                  setConfirmAction(null);
                  approveMutation.reset();
                }}
                fullWidth
              >
                {translation.cancel}
              </Button>
              <Button
                radius="md"
                color="teal"
                loading={approveMutation.isPending}
                onClick={() => approveMutation.mutate(confirmAction)}
                fullWidth
              >
                {translate("Confirm", "تأكيد")}
              </Button>
            </div>
            {approveError && <ErrorAlert error={approveError} />}
          </div>
        )}
      </Modal>
    </>
  );
}
