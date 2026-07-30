import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import customersApi from "@/lib/api/customers";
import vendorsApi from "@/lib/api/vendors";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { EGYPT_COUNTRY_ID } from "@/lib/constants/global";
import { Button, Checkbox, SegmentedControl, Textarea } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import SelectGovernorate from "@/components/global/selections/reference-based/select-governorate";
import SelectCity from "@/components/global/selections/reference-based/select-city";
import SelectCountry from "@/components/global/selections/reference-based/select-country";

type LocationScope = "in-egypt" | "outside-egypt";

type AddressModalProps = {
  opened: boolean;
  close: () => void;
  isFirstAddress: boolean;
} & ({ entityType: "customer"; entityId: string } | { entityType: "vendor"; entityId: string });

export default function AddressModal({ opened, close, entityType, entityId, isFirstAddress }: AddressModalProps) {
  const { locale, translate, translation } = useI18n();

  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [validationError, setValidationError] = useState("");

  const [locationScope, setLocationScope] = useState<LocationScope>("in-egypt");
  const [countryId, setCountryId] = useState<string | null>(null);
  const [governorateId, setGovernorateId] = useState<string | null>(null);
  const [cityId, setCityId] = useState<string | null>(null);
  const [addressLine, setAddressLine] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const isInEgypt = locationScope === "in-egypt";

  function reset() {
    setLocationScope("in-egypt");
    setCountryId(null);
    setGovernorateId(null);
    setCityId(null);
    setAddressLine("");
    setIsDefault(isFirstAddress);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCountryId(null);
    setGovernorateId(null);
    setCityId(null);
  }, [locationScope]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCityId(null);
  }, [governorateId]);

  const mutation = useMutation({
    mutationFn: async () => {
      const dto = {
        countryId: isInEgypt ? EGYPT_COUNTRY_ID : countryId!,
        cityId: isInEgypt ? cityId : null,
        addressLine: addressLine.trim() || null,
        isDefault: isFirstAddress || isDefault,
      };
      if (entityType === "customer") return await customersApi.addAddress({ privateRequest, id: entityId, dto });
      if (entityType === "vendor") return await vendorsApi.addAddress({ privateRequest, id: entityId, dto });
      return null;
    },
    onSuccess: async () => {
      const addressesKey =
        entityType === "customer"
          ? queryKeys.customers.addresses(entityId)
          : entityType === "vendor"
            ? queryKeys.vendors.addresses(entityId)
            : null;
      if (addressesKey) await queryClient.invalidateQueries({ queryKey: addressesKey });
      handleClose();
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    // Validation
    if (isInEgypt) {
      if (!cityId) return setValidationError(translate("Please select a city.", "يرجى اختيار المدينة."));
    } else {
      if (!countryId) return setValidationError(translate("Please select a country.", "يرجى اختيار الدولة."));
      if (countryId === EGYPT_COUNTRY_ID)
        return setValidationError(translate("Please select a country outside Egypt.", "يرجى اختيار دولة خارج مصر."));
    }

    mutation.mutate();
  }

  function handleClose() {
    close();
    setTimeout(() => {
      reset();
      setValidationError("");
      mutation.reset();
    }, 250);
  }

  const title = translate("Add New Address", "إضافة عنوان جديد");

  const isReadyToSubmit = isInEgypt ? !!cityId : !!countryId && countryId !== EGYPT_COUNTRY_ID;

  return (
    <Modal opened={opened} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <SegmentedControl
          fullWidth
          radius="md"
          color="teal"
          variant="light"
          value={locationScope}
          onChange={(value) => setLocationScope(value as LocationScope)}
          data={[
            { label: translate("Inside Egypt", "داخل مصر"), value: "in-egypt" },
            { label: translate("Outside Egypt", "خارج مصر"), value: "outside-egypt" },
          ]}
        />

        {isInEgypt ? (
          <>
            <SelectGovernorate
              value={governorateId}
              setValue={setGovernorateId}
              label={translate("Governorate", "المحافظة")}
              placeholder={translate("Select governorate", "اختر المحافظة")}
              searchable
              required
            />

            <SelectCity
              value={cityId}
              setValue={setCityId}
              governorateScope={governorateId}
              label={translate("City", "المدينة")}
              placeholder={translate("Select city", "اختر المدينة")}
              searchable
              required
            />
          </>
        ) : (
          <SelectCountry
            value={countryId}
            setValue={setCountryId}
            label={translate("Country", "الدولة")}
            placeholder={translate("Select country", "اختر الدولة")}
            searchable
            required
          />
        )}

        <Textarea
          value={addressLine}
          onChange={(e) => setAddressLine(e.target.value)}
          label={translate("Address Details", "تفاصيل العنوان")}
          placeholder={translate("Enter address details", "أدخل تفاصيل العنوان")}
          radius="md"
          autosize
        />

        <Checkbox
          checked={isFirstAddress || isDefault}
          onChange={(e) => setIsDefault(e.currentTarget.checked)}
          label={translate("Set as default address", "تعيين كعنوان افتراضي")}
          disabled={isFirstAddress}
        />

        <div className="flex gap-2">
          <Button onClick={handleClose} variant="light" color="dark" radius="md" fullWidth>
            {translation.cancel}
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!isReadyToSubmit} radius="md" fullWidth>
            {title}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
