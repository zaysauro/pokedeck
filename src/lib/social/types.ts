/** Shared types for the community (social) and trading modules. */

export const LANGUAGES = [
  ["pt", "Português"], ["en", "Inglês"], ["es", "Espanhol"], ["fr", "Francês"], ["de", "Alemão"],
  ["it", "Italiano"], ["ja", "Japonês"], ["ko", "Coreano"], ["zh", "Chinês"],
] as const;
export const VARIANTS = [
  ["normal", "Normal"], ["reverse", "Reverse Holo"], ["holo", "Holo"], ["firstEdition", "1ª edição"], ["wPromo", "Promo"],
] as const;
export const CONDITIONS = [
  ["NM", "Near Mint"], ["LP", "Levemente jogada"], ["MP", "Moderadamente jogada"], ["HP", "Muito jogada"], ["DMG", "Danificada"],
] as const;
export const FORMATS = [
  ["standard", "Standard"], ["expanded", "Expanded"], ["unlimited", "Unlimited"], ["theme", "Tema / Casual"],
] as const;

export type Language = (typeof LANGUAGES)[number][0];
export type Variant = (typeof VARIANTS)[number][0];
export type Condition = (typeof CONDITIONS)[number][0];
export type DeckFormat = (typeof FORMATS)[number][0];

export const labelOf = (list: readonly (readonly [string, string])[], key: string | null | undefined) =>
  list.find(([k]) => k === key)?.[1] ?? key ?? "";

export interface CardSnap {
  card_id: string;
  card_name: string;
  card_image: string | null;
  set_id: string | null;
  set_name: string | null;
  local_id: string | null;
  rarity: string | null;
}

export interface Profile {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_dex: number;
  bio: string | null;
  city: string | null;
  state: string | null;
  collection_public: boolean;
  show_location?: boolean;
}

export interface PublicProfile extends Profile {
  followers: number;
  following: number;
  cards: number;
  decks: number;
  collection_likes: number;
  created_at: string;
}

export interface CollectionItem extends CardSnap {
  id: number;
  language: Language;
  variant: Variant;
  condition: Condition | null;
  quantity: number;
  for_trade: number;
  favorite: boolean;
  notes: string | null;
  card_type: string | null;
  updated_at: string;
}

export interface Want extends CardSnap {
  id: number;
  language: Language | null;
  variant: Variant | null;
  quantity: number;
  created_at: string;
}

export interface MatchCard {
  card_id: string;
  card_name: string;
  card_image: string | null;
  set_name: string | null;
  language: string;
  variant: string;
  direction: "give" | "receive"; // from the viewer's point of view
}

export interface MatchSummary {
  id: number;
  kind: "mutual" | "one_way";
  status: "open" | "closed" | "expired";
  created_at: string;
  last_message_at: string | null;
  other: Pick<Profile, "user_id" | "username" | "display_name" | "avatar_dex" | "city" | "state">;
  unread: number;
  cards: MatchCard[];
}

export interface Message {
  id: number;
  sender_id: string;
  body: string;
  card_refs: string[];
  created_at: string;
}

export interface DeckCardRow {
  card_id: string;
  quantity: number;
  card_name: string;
  card_image: string | null;
  category: string | null;
}

export interface DeckSummary {
  id: string;
  title: string;
  description: string | null;
  format: DeckFormat;
  cover_image: string | null;
  main_card_name: string | null;
  status: "draft" | "published";
  published_at: string | null;
  updated_at: string;
  author: Pick<Profile, "username" | "display_name" | "avatar_dex">;
  likes: number;
  comments: number;
  saves: number;
  card_count: number;
}

export interface DeckDetail extends DeckSummary {
  user_id: string;
  strategy: string | null;
  main_card_id: string | null;
  cards: DeckCardRow[];
  liked: boolean;
  saved: boolean;
}

export interface CommentRow {
  id: number;
  parent_id: number | null;
  body: string;
  created_at: string;
  edited_at: string | null;
  deleted: boolean;
  author: Pick<Profile, "user_id" | "username" | "display_name" | "avatar_dex">;
}

export interface NotificationRow {
  id: number;
  type: "follow" | "deck_like" | "deck_comment" | "comment_reply" | "collection_like" | "match" | "message";
  created_at: string;
  read: boolean;
  actor: Pick<Profile, "username" | "display_name" | "avatar_dex"> | null;
  deck: { id: string; title: string } | null;
  match_id: number | null;
}
