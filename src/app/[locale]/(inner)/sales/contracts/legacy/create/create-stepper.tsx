"use client";

import { Check, ClipboardList, FileText, Package, Boxes } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";

type CreateStepperProps = {
  active: number;
  onStepClick: (step: number) => void;
};

const STEPS = [
  {
    icon: FileText,
    label: { en: "Contract", ar: "العقد" },
    description: { en: "Customer and dates", ar: "العميل والتواريخ" },
  },
  {
    icon: ClipboardList,
    label: { en: "Lines", ar: "البنود" },
    description: { en: "Products and prices", ar: "المنتجات والأسعار" },
  },
  {
    icon: Boxes,
    label: { en: "Units", ar: "الوحدات" },
    description: { en: "Serial numbers", ar: "الأرقام التسلسلية" },
  },
  {
    icon: Package,
    label: { en: "Review", ar: "المراجعة" },
    description: { en: "Confirm and save", ar: "التأكيد والحفظ" },
  },
] as const;

export default function CreateStepper({ active, onStepClick }: CreateStepperProps) {
  const { translate } = useI18n();
  const progress = STEPS.length <= 1 ? 0 : (active / (STEPS.length - 1)) * 100;

  return (
    <nav aria-label={translate("Contract steps", "خطوات العقد")} className="rounded-xl bg-gray-50/80 px-3 py-6 sm:px-5">
      <ol className="relative grid grid-cols-2 gap-y-4 sm:grid-cols-4 sm:gap-y-0">
        <div
          aria-hidden
          className="pointer-events-none absolute start-[12.5%] top-5 hidden h-0.5 w-3/4 bg-gray-200 sm:block"
        />
        <div
          aria-hidden
          className="bg-haze-600 pointer-events-none absolute start-[12.5%] top-5 hidden h-0.5 w-3/4 origin-left transition-transform duration-300 ease-out motion-reduce:transition-none sm:block rtl:origin-right"
          style={{ transform: `scaleX(${progress / 100})` }}
        />

        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const done = index < active;
          const current = index === active;
          const reachable = index <= active;

          return (
            <li key={step.label.en} className="relative z-10 flex flex-col items-center text-center">
              <button
                type="button"
                disabled={!reachable || current}
                onClick={() => onStepClick(index)}
                aria-current={current ? "step" : undefined}
                className={[
                  "group flex w-full max-w-40 flex-col items-center gap-2 rounded-xl px-2 py-5 transition-colors",
                  current ? "ring-haze-200 bg-white ring-1" : "",
                  reachable && !current ? "hover:bg-white/80" : "",
                  !reachable ? "cursor-default opacity-55" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    done
                      ? "border-haze-600 bg-haze-600 text-white"
                      : current
                        ? "border-haze-600 bg-haze-50 text-haze-700"
                        : "border-gray-300 bg-white text-gray-400",
                  ].join(" ")}
                >
                  {done ? <Check size={18} strokeWidth={2.5} /> : <Icon size={18} />}
                </span>
                <span className="min-w-0">
                  <span
                    className={[
                      "block truncate text-sm font-semibold",
                      current || done ? "text-gray-900" : "text-gray-500",
                    ].join(" ")}
                  >
                    {translate(step.label.en, step.label.ar)}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-gray-500">
                    {translate(step.description.en, step.description.ar)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
