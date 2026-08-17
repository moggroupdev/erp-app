import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@/app/globals.css";

import type { Metadata, Viewport } from "next";
import type { LocaleLayoutProps } from "@/lib/i18n/types";
import { createTheme, MantineProvider, mantineHtmlProps } from "@mantine/core";
import { MantineColorSchemeScript } from "@/components/mantine/color-scheme-script";
import MantineDatesProvider from "@/components/mantine/dates-provider";
import { getI18nFromParams } from "@/lib/i18n/utils";
import { locales } from "@/lib/i18n/config";
import { APP_NAME } from "@/lib/constants/global";
import { Alexandria } from "next/font/google";
import { Toaster } from "sonner";
import QueryProvider from "@/providers/query";
import UserProvider from "@/contexts/user/provider";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#00225D",
};

const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  variable: "--font-alexandria",
});

const theme = createTheme({
  fontFamily: "var(--font-alexandria)",
  headings: { fontFamily: "var(--font-alexandria)" },
  defaultRadius: "md",
  components: {
    Badge: {
      styles: {
        root: { overflow: "visible", flexShrink: 0 },
        label: { overflow: "visible", textOverflow: "clip", whiteSpace: "nowrap" },
      },
    },
  },
});

// Generate static paths for each locale at build time (SSG)
export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ params, children }: Readonly<LocaleLayoutProps>) {
  const { locale, translate, translation } = await getI18nFromParams(params);

  return (
    <html
      lang={locale}
      dir={translation.dir}
      className={`${alexandria.variable} ${alexandria.className}`}
      {...mantineHtmlProps}
    >
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <MantineColorSchemeScript />
      </head>
      <body style={{ height: "101vh" }}>
        <QueryProvider>
          <UserProvider>
            <MantineProvider theme={theme}>
              <MantineDatesProvider locale={locale}>{children}</MantineDatesProvider>
              <Toaster
                richColors
                position={translate("bottom-right", "bottom-left") as "bottom-right" | "bottom-left"}
                dir={translation.dir as "auto" | "ltr" | "rtl"}
              />
            </MantineProvider>
          </UserProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
