import "server-only";
import { AppError, tx, type Db } from "./db";
import { CONDITIONS, LANGUAGES, VARIANTS } from "@/lib/social/types";
import type {
  CollectionItem, MatchCard, MatchSummary, Message, NotificationRow, Profile, Want,
} from "@/lib/social/types";

/* ================================================================== validation helpers */

const str = (v: unknown, max: number, opts: { min?: number; required?: boolean } = {}) => {
  if (v === undefined || v === null || v === "") {
    if (opts.required) throw new AppError("INVALID_INPUT");
    return null;
  }
  const s = String(v).trim();
  if (s.length > max || s.length < (opts.min ?? 0)) throw new AppError("INVALID_INPUT");
  return s;
};
const int = (v: unknown, min: number, max: number) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw new AppError("INVALID_INPUT");
  return n;
};
const oneOf = <T extends string>(v: unknown, list: readonly (readonly [T, string])[], nullable = false): T | null => {
  if ((v === null || v === undefined || v === "") && nullable) return null;
  const hit = list.find(([k]) => k === v);
  if (!hit) throw new AppError("INVALID_INPUT");
  return hit[0];
};
const cardId = (v: unknown) => {
  const s = str(v, 40, { min: 2, required: true })!;
  if (!/^[A-Za-z0-9._!?%-]+$/.test(s)) throw new AppError("INVALID_INPUT");
  return s;
};
const imageUrl = (v: unknown) => {
  const s = str(v, 200);
  if (s && !s.startsWith("https://assets.tcgdex.net/")) throw new AppError("INVALID_INPUT");
  return s;
};

export interface CardInput {
  card_id: string;
  card_name: string;
  card_image?: string | null;
  set_id?: string | null;
  set_name?: string | null;
  local_id?: string | null;
  rarity?: string | null;
  card_type?: string | null;
}

function snap(c: CardInput) {
  return {
    card_id: cardId(c.card_id),
    card_name: str(c.card_name, 80, { required: true })!,
    card_image: imageUrl(c.card_image),
    set_id: str(c.set_id, 40),
    set_name: str(c.set_name, 80),
    local_id: str(c.local_id, 20),
    rarity: str(c.rarity, 60),
    card_type: str(c.card_type, 30),
  };
}

async function requireProfile(db: Db, uid: string) {
  const r = await db.query("select 1 from app.profiles where user_id = $1", [uid]);
  if (!r.rowCount) throw new AppError("PROFILE_REQUIRED");
}

/* ================================================================== profile */

export async function getMyProfile(uid: string): Promise<Profile | null> {
  return tx(uid, async (db) => {
    const r = await db.query(
      "select user_id, username::text, display_name, avatar_dex, bio, city, state, collection_public, show_location from app.profiles where user_id = $1",
      [uid],
    );
    return r.rows[0] ?? null;
  });
}

export interface ProfileInput {
  username: string;
  display_name?: string | null;
  avatar_dex?: number;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  collection_public?: boolean;
  show_location?: boolean;
}

export async function saveProfile(uid: string, input: ProfileInput): Promise<Profile> {
  const username = String(input.username ?? "").trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    throw new AppError("INVALID_INPUT", "Use de 3 a 20 caracteres: letras minúsculas, números ou _.");
  }
  const v = {
    display_name: str(input.display_name, 40),
    avatar_dex: input.avatar_dex === undefined ? 25 : int(input.avatar_dex, 1, 1025),
    bio: str(input.bio, 280),
    city: str(input.city, 60),
    state: str(input.state, 2)?.toUpperCase() ?? null,
    collection_public: input.collection_public ?? true,
    show_location: input.show_location ?? true,
  };
  return tx(uid, async (db) => {
    const r = await db.query(
      `insert into app.profiles (user_id, username, display_name, avatar_dex, bio, city, state, collection_public, show_location)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       on conflict (user_id) do update set username = excluded.username, display_name = excluded.display_name,
         avatar_dex = excluded.avatar_dex, bio = excluded.bio, city = excluded.city, state = excluded.state,
         collection_public = excluded.collection_public, show_location = excluded.show_location
       returning user_id, username::text, display_name, avatar_dex, bio, city, state, collection_public, show_location`,
      [uid, username, v.display_name, v.avatar_dex, v.bio, v.city, v.state, v.collection_public, v.show_location],
    );
    return r.rows[0];
  });
}

/* ================================================================== collection (Minha Coleção) */

const ITEM_COLS = `id::int as id, card_id, card_name, card_image, set_id, set_name, local_id, rarity, card_type, language, variant,
  condition, quantity, for_trade, favorite, notes, updated_at`;

