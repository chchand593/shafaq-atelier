import type { Metadata } from "next";
import { AccountDashboard } from "@/components/site/account-dashboard";
import { SiteChrome } from "@/components/site/site-chrome";

export const metadata: Metadata = {
  title: "My Account — ShafaQ Atelier",
  description: "View your orders, wishlist, and profile.",
};

export default function AccountPage() {
  return (
    <SiteChrome>
      <AccountDashboard />
    </SiteChrome>
  );
}
