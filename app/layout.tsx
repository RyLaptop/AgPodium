import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://unipodium.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "Unipodium — Student Org Speaker Platform",
  description:
    "Unipodium connects student speakers with college organizations. Browse campus orgs, request speaking slots, and manage your appearances — all in one place.",
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Unipodium",
  url: "https://unipodium.com",
  logo: "https://unipodium.com/icon.svg",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const uni = jar.get("uni")?.value ?? "default";

  return (
    <html lang="en" className={inter.variable} data-uni={uni}>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </body>
    </html>
  );
}
