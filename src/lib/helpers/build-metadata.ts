import type { Metadata } from "next";
import { APP_NAME, BASE_URL } from "@/lib/constants/global";

export function buildPageMetadata({
  title,
  description,
  pathname,
  locale,
  images,
  openGraph,
}: {
  title: string;
  description?: string;
  pathname: string;
  locale: string;
  images?: Array<{ url: string; alt?: string }>;
  openGraph?: {
    type?: "website" | "article" | "profile" | "video.other";
    publishedTime?: string;
    modifiedTime?: string;
    authors?: string[];
  };
}): Metadata {
  const url = `${BASE_URL}/${locale}/${pathname}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "x-default": `${BASE_URL}/en/${pathname}`,
        en: `${BASE_URL}/en/${pathname}`,
        ar: `${BASE_URL}/ar/${pathname}`,
      },
    },
    openGraph: {
      title,
      description,
      siteName: APP_NAME,
      type: openGraph?.type || "website",
      url,
      images,
      publishedTime: openGraph?.publishedTime,
      modifiedTime: openGraph?.modifiedTime,
      authors: openGraph?.authors,
    } as Metadata["openGraph"],
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images?.map((img) => img.url),
    },
  };
}
