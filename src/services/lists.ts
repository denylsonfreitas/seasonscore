import { getSessionUser, requireUserId, supabase, unwrap } from "../config/supabase";
import type { Tables } from "../types/database";
import type {
  List,
  ListItem,
  ListReaction,
  ListReactionType,
  ListWithUserData,
} from "../types/list";
import { toggleCommentLike } from "./comments";
import { getFollowing } from "./followers";

const DEFAULT_LIMIT = 10;

type ListItemRow = Tables<"list_items">;
type SummaryRow = Tables<"list_summaries"> & {
  list_items?: ListItemRow[];
  list_likes?: { user_id: string; created_at: string }[];
};

const SUMMARY_SELECT = "*, list_items(*)";

function itemFromRow(row: ListItemRow): ListItem {
  return {
    seriesId: row.series_id,
    name: row.name,
    poster_path: row.poster_path,
    addedAt: new Date(row.added_at),
  };
}

function listFromSummary(row: SummaryRow): ListWithUserData {
  const items = [...(row.list_items ?? [])]
    .sort((a, b) => a.added_at.localeCompare(b.added_at))
    .map(itemFromRow);
  return {
    id: row.id ?? "",
    userId: row.user_id ?? "",
    title: row.title ?? "",
    description: row.description ?? "",
    tags: row.tags ?? [],
    isPublic: row.is_public ?? true,
    accessByLink: row.access_by_link ?? false,
    items,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    likesCount: row.likes_count ?? 0,
    commentsCount: row.comments_count ?? 0,
    username: row.username ?? undefined,
    userDisplayName: row.display_name ?? undefined,
    userPhotoURL: row.user_photo_url,
    reactions: row.list_likes?.map((like) => ({
      id: `${row.id}_${like.user_id}`,
      listId: row.id ?? "",
      userId: like.user_id,
      type: "like" as ListReactionType,
      createdAt: new Date(like.created_at),
    })),
  };
}

function listsFromRows(rows: unknown): ListWithUserData[] {
  return (rows as SummaryRow[]).map(listFromSummary);
}

/** Cria uma nova lista de séries e devolve o ID. */
export async function createList(
  title: string,
  description: string = "",
  tags: string[] = [],
  isPublic: boolean = true,
  initialItems: ListItem[] = [],
  accessByLink: boolean = false
): Promise<string> {
  const userId = requireUserId();
  try {
    const list = unwrap(
      await supabase
        .from("lists")
        .insert({
          user_id: userId,
          title,
          description,
          tags,
          is_public: isPublic,
          access_by_link: accessByLink,
        })
        .select("id")
        .single()
    );

    if (initialItems.length > 0) {
      unwrap(
        await supabase.from("list_items").insert(
          initialItems.map((item) => ({
            list_id: list.id,
            series_id: item.seriesId,
            name: item.name,
            poster_path: item.poster_path,
          }))
        )
      );
    }
    return list.id;
  } catch (error) {
    throw new Error("Não foi possível criar a lista", { cause: error });
  }
}

export async function addSeriesToList(
  listId: string,
  series: { id: number; name: string; poster_path: string | null }
): Promise<void> {
  requireUserId();
  const { error } = await supabase.from("list_items").insert({
    list_id: listId,
    series_id: series.id,
    name: series.name,
    poster_path: series.poster_path,
  });
  if (error?.code === "23505") throw new Error("Esta série já está na lista");
  if (error) throw new Error("Não foi possível adicionar a série à lista", { cause: error });
}

export async function removeSeriesFromList(listId: string, seriesId: number): Promise<void> {
  requireUserId();
  unwrap(
    await supabase.from("list_items").delete().eq("list_id", listId).eq("series_id", seriesId)
  );
}

export async function updateList(
  listId: string,
  data: {
    title?: string;
    description?: string;
    tags?: string[];
    isPublic?: boolean;
    accessByLink?: boolean;
  }
): Promise<void> {
  requireUserId();
  const update: Partial<Tables<"lists">> = {};
  if (data.title !== undefined) update.title = data.title;
  if (data.description !== undefined) update.description = data.description;
  if (data.tags !== undefined) update.tags = data.tags;
  if (data.isPublic !== undefined) update.is_public = data.isPublic;
  if (data.accessByLink !== undefined) update.access_by_link = data.accessByLink;
  try {
    unwrap(await supabase.from("lists").update(update).eq("id", listId));
  } catch (error) {
    throw new Error("Não foi possível atualizar a lista", { cause: error });
  }
}

/** Exclui a lista (itens, curtidas e comentários são apagados em cascata). */
export async function deleteList(listId: string): Promise<void> {
  requireUserId();
  try {
    unwrap(await supabase.from("lists").delete().eq("id", listId));
  } catch (error) {
    throw new Error("Não foi possível excluir a lista", { cause: error });
  }
}

