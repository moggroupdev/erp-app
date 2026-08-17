"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { getLogoSize } from "@/lib/constants/ratios";

export default function Logo({
  onClick,
  title = "",
  redirectToHome = false,
}: {
  onClick?: () => void;
  title?: string;
  redirectToHome?: boolean;
}) {
  const router = useRouter();

  return (
    <button
      className={`flex items-center gap-4 ${redirectToHome ? "transition-opacity hover:opacity-80" : "cursor-default"} `}
      onClick={() => {
        onClick?.();
        if (redirectToHome) router.push("/");
      }}
    >
      <Image
        src={"/images/logo.png"}
        alt={title}
        {...getLogoSize(38)}
        className="rounded"
        style={{ height: "auto" }}
      />
      {title && <span className={`text-lg font-bold text-nowrap`}>{title}</span>}
    </button>
  );
}
