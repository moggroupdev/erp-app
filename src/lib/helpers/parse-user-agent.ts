import type { Locale } from "@/lib/i18n/config";

export type UserAgentDevice = "desktop" | "mobile" | "tablet";

export type ParsedUserAgent = {
  browserName: string | null;
  browserVersion: string | null;
  osName: string | null;
  osVersion: string | null;
  device: UserAgentDevice;
};

function firstMatch(ua: string, regex: RegExp): string | null {
  return ua.match(regex)?.[1] ?? null;
}

function majorVersion(version: string | null): string | null {
  if (!version) return null;
  return version.split(".")[0] || version;
}

function shortVersion(version: string | null): string | null {
  if (!version) return null;
  const parts = version.split(".");
  if (parts.length <= 2) return version;
  return `${parts[0]}.${parts[1]}`;
}

function parseBrowser(ua: string): Pick<ParsedUserAgent, "browserName" | "browserVersion"> {
  const rules: { name: string; test: RegExp; version: RegExp }[] = [
    { name: "Edge", test: /Edg(?:e|A|iOS)?\//i, version: /Edg(?:e|A|iOS)?\/([\d.]+)/i },
    { name: "Opera", test: /OPR\/|Opera\//i, version: /(?:OPR|Opera)\/([\d.]+)/i },
    { name: "Samsung Internet", test: /SamsungBrowser\//i, version: /SamsungBrowser\/([\d.]+)/i },
    { name: "Firefox", test: /Firefox\/|FxiOS\//i, version: /(?:Firefox|FxiOS)\/([\d.]+)/i },
    { name: "Chrome", test: /Chrome\/|CriOS\//i, version: /(?:Chrome|CriOS)\/([\d.]+)/i },
    { name: "Safari", test: /Safari\//i, version: /Version\/([\d.]+)/i },
  ];

  for (const rule of rules) {
    if (!rule.test.test(ua)) continue;
    return { browserName: rule.name, browserVersion: majorVersion(firstMatch(ua, rule.version)) };
  }

  return { browserName: null, browserVersion: null };
}

function parseOs(ua: string): Pick<ParsedUserAgent, "osName" | "osVersion"> {
  if (/Windows NT 10\.0/i.test(ua)) return { osName: "Windows", osVersion: "10" };
  if (/Windows NT 6\.3/i.test(ua)) return { osName: "Windows", osVersion: "8.1" };
  if (/Windows NT 6\.2/i.test(ua)) return { osName: "Windows", osVersion: "8" };
  if (/Windows NT 6\.1/i.test(ua)) return { osName: "Windows", osVersion: "7" };
  if (/Windows NT 6\.0/i.test(ua)) return { osName: "Windows", osVersion: "Vista" };
  if (/Windows NT 5\.1/i.test(ua)) return { osName: "Windows", osVersion: "XP" };
  if (/Windows/i.test(ua)) return { osName: "Windows", osVersion: null };

  const iosVersion = firstMatch(ua, /(?:iPhone|CPU)(?: iPhone)? OS (\d+[._]\d+)/i);
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return { osName: "iOS", osVersion: shortVersion(iosVersion?.replace(/_/g, ".") ?? null) };
  }

  const macVersion = firstMatch(ua, /Mac OS X (\d+[._]\d+(?:[._]\d+)?)/i);
  if (/Macintosh|Mac OS X/i.test(ua)) {
    return { osName: "macOS", osVersion: shortVersion(macVersion?.replace(/_/g, ".") ?? null) };
  }

  const androidVersion = firstMatch(ua, /Android (\d+(?:\.\d+)?)/i);
  if (/Android/i.test(ua)) return { osName: "Android", osVersion: androidVersion };

  if (/CrOS/i.test(ua)) return { osName: "Chrome OS", osVersion: null };
  if (/Linux/i.test(ua)) return { osName: "Linux", osVersion: null };

  return { osName: null, osVersion: null };
}

function parseDevice(ua: string): UserAgentDevice {
  if (/iPad|Tablet|PlayBook/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    return "tablet";
  }
  if (/Mobi|iPhone|iPod|Android|webOS|BlackBerry/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

function joinNameVersion(name: string | null, version: string | null): string | null {
  if (!name) return null;
  return version ? `${name} ${version}` : name;
}

export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const ua = userAgent.trim();
  return {
    ...parseBrowser(ua),
    ...parseOs(ua),
    device: parseDevice(ua),
  };
}

export function formatUserAgentDevice(device: UserAgentDevice, locale: Locale): string {
  if (device === "mobile") return locale === "ar" ? "جوال" : "Mobile";
  if (device === "tablet") return locale === "ar" ? "جهاز لوحي" : "Tablet";
  return locale === "ar" ? "سطح المكتب" : "Desktop";
}

export function formatUserAgent(userAgent: string, locale: Locale): string {
  const parsed = parseUserAgent(userAgent);
  const browser = joinNameVersion(parsed.browserName, parsed.browserVersion);
  const os = joinNameVersion(parsed.osName, parsed.osVersion);
  const device = formatUserAgentDevice(parsed.device, locale);
  const parts = [browser, os].filter(Boolean);

  if (parts.length === 0) return userAgent.trim();

  const main = locale === "ar" ? parts.join(" على ") : parts.join(" on ");
  return `${main} · ${device}`;
}
