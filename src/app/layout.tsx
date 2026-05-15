import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Narix Academy — QA Təhsil Platforması",
  description: "Manual QA üzrə professional təhsil platforması",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-surface text-gray-900">
        {children}
      </body>
    </html>
  );
}
