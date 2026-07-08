import type { LocalePageProps } from "@/lib/i18n/types";
import { getI18nFromParams } from "@/lib/i18n/utils";
import { buildPageMetadata } from "@/lib/helpers/build-metadata";
import ProfileContent from "./components/profile-content";

const title = {
  en: "Profile",
  ar: "الملف الشخصي",
};

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale, translate } = await getI18nFromParams(params);

  return buildPageMetadata({
    title: translate(title.en, title.ar),
    pathname: "profile",
    locale,
  });
}

export default async function Page({ params }: LocalePageProps) {
  const { translate, translation } = await getI18nFromParams(params);

  return (
    <div className="root-flex-1">
      <div className="container mx-auto flex flex-col gap-4 px-4 py-12">
        <h1>{translate(title.en, title.ar)}</h1>
        <p>{translation.underConstruction}</p>
        <ProfileContent />
      </div>
    </div>
  );
}
