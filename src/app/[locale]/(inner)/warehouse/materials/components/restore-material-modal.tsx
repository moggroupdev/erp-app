"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Alert, Button } from "@mantine/core";
import { ArchiveRestore, Info } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import Modal from "@/components/ui/modal";
import ErrorAlert from "@/components/ui/error-alert";

export default function RestoreMaterialModal({
  opened,
  close,
  material,
  onSuccess,
}: {
  opened: boolean;
  close: () => void;
  material: { code: string; title: string } | null;
  onSuccess?: () => void;
}) {
  const { locale, translate, translation } = useI18n();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!material) throw new Error("No material selected");
      return await materialsApi.restore({ privateRequest, code: material.code });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.materials.all });
      toast.success(translate("Item restored successfully", "تمت استعادة الصنف بنجاح"));
      close();
      onSuccess?.();
    },
  });

  const errorMessage = mutation.error ? getErrorMessage(locale, mutation.error) : "";

  return (
    <Modal
      opened={opened}
      onClose={close}
      title={translate("Restore item", "استعادة الصنف")}
    >
      <div className="flex flex-col gap-4">
        {material && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-3 text-sm">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-2 last:border-b-0">
              <span className="text-gray-500">{translate("Code", "الكود")}</span>
              <span className="font-mono font-medium text-gray-900">{material.code}</span>
            </div>
            <div className="flex items-start justify-between gap-4 py-2">
              <span className="text-gray-500">{translate("Name", "الاسم")}</span>
              <span className="text-end font-medium text-gray-900">{material.title}</span>
            </div>
          </div>
        )}

        <Alert color="haze" icon={<Info size={16} />} radius="md">
          {translate(
            "The item will appear again in lists and search.",
            "سيظهر الصنف مرة أخرى في القوائم والبحث.",
          )}
        </Alert>

        <div className="flex gap-2">
          <Button variant="light" color="dark" radius="md" onClick={close} disabled={mutation.isPending} fullWidth>
            {translation.cancel}
          </Button>
          <Button
            color="teal"
            radius="md"
            loading={mutation.isPending}
            disabled={!material}
            onClick={() => mutation.mutate()}
            fullWidth
            leftSection={<ArchiveRestore size={14} />}
          >
            {translate("Restore item", "استعادة الصنف")}
          </Button>
        </div>

        {errorMessage && <ErrorAlert error={errorMessage} />}
      </div>
    </Modal>
  );
}
