import type { Metadata } from "next";
import { Container } from "@/components/ui/PageHeader";
import { SharedDeck } from "@/components/team/SharedDeck";

export const metadata: Metadata = { title: "Deck compartilhado" };

export default async function SharePage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d } = await searchParams;
  return (
    <Container>
      <SharedDeck code={d ?? ""} />
    </Container>
  );
}
