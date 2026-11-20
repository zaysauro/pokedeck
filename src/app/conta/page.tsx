import type { Metadata } from "next";
import { requireViewer } from "@/server/auth";
import { getMyProfile } from "@/server/trading";
import { Container, PageHeader } from "@/components/ui/PageHeader";
import { ProfileForm } from "@/components/social/ProfileForm";

export const metadata: Metadata = { title: "Minha conta", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ novo?: string; next?: string }> }) {
  const sp = await searchParams;
  const viewer = await requireViewer("/conta");
  const profile = await getMyProfile(viewer.id);
  const next = sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : null;
  return (
    <Container className="pb-10">
      <PageHeader eyebrow={profile ? "Configurações" : "Bem-vindo à comunidade"} title={profile ? "Seu perfil de" : "Crie seu perfil de"} italic="treinador">
        Escolha um nome de usuário e um Pokémon como avatar. Você controla o que fica público.
      </PageHeader>
      <ProfileForm initial={profile} email={viewer.email} next={next ?? (profile ? null : "/colecao")} />
    </Container>
  );
}
