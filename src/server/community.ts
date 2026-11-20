import "server-only";
import { AppError, tx, type Db } from "./db";
import { FORMATS } from "@/lib/social/types";
import type { CommentRow, DeckCardRow, DeckDetail, DeckSummary, PublicProfile } from "@/lib/social/types";

/* ================================================================== profiles */

const PROFILE_COLS = `user_id, username::text, display_name, avatar_dex, bio, city, state, collection_public,
  followers::int, following::int, cards::int, decks::int, collection_likes::int, created_at`;

export async function getPublicProfile(viewer: string | null, username: string) {
  return tx(viewer, async (db) => {
    const r = await db.query(`select ${PROFILE_COLS} from app.public_profiles where username = $1`, [username.toLowerCase()]);
    if (!r.rowCount) return null;
    const p = r.rows[0] as PublicProfile;
    const rel = viewer
      ? (await db.query(
          `select exists (select 1 from app.follows where follower = $1 and followee = $2) as following,
                  exists (select 1 from app.collection_likes where user_id = $1 and owner_id = $2) as liked,
                  app.is_blocked($1, $2) as blocked,
                  exists (select 1 from app.blocks where blocker = $1 and blocked = $2) as i_blocked`,
          [viewer, p.user_id],
        )).rows[0]
      : { following: false, liked: false, blocked: false, i_blocked: false };
    return { profile: p, ...rel } as { profile: PublicProfile; following: boolean; liked: boolean; blocked: boolean; i_blocked: boolean };
  });
}

export async function getProfileShowcase(viewer: string | null, userId: string) {
  return tx(viewer, async (db) => {
    const [collection, offers, wants] = await Promise.all([
      db.query(
        `select id::int, card_id, card_name, card_image, set_id, set_name, local_id, rarity, card_type, language, variant, quantity, favorite, updated_at
         from app.public_collection where user_id = $1 order by favorite desc, updated_at desc limit 600`,
        [userId],
      ),
      db.query(
        `select id::int, card_id, card_name, card_image, set_name, local_id, language, variant, condition, for_trade
         from app.public_trade_offers where user_id = $1 order by updated_at desc limit 200`,
        [userId],
      ),
      db.query(
        `select id::int, card_id, card_name, card_image, set_name, local_id, language, variant, quantity
         from app.wants where user_id = $1 order by created_at desc limit 200`,
        [userId],
      ),
    ]);
    return { collection: collection.rows, offers: offers.rows, wants: wants.rows };
  });
}

export async function follow(uid: string, userId: string, on: boolean) {
  return tx(uid, async (db) => {
    if (on) await db.query("insert into app.follows (follower, followee) values ($1,$2) on conflict do nothing", [uid, userId]);
    else await db.query("delete from app.follows where follower = $1 and followee = $2", [uid, userId]);
  });
}

export async function likeCollection(uid: string, ownerId: string, on: boolean) {
  return tx(uid, async (db) => {
    if (on) await db.query("insert into app.collection_likes (owner_id, user_id) values ($1,$2) on conflict do nothing", [ownerId, uid]);
    else await db.query("delete from app.collection_likes where owner_id = $1 and user_id = $2", [ownerId, uid]);
  });
}

/* ================================================================== decks */

const DECK_SUMMARY = `
  d.id, d.title, d.description, d.format, d.cover_image, d.main_card_name, d.status, d.published_at, d.updated_at,
  json_build_object('username', p.username, 'display_name', p.display_name, 'avatar_dex', p.avatar_dex) as author,
  coalesce(s.likes, 0)::int as likes, coalesce(s.comments, 0)::int as comments, coalesce(s.saves, 0)::int as saves,
  coalesce(s.card_count, 0)::int as card_count`;
const DECK_FROM = `from app.decks d join app.profiles p on p.user_id = d.user_id left join app.deck_stats s on s.deck_id = d.id`;

export async function listMyDecks(uid: string): Promise<DeckSummary[]> {
  return tx(uid, async (db) => (await db.query(`select ${DECK_SUMMARY} ${DECK_FROM} where d.user_id = $1 order by d.updated_at desc`, [uid])).rows);
}

export async function listUserDecks(viewer: string | null, userId: string): Promise<DeckSummary[]> {
  return tx(viewer, async (db) =>
    (await db.query(`select ${DECK_SUMMARY} ${DECK_FROM} where d.user_id = $1 and d.status = 'published' order by d.published_at desc limit 60`, [userId])).rows,
  );
}

