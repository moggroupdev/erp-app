"use client";

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import type { MaterialPurchaseReceiptItem } from "@/types/material-purchase-order";
import Modal from "@/components/ui/modal";
import { EmptyValue } from "@/components/ui/entity-details";

type InspectionReportModalProps = {
  opened: boolean;
  onClose: () => void;
  items: MaterialPurchaseReceiptItem[];
};

function getInspectionSummary(items: MaterialPurchaseReceiptItem[]) {
  const itemsWithRejections = items.filter((item) => Number(item.quantityRejected) > 0);
  const totalRejected = items.reduce((sum, item) => sum + Number(item.quantityRejected), 0);

  return {
    totalItems: items.length,
    itemsWithRejections: itemsWithRejections.length,
    totalRejected,
  };
}

export default function InspectionReportModal({ opened, onClose, items }: InspectionReportModalProps) {
  const { translate } = useI18n();
  const summary = getInspectionSummary(items);
  const sortedItems = [...items].sort((a, b) => Number(b.quantityRejected) - Number(a.quantityRejected));

  return (
    <Modal opened={opened} onClose={onClose} title={translate("Inspection Report", "محضر الفحص")} size="xl">
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
        <p className="-mt-1 text-sm text-gray-500">
          {translate(
            "Quality inspection results: accepted and rejected quantities with notes for each received material.",
            "نتائج فحص الجودة: الكميات المقبولة والمرفوضة مع ملاحظات الفحص لكل مادة مستلمة.",
          )}
        </p>

        {items.length > 0 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
              <p className="text-sm text-gray-500">{translate("Items inspected", "البنود المفحوصة")}</p>
              <p className="text-lg font-semibold text-gray-900">{summary.totalItems}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
              <p className="text-sm text-gray-500">{translate("Items with rejections", "بنود بها رفض")}</p>
              <p className={`text-lg font-semibold ${summary.itemsWithRejections > 0 ? "text-red-600" : "text-gray-900"}`}>
                {summary.itemsWithRejections}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
              <p className="text-sm text-gray-500">{translate("Total rejected quantity", "إجمالي الكمية المرفوضة")}</p>
              <p className={`text-lg font-semibold ${summary.totalRejected > 0 ? "text-red-600" : "text-gray-900"}`}>
                {summary.totalRejected}
              </p>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-gray-500">{translate("No items in this receipt", "لا توجد بنود في سند الاستلام هذا")}</p>
        ) : (
          sortedItems.map((item, index) => {
            const { material } = item.materialPurchaseOrderItem;
            const quantityReceived = Number(item.quantityReceived);
            const quantityRejected = Number(item.quantityRejected);
            const hasRejection = quantityRejected > 0;

            return (
              <div
                key={item.id}
                className={`rounded-xl border p-3.5 ${
                  hasRejection ? "border-red-200 bg-red-50/50" : "border-gray-200 bg-white"
                }`}
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{material.title}</p>
                    <p className="font-mono text-sm text-gray-600">{material.code}</p>
                  </div>

                  {hasRejection ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-2.5 py-1 text-sm font-semibold text-red-700">
                      <XCircle size={14} />
                      {translate("Partially rejected", "مرفوض جزئياً")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-100 px-2.5 py-1 text-sm font-semibold text-teal-700">
                      <CheckCircle2 size={14} />
                      {translate("Accepted in full", "مقبول بالكامل")}
                    </span>
                  )}
                </div>

                <div className="mb-3 grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-white/80 px-2.5 py-2 ring-1 ring-gray-200">
                    <p className="text-xs text-gray-500">{translate("Quantity Received", "الكمية المستلمة")}</p>
                    <p className="font-semibold text-gray-900">{quantityReceived}</p>
                  </div>
                  <div className="rounded-lg bg-white/80 px-2.5 py-2 ring-1 ring-gray-200">
                    <p className="text-xs text-gray-500">{translate("Quantity Rejected", "الكمية المرفوضة")}</p>
                    <p className={`font-semibold ${hasRejection ? "text-red-600" : "text-gray-900"}`}>{quantityRejected}</p>
                  </div>
                  <div className="rounded-lg bg-white/80 px-2.5 py-2 ring-1 ring-gray-200">
                    <p className="text-xs text-gray-500">{translate("Total inspected", "إجمالي المفحوص")}</p>
                    <p className="font-semibold text-gray-900">{quantityReceived + quantityRejected}</p>
                  </div>
                </div>

                <div className="rounded-lg bg-white/80 px-2.5 py-2 ring-1 ring-gray-200">
                  <div className="mb-1 flex items-center gap-1.5">
                    {hasRejection && !item.inspectionNotes ? <AlertTriangle size={14} className="text-amber-600" /> : null}
                    <p className="text-sm text-gray-500">{translate("Inspection Notes", "ملاحظات الفحص")}</p>
                  </div>
                  {item.inspectionNotes ? (
                    <p className="whitespace-pre-wrap text-gray-900">{item.inspectionNotes}</p>
                  ) : hasRejection ? (
                    <p className="text-sm text-amber-700">
                      {translate("No inspection notes recorded", "لا توجد ملاحظات فحص مسجلة")}
                    </p>
                  ) : (
                    <EmptyValue />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
}
