"use client";

import { Button } from "@mantine/core";
import { useI18n } from "@/lib/i18n/hooks";
import type { MaterialPurchaseReceiptItem } from "@/types/material-purchase-order";
import Modal from "@/components/ui/modal";
import { EmptyValue } from "@/components/ui/entity-details";

type InspectionReportModalProps = {
  opened: boolean;
  onClose: () => void;
  items: MaterialPurchaseReceiptItem[];
};

export default function InspectionReportModal({ opened, onClose, items }: InspectionReportModalProps) {
  const { translate } = useI18n();

  return (
    <Modal opened={opened} onClose={onClose} title={translate("Inspection Report", "محضر الفحص")} size="lg">
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-gray-500">{translate("No items in this receipt", "لا توجد بنود في إذن الاستلام هذا")}</p>
        ) : (
          items.map((item) => {
            const { material } = item.materialPurchaseOrderItem;
            return (
              <div key={item.id} className="rounded-xl border border-gray-200 p-3">
                <div className="mb-3">
                  <p className="font-semibold text-gray-900">{material.title}</p>
                  <p className="font-mono text-sm text-gray-600">{material.code}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <div>
                    <p className="mb-0.5 text-sm text-gray-500">{translate("Quantity Rejected", "الكمية المرفوضة")}</p>
                    <p className="font-semibold text-gray-900">{item.quantityRejected}</p>
                  </div>

                  <div>
                    <p className="mb-0.5 text-sm text-gray-500">{translate("Inspection Notes", "ملاحظات الفحص")}</p>
                    {item.inspectionNotes ? (
                      <p className="whitespace-pre-wrap text-gray-900">{item.inspectionNotes}</p>
                    ) : (
                      <EmptyValue />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        <Button variant="light" color="dark" radius="md" onClick={onClose} fullWidth>
          {translate("Close", "إغلاق")}
        </Button>
      </div>
    </Modal>
  );
}
