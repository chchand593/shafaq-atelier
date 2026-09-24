import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "ShafaQ Atelier | Your Style, Your Modesty, Your Abaya",
  description:
    "Discover premium Pakistani abayas crafted with elegance and modesty. Explore everyday wear, customized designs, new arrivals and best sellers. Your style, your modesty, your abaya.",
  keywords: [
    "abaya",
    "Pakistani abaya",
    "modest fashion",
    "premium abaya",
    "customized abaya",
    "daily wear abaya",
    "Islamic fashion",
    "modest clothing",
  ],
  authors: [{ name: "ShafaQ Atelier" }],
  openGraph: {
    title: "ShafaQ Atelier — Premium Pakistani Abayas",
    description: "Your Style, Your Modesty, Your Abaya",
    siteName: "ShafaQ Atelier",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShafaQ Atelier — Premium Pakistani Abayas",
    description: "Your Style, Your Modesty, Your Abaya",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`font-sans antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
