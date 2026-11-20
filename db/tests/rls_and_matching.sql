-- Integration test for RLS, matchmaking and social integrity.
-- Run against a THROWAWAY database after applying the migrations:
--   psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f db/tests/rls_and_matching.sql
-- Every block impersonates a user exactly like the app does (SET LOCAL ROLE + app.user_id).

\set QUIET on
create or replace function pg_temp.expect_fail(q text, label text) returns void language plpgsql as $$
begin
  begin
    execute q;
  exception when others then
    raise notice 'ok   %  (%)', label, sqlerrm;
    return;
  end;
  raise exception 'FAIL % — statement should have been rejected', label;
end $$;

create or replace function pg_temp.check(cond boolean, label text) returns void language plpgsql as $$
begin
  if not cond then raise exception 'FAIL %', label; end if;
  raise notice 'ok   %', label;
end $$;

-- clean slate (owner context)
truncate app.profiles cascade;

-- ---------------------------------------------------------------- profiles
begin; set local role pokedeck_app; select set_config('app.user_id', 'u_bruno', true);
insert into app.profiles (user_id, username) values ('u_bruno', 'bruno');
select pg_temp.expect_fail($$insert into app.profiles (user_id, username) values ('u_mel', 'impostor')$$, 'cannot create a profile for someone else');
commit;
begin; set local role pokedeck_app; select set_config('app.user_id', 'u_mel', true);
insert into app.profiles (user_id, username) values ('u_mel', 'melissa');
update app.profiles set bio = 'hacked' where user_id = 'u_bruno'; -- RLS: silently affects 0 rows
commit;
-- the update above affects 0 rows silently under RLS; verify bio is untouched
select pg_temp.check((select bio from app.profiles where user_id = 'u_bruno') is null, 'bio of bruno unchanged');
begin; set local role pokedeck_app; select set_config('app.user_id', 'u_carol', true);
select pg_temp.expect_fail($$insert into app.profiles (user_id, username) values ('u_carol', 'Bad Name!')$$, 'username format enforced');
insert into app.profiles (user_id, username) values ('u_carol', 'carol');
commit;

-- ---------------------------------------------------------------- collections & wants
begin; set local role pokedeck_app; select set_config('app.user_id', 'u_bruno', true);
insert into app.collection_items (user_id, card_id, quantity, for_trade, card_name, notes) values ('u_bruno', 'sv03.5-199', 2, 1, 'Charizard ex', 'segredo do bruno');
insert into app.collection_items (user_id, card_id, quantity, for_trade, card_name) values ('u_bruno', 'sv03.5-025', 4, 0, 'Pikachu');
insert into app.wants (user_id, card_id, card_name) values ('u_bruno', 'sv03.5-150', 'Mewtwo ex');
select pg_temp.expect_fail($$insert into app.collection_items (user_id, card_id, quantity, for_trade, card_name) values ('u_bruno', 'x-1', 1, 2, 'X')$$, 'for_trade cannot exceed quantity');
select pg_temp.expect_fail($$insert into app.collection_items (user_id, card_id, quantity, card_name) values ('u_mel', 'x-1', 1, 'X')$$, 'cannot add cards to another collection');
commit;

begin; set local role pokedeck_app; select set_config('app.user_id', 'u_mel', true);
insert into app.collection_items (user_id, card_id, quantity, for_trade, card_name) values ('u_mel', 'sv03.5-150', 1, 1, 'Mewtwo ex');
insert into app.wants (user_id, card_id, card_name) values ('u_mel', 'sv03.5-199', 'Charizard ex');
select pg_temp.check((select count(*) from app.collection_items where user_id = 'u_bruno') = 0, 'cannot read another user''s raw collection rows');
select pg_temp.check((select count(*) from app.public_collection where user_id = 'u_bruno') = 2, 'public showcase visible');
select pg_temp.check(not exists (select 1 from information_schema.columns where table_schema = 'app' and table_name = 'public_collection' and column_name = 'notes'), 'showcase never exposes notes');
select pg_temp.expect_fail($$insert into app.matches (user_a, user_b, kind) values ('u_bruno', 'u_mel', 'mutual')$$, 'matches cannot be inserted directly');
-- matchmaking (mutual)
select app.recompute_matches();
select pg_temp.check((select count(*) from app.matches where status = 'open' and kind = 'mutual') = 1, 'mutual match found for Bruno <-> Melissa');
select pg_temp.check((select count(*) from app.match_items) = 2, 'both cards linked to the match');
commit;

begin; set local role pokedeck_app; select set_config('app.user_id', 'u_carol', true);
select pg_temp.check((select count(*) from app.matches) = 0, 'carol cannot see other people''s matches');
insert into app.wants (user_id, card_id, card_name) values ('u_carol', 'sv03.5-199', 'Charizard ex');
-- pikachu is NOT marked for trade → must not match
insert into app.wants (user_id, card_id, card_name) values ('u_carol', 'sv03.5-025', 'Pikachu');
select app.recompute_matches();
select pg_temp.check((select count(*) from app.matches where kind = 'one_way') = 1, 'one-way match Bruno -> Carol');
select pg_temp.check((select count(*) from app.match_items where card_id = 'sv03.5-025') = 0, 'cards not available for trade never match');
-- language-specific want that differs → no extra item
commit;

