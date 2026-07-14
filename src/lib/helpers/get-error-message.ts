import type { Locale } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

const GLOBAL_ERROR_MESSAGE_EN = "An unexpected error occurred. Please try again later.";
const GLOBAL_ERROR_MESSAGE_AR = "عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى لاحقاً.";

export default function getErrorMessage(locale: Locale, error: unknown): string {
  const message = (error as Error)?.message;

  if (message) {
    if (Array.isArray(message)) return message[0];
    return message;
  }

  return translate(locale, GLOBAL_ERROR_MESSAGE_EN, GLOBAL_ERROR_MESSAGE_AR);
}
