import type { Metadata } from "next";
import { AboutPage } from "@/components/site/about-page";
import { SiteChrome } from "@/components/site/site-chrome";

export const metadata: Metadata = {
  title: "About Us | ShafaQ Atelier",
  description:
    "Discover the story behind ShafaQ Atelier — premium Pakistani abayas designed for modesty, comfort and personal style.",
  openGraph: {
    title: "About Us | ShafaQ Atelier",
    description:
      "Discover the story behind ShafaQ Atelier — premium Pakistani abayas designed for modesty, comfort and personal style.",
  },
};

export default function About() {
  return (
    <SiteChrome>
      <AboutPage />
    </SiteChrome>
  );
}
