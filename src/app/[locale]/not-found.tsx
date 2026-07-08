"use client";

import HomeLayout from "@/components/layouts/home-layout";
import NotFound from "@/components/global/not-found";

export default function Page() {
  return (
    <HomeLayout>
      <NotFound />
    </HomeLayout>
  );
}
