import type { LocalePageProps } from "@/lib/i18n/types";
import { getI18nFromParams } from "@/lib/i18n/utils";
import { buildPageMetadata } from "@/lib/helpers/build-metadata";
import HomeContent from "./components/home-content";

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale, translation } = await getI18nFromParams(params);

  return buildPageMetadata({
    title: translation.appTitle,
    description: translation.appDescription,
    pathname: "",
    locale,
  });
}

export default async function Page() {
  return <HomeContent />;
}
