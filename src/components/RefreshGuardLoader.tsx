"use client";

import dynamic from "next/dynamic";

const RefreshGuard = dynamic(() => import("./RefreshGuard"), { ssr: false });

export default function RefreshGuardLoader() {
  return <RefreshGuard />;
}
