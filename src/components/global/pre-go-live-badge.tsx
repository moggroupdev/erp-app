"use client";

import { Badge } from "@mantine/core";
import { useI18n } from "@/lib/i18n/hooks";

type PreGoLiveBadgeProps = {
  size?: "xs" | "sm" | "md";
};

export default function PreGoLiveBadge({ size = "sm" }: PreGoLiveBadgeProps) {
  const { translate } = useI18n();

  return (
    <Badge size={size} variant="light" color="gray" radius="md">
      {translate("Pre-go-live", "قبل التشغيل")}
    </Badge>
  );
}
