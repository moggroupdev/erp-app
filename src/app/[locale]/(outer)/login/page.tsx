import type { LocalePageProps } from "@/lib/i18n/types";
import { getI18nFromParams } from "@/lib/i18n/utils";
import { buildPageMetadata } from "@/lib/helpers/build-metadata";
import LoginForm from "./components/login-form";
import LocaleSwitchButton from "./components/locale-switch-button";

const PAGE_TITLE = { en: "Welcome Back!", ar: "مرحبًا بعودتك!" };

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale, translate } = await getI18nFromParams(params);

  return buildPageMetadata({
    title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
    pathname: "login",
    locale,
  });
}

export default async function Page({ params }: LocalePageProps) {
  const { translate } = await getI18nFromParams(params);

  return (
    <div className="root-flex-1 relative flex h-full flex-col items-center justify-center p-4 pb-32">
      <h1 className="mb-6 text-center">{translate(PAGE_TITLE.en, PAGE_TITLE.ar)}</h1>
      <LoginForm />
      <div className="absolute bottom-10">
        <LocaleSwitchButton />
      </div>
    </div>
  );
}