export async function listMyCollection(uid: string): Promise<{ items: CollectionItem[]; wants: Want[] }> {
  return tx(uid, async (db) => {
    const [items, wants] = await Promise.all([
      db.query(`select ${ITEM_COLS} from app.collection_items where user_id = $1 order by updated_at desc`, [uid]),
      db.query(
        `select id::int as id, card_id, card_name, card_image, set_id, set_name, local_id, rarity, language, variant, quantity, created_at
         from app.wants where user_id = $1 order by created_at desc`,
        [uid],
      ),
    ]);
    return { items: items.rows, wants: wants.rows };
  });
}

export interface ItemInput extends CardInput {
  language?: string;
  variant?: string;
  condition?: string | null;
  quantity: number;
  for_trade?: number;
  favorite?: boolean;
  notes?: string | null;
}

function itemValues(i: ItemInput) {
  const quantity = int(i.quantity, 1, 999);
  const for_trade = int(i.for_trade ?? 0, 0, quantity);
  return {
    ...snap(i),
    language: oneOf(i.language ?? "pt", LANGUAGES)!,
    variant: oneOf(i.variant ?? "normal", VARIANTS)!,
    condition: oneOf(i.condition ?? null, CONDITIONS, true),
    quantity,
    for_trade,
    favorite: Boolean(i.favorite),
    notes: str(i.notes, 280),
  };
}

/** Adds copies (or creates the row) for the same card/language/variant/condition. */
export async function addItem(uid: string, input: ItemInput): Promise<CollectionItem> {
  const v = itemValues(input);
  return tx(uid, async (db) => {
    await requireProfile(db, uid);
    const r = await db.query(
      `insert into app.collection_items (user_id, card_id, card_name, card_image, set_id, set_name, local_id, rarity, card_type,
         language, variant, condition, quantity, for_trade, favorite, notes)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       on conflict (user_id, card_id, language, variant, coalesce(condition, '')) do update set
         quantity = least(app.collection_items.quantity + excluded.quantity, 999),
         for_trade = least(app.collection_items.for_trade + excluded.for_trade, least(app.collection_items.quantity + excluded.quantity, 999)),
         favorite = app.collection_items.favorite or excluded.favorite,
         notes = coalesce(excluded.notes, app.collection_items.notes)
       returning ${ITEM_COLS}`,
      [uid, v.card_id, v.card_name, v.card_image, v.set_id, v.set_name, v.local_id, v.rarity, v.card_type,
        v.language, v.variant, v.condition, v.quantity, v.for_trade, v.favorite, v.notes],
    );
    if (v.for_trade > 0) await db.query("select app.recompute_matches()");
    return r.rows[0];
  });
}

export async function updateItem(uid: string, id: number, input: Partial<ItemInput>): Promise<CollectionItem> {
  return tx(uid, async (db) => {
    const cur = await db.query(`select ${ITEM_COLS} from app.collection_items where id = $1 and user_id = $2`, [id, uid]);
    if (!cur.rowCount) throw new AppError("NOT_FOUND");
    const merged = { ...cur.rows[0], ...input } as ItemInput;
    const v = itemValues(merged);
    const r = await db.query(
      `update app.collection_items set language = $3, variant = $4, condition = $5, quantity = $6, for_trade = $7,
         favorite = $8, notes = $9 where id = $1 and user_id = $2 returning ${ITEM_COLS}`,
      [id, uid, v.language, v.variant, v.condition, v.quantity, v.for_trade, v.favorite, v.notes],
    );
    await db.query("select app.recompute_matches()");
    return r.rows[0];
  });
}

export async function deleteItem(uid: string, id: number) {
  return tx(uid, async (db) => {
    await db.query("delete from app.collection_items where id = $1 and user_id = $2", [id, uid]);
    await db.query("select app.recompute_matches()");
  });
}

export interface WantInput extends CardInput {
  language?: string | null;
  variant?: string | null;
  quantity?: number;
}

export async function addWant(uid: string, input: WantInput): Promise<Want> {
  const s = snap(input);
  const language = oneOf(input.language ?? null, LANGUAGES, true);
  const variant = oneOf(input.variant ?? null, VARIANTS, true);
  const quantity = int(input.quantity ?? 1, 1, 99);
  return tx(uid, async (db) => {
    await requireProfile(db, uid);
    const r = await db.query(
      `insert into app.wants (user_id, card_id, card_name, card_image, set_id, set_name, local_id, rarity, language, variant, quantity)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       on conflict (user_id, card_id, coalesce(language, ''), coalesce(variant, '')) do update set quantity = excluded.quantity
       returning id::int as id, card_id, card_name, card_image, set_id, set_name, local_id, rarity, language, variant, quantity, created_at`,
      [uid, s.card_id, s.card_name, s.card_image, s.set_id, s.set_name, s.local_id, s.rarity, language, variant, quantity],
    );
    await db.query("select app.recompute_matches()");
    return r.rows[0];
  });
}