export async function listSavedDecks(uid: string): Promise<DeckSummary[]> {
  return tx(uid, async (db) =>
    (await db.query(
      `select ${DECK_SUMMARY} ${DECK_FROM} join app.deck_saves sv on sv.deck_id = d.id and sv.user_id = $1
       where d.status = 'published' order by sv.created_at desc limit 60`,
      [uid],
    )).rows,
  );
}

export async function getDeck(viewer: string | null, id: string): Promise<DeckDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return tx(viewer, async (db) => {
    const r = await db.query(`select ${DECK_SUMMARY}, d.user_id, d.strategy, d.main_card_id ${DECK_FROM} where d.id = $1`, [id]);
    if (!r.rowCount) return null;
    const cards = await db.query(
      "select card_id, quantity, card_name, card_image, category from app.deck_cards where deck_id = $1 order by category nulls last, card_name",
      [id],
    );
    const rel = viewer
      ? (await db.query(
          `select exists (select 1 from app.deck_likes where deck_id = $1 and user_id = $2) as liked,
                  exists (select 1 from app.deck_saves where deck_id = $1 and user_id = $2) as saved`,
          [id, viewer],
        )).rows[0]
      : { liked: false, saved: false };
    return { ...r.rows[0], cards: cards.rows, ...rel };
  });
}

export interface DeckInput {
  title: string;
  description?: string | null;
  strategy?: string | null;
  format?: string;
  main_card_id?: string | null;
  main_card_name?: string | null;
  cover_image?: string | null;
  cards: DeckCardRow[];
}

function deckValues(i: DeckInput) {
  const clean = (v: unknown, max: number) => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    if (s.length > max) throw new AppError("INVALID_INPUT");
    return s || null;
  };
  const title = clean(i.title, 60);
  if (!title) throw new AppError("INVALID_INPUT", "Dê um nome ao deck.");
  const format = FORMATS.some(([k]) => k === i.format) ? i.format! : "standard";
  const cover = clean(i.cover_image, 200);
  if (cover && !cover.startsWith("https://assets.tcgdex.net/")) throw new AppError("INVALID_INPUT");
  const seen = new Set<string>();
  const cards = (i.cards ?? []).slice(0, 60).map((c) => {
    const id = String(c.card_id ?? "").trim();
    if (!/^[A-Za-z0-9._!?%-]{2,40}$/.test(id) || seen.has(id)) throw new AppError("INVALID_INPUT");
    seen.add(id);
    const q = Number(c.quantity);
    if (!Number.isInteger(q) || q < 1 || q > 60) throw new AppError("INVALID_INPUT");
    const img = clean(c.card_image, 200);
    if (img && !img.startsWith("https://assets.tcgdex.net/")) throw new AppError("INVALID_INPUT");
    return { card_id: id, quantity: q, card_name: clean(c.card_name, 80) ?? id, card_image: img, category: clean(c.category, 30) };
  });
  if (cards.reduce((n, c) => n + c.quantity, 0) > 60) throw new AppError("DECK_TOO_LARGE");
  return {
    title, format, cover,
    description: clean(i.description, 500),
    strategy: clean(i.strategy, 4000),
    main_card_id: clean(i.main_card_id, 40),
    main_card_name: clean(i.main_card_name, 80),
    cards,
  };
}

async function writeCards(db: Db, deckId: string, cards: ReturnType<typeof deckValues>["cards"]) {
  await db.query("delete from app.deck_cards where deck_id = $1", [deckId]);
  for (const c of cards) {
    await db.query(
      "insert into app.deck_cards (deck_id, card_id, quantity, card_name, card_image, category) values ($1,$2,$3,$4,$5,$6)",
      [deckId, c.card_id, c.quantity, c.card_name, c.card_image, c.category],
    );
  }
}

