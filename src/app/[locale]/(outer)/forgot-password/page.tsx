import type { LocalePageProps } from "@/lib/i18n/types";
import { getI18nFromParams } from "@/lib/i18n/utils";
import { buildPageMetadata } from "@/lib/helpers/build-metadata";
import ForgotPasswordContent from "./components/forgot-password-content";
import LocaleSwitchButton from "../login/components/locale-switch-button";

const PAGE_TITLE = { en: "Forgot Password", ar: "نسيت كلمة المرور" };

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale, translate } = await getI18nFromParams(params);

  return buildPageMetadata({
    title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
    description: translate(
      "Password resets are handled by system administrators.",
      "إعادة تعيين كلمات المرور تتم عبر مسؤولي النظام.",
    ),
    pathname: "forgot-password",
    locale,
  });
}

export default function Page() {
  return (
    <div className="root-flex-1 relative flex h-full flex-col items-center justify-center overflow-hidden p-4 pb-32">
      <ForgotPasswordContent />
      <div className="absolute bottom-10">
        <LocaleSwitchButton />
      </div>
    </div>
  );
}
