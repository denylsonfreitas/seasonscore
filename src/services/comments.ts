import { requireUserId, supabase, unwrap } from "../config/supabase";
import type { Comment } from "../types/comment";

// Comentários em avaliações (review_comments) e listas (list_comments).
// As notificações para o dono do conteúdo são criadas por triggers no banco.

type ObjectType = "review" | "list" | string;

type CommentRow = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string | null;
  season_number?: number;
  author: { username: string; display_name: string | null; photo_url: string | null } | null;
  likes: { user_id: string }[];
};

function fromRow(row: CommentRow, objectId: string, objectType: string): Comment {
  return {
    id: row.id,
    objectId,
    objectType,
    userId: row.user_id,
    username: row.author?.username ?? "",
    userDisplayName: row.author?.display_name ?? undefined,
    userPhotoURL: row.author?.photo_url ?? undefined,
    content: row.content,
    seasonNumber: row.season_number,
    likes: Object.fromEntries(row.likes.map((l) => [l.user_id, true])),
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  };
}

const REVIEW_COMMENT_SELECT =
  "*, author:profiles!review_comments_user_id_fkey(username, display_name, photo_url), likes:review_comment_likes(user_id)";
const LIST_COMMENT_SELECT =
  "*, author:profiles!list_comments_user_id_fkey(username, display_name, photo_url), likes:list_comment_likes(user_id)";

export async function addComment(
  objectId: string,
  objectType: ObjectType,
  content: string,
  seasonNumber?: number
): Promise<Comment> {
  const userId = requireUserId();

  if (objectType === "review") {
    if (seasonNumber === undefined) {
      throw new Error("Número da temporada é necessário para comentar em avaliações");
    }
    const row = unwrap(
      await supabase
        .from("review_comments")
        .insert({ review_id: objectId, season_number: seasonNumber, user_id: userId, content })
        .select(REVIEW_COMMENT_SELECT)
        .single()
    );
    return fromRow(row as unknown as CommentRow, objectId, objectType);
  }

  const row = unwrap(
    await supabase
      .from("list_comments")
      .insert({ list_id: objectId, user_id: userId, content })
      .select(LIST_COMMENT_SELECT)
      .single()
  );
  return fromRow(row as unknown as CommentRow, objectId, objectType);
}

export async function getComments(
  objectId: string,
  objectType: ObjectType,
  seasonNumber?: number
): Promise<Comment[]> {
  if (objectType === "review") {
    let query = supabase
      .from("review_comments")
      .select(REVIEW_COMMENT_SELECT)
      .eq("review_id", objectId)
      .order("created_at", { ascending: false });
    if (seasonNumber !== undefined) query = query.eq("season_number", seasonNumber);
    const { data, error } = await query;
    if (error || !data) return [];
    return (data as unknown as CommentRow[]).map((r) => fromRow(r, objectId, objectType));
  }

  const { data, error } = await supabase
    .from("list_comments")
    .select(LIST_COMMENT_SELECT)
    .eq("list_id", objectId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as unknown as CommentRow[]).map((r) => fromRow(r, objectId, objectType));
}

function commentsTable(objectType: ObjectType) {
  return objectType === "review" ? "review_comments" : "list_comments";
}

export async function updateComment(
  commentId: string,
  _objectId: string,
  objectType: ObjectType,
  content: string
): Promise<void> {
  requireUserId();
  unwrap(await supabase.from(commentsTable(objectType)).update({ content }).eq("id", commentId));
}

export async function deleteComment(
  commentId: string,
  _objectId: string,
  objectType: ObjectType
): Promise<void> {
  requireUserId();
  unwrap(await supabase.from(commentsTable(objectType)).delete().eq("id", commentId));
}

/** Curte ou descurte um comentário (de avaliação ou de lista). */
export async function toggleCommentLike(
  table: "review_comment_likes" | "list_comment_likes",
  commentId: string
): Promise<{ liked: boolean; likesCount: number }> {
  const userId = requireUserId();
  const match = { comment_id: commentId, user_id: userId };

  const { count } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .match(match);
  const alreadyLiked = (count ?? 0) > 0;

  if (alreadyLiked) {
    unwrap(await supabase.from(table).delete().match(match));
  } else {
    unwrap(await supabase.from(table).insert(match));
  }

  const { count: total } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("comment_id", commentId);

  return { liked: !alreadyLiked, likesCount: total ?? 0 };
}

export async function toggleReviewCommentReaction(
  _objectId: string,
  commentId: string,
  _seasonNumber: number
): Promise<{ liked: boolean; likesCount: number }> {
  return toggleCommentLike("review_comment_likes", commentId);
}
