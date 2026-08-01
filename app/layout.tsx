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
    "Unipodium helps campus organizations communicate, collaborate, and coordinate — so student communities can work better together. Find orgs, request speaking slots, and stay connected with everything happening on campus.",
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
