import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "UniPodium",
  description: "Cross-campus speaker platform for student orgs.",
  icons: { icon: "/favicon.svg" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const uni = jar.get("uni")?.value ?? "default";

  return (
    <html lang="en" className={inter.variable} data-uni={uni}>
      <body>{children}</body>
    </html>
  );
}
