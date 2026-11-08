/**
 * Teste de ponta a ponta dos serviços contra um projeto Supabase real.
 * Não roda no `npm test`: use `npm run test:integration` com as variáveis
 * VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, TEST_USER_A_EMAIL,
 * TEST_USER_B_EMAIL e TEST_USER_PASSWORD (usuários já confirmados).
 * Ao final, as duas contas de teste são excluídas.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("../services/tmdb", () => ({
  getSeriesDetails: vi.fn(async (id: number) => ({
    id,
    name: `Série ${id}`,
    poster_path: `/poster-${id}.jpg`,
  })),
  getLatestEpisode: vi.fn(async () => null),
}));

const { supabase } = await import("../config/supabase");
const reviews = await import("../services/reviews");
const lists = await import("../services/lists");
const comments = await import("../services/comments");
const followers = await import("../services/followers");
const notifications = await import("../services/notifications");
const users = await import("../services/users");
const watchlist = await import("../services/watchlist");
const upload = await import("../services/upload");

const env = process.env;
const SERIES = 1399;

async function signIn(email: string) {
  await supabase.auth.signOut();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: env.TEST_USER_PASSWORD!,
  });
  if (error) throw error;
  // aguarda o listener de auth atualizar o usuário da sessão
  await new Promise((r) => setTimeout(r, 50));
  return data.user!.id;
}

describe("Supabase ponta a ponta", () => {
  let ana = "";
  let beto = "";
  let reviewId = "";
  let listId = "";

  it("ana avalia temporadas, cria lista e watchlist", async () => {
    ana = await signIn(env.TEST_USER_A_EMAIL!);

    await users.updateProfile(ana, { displayName: "Ana Teste", description: "Fã de séries" });
    expect((await users.getUserData(ana))?.displayName).toBe("Ana Teste");

    await reviews.addSeasonReview(SERIES, 1, 4.5, "Ótima temporada");
    await reviews.addSeasonReview(SERIES, 2, 4, "Boa");
    await reviews.addSeasonReview(SERIES, 2, 3.5, "Revisando: razoável");

    const seriesReviews = await reviews.getSeriesReviews(SERIES);
    expect(seriesReviews).toHaveLength(1);
    reviewId = seriesReviews[0].id;
    expect(seriesReviews[0].series.name).toBe(`Série ${SERIES}`);
    expect(seriesReviews[0].seasonReviews.map((s) => s.rating)).toEqual([4.5, 3.5]);
    expect(await reviews.getSeriesAverageRating(SERIES)).toBe(4);

    await expect(reviews.addSeasonReview(SERIES, 3, 4.2, "")).rejects.toThrow();

    listId = await lists.createList("Favoritas", "As melhores", ["drama"], true, [
      { seriesId: SERIES, name: "GoT", poster_path: null, addedAt: new Date() },
    ]);
    await lists.addSeriesToList(listId, { id: 1396, name: "Breaking Bad", poster_path: null });
    await expect(
      lists.addSeriesToList(listId, { id: 1396, name: "Breaking Bad", poster_path: null })
    ).rejects.toThrow("já está na lista");

    await watchlist.addToWatchlist(ana, {
      id: 1396,
      name: "Breaking Bad",
      poster_path: null,
      first_air_date: "2008-01-20",
    });
    expect(await watchlist.isInWatchlist(ana, 1396)).toBe(true);
    expect((await watchlist.getUserWatchlist(ana))[0].seriesData.name).toBe("Breaking Bad");
  });

  it("ana envia foto de perfil para o Storage", async () => {
    const png = Uint8Array.from(
      atob(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkqPhfDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
      ),
      (c) => c.charCodeAt(0)
    );
    const url = await upload.uploadProfilePhoto(
      new File([png], "foto.png", { type: "image/png" }),
      ana
    );
    expect(url).toContain(`/profile-images/${ana}/profile`);
    const response = await fetch(url);
    expect(response.status).toBe(200);
  });

  it("beto segue, curte e comenta", async () => {
    beto = await signIn(env.TEST_USER_B_EMAIL!);

    await followers.followUser(ana);
    expect(await followers.isFollowing(ana)).toBe(true);
    await expect(followers.followUser(ana)).rejects.toThrow("já segue");
    expect((await followers.getFollowers(ana)).map((f) => f.followerId)).toContain(beto);

    expect(await reviews.toggleReaction(reviewId, 1, "likes")).toEqual({
      likes: 1,
      userReaction: "likes",
    });

    const comment = await comments.addComment(reviewId, "review", "Concordo!", 1);
    expect(comment.username).toBe("teste_beto");
    const reviewComments = await comments.getComments(reviewId, "review", 1);
    expect(reviewComments).toHaveLength(1);
    expect(await comments.toggleReviewCommentReaction(reviewId, comment.id, 1)).toEqual({
      liked: true,
      likesCount: 1,
    });

    expect(await lists.toggleListReaction(listId, "like")).toEqual({ liked: true, likesCount: 1 });
    await comments.addComment(listId, "list", "Boa lista");

    const list = await lists.getListById(listId);
    expect(list?.items.map((i) => i.seriesId)).toEqual([SERIES, 1396]);
    expect(list?.likesCount).toBe(1);
    expect(list?.commentsCount).toBe(1);
    expect(list?.username).toBe("teste_ana");
    expect(list?.reactions?.map((r) => r.userId)).toEqual([beto]);
  });

  it("feeds, buscas e rankings refletem os dados", async () => {
    expect((await reviews.getPopularReviews()).some((r) => r.id === reviewId)).toBe(true);
    expect((await reviews.getAllReviews()).some((r) => r.id === reviewId)).toBe(true);
    expect((await reviews.getRecentFollowedUsersReviews()).length).toBeGreaterThan(0);
    expect(await reviews.getFollowedUsersReviews(beto, SERIES)).toHaveLength(1);
    expect((await reviews.getUserRecentReviews(ana))[0].userName).toBe("Ana Teste");
    expect((await reviews.getTopRatedSeries()).some((s) => s.seriesId === SERIES)).toBe(true);
    expect((await reviews.getReviewDetails(reviewId))?.seasonReviews[0].reactions?.likes).toEqual([
      beto,
    ]);

    expect((await lists.getPopularLists()).some((l) => l.id === listId)).toBe(true);
    expect((await lists.getFollowedUsersLists()).some((l) => l.id === listId)).toBe(true);
    expect((await lists.getListsByTag("drama")).some((l) => l.id === listId)).toBe(true);
    expect((await lists.searchLists("Favoritas")).some((l) => l.id === listId)).toBe(true);
    expect((await lists.getUserLists(ana)).map((l) => l.id)).toContain(listId);
    expect((await lists.getPopularTags()).map((t) => t.tag)).toContain("drama");

    expect((await users.getPopularUsers()).map((u) => u.id)).toContain(ana);
    expect((await users.searchUsers("teste_")).length).toBeGreaterThanOrEqual(2);
    expect(await users.isUsernameAvailable("teste_ana")).toBe(false);
    expect((await users.getUserByUsername("teste_ana"))?.id).toBe(ana);
  });

  it("beto não altera dados da ana", async () => {
    await reviews.updateReview(reviewId, 1, 0.5, "hack");
    await lists.updateList(listId, { title: "hack" });
    const review = await reviews.getReviewDetails(reviewId);
    expect(review?.seasonReviews[0].rating).toBe(4.5);
    expect((await lists.getListById(listId))?.title).toBe("Favoritas");
    expect(await notifications.getUserNotifications(ana)).toEqual([]);
  });

  it("ana recebe as notificações criadas pelos triggers", async () => {
    await signIn(env.TEST_USER_A_EMAIL!);
    const received = await notifications.getUserNotifications(ana);
    expect(received.map((n) => n.type).sort()).toEqual(
      ["LIST_COMMENT", "LIST_REACTION", "NEW_COMMENT", "NEW_FOLLOWER", "NEW_REACTION"].sort()
    );
    expect(received.every((n) => n.senderName === "teste_beto")).toBe(true);
    expect(received.find((n) => n.type === "NEW_COMMENT")?.message).toContain(
      `Série ${SERIES} (Temporada 1)`
    );

    await notifications.markAllNotificationsAsRead(ana);
    expect((await notifications.getUserNotifications(ana)).every((n) => n.read)).toBe(true);

    await reviews.deleteReview(reviewId, 2);
    expect((await reviews.getReviewDetails(reviewId))?.seasonReviews).toHaveLength(1);
  });

  it("as duas contas de teste são excluídas", async () => {
    await users.deleteCurrentUserAccount(ana);
    await signIn(env.TEST_USER_B_EMAIL!);
    await users.deleteCurrentUserAccount(beto);

    expect(await reviews.getSeriesReviews(SERIES)).toEqual([]);
    expect(await lists.getListById(listId)).toBeNull();
    const { error } = await supabase.auth.signInWithPassword({
      email: env.TEST_USER_A_EMAIL!,
      password: env.TEST_USER_PASSWORD!,
    });
    expect(error).not.toBeNull();
  });
});
