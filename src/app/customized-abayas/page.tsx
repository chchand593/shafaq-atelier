import type { Metadata } from "next";
import { CustomAbayaBuilder } from "@/components/site/custom-abaya-builder";
import { SiteChrome } from "@/components/site/site-chrome";

export const metadata: Metadata = {
  title: "Customized Abayas — Design Your Own — ShafaQ Atelier",
  description:
    "Design your own bespoke abaya. Choose style, fabric, colour, sleeves, hijab, embroidery and details. Live price calculation. Crafted in 10–14 days.",
  openGraph: {
    title: "Customized Abayas — Design Your Own — ShafaQ Atelier",
    description: "Your Style, Your Modesty, Your Abaya — bespoke to you.",
  },
};

export default function CustomizedAbayasPage() {
  return (
    <SiteChrome>
      <CustomAbayaBuilder />
    </SiteChrome>
  );
}
