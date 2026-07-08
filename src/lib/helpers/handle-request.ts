import type { Locale } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

const GLOBAL_ERROR_MESSAGE_EN = "An unexpected error occurred. Please try again later.";
const GLOBAL_ERROR_MESSAGE_AR = "عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى لاحقاً.";

export default async function handleRequest(
  locale: Locale,
  setLoading: (loading: boolean) => void,
  setError: (error: string) => void,
  callback: () => Promise<void>,
  cancellationRefCurrent: { canceled: boolean } = { canceled: false }, // optional parameter to track if the operation was canceled
): Promise<void> {
  try {
    if (!cancellationRefCurrent.canceled) setError("");
    if (!cancellationRefCurrent.canceled) setLoading(true);
    await callback();
  } catch (err) {
    let error;
    const message = (err as Error)?.message;
    if (message) {
      // Handle case where message is an array (e.g., from validation errors)
      if (Array.isArray(message)) error = message[0];
      else error = message;
    } else error = translate(locale, GLOBAL_ERROR_MESSAGE_EN, GLOBAL_ERROR_MESSAGE_AR);
    if (!cancellationRefCurrent.canceled) setError(error);
  } finally {
    if (!cancellationRefCurrent.canceled) setLoading(false);
  }
}
