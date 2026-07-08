import type { LocalePageProps } from "@/lib/i18n/types";
import { getI18nFromParams } from "@/lib/i18n/utils";
import { buildPageMetadata } from "@/lib/helpers/build-metadata";
import LoginForm from "./components/login-form";

const title = {
  en: "Welcome Back!",
  ar: "مرحبًا بعودتك!",
};

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale, translate } = await getI18nFromParams(params);

  return buildPageMetadata({
    title: translate(title.en, title.ar),
    pathname: "login",
    locale,
  });
}

export default async function Page({ params }: LocalePageProps) {
  const { translate } = await getI18nFromParams(params);

  return (
    <div className="root-flex-1 flex flex-col justify-center p-4 pb-32">
      <h1 className="mb-6 text-center">{translate(title.en, title.ar)}</h1>
      <LoginForm />
    </div>
  );
}
