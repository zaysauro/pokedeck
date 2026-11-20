-- =====================================================================================
-- PokéDeck — Social & Trading (Neon Postgres)
--
-- Security model
--   * The app connects as the database owner, but every user request runs inside a
--     transaction that does:   SET LOCAL ROLE pokedeck_app;
--                              SELECT set_config('app.user_id', <session user id>, true);
--   * pokedeck_app has no BYPASSRLS, so the Row Level Security policies below are the
--     last line of defense even if application code has a bug.
--   * Engagement counters are never stored in user-writable columns: they are COUNT()s
--     over rows that each user can only insert once (composite primary keys).
--   * Notifications and matches are only created by SECURITY DEFINER functions/triggers.
--
-- Module separation
--   * Trading (collection_items.for_trade, wants, matches, messages) and the public social
--     layer (follows, decks, likes, comments) share only the profile. Publishing a deck or a
--     public collection never makes a card tradeable; messages require an open match.
-- =====================================================================================

create extension if not exists pgcrypto;
create extension if not exists citext;

create schema if not exists app;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'pokedeck_app') then
    create role pokedeck_app nologin;
  end if;
end $$;
grant pokedeck_app to current_user;

-- Current user id for RLS (null when anonymous)
create or replace function app.uid() returns text
language sql stable as $$ select nullif(current_setting('app.user_id', true), '') $$;

