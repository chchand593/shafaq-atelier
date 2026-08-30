import type { Metadata } from "next";
import { CompareView } from "@/components/site/compare-view";
import { SiteChrome } from "@/components/site/site-chrome";

export const metadata: Metadata = {
  title: "Compare Abayas — ShafaQ Atelier",
  description: "Compare up to 3 abayas side by side.",
};

export default function ComparePage() {
  return (
    <SiteChrome>
      <CompareView />
    </SiteChrome>
  );
}
