import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/hooks";

export default function useDocumentTitle(title: string, suffix?: "appName" | "dashboard"): void {
  const { translation } = useI18n();

  useEffect(() => {
    const suffixText = suffix === "appName" ? translation.appName : suffix === "dashboard" ? translation.dashboard : "";
    if (suffixText) document.title = `${title} | ${suffixText}`;
    else document.title = title;
  }, [title, suffix, translation]);
}
