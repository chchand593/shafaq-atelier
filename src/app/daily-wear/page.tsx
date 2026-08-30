import type { Metadata } from "next";
import { DailyWearCollection } from "@/components/site/daily-wear-collection";
import { SiteChrome } from "@/components/site/site-chrome";

export const metadata: Metadata = {
  title: "Daily Wear Abayas — ShafaQ Atelier",
  description:
    "Explore our Daily Wear abaya collection — effortless, breathable, and beautifully cut for the rhythm of your day. Filter by price, size, colour and fabric.",
  openGraph: {
    title: "Daily Wear Abayas — ShafaQ Atelier",
    description: "Your Style, Your Modesty, Your Abaya.",
  },
};

export default function DailyWearPage() {
  return (
    <SiteChrome>
      <DailyWearCollection />
    </SiteChrome>
  );
}
