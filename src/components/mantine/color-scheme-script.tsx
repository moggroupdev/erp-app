"use client";

import { ColorSchemeScript } from "@mantine/core";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// After hydration, skip the script — React 19 warns on client-rendered <script> tags.
const getClientSnapshot = () => false;

// SSR + hydration: emit once so the color scheme is set before paint.
const getServerSnapshot = () => true;

export function MantineColorSchemeScript() {
  const shouldRender = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  if (!shouldRender) return null;
  return <ColorSchemeScript />;
}
