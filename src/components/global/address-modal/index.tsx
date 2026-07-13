import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/hooks";
import handleRequest from "@/lib/helpers/handle-request";
import useDataHandler from "@/hooks/use-data-handler";
import vendorsApi from "@/lib/api/vendors";
import { EGYPT_COUNTRY_ID } from "@/lib/constants/global";
import { type VendorAddress } from "@/types/vendor";
import { Button, Checkbox, SegmentedControl, Textarea } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import SelectGovernorate from "@/components/global/select-governorate";
import SelectCity from "@/components/global/select-city";
import SelectCountry from "@/components/global/select-country";

type LocationScope = "in-egypt" | "outside-egypt";

export default function AddressModal({
  opened,
  close,
  vendorId,
  isFirstAddress,
  callback,
}: {
  opened: boolean;
  close: () => void;
  vendorId: string;
  isFirstAddress: boolean;
  callback: (address: VendorAddress) => void;
}) {
  const { locale, translate, translation } = useI18n();

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

  const { privateRequest, loading, setLoading, error, setError } = useDataHandler({ initialData: null });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isInEgypt) {
      if (!cityId) return setError(translate("Please select a city.", "يرجى اختيار المدينة."));
    } else {
      if (!countryId) return setError(translate("Please select a country.", "يرجى اختيار الدولة."));
      if (countryId === EGYPT_COUNTRY_ID)
        return setError(translate("Please select a country outside Egypt.", "يرجى اختيار دولة خارج مصر."));
    }

    handleRequest(locale, setLoading, setError, async () => {
      const response = await vendorsApi.addAddress({
        privateRequest,
        id: vendorId,
        dto: {
          countryId: isInEgypt ? EGYPT_COUNTRY_ID : countryId!,
          cityId: isInEgypt ? cityId : null,
          addressLine: addressLine.trim() || null,
          isDefault: isFirstAddress || isDefault,
        },
      });
      callback(response);
      handleClose();
    });
  }

  function handleClose() {
    close();
    setTimeout(() => {
      reset();
      setError("");
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
          <Button type="submit" loading={loading} disabled={!isReadyToSubmit} radius="md" fullWidth>
            {title}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
