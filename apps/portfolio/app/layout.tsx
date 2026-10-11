import type { Metadata } from "next";
import { getSiteOrigin } from "@/lib/env";
import { getPublicSiteSettings } from "@/lib/homepage/site-settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  return {
    metadataBase: new URL(getSiteOrigin()),
    title: settings.metaTitle,
    description: settings.metaDescription,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      title: `${settings.displayName} | ${settings.headline}`,
      description: settings.metaDescription,
      url: "/",
      siteName: "Keval Patel Portfolio",
    },
    other: {
      "codex-preview": "keval-patel-portfolio",
    },
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
