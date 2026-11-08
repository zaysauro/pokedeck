/** Curated decks shown on Home and My Decks — users can clone them into their collection. */
export const PRESET_DECKS: { slug: string; name: string; description: string; members: number[]; coverId: number }[] = [
  { slug: "kanto-classics", name: "Clássicos de Kanto", description: "Os iniciais finais e os ícones que começaram tudo.", members: [6, 9, 3, 25, 143, 131], coverId: 6 },
  { slug: "shadow-court", name: "Corte das Sombras", description: "Fantasmas e sombrios para quem joga no escuro.", members: [94, 197, 442, 778, 887, 1000], coverId: 94 },
  { slug: "dragon-legion", name: "Legião Dracônica", description: "Pseudo-lendários com poder bruto e presença.", members: [149, 248, 373, 445, 635, 706], coverId: 445 },
  { slug: "rain-dance", name: "Dança da Chuva", description: "Equipe aquática equilibrada com cobertura elétrica.", members: [130, 186, 260, 658, 145, 6], coverId: 658 },
  { slug: "legends", name: "Panteão Lendário", description: "Criação, tempo, espaço e céu num só deck.", members: [150, 249, 384, 483, 484, 487], coverId: 384 },
  { slug: "fairy-tale", name: "Conto de Fadas", description: "Fadas, psíquicos e aço para um time elegante.", members: [282, 700, 303, 468, 858, 445], coverId: 700 },
];
