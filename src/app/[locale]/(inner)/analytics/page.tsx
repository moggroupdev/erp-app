import type { LocalePageProps } from "@/lib/i18n/types";
import { getI18nFromParams } from "@/lib/i18n/utils";
import { buildPageMetadata } from "@/lib/helpers/build-metadata";
import AdminLayoutBox from "@/components/ui/admin-layout-box";

const title = {
  en: "Analytics",
  ar: "التحليلات",
};

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale, translate } = await getI18nFromParams(params);

  return buildPageMetadata({
    title: translate(title.en, title.ar),
    pathname: "dashboard/analytics",
    locale,
  });
}

export default async function Page({ params }: LocalePageProps) {
  const { translate, translation } = await getI18nFromParams(params);

  return (
    <AdminLayoutBox header={{ title: translate(title.en, title.ar) }}>
      <p>{translation.underConstruction}</p>
    </AdminLayoutBox>
  );
}
