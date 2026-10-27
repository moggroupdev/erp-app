"use client";

import { useI18n } from "@/lib/i18n/hooks";

type CreateStepperProps = {
  active: number;
  maxReachable: number;
  validating?: boolean;
  onStepClick: (step: number) => void;
};

const STEPS = [
  {
    label: { en: "Contract review", ar: "مراجعة العقد" },
    description: { en: "Customer and dates", ar: "العميل والتواريخ" },
  },
  {
    label: { en: "Lines", ar: "البنود" },
    description: { en: "Products and prices", ar: "المنتجات والأسعار" },
  },
  {
    label: { en: "Units", ar: "الوحدات" },
    description: { en: "Serial numbers", ar: "الأرقام التسلسلية" },
  },
  {
    label: { en: "Review", ar: "المراجعة" },
    description: { en: "Confirm and save", ar: "التأكيد والحفظ" },
  },
] as const;

export default function CreateStepper({
  active,
  maxReachable,
  validating = false,
  onStepClick,
}: CreateStepperProps) {
  const { translate } = useI18n();
  const progress = STEPS.length <= 1 ? 0 : (maxReachable / (STEPS.length - 1)) * 100;

  return (
    <nav aria-label={translate("Contract review steps", "خطوات مراجعة العقد")} className="rounded-xl bg-gray-50/80 px-3 py-8 sm:px-4">
      <ol className="relative grid grid-cols-2 gap-y-4 sm:grid-cols-4 sm:gap-y-0">
        {/* Track sits on the icon vertical center, behind the step buttons */}
        <div
          aria-hidden
          className="pointer-events-none absolute start-[12.5%] top-6.5 z-0 hidden h-0.5 w-3/4 -translate-y-1/2 bg-gray-200 sm:block"
        />
        <div
          aria-hidden
          className="bg-haze-600 pointer-events-none absolute start-[12.5%] top-6.5 z-0 hidden h-0.5 w-3/4 origin-left -translate-y-1/2 transition-transform duration-300 ease-out motion-reduce:transition-none sm:block rtl:origin-right"
          style={{ transform: `translateY(-50%) scaleX(${progress / 100})` }}
        />

        {STEPS.map((step, index) => {
          const n = index + 1;
          const current = index === active;
          const reachable = index <= maxReachable;
          const complete = reachable && !current && index < maxReachable;
          const locked = !reachable;
          const clickable = reachable && !current && !validating;

          return (
            <li key={step.label.en} className="relative z-10 flex flex-col items-center text-center">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onStepClick(index)}
                aria-current={current ? "step" : undefined}
                aria-disabled={locked || current || validating}
                aria-label={translate(
                  locked ? `Step ${n}: ${step.label.en} (locked)` : `Step ${n}: ${step.label.en}`,
                  locked ? `الخطوة ${n}: ${step.label.ar} (مقفلة)` : `الخطوة ${n}: ${step.label.ar}`,
                )}
                className={[
                  "group flex w-full max-w-40 flex-col items-center gap-2 rounded-xl px-2 py-1.5 transition-colors",
                  clickable ? "cursor-pointer hover:bg-gray-100/70" : locked ? "cursor-not-allowed" : "cursor-default",
                ].join(" ")}
              >
                <span
                  className={[
                    "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums transition-colors",
                    current
                      ? "border-haze-600 bg-haze-50 text-haze-700 ring-haze-100 ring-4"
                      : complete
                        ? "border-haze-600 bg-haze-600 text-white"
                        : reachable
                          ? "border-haze-400 bg-white text-haze-700 group-hover:border-haze-600"
                          : "border-gray-300 bg-white text-gray-400",
                  ].join(" ")}
                >
                  {n}
                </span>
                <span className="min-w-0">
                  <span
                    className={[
                      "block truncate text-sm font-semibold",
                      current || complete || reachable ? "text-gray-900" : "text-gray-500",
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
