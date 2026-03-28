import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";

const displayFont = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "AXIOM//LENS",
  description: "Futuristic video intelligence dashboard for short-form analysis demos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${displayFont.variable} ${bodyFont.variable} bg-mist font-sans text-ink antialiased`}>
        {children}
      </body>
    </html>
  );
}
