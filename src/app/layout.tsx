import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/nav/Footer";
import { SearchPalette } from "@/components/nav/SearchPalette";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "PokéDeck — Pokédex colecionável & Team Builder", template: "%s · PokéDeck" },
  description:
    "Explore todos os Pokémon com artes oficiais, fichas completas, cadeias evolutivas e monte decks de seis com análise de tipos.",
  applicationName: "PokéDeck",
};

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${geist.variable} ${geistMono.variable} ${serif.variable} grain antialiased`}>
        <Providers>
          <Header />
          <SearchPalette />
          <main className="min-h-[70vh]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