export async function deleteWant(uid: string, id: number) {
  return tx(uid, async (db) => {
    await db.query("delete from app.wants where id = $1 and user_id = $2", [id, uid]);
    await db.query("select app.recompute_matches()");
  });
}

/** One-shot import of the cards saved locally in this browser (Cartas TCG → "Tenho"/"Quero"). */
export async function importLocal(uid: string, owned: (CardInput & { quantity: number })[], wanted: CardInput[]) {
  const items = owned.slice(0, 500).map((o) => itemValues({ ...o, quantity: Math.min(Math.max(1, o.quantity), 999) }));
  const wants = wanted.slice(0, 500).map(snap);
  return tx(uid, async (db) => {
    await requireProfile(db, uid);
    let added = 0;
    for (const v of items) {
      const r = await db.query(
        `insert into app.collection_items (user_id, card_id, card_name, card_image, set_id, set_name, local_id, rarity, language, variant, quantity)
         values ($1,$2,$3,$4,$5,$6,$7,$8,'pt','normal',$9)
         on conflict (user_id, card_id, language, variant, coalesce(condition, '')) do nothing`,
        [uid, v.card_id, v.card_name, v.card_image, v.set_id, v.set_name, v.local_id, v.rarity, v.quantity],
      );
      added += r.rowCount ?? 0;
    }
    for (const s of wants) {
      const r = await db.query(
        `insert into app.wants (user_id, card_id, card_name, card_image, set_id, set_name, local_id, rarity)
         values ($1,$2,$3,$4,$5,$6,$7,$8) on conflict do nothing`,
        [uid, s.card_id, s.card_name, s.card_image, s.set_id, s.set_name, s.local_id, s.rarity],
      );
      added += r.rowCount ?? 0;
    }
    await db.query("select app.recompute_matches()");
    return added;
  });
}

/* ================================================================== matches */

export async function listMatches(uid: string): Promise<MatchSummary[]> {
  return tx(uid, async (db) => {
    await db.query("select app.recompute_matches()");
    const r = await db.query(
      `select m.id::int as id, m.kind, m.status, m.created_at, m.last_message_at,
              json_build_object('user_id', p.user_id, 'username', p.username, 'display_name', p.display_name,
                'avatar_dex', p.avatar_dex, 'city', case when p.show_location then p.city end,
                'state', case when p.show_location then p.state end) as other,
              (select count(*)::int from app.messages msg where msg.match_id = m.id and msg.sender_id <> $1
                 and msg.created_at > coalesce((select last_read_at from app.match_reads r where r.match_id = m.id and r.user_id = $1), 'epoch')) as unread
       from app.matches m
       join app.profiles p on p.user_id = case when m.user_a = $1 then m.user_b else m.user_a end
       where $1 in (m.user_a, m.user_b) and not app.is_blocked(m.user_a, m.user_b)
       order by (m.status = 'open') desc, coalesce(m.last_message_at, m.created_at) desc
       limit 200`,
      [uid],
    );
    const ids = r.rows.map((x) => x.id);
    const cards = ids.length ? await matchCards(db, uid, ids) : new Map<number, MatchCard[]>();
    return r.rows.map((x) => ({ ...x, cards: cards.get(x.id) ?? [] }));
  });
}

async function matchCards(db: Db, uid: string, ids: number[]) {
  const r = await db.query(
    `select mi.match_id::int as match_id, mi.card_id, o.card_name, o.card_image, o.set_name, o.language, o.variant,
            case when mi.giver = $1 then 'give' else 'receive' end as direction
     from app.match_items mi join app.public_trade_offers o on o.id = mi.collection_item_id
     where mi.match_id = any($2::bigint[])
     order by mi.match_id, direction, o.card_name`,
    [uid, ids],
  );
  const map = new Map<number, MatchCard[]>();
  for (const row of r.rows) {
    const key = Number(row.match_id);
    const list = map.get(key) ?? [];
    if (!list.some((c) => c.card_id === row.card_id && c.direction === row.direction && c.language === row.language)) list.push(row);
    map.set(key, list);
  }
  return map;
}

export async function getMatch(uid: string, id: number) {
  return tx(uid, async (db) => {
    const m = await db.query(
      `select m.id::int as id, m.kind, m.status, m.created_at, m.last_message_at, m.closed_by,
              json_build_object('user_id', p.user_id, 'username', p.username, 'display_name', p.display_name, 'avatar_dex', p.avatar_dex,
                'city', case when p.show_location then p.city end, 'state', case when p.show_location then p.state end) as other,
              app.is_blocked(m.user_a, m.user_b) as blocked
       from app.matches m join app.profiles p on p.user_id = case when m.user_a = $1 then m.user_b else m.user_a end
       where m.id = $2`,
      [uid, id],
    );
    if (!m.rowCount) throw new AppError("NOT_FOUND");
    const cards = (await matchCards(db, uid, [id])).get(id) ?? [];
    return { ...m.rows[0], cards } as MatchSummary & { blocked: boolean; closed_by: string | null };
  });
}

