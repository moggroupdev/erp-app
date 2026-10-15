"use client";

import { useI18n } from "@/lib/i18n/hooks";
import { useMutation } from "@tanstack/react-query";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { type ContactPerson } from "@/types/contact-person";
import { Button, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Star, UserRound } from "lucide-react";
import Modal from "@/components/ui/modal";
import ErrorAlert from "@/components/ui/error-alert";

export default function ContactPersonCard({
  contactPerson,
  onSetPrimary,
}: {
  contactPerson: ContactPerson;
  onSetPrimary?: (contactPersonId: string) => Promise<void>;
}) {
  const { locale, translate, translation } = useI18n();

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const mutation = useMutation({
    mutationFn: () => onSetPrimary!(contactPerson.id),
    onSuccess: () => handleCloseModal(),
  });

  const canSetPrimary = !!onSetPrimary && !contactPerson.isPrimary;
  const error = mutation.error ? getErrorMessage(locale, mutation.error) : "";

  function handleCloseModal() {
    closeModal();
    mutation.reset();
  }

  function handleConfirmSettingAsPrimary(e: React.FormEvent) {
    e.preventDefault();
    if (!onSetPrimary) return;
    mutation.mutate();
  }

  return (
    <>
      <article
        className={`flex h-full flex-col gap-3 rounded-2xl border bg-white p-4 ${
          contactPerson.isPrimary ? "border-teal-200 ring-1 ring-teal-100" : "border-gray-200"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                contactPerson.isPrimary ? "bg-teal-100 text-teal-600" : "bg-gray-100 text-gray-500"
              }`}
            >
              <UserRound size={18} />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-gray-900">{contactPerson.name}</h3>
              {contactPerson.jobTitle && <p className="truncate text-sm text-gray-500">{contactPerson.jobTitle}</p>}
            </div>
          </div>

          {contactPerson.isPrimary ? (
            <span className="shrink-0 rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-700">
              {translate("Primary", "أساسي")}
            </span>
          ) : canSetPrimary ? (
            <Tooltip withArrow label={translate("Set as primary contact", "تعيين كشخص اتصال أساسي")}>
              <button
                type="button"
                onClick={openModal}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-teal-100 hover:text-teal-600"
              >
                <Star size={14} />
              </button>
            </Tooltip>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 rounded-xl bg-gray-50 p-4 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">{translate("Phone", "الهاتف")}</span>
            {contactPerson.phone ? (
              <a href={`tel:${contactPerson.phone}`} className="font-medium text-gray-900">
                {contactPerson.phone}
              </a>
            ) : (
              <p className="text-sm text-gray-400">{translate("No phone added", "لم تتم إضافة هاتف")}</p>
            )}
          </div>

          <div className="flex flex-col gap-1 border-t border-gray-200 pt-2">
            <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              {translate("Email", "البريد الإلكتروني")}
            </span>
            {contactPerson.email ? (
              <a href={`mailto:${contactPerson.email}`} className="font-medium break-all text-gray-900">
                {contactPerson.email}
              </a>
            ) : (
              <p className="text-sm text-gray-400">{translate("No email added", "لم تتم إضافة بريد إلكتروني")}</p>
            )}
          </div>
        </div>
      </article>

      <Modal
        opened={modalOpened}
        onClose={handleCloseModal}
        title={translate("Set as primary contact", "تعيين كشخص اتصال أساسي")}
      >
        <form onSubmit={handleConfirmSettingAsPrimary} className="flex flex-col gap-3">
          <p className="text-sm">
            {translate(
              "Are you sure you want to set this person as the primary contact?",
              "هل أنت متأكد من تعيين هذا الشخص كشخص اتصال أساسي؟",
            )}
          </p>

          <div className="flex gap-2">
            <Button variant="light" color="dark" radius="md" onClick={handleCloseModal} fullWidth>
              {translation.cancel}
            </Button>
            <Button type="submit" color="teal" loading={mutation.isPending} radius="md" fullWidth>
              {translation.confirm}
            </Button>
          </div>

          {error && <ErrorAlert error={error} />}
        </form>
      </Modal>
    </>
  );
}