-- ---------------------------------------------------------------- messages
select id as mutual_id from app.matches where kind = 'mutual' \gset
begin; set local role pokedeck_app; select set_config('app.user_id', 'u_bruno', true);
insert into app.messages (match_id, sender_id, body)
  select id, 'u_bruno', 'Você tem uma carta que estou procurando!' from app.matches where kind = 'mutual';
select pg_temp.expect_fail($$insert into app.messages (match_id, sender_id, body) select id, 'u_mel', 'forjado' from app.matches where kind = 'mutual'$$, 'cannot send as someone else');
select pg_temp.expect_fail($$insert into app.messages (match_id, sender_id, body, created_at) select id, 'u_bruno', 'x', now() - interval '1 year' from app.matches where kind = 'mutual'$$, 'cannot forge message timestamps');
commit;
begin; set local role pokedeck_app; select set_config('app.user_id', 'u_carol', true);
select pg_temp.check((select count(*) from app.messages) = 0, 'outsiders cannot read conversations');
select pg_temp.expect_fail(format($$insert into app.messages (match_id, sender_id, body) values (%s, 'u_carol', 'intrusa')$$, :mutual_id), 'outsiders cannot post in a conversation');
select pg_temp.expect_fail(format($$select app.close_match(%s)$$, :mutual_id), 'outsiders cannot close a match');
commit;
begin; set local role pokedeck_app; select set_config('app.user_id', 'u_mel', true);
select pg_temp.check((select count(*) from app.messages) = 1, 'participant reads the conversation');
select pg_temp.check((select count(*) from app.notifications where type = 'message') = 1, 'message notification delivered');
select pg_temp.check((select count(*) from app.notifications where type = 'match') = 1, 'match notification delivered');
select pg_temp.expect_fail($$insert into app.notifications (user_id, type) values ('u_mel', 'follow')$$, 'notifications cannot be forged');
commit;

-- rate limit: 20 messages per minute
begin; set local role pokedeck_app; select set_config('app.user_id', 'u_bruno', true);
do $$ begin
  for i in 1..19 loop
    insert into app.messages (match_id, sender_id, body) select id, 'u_bruno', 'spam ' || i from app.matches where kind = 'mutual';
  end loop;
end $$;
select pg_temp.expect_fail($$insert into app.messages (match_id, sender_id, body) select id, 'u_bruno', 'spam 21' from app.matches where kind = 'mutual'$$, 'message rate limit');
commit;

-- removing a card from the trade list stops matches and conversations
begin; set local role pokedeck_app; select set_config('app.user_id', 'u_bruno', true);
update app.collection_items set for_trade = 0 where card_id = 'sv03.5-199';
select app.recompute_matches();
select pg_temp.check((select count(*) from app.matches where status = 'open' and user_b = 'u_carol') = 0, 'one-way match expires when the card leaves the trade list');
select pg_temp.check((select kind from app.matches where status = 'open' and user_b = 'u_mel') = 'one_way', 'mutual match downgrades to one-way');
update app.collection_items set for_trade = 1 where card_id = 'sv03.5-199';
select app.recompute_matches();
commit;

-- closing & blocking (clear the rate-limit window first so the block itself is what gets tested)
delete from app.messages where body like 'spam%';
begin; set local role pokedeck_app; select set_config('app.user_id', 'u_mel', true);
select app.block_user('u_bruno');
select pg_temp.check((select count(*) from app.matches where status = 'open' and 'u_bruno' in (user_a, user_b) and 'u_mel' in (user_a, user_b)) = 0, 'blocking closes the match');
select app.recompute_matches();
select pg_temp.check((select count(*) from app.matches where status = 'open' and 'u_bruno' in (user_a, user_b) and 'u_mel' in (user_a, user_b)) = 0, 'blocked users never match again');
commit;
begin; set local role pokedeck_app; select set_config('app.user_id', 'u_bruno', true);
select pg_temp.expect_fail($$insert into app.messages (match_id, sender_id, body) select id, 'u_bruno', 'oi?' from app.matches where user_b = 'u_mel' order by id desc limit 1$$, 'no messages after block/close');
select pg_temp.expect_fail($$select app.close_match((select id from app.matches where user_b = 'u_mel' order by id desc limit 1))$$, 'closed match cannot be closed again');
commit;

-- ---------------------------------------------------------------- decks, likes, comments
begin; set local role pokedeck_app; select set_config('app.user_id', 'u_bruno', true);
insert into app.decks (user_id, title) values ('u_bruno', 'Charizard Control');
select pg_temp.expect_fail($$update app.decks set status = 'published' where user_id = 'u_bruno'$$, 'cannot publish an empty deck');
insert into app.deck_cards (deck_id, card_id, quantity, card_name) select id, 'sv03.5-199', 3, 'Charizard ex' from app.decks;
update app.decks set status = 'published';
select pg_temp.check((select published_at is not null from app.decks), 'published_at set by the server');
select pg_temp.expect_fail($$update app.decks set published_at = now() + interval '1 day'$$, 'published_at cannot be forged');
commit;
begin; set local role pokedeck_app; select set_config('app.user_id', 'u_bruno', true);
insert into app.decks (user_id, title) values ('u_bruno', 'Rascunho secreto');
commit;

