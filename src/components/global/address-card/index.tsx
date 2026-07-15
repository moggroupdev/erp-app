"use client";

import { useI18n } from "@/lib/i18n/hooks";
import { useMutation } from "@tanstack/react-query";
import useLocations from "@/hooks/use-locations";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { EGYPT_COUNTRY_ID } from "@/lib/constants/global";
import { type Address } from "@/types/address";
import { Button, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { MapPin, Star } from "lucide-react";
import Modal from "@/components/ui/modal";
import ErrorAlert from "@/components/ui/error-alert";

export default function AddressCard({
  address,
  onSetDefault,
}: {
  address: Address;
  onSetDefault?: (addressId: string) => Promise<void>;
}) {
  const { locale, translate, translation } = useI18n();

  const { helpers } = useLocations();

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const mutation = useMutation({
    mutationFn: () => onSetDefault!(address.id),
    onSuccess: () => handleCloseModal(),
  });

  const country = helpers.getCountryById(address.countryId);
  const governorate = helpers.getGovernorateOfCity(address.cityId);
  const city = helpers.getCityById(address.cityId);

  const countryName = country ? translate(country.nameEn, country.nameAr) : null;
  const governorateName = governorate ? translate(governorate.nameEn, governorate.nameAr) : null;
  const cityName = city ? translate(city.nameEn, city.nameAr) : null;

  const headline = cityName || countryName || translate("Address", "عنوان");

  const isInEgypt = address.countryId === EGYPT_COUNTRY_ID;
  const locationText = [countryName, governorateName, cityName].filter(Boolean).join(" · ");

  const canSetDefault = !!onSetDefault && !address.isDefault;

  const error = mutation.error ? getErrorMessage(locale, mutation.error) : "";

  function handleCloseModal() {
    closeModal();
    mutation.reset();
  }

  function handleConfirmSettingAsDefault(e: React.FormEvent) {
    e.preventDefault();
    if (!onSetDefault) return;
    mutation.mutate();
  }

  return (
    <>
      <article
        className={`flex h-full flex-col gap-3 rounded-2xl border bg-white p-4 ${
          address.isDefault ? "border-teal-200 ring-1 ring-teal-100" : "border-gray-200"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                address.isDefault ? "bg-teal-100 text-teal-600" : "bg-gray-100 text-gray-500"
              }`}
            >
              <MapPin size={18} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-gray-900">{headline}</h3>

              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${isInEgypt ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-700"}`}
              >
                {translate(isInEgypt ? "In Egypt" : "Outside Egypt", isInEgypt ? "داخل مصر" : "خارج مصر")}
              </span>
            </div>
          </div>

          {address.isDefault ? (
            <span className="shrink-0 rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-700">
              {translate("Default", "افتراضي")}
            </span>
          ) : canSetDefault ? (
            <Tooltip withArrow label={translate("Set as default address", "تعيين كعنوان افتراضي")}>
              <button
                type="button"
                onClick={openModal}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-teal-100 hover:text-teal-600"
                aria-label={translate("Set as default address", "تعيين كعنوان افتراضي")}
              >
                <Star size={14} />
              </button>
            </Tooltip>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 rounded-xl bg-gray-50 p-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              {translate("Address Details", "تفاصيل العنوان")}
            </span>

            {address.addressLine ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-900">{address.addressLine}</p>
            ) : (
              <p className="text-sm text-gray-400">{translate("No details added", "لم تتم إضافة تفاصيل")}</p>
            )}
          </div>

          {locationText && (
            <div className="flex flex-col gap-1.5 border-t border-gray-200 pt-3">
              <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                {translate("Location", "الموقع")}
              </span>
              <p className="text-sm font-medium text-gray-900">{locationText}</p>
            </div>
          )}
        </div>
      </article>

      <Modal
        opened={modalOpened}
        onClose={handleCloseModal}
        title={translate("Set as default address", "تعيين كعنوان افتراضي")}
      >
        <form onSubmit={handleConfirmSettingAsDefault} className="flex flex-col gap-3">
          <p className="text-sm">
            {translate(
              "Are you sure you want to set this address as the default?",
              "هل أنت متأكد من تعيين هذا العنوان كعنوان افتراضي؟",
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
