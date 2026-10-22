import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Chistix.id",
    template: "%s | Chistix.id"
  },
  icons: {
    icon: "/favicon.png"
  },
  description: "Your Crunchy Event ",
  keywords: ["Live Concerts","Viral Events","Acara Populer di Indonesia","Seminar Premium" ]
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