begin; set local role pokedeck_app; select set_config('app.user_id', 'u_carol', true);
select pg_temp.check((select count(*) from app.decks) = 1, 'drafts of others are invisible');
update app.decks set title = 'pwned';
select pg_temp.check((select title from app.decks) = 'Charizard Control', 'cannot edit decks of others');
select pg_temp.expect_fail($$insert into app.deck_cards (deck_id, card_id, quantity, card_name) select id, 'x', 1, 'X' from app.decks$$, 'cannot add cards to decks of others');
insert into app.deck_likes (deck_id, user_id) select id, 'u_carol' from app.decks;
select pg_temp.expect_fail($$insert into app.deck_likes (deck_id, user_id) select id, 'u_carol' from app.decks$$, 'duplicate likes rejected');
select pg_temp.expect_fail($$insert into app.deck_likes (deck_id, user_id) select id, 'u_mel' from app.decks$$, 'cannot like on behalf of others');
select pg_temp.expect_fail($$insert into app.deck_likes (deck_id, user_id, created_at) select id, 'u_carol', now() from app.decks$$, 'like timestamps cannot be forged');
insert into app.comments (deck_id, user_id, body) select id, 'u_carol', 'Que deck lindo!' from app.decks;
insert into app.follows (follower, followee) values ('u_carol', 'u_bruno');
select pg_temp.expect_fail($$insert into app.follows (follower, followee) values ('u_carol', 'u_carol')$$, 'cannot follow yourself');
commit;

begin; set local role pokedeck_app; select set_config('app.user_id', 'u_bruno', true);
insert into app.comments (deck_id, user_id, parent_id, body)
  select deck_id, 'u_bruno', id, 'Valeu!' from app.comments where user_id = 'u_carol';
update app.comments set body = 'editado por invasor' where user_id = 'u_carol';
select pg_temp.check((select body from app.comments where user_id = 'u_carol') = 'Que deck lindo!', 'cannot edit comments of others');
select pg_temp.check((select count(*) from app.notifications where type in ('deck_like','deck_comment','follow')) = 3, 'like/comment/follow notifications delivered');
select pg_temp.check((select likes from app.deck_stats s join app.decks d on d.id = s.deck_id where d.status = 'published') = 1, 'like counter derived from rows');
select pg_temp.expect_fail($$insert into app.comments (deck_id, user_id, body) select id, 'u_bruno', 'x' from app.decks where status = 'draft'$$, 'no comments on drafts');
commit;
begin; set local role pokedeck_app; select set_config('app.user_id', 'u_carol', true);
select pg_temp.check((select count(*) from app.notifications where user_id <> 'u_carol') = 0, 'carol only sees her own notifications');
select pg_temp.check((select count(*) from app.notifications where type = 'comment_reply') = 1, 'reply notification delivered');
select pg_temp.check((select count(*) from app.deck_stats) = 1, 'stats never reveal drafts of others');
commit;

-- like/unlike loops do not spam notifications
begin; set local role pokedeck_app; select set_config('app.user_id', 'u_carol', true);
delete from app.deck_likes;
insert into app.deck_likes (deck_id, user_id) select id, 'u_carol' from app.decks;
commit;
select pg_temp.check((select count(*) from app.notifications where type = 'deck_like') = 1, 'like notifications are deduplicated');

-- private collection
begin; set local role pokedeck_app; select set_config('app.user_id', 'u_bruno', true);
update app.profiles set collection_public = false where user_id = 'u_bruno';
commit;
begin; set local role pokedeck_app; select set_config('app.user_id', 'u_carol', true);
select pg_temp.check((select count(*) from app.public_collection where user_id = 'u_bruno') = 0, 'private collections are hidden');
select pg_temp.check((select count(*) from app.public_trade_offers where user_id = 'u_bruno') = 1, 'explicit trade offers stay listed (module separation)');
select pg_temp.expect_fail($$insert into app.collection_likes (owner_id, user_id) values ('u_bruno', 'u_carol')$$, 'cannot like a private collection');
commit;

-- module separation: publishing a deck never creates trade opportunities
begin; set local role pokedeck_app; select set_config('app.user_id', 'u_carol', true);
select app.recompute_matches();
select pg_temp.check(not exists (select 1 from app.match_items mi join app.deck_cards dc on dc.card_id = mi.card_id where mi.giver = 'u_bruno' and mi.collection_item_id is null), 'deck cards are not trade offers');
commit;

-- anonymous visitors
begin; set local role pokedeck_app;
select pg_temp.check((select count(*) from app.decks) = 1, 'anonymous sees published decks only');
select pg_temp.check((select count(*) from app.messages) = 0, 'anonymous sees no messages');
select pg_temp.expect_fail($$insert into app.deck_likes (deck_id, user_id) select id, 'u_carol' from app.decks$$, 'anonymous cannot like');
commit;

\echo 'ALL CHECKS PASSED'
