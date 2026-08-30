import type { Metadata } from "next";
import { SizeGuidePage } from "@/components/site/size-guide-page";
import { SiteChrome } from "@/components/site/site-chrome";

export const metadata: Metadata = {
  title: "Size Guide | ShafaQ Atelier",
  description:
    "Find your perfect abaya size with the ShafaQ Atelier size guide, measurement instructions and fit recommendations.",
  openGraph: {
    title: "Size Guide | ShafaQ Atelier",
    description:
      "Find your perfect abaya size with the ShafaQ Atelier size guide, measurement instructions and fit recommendations.",
  },
};

export default function SizeGuide() {
  return (
    <SiteChrome>
      <SizeGuidePage />
    </SiteChrome>
  );
}