/** Lista com itens, autor e curtidas (null se não existir ou não for visível). */
export async function getListById(listId: string): Promise<ListWithUserData | null> {
  const { data, error } = await supabase
    .from("list_summaries")
    .select(`${SUMMARY_SELECT}, list_likes(user_id, created_at)`)
    .eq("id", listId)
    .maybeSingle();
  if (error) throw new Error("Não foi possível obter os detalhes da lista", { cause: error });
  return data ? listFromSummary(data as unknown as SummaryRow) : null;
}

export async function getUserLists(
  userId: string,
  onlyPublic: boolean = false
): Promise<ListWithUserData[]> {
  if (!userId) return [];
  const isOwnProfile = getSessionUser()?.id === userId;
  let query = supabase
    .from("list_summaries")
    .select(SUMMARY_SELECT)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (!isOwnProfile || onlyPublic) query = query.eq("is_public", true);
  return listsFromRows(unwrap(await query));
}

export async function getPopularLists(
  limitCount: number = DEFAULT_LIMIT
): Promise<ListWithUserData[]> {
  const { data, error } = await supabase
    .from("list_summaries")
    .select(SUMMARY_SELECT)
    .eq("is_public", true)
    .gt("likes_count", 0)
    .order("likes_count", { ascending: false })
    .limit(limitCount);
  return error || !data ? [] : listsFromRows(data);
}

/** Listas públicas em ordem aleatória (entre as 100 mais recentes). */
export async function getAllLists(limitCount: number = DEFAULT_LIMIT): Promise<ListWithUserData[]> {
  const { data, error } = await supabase
    .from("list_summaries")
    .select(SUMMARY_SELECT)
    .eq("is_public", true)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  const lists = listsFromRows(data);
  for (let i = lists.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lists[i], lists[j]] = [lists[j], lists[i]];
  }
  return lists.slice(0, limitCount);
}

export async function getListsByTag(
  tag: string,
  limitCount: number = DEFAULT_LIMIT
): Promise<ListWithUserData[]> {
  const { data, error } = await supabase
    .from("list_summaries")
    .select(SUMMARY_SELECT)
    .eq("is_public", true)
    .contains("tags", [tag])
    .order("updated_at", { ascending: false })
    .limit(limitCount);
  return error || !data ? [] : listsFromRows(data);
}

/** Listas do usuário que já contêm a série. */
export async function getListsContainingSeries(userId: string, seriesId: number): Promise<List[]> {
  const { data, error } = await supabase
    .from("list_summaries")
    .select("*, list_items!inner(*)")
    .eq("user_id", userId)
    .eq("list_items.series_id", seriesId);
  return error || !data ? [] : listsFromRows(data);
}

export async function toggleListCommentReaction(
  _listId: string,
  commentId: string
): Promise<{ liked: boolean; likesCount: number }> {
  return toggleCommentLike("list_comment_likes", commentId);
}

/** Curte ou descurte uma lista. */
export async function toggleListReaction(
  listId: string,
  _reactionType: ListReactionType
): Promise<{ liked: boolean; likesCount: number }> {
  const userId = requireUserId();
  const match = { list_id: listId, user_id: userId };

  const { count } = await supabase
    .from("list_likes")
    .select("*", { count: "exact", head: true })
    .match(match);
  const alreadyLiked = (count ?? 0) > 0;

  if (alreadyLiked) {
    unwrap(await supabase.from("list_likes").delete().match(match));
  } else {
    unwrap(await supabase.from("list_likes").insert(match));
  }

  const { count: total } = await supabase
    .from("list_likes")
    .select("*", { count: "exact", head: true })
    .eq("list_id", listId);

  return { liked: !alreadyLiked, likesCount: total ?? 0 };
}

/** Listas públicas mais recentes de quem o usuário logado segue. */
export async function getFollowedUsersLists(
  limitCount: number = DEFAULT_LIMIT
): Promise<ListWithUserData[]> {
  const currentUser = getSessionUser();
  if (!currentUser) return [];
  const following = await getFollowing(currentUser.id);
  const ids = following.map((f) => f.userId);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("list_summaries")
    .select(SUMMARY_SELECT)
    .eq("is_public", true)
    .in("user_id", ids)
    .order("updated_at", { ascending: false })
    .limit(limitCount);
  return error || !data ? [] : listsFromRows(data);
}

export async function getPopularTags(
  limitCount: number = 20
): Promise<{ tag: string; count: number }[]> {
  const { data, error } = await supabase.rpc("popular_list_tags", { p_limit: limitCount });
  if (error || !data) return [];
  return data.map((row) => ({ tag: row.tag, count: Number(row.count) }));
}

export async function searchLists(
  searchText: string,
  limitCount: number = DEFAULT_LIMIT
): Promise<ListWithUserData[]> {
  const term = searchText.trim().replace(/[%_,(){}"]/g, "");
  if (!term) return [];
  const { data, error } = await supabase
    .from("list_summaries")
    .select(SUMMARY_SELECT)
    .eq("is_public", true)
    .or(`title.ilike.%${term}%,description.ilike.%${term}%,tags.cs.{${term.toLowerCase()}}`)
    .order("updated_at", { ascending: false })
    .limit(limitCount);
  return error || !data ? [] : listsFromRows(data);
}

export type { ListReaction };