-- ------------------------------------------------------------------ profiles
create table if not exists app.profiles (
  user_id text primary key,
  username citext not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text check (char_length(display_name) <= 40),
  avatar_dex int not null default 25 check (avatar_dex between 1 and 1025),
  bio text check (char_length(bio) <= 280),
  city text check (char_length(city) <= 60),
  state text check (char_length(state) <= 2),
  collection_public boolean not null default true,
  show_location boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ collection (trading module + showcase)
create table if not exists app.collection_items (
  id bigint generated always as identity primary key,
  user_id text not null references app.profiles(user_id) on delete cascade,
  card_id text not null check (char_length(card_id) between 2 and 40),
  language text not null default 'pt' check (language in ('pt','en','es','fr','de','it','ja','ko','zh')),
  variant text not null default 'normal' check (variant in ('normal','reverse','holo','firstEdition','wPromo')),
  condition text check (condition in ('NM','LP','MP','HP','DMG')),
  quantity int not null check (quantity between 1 and 999),
  for_trade int not null default 0 check (for_trade >= 0),
  favorite boolean not null default false,
  notes text check (char_length(notes) <= 280),
  -- display snapshot (TCGdex data, not authoritative)
  card_name text not null check (char_length(card_name) <= 80),
  card_image text check (char_length(card_image) <= 200),
  set_id text check (char_length(set_id) <= 40),
  set_name text check (char_length(set_name) <= 80),
  local_id text check (char_length(local_id) <= 20),
  rarity text check (char_length(rarity) <= 60),
  card_type text check (char_length(card_type) <= 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint for_trade_le_quantity check (for_trade <= quantity)
);
create unique index if not exists collection_items_unique
  on app.collection_items (user_id, card_id, language, variant, coalesce(condition, ''));
create index if not exists collection_items_card on app.collection_items (card_id) where for_trade > 0;
create index if not exists collection_items_user on app.collection_items (user_id, updated_at desc);

create table if not exists app.wants (
  id bigint generated always as identity primary key,
  user_id text not null references app.profiles(user_id) on delete cascade,
  card_id text not null check (char_length(card_id) between 2 and 40),
  language text check (language in ('pt','en','es','fr','de','it','ja','ko','zh')), -- null = any
  variant text check (variant in ('normal','reverse','holo','firstEdition','wPromo')), -- null = any
  quantity int not null default 1 check (quantity between 1 and 99),
  card_name text not null check (char_length(card_name) <= 80),
  card_image text check (char_length(card_image) <= 200),
  set_id text check (char_length(set_id) <= 40),
  set_name text check (char_length(set_name) <= 80),
  local_id text check (char_length(local_id) <= 20),
  rarity text check (char_length(rarity) <= 60),
  created_at timestamptz not null default now()
);
create unique index if not exists wants_unique on app.wants (user_id, card_id, coalesce(language, ''), coalesce(variant, ''));
create index if not exists wants_card on app.wants (card_id);

-- ------------------------------------------------------------------ blocks & reports
create table if not exists app.blocks (
  blocker text not null references app.profiles(user_id) on delete cascade,
  blocked text not null references app.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);

create table if not exists app.reports (
  id bigint generated always as identity primary key,
  reporter text not null references app.profiles(user_id) on delete cascade,
  target_type text not null check (target_type in ('user','message','comment','deck','collection')),
  target_id text not null check (char_length(target_id) <= 80),
  reason text not null check (reason in ('spam','abuse','fraud','inappropriate','other')),
  details text check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open','reviewed','dismissed')),
  created_at timestamptz not null default now(),
  unique (reporter, target_type, target_id)
);

-- ------------------------------------------------------------------ matches (created ONLY by app.recompute_matches)
create table if not exists app.matches (
  id bigint generated always as identity primary key,
  user_a text not null references app.profiles(user_id) on delete cascade,
  user_b text not null references app.profiles(user_id) on delete cascade,
  kind text not null check (kind in ('mutual','one_way')),
  status text not null default 'open' check (status in ('open','closed','expired')),
  closed_by text,
  closed_at timestamptz,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_a < user_b)
);
create unique index if not exists matches_open_pair on app.matches (user_a, user_b) where status = 'open';
create index if not exists matches_user_a on app.matches (user_a, updated_at desc);
create index if not exists matches_user_b on app.matches (user_b, updated_at desc);

create table if not exists app.match_items (
  match_id bigint not null references app.matches(id) on delete cascade,
  giver text not null,          -- owns the card (offered for trade)
  receiver text not null,       -- wants the card
  collection_item_id bigint not null references app.collection_items(id) on delete cascade,
  want_id bigint not null references app.wants(id) on delete cascade,
  card_id text not null,
  primary key (match_id, collection_item_id, want_id)
);

create table if not exists app.messages (
  id bigint generated always as identity primary key,
  match_id bigint not null references app.matches(id) on delete cascade,
  sender_id text not null references app.profiles(user_id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  card_refs text[] not null default '{}' check (cardinality(card_refs) <= 6),
  created_at timestamptz not null default now()
);
create index if not exists messages_match on app.messages (match_id, created_at);

create table if not exists app.match_reads (
  match_id bigint not null references app.matches(id) on delete cascade,
  user_id text not null,
  last_read_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

-- ------------------------------------------------------------------ social: follows, decks, engagement
create table if not exists app.follows (
  follower text not null references app.profiles(user_id) on delete cascade,
  followee text not null references app.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower, followee),
  check (follower <> followee)
);
create index if not exists follows_followee on app.follows (followee);

create table if not exists app.decks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references app.profiles(user_id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 60),
  description text check (char_length(description) <= 500),
  strategy text check (char_length(strategy) <= 4000),
  format text not null default 'standard' check (format in ('standard','expanded','unlimited','theme')),
  main_card_id text check (char_length(main_card_id) <= 40),
  main_card_name text check (char_length(main_card_name) <= 80),
  cover_image text check (char_length(cover_image) <= 200),
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists decks_published on app.decks (published_at desc) where status = 'published';
create index if not exists decks_user on app.decks (user_id, updated_at desc);

create table if not exists app.deck_cards (
  deck_id uuid not null references app.decks(id) on delete cascade,
  card_id text not null check (char_length(card_id) <= 40),
  quantity int not null check (quantity between 1 and 60),
  card_name text not null check (char_length(card_name) <= 80),
  card_image text check (char_length(card_image) <= 200),
  category text check (char_length(category) <= 30),
  primary key (deck_id, card_id)
);

create table if not exists app.deck_likes (
  deck_id uuid not null references app.decks(id) on delete cascade,
  user_id text not null references app.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (deck_id, user_id)
);
create index if not exists deck_likes_recent on app.deck_likes (created_at desc);

create table if not exists app.deck_saves (
  deck_id uuid not null references app.decks(id) on delete cascade,
  user_id text not null references app.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (deck_id, user_id)
);

create table if not exists app.collection_likes (
  owner_id text not null references app.profiles(user_id) on delete cascade,
  user_id text not null references app.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, user_id),
  check (owner_id <> user_id)
);

create table if not exists app.comments (
  id bigint generated always as identity primary key,
  deck_id uuid not null references app.decks(id) on delete cascade,
  user_id text not null references app.profiles(user_id) on delete cascade,
  parent_id bigint references app.comments(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
create index if not exists comments_deck on app.comments (deck_id, created_at);

create table if not exists app.notifications (
  id bigint generated always as identity primary key,
  user_id text not null references app.profiles(user_id) on delete cascade,
  actor_id text references app.profiles(user_id) on delete cascade,
  type text not null check (type in ('follow','deck_like','deck_comment','comment_reply','collection_like','match','message')),
  deck_id uuid references app.decks(id) on delete cascade,
  comment_id bigint references app.comments(id) on delete cascade,
  match_id bigint references app.matches(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists notifications_user on app.notifications (user_id, created_at desc);
-- one notification per (recipient, actor, kind, target): like/unlike or follow/unfollow loops cannot spam
create unique index if not exists notifications_dedupe on app.notifications
  (user_id, coalesce(actor_id, ''), type, coalesce(deck_id::text, ''), coalesce(match_id, 0))
  where type in ('follow','deck_like','collection_like','match');

-- ------------------------------------------------------------------ helpers
create or replace function app.is_blocked(a text, b text) returns boolean
language sql stable security definer set search_path = app as $$
  select exists (select 1 from app.blocks where (blocker = a and blocked = b) or (blocker = b and blocked = a))
$$;

create or replace function app.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists t_profiles_touch on app.profiles;
create trigger t_profiles_touch before update on app.profiles for each row execute function app.touch_updated_at();
drop trigger if exists t_items_touch on app.collection_items;
create trigger t_items_touch before update on app.collection_items for each row execute function app.touch_updated_at();
drop trigger if exists t_decks_touch on app.decks;
create trigger t_decks_touch before update on app.decks for each row execute function app.touch_updated_at();

-- Rate limits (anti-spam). Raise a recognizable error the app turns into a friendly message.
create or replace function app.rate_limit() returns trigger
language plpgsql security definer set search_path = app as $$
declare n int; who text; lim int; win interval;
begin
  if tg_table_name = 'messages' then
    who := new.sender_id; lim := 20; win := interval '1 minute';
    select count(*) into n from app.messages where sender_id = who and created_at > now() - win;
  elsif tg_table_name = 'comments' then
    who := new.user_id; lim := 8; win := interval '1 minute';
    select count(*) into n from app.comments where user_id = who and created_at > now() - win;
  elsif tg_table_name = 'reports' then
    who := new.reporter; lim := 20; win := interval '1 day';
    select count(*) into n from app.reports where reporter = who and created_at > now() - win;
  elsif tg_table_name = 'decks' then
    who := new.user_id; lim := 30; win := interval '1 day';
    select count(*) into n from app.decks where user_id = who and created_at > now() - win;
  else
    return new;
  end if;
  if n >= lim then raise exception 'RATE_LIMIT' using errcode = 'P0001'; end if;
  return new;
end $$;

drop trigger if exists t_messages_rate on app.messages;
create trigger t_messages_rate before insert on app.messages for each row execute function app.rate_limit();
drop trigger if exists t_comments_rate on app.comments;
create trigger t_comments_rate before insert on app.comments for each row execute function app.rate_limit();
drop trigger if exists t_reports_rate on app.reports;
create trigger t_reports_rate before insert on app.reports for each row execute function app.rate_limit();
drop trigger if exists t_decks_rate on app.decks;
create trigger t_decks_rate before insert on app.decks for each row execute function app.rate_limit();

-- Deck integrity: total ≤ 60 cards; published decks need at least one card
create or replace function app.deck_cards_guard() returns trigger
language plpgsql security definer set search_path = app as $$
declare total int;
begin
  select coalesce(sum(quantity), 0) into total from app.deck_cards where deck_id = new.deck_id;
  if total > 60 then raise exception 'DECK_TOO_LARGE' using errcode = 'P0001'; end if;
  return new;
end $$;
drop trigger if exists t_deck_cards_guard on app.deck_cards;
create constraint trigger t_deck_cards_guard after insert or update on app.deck_cards
  deferrable initially deferred for each row execute function app.deck_cards_guard();

create or replace function app.deck_publish_guard() returns trigger
language plpgsql security definer set search_path = app as $$
begin
  if new.status = 'published' then
    if not exists (select 1 from app.deck_cards where deck_id = new.id) then
      raise exception 'DECK_EMPTY' using errcode = 'P0001';
    end if;
    if old.status is distinct from 'published' or new.published_at is null then
      new.published_at := coalesce(old.published_at, now());
    end if;
  else
    new.published_at := null;
  end if;
  -- published_at can never be forged to game "new" rankings
  if tg_op = 'UPDATE' and old.published_at is not null and new.status = 'published' then
    new.published_at := old.published_at;
  end if;
  return new;
end $$;
drop trigger if exists t_deck_publish on app.decks;
create trigger t_deck_publish before insert or update of status, published_at on app.decks
  for each row execute function app.deck_publish_guard();

-- Comments: replies only one level deep and on the same deck; no comments on unpublished decks
create or replace function app.comment_guard() returns trigger
language plpgsql security definer set search_path = app as $$
declare p record;
begin
  if not exists (select 1 from app.decks where id = new.deck_id and status = 'published') then
    raise exception 'DECK_NOT_PUBLISHED' using errcode = 'P0001';
  end if;
  if new.parent_id is not null then
    select deck_id, parent_id into p from app.comments where id = new.parent_id;
    if p.deck_id is distinct from new.deck_id or p.parent_id is not null then
      raise exception 'INVALID_PARENT' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists t_comment_guard on app.comments;
create trigger t_comment_guard before insert on app.comments for each row execute function app.comment_guard();

-- ------------------------------------------------------------------ notifications (triggers only)
create or replace function app.notify(recipient text, actor text, kind text, deck uuid, cmt bigint, mtc bigint)
returns void language plpgsql security definer set search_path = app as $$
begin
  if recipient is null or recipient = actor then return; end if;
  if actor is not null and app.is_blocked(recipient, actor) then return; end if;
  insert into app.notifications (user_id, actor_id, type, deck_id, comment_id, match_id)
  values (recipient, actor, kind, deck, cmt, mtc)
  on conflict do nothing;
end $$;

create or replace function app.on_follow() returns trigger language plpgsql security definer set search_path = app as $$
begin perform app.notify(new.followee, new.follower, 'follow', null, null, null); return new; end $$;
drop trigger if exists t_on_follow on app.follows;
create trigger t_on_follow after insert on app.follows for each row execute function app.on_follow();

create or replace function app.on_deck_like() returns trigger language plpgsql security definer set search_path = app as $$
begin perform app.notify((select user_id from app.decks where id = new.deck_id), new.user_id, 'deck_like', new.deck_id, null, null); return new; end $$;
drop trigger if exists t_on_deck_like on app.deck_likes;
create trigger t_on_deck_like after insert on app.deck_likes for each row execute function app.on_deck_like();

create or replace function app.on_collection_like() returns trigger language plpgsql security definer set search_path = app as $$
begin perform app.notify(new.owner_id, new.user_id, 'collection_like', null, null, null); return new; end $$;
drop trigger if exists t_on_collection_like on app.collection_likes;
create trigger t_on_collection_like after insert on app.collection_likes for each row execute function app.on_collection_like();

create or replace function app.on_comment() returns trigger language plpgsql security definer set search_path = app as $$
begin
  if new.parent_id is not null then
    perform app.notify((select user_id from app.comments where id = new.parent_id), new.user_id, 'comment_reply', new.deck_id, new.id, null);
  end if;
  perform app.notify((select user_id from app.decks where id = new.deck_id), new.user_id, 'deck_comment', new.deck_id, new.id, null);
  return new;
end $$;
drop trigger if exists t_on_comment on app.comments;
create trigger t_on_comment after insert on app.comments for each row execute function app.on_comment();

-- Messages: keep match activity fresh and notify the other participant (one unread notification per match)
create or replace function app.on_message() returns trigger language plpgsql security definer set search_path = app as $$
declare m record; other text;
begin
  update app.matches set last_message_at = new.created_at, updated_at = now() where id = new.match_id returning * into m;
  other := case when m.user_a = new.sender_id then m.user_b else m.user_a end;
  insert into app.match_reads (match_id, user_id, last_read_at) values (new.match_id, new.sender_id, now())
    on conflict (match_id, user_id) do update set last_read_at = excluded.last_read_at;
  if not exists (select 1 from app.notifications where user_id = other and match_id = new.match_id and type = 'message' and read_at is null) then
    perform app.notify(other, new.sender_id, 'message', null, null, new.match_id);
  end if;
  return new;
end $$;
drop trigger if exists t_on_message on app.messages;
create trigger t_on_message after insert on app.messages for each row execute function app.on_message();

-- ------------------------------------------------------------------ matchmaking engine
-- Recomputes every opportunity involving the CURRENT user (both directions) from explicit data only:
--   offer = collection_items.for_trade > 0      want = wants row
--   same TCGdex card id; language/variant must match unless the want accepts "any".
-- Blocked pairs never match. Matches whose cards disappear expire (messages stop).
create or replace function app.recompute_matches() returns int
language plpgsql security definer set search_path = app as $$
declare me text := app.uid(); pair record; mid bigint; created int := 0;
begin
  if me is null then raise exception 'AUTH_REQUIRED' using errcode = 'P0001'; end if;

  create temporary table if not exists _cand (giver text, receiver text, item_id bigint, want_id bigint, card_id text) on commit drop;
  truncate _cand;

  insert into _cand
  select ci.user_id, w.user_id, ci.id, w.id, ci.card_id
  from app.collection_items ci
  join app.wants w on w.card_id = ci.card_id
   and (w.language is null or w.language = ci.language)
   and (w.variant is null or w.variant = ci.variant)
  where ci.for_trade > 0
    and ci.user_id <> w.user_id
    and (ci.user_id = me or w.user_id = me)
    and not app.is_blocked(ci.user_id, w.user_id);

  for pair in
    select least(giver, receiver) as a, greatest(giver, receiver) as b,
           case when count(distinct giver) = 2 then 'mutual' else 'one_way' end as kind
    from _cand group by 1, 2
  loop
    select id into mid from app.matches where user_a = pair.a and user_b = pair.b and status = 'open';
    if mid is null then
      insert into app.matches (user_a, user_b, kind) values (pair.a, pair.b, pair.kind) returning id into mid;
      created := created + 1;
      perform app.notify(pair.a, pair.b, 'match', null, null, mid);
      perform app.notify(pair.b, pair.a, 'match', null, null, mid);
    else
      update app.matches set kind = pair.kind, updated_at = now() where id = mid and kind <> pair.kind;
    end if;
    delete from app.match_items where match_id = mid;
    insert into app.match_items (match_id, giver, receiver, collection_item_id, want_id, card_id)
      select mid, giver, receiver, item_id, want_id, card_id from _cand
      where least(giver, receiver) = pair.a and greatest(giver, receiver) = pair.b
      on conflict do nothing;
  end loop;

  -- open matches of mine that no longer have any opportunity → expire
  update app.matches m set status = 'expired', updated_at = now()
  where m.status = 'open' and (m.user_a = me or m.user_b = me)
    and not exists (select 1 from _cand c where least(c.giver, c.receiver) = m.user_a and greatest(c.giver, c.receiver) = m.user_b);
  delete from app.match_items mi using app.matches m
  where mi.match_id = m.id and m.status = 'expired' and (m.user_a = me or m.user_b = me);

  return created;
end $$;

-- Either participant can close a match; blocking closes every open match with that user.
create or replace function app.close_match(p_match bigint) returns void
language plpgsql security definer set search_path = app as $$
declare me text := app.uid();
begin
  update app.matches set status = 'closed', closed_by = me, closed_at = now(), updated_at = now()
  where id = p_match and status = 'open' and me in (user_a, user_b);
  if not found then raise exception 'NOT_ALLOWED' using errcode = 'P0001'; end if;
end $$;

create or replace function app.block_user(p_user text) returns void
language plpgsql security definer set search_path = app as $$
declare me text := app.uid();
begin
  if me is null or p_user = me then raise exception 'NOT_ALLOWED' using errcode = 'P0001'; end if;
  insert into app.blocks (blocker, blocked) values (me, p_user) on conflict do nothing;
  update app.matches set status = 'closed', closed_by = me, closed_at = now(), updated_at = now()
  where status = 'open' and user_a = least(me, p_user) and user_b = greatest(me, p_user);
  delete from app.follows where (follower = me and followee = p_user) or (follower = p_user and followee = me);
end $$;

-- ------------------------------------------------------------------ public read models (views run as owner; they filter themselves)
create or replace view app.public_profiles as
  select p.user_id, p.username, p.display_name, p.avatar_dex, p.bio,
         case when p.show_location then p.city end as city,
         case when p.show_location then p.state end as state,
         p.collection_public, p.created_at,
         (select count(*) from app.follows f where f.followee = p.user_id) as followers,
         (select count(*) from app.follows f where f.follower = p.user_id) as following,
         (select coalesce(sum(quantity), 0) from app.collection_items c where c.user_id = p.user_id) as cards,
         (select count(*) from app.decks d where d.user_id = p.user_id and d.status = 'published') as decks,
         (select count(*) from app.collection_likes l where l.owner_id = p.user_id) as collection_likes
  from app.profiles p;

-- Showcase: only public collections, never personal notes
create or replace view app.public_collection as
  select c.id, c.user_id, c.card_id, c.language, c.variant, c.condition, c.quantity, c.favorite,
         c.card_name, c.card_image, c.set_id, c.set_name, c.local_id, c.rarity, c.card_type, c.created_at, c.updated_at
  from app.collection_items c join app.profiles p on p.user_id = c.user_id
  where p.collection_public;

-- Trade lists are public by design (explicitly marked by the user), without notes
create or replace view app.public_trade_offers as
  select c.id, c.user_id, c.card_id, c.language, c.variant, c.condition, c.for_trade,
         c.card_name, c.card_image, c.set_id, c.set_name, c.local_id, c.rarity, c.updated_at
  from app.collection_items c where c.for_trade > 0;

create or replace view app.deck_stats as
  select d.id as deck_id,
         (select count(*) from app.deck_likes l where l.deck_id = d.id) as likes,
         (select count(*) from app.deck_saves s where s.deck_id = d.id) as saves,
         (select count(*) from app.comments c where c.deck_id = d.id and c.deleted_at is null) as comments,
         (select count(*) from app.deck_likes l where l.deck_id = d.id and l.created_at > now() - interval '7 days') as likes_7d,
         (select count(*) from app.deck_likes l where l.deck_id = d.id and l.created_at > now() - interval '30 days') as likes_30d,
         (select count(*) from app.comments c where c.deck_id = d.id and c.deleted_at is null and c.created_at > now() - interval '7 days') as comments_7d,
         (select coalesce(sum(quantity), 0) from app.deck_cards dc where dc.deck_id = d.id) as card_count
  from app.decks d
  where d.status = 'published' or d.user_id = app.uid();

-- Trending: engagement velocity with time decay (gravity), so old decks cannot dominate forever.
create or replace view app.deck_trending as
  select d.id as deck_id,
         ((s.likes_7d * 3 + s.comments_7d * 4 + s.saves * 1 + 1)::float
           / power(extract(epoch from (now() - d.published_at)) / 3600 + 2, 1.5)) as score
  from app.decks d join app.deck_stats s on s.deck_id = d.id
  where d.status = 'published';

-- ------------------------------------------------------------------ privileges + RLS
grant usage on schema app to pokedeck_app;
grant select on all tables in schema app to pokedeck_app;
-- full write access only where the user owns every column's meaning
grant insert, update, delete on app.profiles, app.collection_items, app.wants, app.match_reads, app.deck_cards to pokedeck_app;
grant insert, delete on app.blocks to pokedeck_app;
grant insert (blocker, blocked) on app.blocks to pokedeck_app;
-- engagement rows: only the identifying columns are writable (timestamps/status cannot be forged)
grant insert (follower, followee), delete on app.follows to pokedeck_app;
grant insert (deck_id, user_id), delete on app.deck_likes to pokedeck_app;
grant insert (deck_id, user_id), delete on app.deck_saves to pokedeck_app;
grant insert (owner_id, user_id), delete on app.collection_likes to pokedeck_app;
grant insert (deck_id, user_id, parent_id, body), delete on app.comments to pokedeck_app;
grant update (body, edited_at, deleted_at) on app.comments to pokedeck_app;
grant insert (match_id, sender_id, body, card_refs) on app.messages to pokedeck_app;
grant insert (reporter, target_type, target_id, reason, details) on app.reports to pokedeck_app;
-- decks: everything except ownership and creation time
grant insert (user_id, title, description, strategy, format, main_card_id, main_card_name, cover_image, status), delete on app.decks to pokedeck_app;
grant update (title, description, strategy, format, main_card_id, main_card_name, cover_image, status) on app.decks to pokedeck_app;
grant update (read_at) on app.notifications to pokedeck_app;
revoke insert, delete on app.notifications from pokedeck_app;
revoke insert, update, delete on app.matches, app.match_items from pokedeck_app;
grant execute on function app.uid(), app.recompute_matches(), app.close_match(bigint), app.block_user(text), app.is_blocked(text, text) to pokedeck_app;

alter table app.profiles enable row level security;
alter table app.collection_items enable row level security;
alter table app.wants enable row level security;
alter table app.blocks enable row level security;
alter table app.reports enable row level security;
alter table app.matches enable row level security;
alter table app.match_items enable row level security;
alter table app.messages enable row level security;
alter table app.match_reads enable row level security;
alter table app.follows enable row level security;
alter table app.decks enable row level security;
alter table app.deck_cards enable row level security;
alter table app.deck_likes enable row level security;
alter table app.deck_saves enable row level security;
alter table app.collection_likes enable row level security;
alter table app.comments enable row level security;
alter table app.notifications enable row level security;

-- policies are recreated idempotently
do $$ declare r record; begin
  for r in select schemaname, tablename, policyname from pg_policies where schemaname = 'app' loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- profiles: public read (no private data lives here); write only your own row
create policy profiles_read on app.profiles for select to pokedeck_app using (true);
create policy profiles_insert on app.profiles for insert to pokedeck_app with check (user_id = app.uid());
create policy profiles_update on app.profiles for update to pokedeck_app using (user_id = app.uid()) with check (user_id = app.uid());

-- collection & wants: full rows only for the owner (public reads go through the views above)
create policy items_owner on app.collection_items for all to pokedeck_app using (user_id = app.uid()) with check (user_id = app.uid());
create policy wants_read on app.wants for select to pokedeck_app using (true);
create policy wants_write on app.wants for insert to pokedeck_app with check (user_id = app.uid());
create policy wants_update on app.wants for update to pokedeck_app using (user_id = app.uid()) with check (user_id = app.uid());
create policy wants_delete on app.wants for delete to pokedeck_app using (user_id = app.uid());

create policy blocks_owner on app.blocks for all to pokedeck_app using (blocker = app.uid()) with check (blocker = app.uid());
create policy reports_insert on app.reports for insert to pokedeck_app with check (reporter = app.uid());
create policy reports_read on app.reports for select to pokedeck_app using (reporter = app.uid());

-- matches: only participants can see them; no direct writes (functions only)
create policy matches_read on app.matches for select to pokedeck_app using (app.uid() in (user_a, user_b));
create policy match_items_read on app.match_items for select to pokedeck_app
  using (exists (select 1 from app.matches m where m.id = match_id and app.uid() in (m.user_a, m.user_b)));

-- messages: participants read; send only in an OPEN match, as yourself, and never to someone blocked
create policy messages_read on app.messages for select to pokedeck_app
  using (exists (select 1 from app.matches m where m.id = match_id and app.uid() in (m.user_a, m.user_b)));
create policy messages_send on app.messages for insert to pokedeck_app
  with check (
    sender_id = app.uid()
    and exists (
      select 1 from app.matches m
      where m.id = match_id and m.status = 'open' and app.uid() in (m.user_a, m.user_b)
        and not app.is_blocked(m.user_a, m.user_b)
    )
  );
create policy match_reads_owner on app.match_reads for all to pokedeck_app
  using (user_id = app.uid())
  with check (user_id = app.uid() and exists (select 1 from app.matches m where m.id = match_id and app.uid() in (m.user_a, m.user_b)));

-- social
create policy follows_read on app.follows for select to pokedeck_app using (true);
create policy follows_insert on app.follows for insert to pokedeck_app
  with check (follower = app.uid() and not app.is_blocked(follower, followee));
create policy follows_delete on app.follows for delete to pokedeck_app using (follower = app.uid());

create policy decks_read on app.decks for select to pokedeck_app using (status = 'published' or user_id = app.uid());
create policy decks_insert on app.decks for insert to pokedeck_app with check (user_id = app.uid());
create policy decks_update on app.decks for update to pokedeck_app using (user_id = app.uid()) with check (user_id = app.uid());
create policy decks_delete on app.decks for delete to pokedeck_app using (user_id = app.uid());

create policy deck_cards_read on app.deck_cards for select to pokedeck_app
  using (exists (select 1 from app.decks d where d.id = deck_id and (d.status = 'published' or d.user_id = app.uid())));
create policy deck_cards_write on app.deck_cards for all to pokedeck_app
  using (exists (select 1 from app.decks d where d.id = deck_id and d.user_id = app.uid()))
  with check (exists (select 1 from app.decks d where d.id = deck_id and d.user_id = app.uid()));

create policy deck_likes_read on app.deck_likes for select to pokedeck_app using (true);
create policy deck_likes_insert on app.deck_likes for insert to pokedeck_app
  with check (user_id = app.uid() and exists (select 1 from app.decks d where d.id = deck_id and d.status = 'published'));
create policy deck_likes_delete on app.deck_likes for delete to pokedeck_app using (user_id = app.uid());

create policy deck_saves_owner on app.deck_saves for all to pokedeck_app using (user_id = app.uid())
  with check (user_id = app.uid() and exists (select 1 from app.decks d where d.id = deck_id and (d.status = 'published' or d.user_id = app.uid())));

create policy collection_likes_read on app.collection_likes for select to pokedeck_app using (true);
create policy collection_likes_insert on app.collection_likes for insert to pokedeck_app
  with check (user_id = app.uid() and exists (select 1 from app.profiles p where p.user_id = owner_id and p.collection_public));
create policy collection_likes_delete on app.collection_likes for delete to pokedeck_app using (user_id = app.uid());

create policy comments_read on app.comments for select to pokedeck_app
  using (exists (select 1 from app.decks d where d.id = deck_id and (d.status = 'published' or d.user_id = app.uid())));
create policy comments_insert on app.comments for insert to pokedeck_app with check (user_id = app.uid());
create policy comments_update on app.comments for update to pokedeck_app using (user_id = app.uid()) with check (user_id = app.uid());
create policy comments_delete on app.comments for delete to pokedeck_app using (user_id = app.uid());

create policy notifications_read on app.notifications for select to pokedeck_app using (user_id = app.uid());
create policy notifications_mark on app.notifications for update to pokedeck_app using (user_id = app.uid()) with check (user_id = app.uid());

-- views are read-only for the app role
grant select on app.public_profiles, app.public_collection, app.public_trade_offers, app.deck_stats, app.deck_trending to pokedeck_app;
