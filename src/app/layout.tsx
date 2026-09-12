import type { Metadata } from "next";
import { Geist, Geist_Mono, Amiri } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Self-hosted as a static asset by next/font at build time, so the Qur'an
// verse text renders identically everywhere — desktop and mobile alike —
// instead of falling back to whatever Arabic system font each OS ships
// (macOS, Android and Windows all default to visibly different ones).
const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Pious Muslim Women International Organization",
    template: "%s · Pious Muslim Women International Organization",
  },
  description:
    "A global Islamic NGO empowering women, caring for orphans, and funding scholarships for brilliant, needy students. Become a member or apply for a program.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${amiri.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
