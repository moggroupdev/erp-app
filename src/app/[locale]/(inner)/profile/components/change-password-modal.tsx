"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Alert, Button, PasswordInput } from "@mantine/core";
import { CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import profileApi from "@/lib/api/profile";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { validationRegex } from "@/lib/constants/regex";
import Modal from "@/components/ui/modal";
import ErrorAlert from "@/components/ui/error-alert";

export default function ChangePasswordModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const { locale, translate, translation } = useI18n();
  const privateRequest = usePrivateRequest();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const passwordMutation = useMutation({
    mutationFn: () =>
      profileApi.updatePassword({
        privateRequest,
        dto: { currentPassword, newPassword },
      }),
    onSuccess: (response) => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setValidationError("");
      setSuccessMessage(response.message || translate("Password updated successfully.", "تم تحديث كلمة المرور بنجاح."));
    },
  });

  const mutationError = passwordMutation.error ? getErrorMessage(locale, passwordMutation.error) : "";

  function resetForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setValidationError("");
    setSuccessMessage("");
    passwordMutation.reset();
  }

  function handleClose() {
    onClose();
    setTimeout(resetForm, 250);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMessage("");
    setValidationError("");
    passwordMutation.reset();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setValidationError(translate("Please fill in all password fields.", "يرجى تعبئة جميع حقول كلمة المرور."));
      return;
    }
    if (!validationRegex.password.test(newPassword)) {
      setValidationError(
        translate("Password must be at least 8 characters.", "يجب أن تكون كلمة المرور 8 أحرف على الأقل."),
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationError(
        translate("New password and confirmation do not match.", "كلمة المرور الجديدة وتأكيدها غير متطابقين."),
      );
      return;
    }
    if (newPassword === currentPassword) {
      setValidationError(
        translate(
          "New password must be different from the current password.",
          "يجب أن تكون كلمة المرور الجديدة مختلفة عن كلمة المرور الحالية.",
        ),
      );
      return;
    }

    passwordMutation.mutate();
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={translate("Change password", "تغيير كلمة المرور")}
      size="md"
    >
      <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-3">
        <p className="mb-1 text-sm text-gray-500">
          {translate(
            "Use a strong password with at least 8 characters.",
            "استخدم كلمة مرور قوية من 8 أحرف على الأقل.",
          )}
        </p>

        <PasswordInput
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.currentTarget.value);
            setSuccessMessage("");
          }}
          label={translate("Current password", "كلمة المرور الحالية")}
          placeholder={translate("Enter current password", "أدخل كلمة المرور الحالية")}
          autoComplete="current-password"
          radius="md"
          required
          autoFocus
        />

        <PasswordInput
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.currentTarget.value);
            setSuccessMessage("");
          }}
          label={translate("New password", "كلمة المرور الجديدة")}
          description={translate("Enter a password with at least 8 characters", "أدخل كلمة مرور بأقل 8 أحرف")}
          placeholder={translate("Enter new password", "أدخل كلمة المرور الجديدة")}
          autoComplete="new-password"
          radius="md"
          required
        />

        <PasswordInput
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.currentTarget.value);
            setSuccessMessage("");
          }}
          label={translate("Confirm new password", "تأكيد كلمة المرور الجديدة")}
          placeholder={translate("Re-enter new password", "أعد إدخال كلمة المرور الجديدة")}
          autoComplete="new-password"
          radius="md"
          required
        />

        <div className="flex gap-2">
          <Button onClick={handleClose} variant="light" color="dark" radius="md" fullWidth>
            {translation.cancel}
          </Button>
          <Button
            type="submit"
            radius="md"
            color="teal"
            loading={passwordMutation.isPending}
            disabled={!currentPassword || !newPassword || !confirmPassword}
            fullWidth
          >
            {translate("Update password", "تحديث كلمة المرور")}
          </Button>
        </div>

        {(validationError || mutationError) && <ErrorAlert error={validationError || mutationError} fade />}

        {successMessage && (
          <Alert color="teal" icon={<CheckCircle2 size={16} />} radius="md" className="animate-fade-in">
            {successMessage}
          </Alert>
        )}
      </form>
    </Modal>
  );
}
