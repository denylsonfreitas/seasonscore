import { getSessionUser, requireUserId, supabase, unwrap } from "../config/supabase";

/** Relação de seguidor: `followerId` segue `userId`. */
export interface Follower {
  id: string;
  userId: string;
  followerId: string;
  createdAt: Date;
}

type FollowRow = { follower_id: string; following_id: string; created_at: string };

function followerFromRow(row: FollowRow): Follower {
  return {
    id: `${row.follower_id}_${row.following_id}`,
    userId: row.following_id,
    followerId: row.follower_id,
    createdAt: new Date(row.created_at),
  };
}

export async function followUser(userId: string): Promise<void> {
  const currentUserId = requireUserId();
  if (userId === currentUserId) throw new Error("Não é possível seguir a si mesmo");

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: currentUserId, following_id: userId });
  if (error?.code === "23505") throw new Error("Você já segue este usuário");
  if (error) throw error;
  // A notificação para o usuário seguido é criada por trigger no banco.
}

export async function unfollowUser(userId: string): Promise<boolean> {
  const currentUserId = requireUserId();
  unwrap(
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", currentUserId)
      .eq("following_id", userId)
  );
  return true;
}

/** Quem segue o usuário. */
export async function getFollowers(userId: string): Promise<Follower[]> {
  const rows = unwrap(await supabase.from("follows").select("*").eq("following_id", userId));
  return rows.map(followerFromRow);
}

/** Quem o usuário segue. */
export async function getFollowing(userId: string): Promise<Follower[]> {
  const rows = unwrap(await supabase.from("follows").select("*").eq("follower_id", userId));
  return rows.map(followerFromRow);
}

export async function isFollowing(userId: string): Promise<boolean> {
  const currentUser = getSessionUser();
  if (!currentUser || !userId) return false;
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", currentUser.id)
    .eq("following_id", userId);
  return (count ?? 0) > 0;
}
