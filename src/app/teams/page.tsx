import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/ui/PageHeader";
import { TeamsView } from "@/components/team/TeamsView";

export const metadata: Metadata = { title: "My Decks" };

export default function TeamsPage() {
  return (
    <Container>
      <PageHeader eyebrow="Team Builder · Seis cartas por deck" title="My" italic="Decks">
        Seus times, guardados neste navegador. Crie, edite, duplique, exporte em JSON e compartilhe por link.
      </PageHeader>
      <TeamsView />
    </Container>
  );
}
