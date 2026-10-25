"use client";

import dynamic from "next/dynamic";

// Periods depend on the user's local clock, so render on the client only.
const Stats = dynamic(() => import("@/components/Stats"), { ssr: false });

export default function StatsPage() {
  return <Stats />;
}
