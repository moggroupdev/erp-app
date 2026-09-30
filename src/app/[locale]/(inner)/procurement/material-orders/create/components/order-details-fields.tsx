"use client";

import { NumberInput, Textarea } from "@mantine/core";
import { Factory, Truck, Warehouse } from "lucide-react";
import SelectSupplier from "@/components/global/selections/remote-based/select-supplier";
import { useI18n } from "@/lib/i18n/hooks";
import { MPO_DELIVERY_LOCATIONS, type MpoDeliveryLocation } from "@/lib/constants/enums/mpo-delivery-locations";
import { MPO_DELIVERY_TIMINGS, type MpoDeliveryTiming } from "@/lib/constants/enums/mpo-delivery-timings";

type OrderDetailsFieldsProps = {
  supplierId: string | null;
  setSupplierId: React.Dispatch<React.SetStateAction<string | null>>;
  onSupplierSelect: () => void;
  deliveryLocation: MpoDeliveryLocation | null;
  setDeliveryLocation: (location: MpoDeliveryLocation) => void;
  deliveryTiming: MpoDeliveryTiming | null;
  setDeliveryTiming: (timing: MpoDeliveryTiming) => void;
  deliveryPeriodDays: number | "";
  setDeliveryPeriodDays: (days: number | "") => void;
  notes: string;
  setNotes: (notes: string) => void;
};

function ChoiceCard({
  selected,
  onClick,
  icon,
  title,
  hint,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-20 items-center gap-3 rounded-2xl border px-4 py-3 text-start transition-all ${
        selected
          ? "border-teal-800 bg-teal-800 text-white"
          : "border-gray-200 bg-white text-gray-900 hover:border-teal-800/25 hover:bg-teal-50/60"
      }`}
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
          selected ? "bg-white/15 text-white" : "bg-teal-800/10 text-teal-900"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm leading-snug font-semibold">{title}</span>
        <span className={`mt-0.5 block text-xs leading-snug ${selected ? "text-white/70" : "text-gray-500"}`}>{hint}</span>
      </span>
    </button>
  );
}

export default function OrderDetailsFields({
  supplierId,
  setSupplierId,
  onSupplierSelect,
  deliveryLocation,
  setDeliveryLocation,
  deliveryTiming,
  setDeliveryTiming,
  deliveryPeriodDays,
  setDeliveryPeriodDays,
  notes,
  setNotes,
}: OrderDetailsFieldsProps) {
  const { translate } = useI18n();
  const withinDays = deliveryTiming === MPO_DELIVERY_TIMINGS.WITHIN_DAYS;

  function chooseTiming(next: MpoDeliveryTiming) {
    setDeliveryTiming(next);
    if (next !== MPO_DELIVERY_TIMINGS.WITHIN_DAYS) setDeliveryPeriodDays("");
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-white">
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-teal-800 text-white">
          <Truck size={18} />
        </span>
        <div>
          <h4 className="text-base font-semibold text-gray-950">{translate("Order details", "بيانات الأمر")}</h4>
          <p className="text-sm text-gray-500">
            {translate(
              "Supplier, delivery place, and how soon the materials arrive.",
              "المورد ومكان التسليم وموعد وصول الخامات.",
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-5 py-5">
        <div className="w-[500px] max-w-full">
          <SelectSupplier
            value={supplierId}
            setValue={setSupplierId}
            onSupplierSelect={onSupplierSelect}
            label={translate("Supplier", "المورد")}
            placeholder={translate("Search by name or code...", "ابحث بالاسم أو الكود...")}
            searchable
            clearable
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-900">
            {translate("Delivery location", "مكان التسليم")}
            <span className="text-clay-600"> *</span>
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <ChoiceCard
              selected={deliveryLocation === MPO_DELIVERY_LOCATIONS.OUR_10TH_RAMADAN_FACTORIES}
              onClick={() => setDeliveryLocation(MPO_DELIVERY_LOCATIONS.OUR_10TH_RAMADAN_FACTORIES)}
              icon={<Factory size={18} />}
              title={translate("Our factories", "مصانعنا")}
              hint={translate("10th of Ramadan", "العاشر من رمضان")}
            />
            <ChoiceCard
              selected={deliveryLocation === MPO_DELIVERY_LOCATIONS.SUPPLIER_WAREHOUSES}
              onClick={() => setDeliveryLocation(MPO_DELIVERY_LOCATIONS.SUPPLIER_WAREHOUSES)}
              icon={<Warehouse size={18} />}
              title={translate("Supplier's warehouses", "مخازن المورد")}
              hint={translate("Collected from the supplier", "الاستلام من عند المورد")}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {translate("Delivery period", "مدة التوريد")}
              <span className="text-clay-600"> *</span>
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {withinDays
                ? translate(
                    "Materials arrive within the number of days you enter.",
                    "تصل الخامات خلال عدد الأيام الذي تدخله.",
                  )
                : deliveryTiming === MPO_DELIVERY_TIMINGS.IMMEDIATE
                  ? translate("Materials are delivered immediately.", "يتم تسليم الخامات فوراً.")
                  : translate("Choose immediate delivery, or a number of days.", "اختر التوريد الفوري أو عدداً من الأيام.")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-gray-200 bg-white p-1">
              <button
                type="button"
                aria-pressed={deliveryTiming === MPO_DELIVERY_TIMINGS.IMMEDIATE}
                onClick={() => chooseTiming(MPO_DELIVERY_TIMINGS.IMMEDIATE)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  deliveryTiming === MPO_DELIVERY_TIMINGS.IMMEDIATE
                    ? "bg-teal-800 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {translate("Immediately", "فوراً")}
              </button>
              <button
                type="button"
                aria-pressed={withinDays}
                onClick={() => chooseTiming(MPO_DELIVERY_TIMINGS.WITHIN_DAYS)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  withinDays ? "bg-teal-800 text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {translate("Within days", "خلال أيام")}
              </button>
            </div>
            {withinDays ? (
              <div className="flex items-center gap-2">
                <NumberInput
                  value={deliveryPeriodDays}
                  onChange={(value) => setDeliveryPeriodDays(value === "" ? "" : Number(value))}
                  placeholder={translate("7", "٧")}
                  aria-label={translate("Delivery days", "أيام التوريد")}
                  min={1}
                  allowDecimal={false}
                  allowNegative={false}
                  hideControls
                  required
                  radius="xl"
                  w={88}
                />
                <span className="text-sm text-gray-500">{translate("days", "يوم")}</span>
              </div>
            ) : null}
          </div>
        </div>

        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          label={translate("Notes", "الملاحظات")}
          placeholder={translate("Optional note for this order", "ملاحظة اختيارية لهذا الأمر")}
          radius="md"
          autosize
          minRows={2}
        />
      </div>
    </section>
  );
}
