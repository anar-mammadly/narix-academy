import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QA Academy — Manual QA tədris platforması",
  description: "Canlı dərs + strukturlaşdırılmış materiallar, tapşırıqlar və testlər.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
