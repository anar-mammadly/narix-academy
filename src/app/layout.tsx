import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { TooltipProvider } from "@/components/ui/Tooltip";

// Bricolage Grotesque lacks Ə/ə; these static instances add them as rotated "e"
// glyphs (OFL allows modification under a new name). Built from the upstream
// variable font — see src/app/fonts/README.md.
const bricolage = localFont({
  src: [
    { path: "./fonts/bricolage-az-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/bricolage-az-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/bricolage-az-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/bricolage-az-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-bricolage",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});
const jetbrains = JetBrains_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Narix Academy", template: "%s · Narix Academy" },
  description: "Manual QA və test avtomatlaşdırmasını interaktiv dərslərlə öyrən.",
  applicationName: "Narix Academy",
  appleWebApp: { capable: true, title: "Narix", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0e1f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az" suppressHydrationWarning className={`${bricolage.variable} ${jetbrains.variable}`}>
      <body className="min-h-dvh font-sans">
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            <ToastProvider>{children}</ToastProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
