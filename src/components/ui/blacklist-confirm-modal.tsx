"use client";

import { Button } from "@mantine/core";
import { Ban, Undo2 } from "lucide-react";
import Modal from "@/components/ui/modal";
import ErrorAlert from "@/components/ui/error-alert";
import { useI18n } from "@/lib/i18n/hooks";

export default function BlacklistConfirmModal({
  opened,
  onClose,
  action,
  name,
  onConfirm,
  isPending,
  error,
}: {
  opened: boolean;
  onClose: () => void;
  action: "add" | "remove";
  name: string;
  onConfirm: () => void;
  isPending: boolean;
  error?: string;
}) {
  const { translate, translation } = useI18n();
  const isAdd = action === "add";

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        isAdd
          ? translate("Add to blacklist", "إضافة إلى القائمة السوداء")
          : translate("Remove from blacklist", "إزالة من القائمة السوداء")
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-[1.75] text-gray-700">
          {isAdd
            ? translate(
                `${name} will leave the normal list and cannot be edited. Continue?`,
                `سيُزال ${name} من القائمة العادية ولن يمكن تعديله. هل تريد المتابعة؟`,
              )
            : translate(
                `${name} will return to the normal list. Continue?`,
                `سيعود ${name} إلى القائمة العادية. هل تريد المتابعة؟`,
              )}
        </p>

        <div className="flex gap-2">
          <Button variant="light" color="dark" radius="md" onClick={onClose} disabled={isPending} fullWidth>
            {translation.cancel}
          </Button>
          <Button
            color={isAdd ? "clay" : "haze"}
            radius="md"
            loading={isPending}
            onClick={onConfirm}
            fullWidth
            leftSection={isAdd ? <Ban size={14} /> : <Undo2 size={14} />}
          >
            {isAdd
              ? translate("Add to blacklist", "إضافة إلى القائمة السوداء")
              : translate("Remove from blacklist", "إزالة من القائمة السوداء")}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </div>
    </Modal>
  );
}
