import type { Metadata } from "next";
import { TeamBuilder } from "@/components/team/TeamBuilder";

export const metadata: Metadata = { title: "Team Builder" };

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TeamBuilder id={id} />;
}
