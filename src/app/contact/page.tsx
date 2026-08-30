import type { Metadata } from "next";
import { ContactPage } from "@/components/site/contact-page";
import { SiteChrome } from "@/components/site/site-chrome";

export const metadata: Metadata = {
  title: "Contact Us | ShafaQ Atelier",
  description:
    "Get in touch with ShafaQ Atelier for abaya orders, sizing, shipping, returns, and customized abaya assistance.",
  openGraph: {
    title: "Contact Us | ShafaQ Atelier",
    description:
      "Get in touch with ShafaQ Atelier for abaya orders, sizing, shipping, returns, and customized abaya assistance.",
  },
};

export default function Contact() {
  return (
    <SiteChrome>
      <ContactPage />
    </SiteChrome>
  );
}