/** Creates (id = null) or updates a deck the viewer owns; RLS rejects anything else. */
export async function saveDeck(uid: string, id: string | null, input: DeckInput, publish?: boolean): Promise<string> {
  const v = deckValues(input);
  return tx(uid, async (db) => {
    const prof = await db.query("select 1 from app.profiles where user_id = $1", [uid]);
    if (!prof.rowCount) throw new AppError("PROFILE_REQUIRED");
    let deckId = id;
    if (!deckId) {
      const r = await db.query(
        `insert into app.decks (user_id, title, description, strategy, format, main_card_id, main_card_name, cover_image)
         values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
        [uid, v.title, v.description, v.strategy, v.format, v.main_card_id, v.main_card_name, v.cover],
      );
      deckId = r.rows[0].id;
    } else {
      const r = await db.query(
        `update app.decks set title = $3, description = $4, strategy = $5, format = $6, main_card_id = $7, main_card_name = $8, cover_image = $9
         where id = $1 and user_id = $2`,
        [deckId, uid, v.title, v.description, v.strategy, v.format, v.main_card_id, v.main_card_name, v.cover],
      );
      if (!r.rowCount) throw new AppError("NOT_FOUND");
    }
    await writeCards(db, deckId!, v.cards);
    if (publish !== undefined) {
      await db.query("update app.decks set status = $3 where id = $1 and user_id = $2", [deckId, uid, publish ? "published" : "draft"]);
    }
    return deckId!;
  });
}

export const deleteDeck = (uid: string, id: string) =>
  tx(uid, async (db) => {
    const r = await db.query("delete from app.decks where id = $1 and user_id = $2", [id, uid]);
    if (!r.rowCount) throw new AppError("NOT_FOUND");
  });

export async function likeDeck(uid: string, deckId: string, on: boolean) {
  return tx(uid, async (db) => {
    if (on) await db.query("insert into app.deck_likes (deck_id, user_id) values ($1,$2) on conflict do nothing", [deckId, uid]);
    else await db.query("delete from app.deck_likes where deck_id = $1 and user_id = $2", [deckId, uid]);
    return (await db.query("select likes::int from app.deck_stats where deck_id = $1", [deckId])).rows[0]?.likes ?? 0;
  });
}

export async function saveDeckBookmark(uid: string, deckId: string, on: boolean) {
  return tx(uid, async (db) => {
    if (on) await db.query("insert into app.deck_saves (deck_id, user_id) values ($1,$2) on conflict do nothing", [deckId, uid]);
    else await db.query("delete from app.deck_saves where deck_id = $1 and user_id = $2", [deckId, uid]);
  });
}

/* ================================================================== comments */

export async function listComments(viewer: string | null, deckId: string): Promise<CommentRow[]> {
  return tx(viewer, async (db) =>
    (await db.query(
      `select c.id::int, c.parent_id::int, case when c.deleted_at is null then c.body else '' end as body,
              c.created_at, c.edited_at, c.deleted_at is not null as deleted,
              json_build_object('user_id', p.user_id, 'username', p.username, 'display_name', p.display_name, 'avatar_dex', p.avatar_dex) as author
       from app.comments c join app.profiles p on p.user_id = c.user_id
       where c.deck_id = $1 and (c.deleted_at is null or exists (select 1 from app.comments r where r.parent_id = c.id and r.deleted_at is null))
         and ($2::text is null or not app.is_blocked($2, c.user_id))
       order by c.created_at asc limit 500`,
      [deckId, viewer],
    )).rows,
  );
}

const commentBody = (b: string) => {
  const s = String(b ?? "").trim();
  if (!s || s.length > 1000) throw new AppError("INVALID_INPUT", "O comentário deve ter entre 1 e 1000 caracteres.");
  return s;
};

export const addComment = (uid: string, deckId: string, body: string, parentId: number | null) =>
  tx(uid, async (db) => {
    await db.query("insert into app.comments (deck_id, user_id, parent_id, body) values ($1,$2,$3,$4)", [deckId, uid, parentId, commentBody(body)]);
  });

export const editComment = (uid: string, id: number, body: string) =>
  tx(uid, async (db) => {
    const r = await db.query("update app.comments set body = $3, edited_at = now() where id = $1 and user_id = $2 and deleted_at is null", [id, uid, commentBody(body)]);
    if (!r.rowCount) throw new AppError("NOT_ALLOWED");
  });

export const deleteComment = (uid: string, id: number) =>
  tx(uid, async (db) => {
    const r = await db.query("update app.comments set deleted_at = now() where id = $1 and user_id = $2 and deleted_at is null", [id, uid]);
    if (!r.rowCount) throw new AppError("NOT_ALLOWED");
  });

/* ================================================================== explore & feed */

export type ExploreTab = "trending" | "top" | "commented" | "new" | "week" | "month" | "recommended";

export async function exploreDecks(viewer: string | null, tab: ExploreTab, limit = 24): Promise<DeckSummary[]> {
  const order: Record<ExploreTab, string> = {
    trending: "t.score desc nulls last, d.published_at desc",
    top: "coalesce(s.likes, 0) desc, d.published_at desc",
    commented: "coalesce(s.comments, 0) desc, d.published_at desc",
    new: "d.published_at desc",
    week: "coalesce(s.likes_7d, 0) desc, coalesce(s.comments_7d, 0) desc, d.published_at desc",
    month: "coalesce(s.likes_30d, 0) desc, d.published_at desc",
    recommended: "rec desc, t.score desc nulls last",
  };
  const extraWhere =
    tab === "week" ? "and (coalesce(s.likes_7d,0) + coalesce(s.comments_7d,0) > 0 or d.published_at > now() - interval '7 days')"
    : tab === "month" ? "and (coalesce(s.likes_30d,0) > 0 or d.published_at > now() - interval '30 days')"
    : "";
  return tx(viewer, async (db) =>
    (await db.query(
      `select ${DECK_SUMMARY},
         ${tab === "recommended" && viewer
           ? `( (select count(*) from app.deck_likes l join app.follows f on f.followee = l.user_id and f.follower = $2 where l.deck_id = d.id) * 3
              + (select count(*) from app.deck_cards dc where dc.deck_id = d.id and dc.card_id in
                   (select card_id from app.collection_items where user_id = $2 union select card_id from app.wants where user_id = $2)) )`
           : "0"} as rec
       ${DECK_FROM} left join app.deck_trending t on t.deck_id = d.id
       where d.status = 'published' ${extraWhere}
         ${viewer ? "and d.user_id <> $2 and not app.is_blocked($2, d.user_id)" : ""}
       order by ${order[tab]} limit $1`,
      viewer ? [limit, viewer] : [limit],
    )).rows,
  );
}

export async function popularTrainers(viewer: string | null, limit = 12) {
  return tx(viewer, async (db) =>
    (await db.query(
      `select ${PROFILE_COLS},
              (select count(*) from app.deck_likes l join app.decks d on d.id = l.deck_id where d.user_id = pp.user_id and l.created_at > now() - interval '30 days')::int as recent_likes
       from app.public_profiles pp
       where ($2::text is null or pp.user_id <> $2)
       order by followers desc, recent_likes desc, decks desc, cards desc limit $1`,
      [limit, viewer],
    )).rows as (PublicProfile & { recent_likes: number })[],
  );
}

export interface FeedItem {
  kind: "deck" | "collection";
  at: string;
  author: { username: string; display_name: string | null; avatar_dex: number };
  deck?: DeckSummary;
  cards?: { card_id: string; card_name: string; card_image: string | null }[];
  count?: number;
}

/** Following feed: new decks + public collection updates (grouped per trainer per day). */
export async function followingFeed(uid: string): Promise<FeedItem[]> {
  return tx(uid, async (db) => {
    const decks = await db.query(
      `select ${DECK_SUMMARY} ${DECK_FROM}
       join app.follows f on f.followee = d.user_id and f.follower = $1
       where d.status = 'published' and d.published_at > now() - interval '60 days'
       order by d.published_at desc limit 40`,
      [uid],
    );
    const updates = await db.query(
      `select p.username::text, p.display_name, p.avatar_dex, date_trunc('day', c.created_at) as day, max(c.created_at) as at,
              count(*)::int as count,
              (json_agg(json_build_object('card_id', c.card_id, 'card_name', c.card_name, 'card_image', c.card_image) order by c.created_at desc))
                as cards
       from app.public_collection c
       join app.follows f on f.followee = c.user_id and f.follower = $1
       join app.profiles p on p.user_id = c.user_id
       where c.created_at > now() - interval '30 days'
       group by 1, 2, 3, 4 order by at desc limit 30`,
      [uid],
    );
    const items: FeedItem[] = [
      ...decks.rows.map((d) => ({ kind: "deck" as const, at: d.published_at, author: d.author, deck: d })),
      ...updates.rows.map((u) => ({
        kind: "collection" as const,
        at: u.at,
        author: { username: u.username, display_name: u.display_name, avatar_dex: u.avatar_dex },
        cards: (u.cards as FeedItem["cards"])!.slice(0, 8),
        count: u.count,
      })),
    ];
    return items.sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 60);
  });
}

/** Trading discovery shown in Comunidade (read-only; only explicit offers/wants). */
export async function tradeDiscovery(uid: string) {
  return tx(uid, async (db) => {
    const wantedFromMe = await db.query(
      `select w.card_id, w.card_name, w.card_image, count(distinct w.user_id)::int as people
       from app.wants w join app.collection_items ci on ci.card_id = w.card_id and ci.user_id = $1 and ci.for_trade > 0
       where w.user_id <> $1 and not app.is_blocked($1, w.user_id)
       group by 1, 2, 3 order by people desc limit 12`,
      [uid],
    );
    const offeredToMe = await db.query(
      `select o.card_id, o.card_name, o.card_image, count(distinct o.user_id)::int as people
       from app.public_trade_offers o join app.wants w on w.card_id = o.card_id and w.user_id = $1
       where o.user_id <> $1 and not app.is_blocked($1, o.user_id)
       group by 1, 2, 3 order by people desc limit 12`,
      [uid],
    );
    return { wantedFromMe: wantedFromMe.rows, offeredToMe: offeredToMe.rows };
  });
}
