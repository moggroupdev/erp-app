import type { Metadata } from "next";
import type { LocalePageProps } from "@/lib/i18n/types";
import { getI18nFromParams } from "@/lib/i18n/utils";
import HomeContent from "./components/home-content";

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { translation } = await getI18nFromParams(params);
  return { title: translation.appTitle, description: translation.appDescription };
}

export default async function Page() {
  return <HomeContent />;
}
