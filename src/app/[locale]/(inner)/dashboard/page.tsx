import type { LocalePageProps } from "@/lib/i18n/types";
import { getI18nFromParams } from "@/lib/i18n/utils";
import { buildPageMetadata } from "@/lib/helpers/build-metadata";
import LayoutBox from "@/components/ui/layout-box";

const title = {
  en: "Dashboard",
  ar: "لوحة التحكم",
};

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale, translate } = await getI18nFromParams(params);

  return buildPageMetadata({
    title: translate(title.en, title.ar),
    pathname: "dashboard",
    locale,
  });
}

export default async function Page({ params }: LocalePageProps) {
  const { translate, translation } = await getI18nFromParams(params);

  return (
    <LayoutBox header={{ title: translate(title.en, title.ar) }}>
      <p>{translation.underConstruction}</p>
    </LayoutBox>
  );
}
