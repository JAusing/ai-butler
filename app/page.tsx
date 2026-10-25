"use client";

import dynamic from "next/dynamic";

// Dates depend on the user's local clock, so render on the client only.
const Ledger = dynamic(() => import("@/components/Ledger"), { ssr: false });

export default function Home() {
  return <Ledger />;
}
