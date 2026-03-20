import type { Metadata } from "next";
import { Spline_Sans, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";

const splineSans = Spline_Sans({
  variable: "--font-spline-sans",
  subsets: ["latin"],
});

const splineMono = Spline_Sans_Mono({
  variable: "--font-spline-mono",
  subsets: ["latin"],
});

const siteUrl = "https://be-productive.brianagude.com"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Be Productive",
    template: "%s · Be Productive",
  },
  description: "A simple task management app to help you track and improve your productivity.",
  keywords: ["productivity", "task management", "to-do", "tasks", "pomodoro"],
  authors: [{ name: "Briana Gude", url: "https://www.brianagude.com" }],
  creator: "Briana Gude",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Be Productive",
    title: "Be Productive",
    description: "A simple task management app to help you track and improve your productivity.",
    images: [],
  },
  twitter: {
    card: "summary",
    title: "Be Productive",
    description: "A simple task management app to help you track and improve your productivity.",
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
      <body
        className={`${splineSans.variable} ${splineMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
