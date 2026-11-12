import type { Metadata } from "next";
import "./globals.css";
import CookieConsentBanner from "@/components/common/CookieConsentBanner";

export const metadata: Metadata = {
  title: "MOVEN · Núcleo de Missões · Igreja UNASP-HT",
  description:
    "Escola de Missões e Missão Amazonas 2027. Movidos pelo amor. Enviados para servir.",
  keywords: [
    "MOVEN",
    "Missões",
    "UNASP",
    "UNASP-HT",
    "Escola de Missões",
    "Missão Amazonas 2027",
    "Salva-Vidas Amazônia",
    "SVA",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Figtree:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased selection:bg-[#8fa66a] selection:text-[#072119]">
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
