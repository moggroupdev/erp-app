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

export default function Page() {
  return <ProfileContent />;
}
