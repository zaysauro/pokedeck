import type { Metadata } from "next";
import { TcgExplorer } from "@/components/tcg/TcgExplorer";

export const metadata: Metadata = {
  title: "Cartas Pokémon TCG",
  description: "Explore cartas reais do Pokémon Estampas Ilustradas, coleções, raridades e ilustrações oficiais.",
};

export default function TcgPage() {
  return <TcgExplorer />;
}
