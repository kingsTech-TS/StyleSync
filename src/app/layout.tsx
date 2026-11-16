import type { Metadata, Viewport } from "next";
import { Anton, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { themeScript } from "@/lib/theme";
import "./globals.css";
import { Providers } from "./providers";

const body = Plus_Jakarta_Sans({ variable: "--font-body", subsets: ["latin"], style: ["normal", "italic"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Anton({ variable: "--font-display", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: { default: "StyleSync", template: "%s · StyleSync" },
  description: "Your wardrobe, styled on your own doll.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf1f0" },
    { media: "(prefers-color-scheme: dark)", color: "#141111" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${body.variable} ${mono.variable} ${display.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
