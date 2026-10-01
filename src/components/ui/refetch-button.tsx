"use client";

import { useI18n } from "@/lib/i18n/hooks";
import { RefreshCw } from "lucide-react";

type RefetchButtonVariant = "default" | "outline" | "light";

const sizedClassName = "refetch-button-sized";

const variantClassName: Record<RefetchButtonVariant, string> = {
  default: "text-gray-600 hover:text-gray-800 disabled:cursor-not-allowed disabled:text-gray-300",
  outline: `${sizedClassName} border border-gray-300 text-gray-600 hover:text-gray-800 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300`,
  light: `${sizedClassName} border border-transparent bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-300`,
};

export default function RefetchButton({
  isFetching,
  onRefetch,
  variant = "default",
}: {
  isFetching: boolean;
  onRefetch: () => void;
  variant?: RefetchButtonVariant;
}) {
  const { translate } = useI18n();

  return (
    <button
      onClick={onRefetch}
      disabled={isFetching}
      className={variantClassName[variant]}
      title={translate("Refresh", "تحديث")}
    >
      <RefreshCw size={14} />
    </button>
  );
}