export async function listMessages(uid: string, matchId: number, after?: number): Promise<Message[]> {
  return tx(uid, async (db) => {
    const r = await db.query(
      `select id::int, sender_id, body, card_refs, created_at from app.messages
       where match_id = $1 and ($2::bigint is null or id > $2) order by id asc limit 300`,
      [matchId, after ?? null],
    );
    await db.query(
      `insert into app.match_reads (match_id, user_id, last_read_at) select $1, $2, now()
       where exists (select 1 from app.matches m where m.id = $1 and $2 in (m.user_a, m.user_b))
       on conflict (match_id, user_id) do update set last_read_at = now()`,
      [matchId, uid],
    );
    await db.query("update app.notifications set read_at = now() where user_id = $1 and match_id = $2 and read_at is null", [uid, matchId]);
    return r.rows;
  });
}

export async function sendMessage(uid: string, matchId: number, body: string, cardRefs: string[] = []): Promise<Message> {
  const text = str(body, 2000, { min: 1, required: true })!;
  const refs = cardRefs.slice(0, 6).map(cardId);
  return tx(uid, async (db) => {
    const ok = await db.query(
      "select 1 from app.matches m where m.id = $1 and m.status = 'open' and $2 in (m.user_a, m.user_b) and not app.is_blocked(m.user_a, m.user_b)",
      [matchId, uid],
    );
    if (!ok.rowCount) throw new AppError("MATCH_CLOSED");
    const r = await db.query(
      "insert into app.messages (match_id, sender_id, body, card_refs) values ($1,$2,$3,$4) returning id::int, sender_id, body, card_refs, created_at",
      [matchId, uid, text, refs],
    );
    return r.rows[0];
  });
}

export const closeMatch = (uid: string, id: number) => tx(uid, (db) => db.query("select app.close_match($1)", [id]).then(() => undefined));
export const blockUser = (uid: string, other: string) => tx(uid, (db) => db.query("select app.block_user($1)", [other]).then(() => undefined));

export async function report(uid: string, targetType: string, targetId: string, reason: string, details?: string | null) {
  const type = ["user", "message", "comment", "deck", "collection"].includes(targetType) ? targetType : null;
  const why = ["spam", "abuse", "fraud", "inappropriate", "other"].includes(reason) ? reason : null;
  if (!type || !why) throw new AppError("INVALID_INPUT");
  return tx(uid, (db) =>
    db.query(
      `insert into app.reports (reporter, target_type, target_id, reason, details) values ($1,$2,$3,$4,$5)
       on conflict (reporter, target_type, target_id) do nothing`,
      [uid, type, str(targetId, 80, { required: true }), why, str(details, 500)],
    ).then(() => undefined),
  );
}

/* ================================================================== notifications & badges */

export async function badges(uid: string) {
  return tx(uid, async (db) => {
    const r = await db.query(
      `select
         (select count(*)::int from app.notifications where user_id = $1 and read_at is null and type <> 'message') as notifications,
         (select count(*)::int from app.messages msg join app.matches m on m.id = msg.match_id
            where $1 in (m.user_a, m.user_b) and msg.sender_id <> $1
              and msg.created_at > coalesce((select last_read_at from app.match_reads r where r.match_id = m.id and r.user_id = $1), 'epoch')) as messages,
         (select count(*)::int from app.matches m where $1 in (m.user_a, m.user_b) and m.status = 'open') as matches`,
      [uid],
    );
    return r.rows[0] as { notifications: number; messages: number; matches: number };
  });
}

export async function listNotifications(uid: string): Promise<NotificationRow[]> {
  return tx(uid, async (db) => {
    const r = await db.query(
      `select n.id::int, n.type, n.created_at, n.read_at is not null as read, n.match_id::int,
              case when a.user_id is null then null else json_build_object('username', a.username, 'display_name', a.display_name, 'avatar_dex', a.avatar_dex) end as actor,
              case when d.id is null then null else json_build_object('id', d.id, 'title', d.title) end as deck
       from app.notifications n
       left join app.profiles a on a.user_id = n.actor_id
       left join app.decks d on d.id = n.deck_id
       where n.user_id = $1 order by n.created_at desc limit 40`,
      [uid],
    );
    return r.rows;
  });
}

export const markNotificationsRead = (uid: string) =>
  tx(uid, (db) => db.query("update app.notifications set read_at = now() where user_id = $1 and read_at is null and type <> 'message'", [uid]).then(() => undefined));
