"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { AppError, run, type ActionResult } from "@/server/db";
import { auth, devAuth, getViewer } from "@/server/auth";
import * as trading from "@/server/trading";
import * as community from "@/server/community";
import type { CollectionItem, Message, Profile, Want } from "@/lib/social/types";

/**
 * Server Actions — the only write path from the browser. Each one resolves the session on the
 * server, then delegates to the data layer, which runs under Postgres RLS as that user.
 */
async function uid(): Promise<string> {
  const v = await getViewer();
  if (!v) throw new AppError("AUTH_REQUIRED");
  return v.id;
}

/* ------------------------------------------------------------------ session */

export async function signOutAction(): Promise<void> {
  if (devAuth) (await cookies()).delete("pd_dev_uid");
  else if (auth) await auth.signOut().catch(() => undefined);
  revalidatePath("/", "layout");
}

/** Development only (DEV_FAKE_AUTH=1): sign in as a test id. */
export async function devSignInAction(id: string): Promise<ActionResult> {
  return run(async () => {
    if (!devAuth) throw new AppError("NOT_ALLOWED");
    if (!/^[a-z0-9_]{2,30}$/.test(id)) throw new AppError("INVALID_INPUT");
    (await cookies()).set("pd_dev_uid", `dev_${id}`, { httpOnly: true, sameSite: "lax", path: "/" });
    return undefined;
  });
}

/* ------------------------------------------------------------------ profile */

export async function saveProfileAction(input: trading.ProfileInput): Promise<ActionResult<Profile>> {
  return run(async () => {
    const p = await trading.saveProfile(await uid(), input);
    revalidatePath("/", "layout");
    return p;
  });
}

/* ------------------------------------------------------------------ collection & wants */

export const addItemAction = async (input: trading.ItemInput): Promise<ActionResult<CollectionItem>> =>
  run(async () => trading.addItem(await uid(), input));
export const updateItemAction = async (id: number, input: Partial<trading.ItemInput>): Promise<ActionResult<CollectionItem>> =>
  run(async () => trading.updateItem(await uid(), id, input));
export const deleteItemAction = async (id: number): Promise<ActionResult> =>
  run(async () => trading.deleteItem(await uid(), id));
export const addWantAction = async (input: trading.WantInput): Promise<ActionResult<Want>> =>
  run(async () => trading.addWant(await uid(), input));
export const deleteWantAction = async (id: number): Promise<ActionResult> =>
  run(async () => trading.deleteWant(await uid(), id));
export const importLocalAction = async (owned: (trading.CardInput & { quantity: number })[], wanted: trading.CardInput[]): Promise<ActionResult<number>> =>
  run(async () => trading.importLocal(await uid(), owned, wanted));

/* ------------------------------------------------------------------ matches & messages */

export const sendMessageAction = async (matchId: number, body: string, cardRefs: string[]): Promise<ActionResult<Message>> =>
  run(async () => trading.sendMessage(await uid(), matchId, body, cardRefs));
export const closeMatchAction = async (matchId: number): Promise<ActionResult> =>
  run(async () => {
    await trading.closeMatch(await uid(), matchId);
    revalidatePath("/trocas");
  });
export const blockUserAction = async (userId: string): Promise<ActionResult> =>
  run(async () => {
    await trading.blockUser(await uid(), userId);
    revalidatePath("/trocas");
  });
export const reportAction = async (type: string, id: string, reason: string, details?: string): Promise<ActionResult> =>
  run(async () => trading.report(await uid(), type, id, reason, details));
export const markNotificationsReadAction = async (): Promise<ActionResult> =>
  run(async () => trading.markNotificationsRead(await uid()));

/* ------------------------------------------------------------------ community */

export const followAction = async (userId: string, on: boolean): Promise<ActionResult> =>
  run(async () => community.follow(await uid(), userId, on));
export const likeCollectionAction = async (ownerId: string, on: boolean): Promise<ActionResult> =>
  run(async () => community.likeCollection(await uid(), ownerId, on));
export const likeDeckAction = async (deckId: string, on: boolean): Promise<ActionResult<number>> =>
  run(async () => community.likeDeck(await uid(), deckId, on));
export const saveDeckBookmarkAction = async (deckId: string, on: boolean): Promise<ActionResult> =>
  run(async () => community.saveDeckBookmark(await uid(), deckId, on));

export async function saveDeckAction(id: string | null, input: community.DeckInput, publish?: boolean): Promise<ActionResult<string>> {
  return run(async () => {
    const deckId = await community.saveDeck(await uid(), id, input, publish);
    revalidatePath(`/d/${deckId}`);
    revalidatePath("/comunidade");
    return deckId;
  });
}
export const deleteDeckAction = async (id: string): Promise<ActionResult> =>
  run(async () => {
    await community.deleteDeck(await uid(), id);
    revalidatePath("/decks-tcg");
  });

export async function addCommentAction(deckId: string, body: string, parentId: number | null): Promise<ActionResult> {
  return run(async () => {
    await community.addComment(await uid(), deckId, body, parentId);
    revalidatePath(`/d/${deckId}`);
  });
}
export async function editCommentAction(deckId: string, id: number, body: string): Promise<ActionResult> {
  return run(async () => {
    await community.editComment(await uid(), id, body);
    revalidatePath(`/d/${deckId}`);
  });
}
export async function deleteCommentAction(deckId: string, id: number): Promise<ActionResult> {
  return run(async () => {
    await community.deleteComment(await uid(), id);
    revalidatePath(`/d/${deckId}`);
  });
}
