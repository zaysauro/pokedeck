import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/ui/PageHeader";
import { CompareView } from "@/components/compare/CompareView";

export const metadata: Metadata = { title: "Comparar" };

export default function ComparePage() {
  return (
    <Container>
      <PageHeader eyebrow="Comparison · até quatro" title="Lado a" italic="lado">
        Compare tipos, atributos base e o total de cada Pokémon com gráficos sobrepostos.
      </PageHeader>
      <CompareView />
    </Container>
  );
}
