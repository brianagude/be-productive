import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { Kalam, Special_Elite } from "next/font/google";
import { Toaster } from "sonner";
import { Wrapper } from "@/components/Wrapper";
import "./globals.css";

const cooperHewitt = localFont({
  variable: "--font-cooper-hewitt",
  display: "swap",
  src: [
    {
      path: "../fonts/cooperhewitt-thin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "../fonts/cooperhewitt-thinitalic.woff2",
      weight: "100",
      style: "italic",
    },
    {
      path: "../fonts/cooperhewitt-light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/cooperhewitt-lightitalic.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "../fonts/cooperhewitt-book.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/cooperhewitt-bookitalic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../fonts/cooperhewitt-medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/cooperhewitt-mediumitalic.woff2",
      weight: "500",
      style: "italic",
    },
    {
      path: "../fonts/cooperhewitt-semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/cooperhewitt-semibolditalic.woff2",
      weight: "600",
      style: "italic",
    },
    {
      path: "../fonts/cooperhewitt-bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/cooperhewitt-bolditalic.woff2",
      weight: "700",
      style: "italic",
    },
    {
      path: "../fonts/cooperhewitt-heavy.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../fonts/cooperhewitt-heavyitalic.woff2",
      weight: "800",
      style: "italic",
    },
  ],
});

const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const specialElite = Special_Elite({
  variable: "--font-special-elite",
  subsets: ["latin"],
  weight: "400",
});

const siteUrl = "https://be-productive.brianagude.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Be Productive",
    template: "%s · Be Productive",
  },
  description: "A simple, local-only productivity app.",
  keywords: ["productivity", "task management", "to-do", "tasks", "pomodoro"],
  authors: [{ name: "Briana Gude", url: "https://www.brianagude.com" }],
  creator: "Briana Gude",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Be Productive",
    title: "Be Productive",
    description: "A simple, local-only productivity app.",
    images: [],
  },
  twitter: {
    card: "summary",
    title: "Be Productive",
    description: "A simple, local-only productivity app.",
    images: [],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cooperHewitt.className} ${kalam.variable} ${specialElite.variable} antialiased`}>
        <Wrapper>{children}</Wrapper>
        <Toaster position="bottom-right" />
        <Analytics />
      </body>
    </html>
  );
}
