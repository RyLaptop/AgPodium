import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgPodium",
  description:
    "Cross-org campus platform for meeting speakers, event calendars, and bulletin boards.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
