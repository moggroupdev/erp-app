import type { LocalePageProps } from "@/lib/i18n/types";
import { getI18nFromParams } from "@/lib/i18n/utils";
import { buildPageMetadata } from "@/lib/helpers/build-metadata";
import AdminLayoutBox from "@/components/ui/admin-layout-box";

const PAGE_TITLE = {
  en: "Users",
  ar: "المستخدمون",
};

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale, translate } = await getI18nFromParams(params);

  return buildPageMetadata({
    title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
    pathname: "dashboard/users",
    locale,
  });
}

export default async function Page({ params }: LocalePageProps) {
  const { translate, translation } = await getI18nFromParams(params);

  return (
    <AdminLayoutBox header={{ title: translate(PAGE_TITLE.en, PAGE_TITLE.ar) }}>
      <p>{translation.underConstruction}</p>
    </AdminLayoutBox>
  );
}
