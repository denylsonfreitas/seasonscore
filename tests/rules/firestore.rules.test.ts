import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

let env: RulesTestEnvironment;

const ALICE = "alice";
const BOB = "bob";

const db = (uid?: string) =>
  uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore();

const seasonReview = (overrides: Record<string, unknown> = {}) => ({
  seasonNumber: 1,
  userId: ALICE,
  rating: 4,
  comment: "Ótima temporada",
  reactions: { likes: [] as string[] },
  comments: [],
  ...overrides,
});

async function seed(path: string, data: Record<string, unknown>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data);
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "seasonscore-rules-test",
    firestore: { rules: readFileSync(resolve(__dirname, "../../firestore.rules"), "utf8") },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

describe("users", () => {
  it("qualquer pessoa lê perfis", async () => {
    await seed("users/alice", { username: "alice" });
    await assertSucceeds(getDoc(doc(db(), "users/alice")));
  });

  it("só o dono cria e edita o próprio perfil", async () => {
    await assertSucceeds(setDoc(doc(db(ALICE), "users/alice"), { username: "alice" }));
    await assertFails(setDoc(doc(db(BOB), "users/alice"), { username: "hacker" }));
    await assertFails(updateDoc(doc(db(BOB), "users/alice"), { username: "hacker" }));
  });
});

describe("reviews", () => {
  beforeEach(async () => {
    await seed("reviews/r1", {
      userId: ALICE,
      seriesId: 1399,
      seasonReviews: [seasonReview(), seasonReview({ seasonNumber: 2, rating: 3 })],
      commentsCount: 0,
    });
  });

  it("autor cria avaliação apenas em nome próprio", async () => {
    const data = { userId: BOB, seriesId: 1, seasonReviews: [seasonReview({ userId: BOB })] };
    await assertSucceeds(setDoc(doc(db(BOB), "reviews/r2"), data));
    await assertFails(setDoc(doc(db(BOB), "reviews/r3"), { ...data, userId: ALICE }));
  });

  it("dono edita nota e comentário", async () => {
    await assertSucceeds(
      updateDoc(doc(db(ALICE), "reviews/r1"), {
        seasonReviews: [seasonReview({ rating: 5 }), seasonReview({ seasonNumber: 2 })],
      })
    );
  });

  it("outro usuário NÃO altera a nota", async () => {
    await assertFails(
      updateDoc(doc(db(BOB), "reviews/r1"), {
        seasonReviews: [seasonReview({ rating: 0.5 }), seasonReview({ seasonNumber: 2, rating: 3 })],
      })
    );
  });

  it("outro usuário NÃO altera o texto da segunda temporada", async () => {
    await assertFails(
      updateDoc(doc(db(BOB), "reviews/r1"), {
        seasonReviews: [
          seasonReview(),
          seasonReview({ seasonNumber: 2, rating: 3, comment: "texto trocado" }),
        ],
      })
    );
  });

  it("outro usuário NÃO remove temporadas", async () => {
    await assertFails(updateDoc(doc(db(BOB), "reviews/r1"), { seasonReviews: [seasonReview()] }));
  });

  it("outro usuário curte e descurte uma temporada", async () => {
    const liked = [
      seasonReview({ reactions: { likes: [BOB] } }),
      seasonReview({ seasonNumber: 2, rating: 3 }),
    ];
    await assertSucceeds(updateDoc(doc(db(BOB), "reviews/r1"), { seasonReviews: liked }));
    await assertSucceeds(
      updateDoc(doc(db(BOB), "reviews/r1"), {
        seasonReviews: [seasonReview(), seasonReview({ seasonNumber: 2, rating: 3 })],
      })
    );
  });

  it("outro usuário NÃO curte em nome de terceiros", async () => {
    await assertFails(
      updateDoc(doc(db(BOB), "reviews/r1"), {
        seasonReviews: [
          seasonReview({ reactions: { likes: ["carol"] } }),
          seasonReview({ seasonNumber: 2, rating: 3 }),
        ],
      })
    );
  });

  it("contador de comentários só muda de 1 em 1", async () => {
    await assertSucceeds(updateDoc(doc(db(BOB), "reviews/r1"), { commentsCount: 1 }));
    await assertFails(updateDoc(doc(db(BOB), "reviews/r1"), { commentsCount: 100 }));
  });

  it("outro usuário NÃO muda o autor nem a série", async () => {
    await assertFails(updateDoc(doc(db(BOB), "reviews/r1"), { userId: BOB }));
    await assertFails(updateDoc(doc(db(BOB), "reviews/r1"), { seriesId: 1 }));
  });

  it("curtida funciona em séries longas (35 temporadas)", async () => {
    const seasons = Array.from({ length: 35 }, (_, i) => seasonReview({ seasonNumber: i + 1 }));
    await seed("reviews/long", { userId: ALICE, seriesId: 456, seasonReviews: seasons });
    const liked = seasons.map((s, i) => (i === 34 ? { ...s, reactions: { likes: [BOB] } } : s));
    await assertSucceeds(updateDoc(doc(db(BOB), "reviews/long"), { seasonReviews: liked }));
    const tampered = seasons.map((s, i) => (i === 34 ? { ...s, rating: 1 } : s));
    await assertFails(updateDoc(doc(db(BOB), "reviews/long"), { seasonReviews: tampered }));
  });

  it("só o dono exclui", async () => {
    await assertFails(deleteDoc(doc(db(BOB), "reviews/r1")));
    await assertSucceeds(deleteDoc(doc(db(ALICE), "reviews/r1")));
  });
});

describe("lists", () => {
  beforeEach(async () => {
    await seed("lists/l1", {
      userId: ALICE,
      title: "Favoritas",
      items: [],
      likesCount: 0,
      commentsCount: 0,
    });
  });

  it("dono edita a lista", async () => {
    await assertSucceeds(updateDoc(doc(db(ALICE), "lists/l1"), { title: "Novo título" }));
  });

  it("outro usuário NÃO edita título ou itens", async () => {
    await assertFails(updateDoc(doc(db(BOB), "lists/l1"), { title: "hack" }));
    await assertFails(updateDoc(doc(db(BOB), "lists/l1"), { items: [{ seriesId: 1 }] }));
  });

  it("outro usuário ajusta contador de curtidas em 1", async () => {
    await assertSucceeds(updateDoc(doc(db(BOB), "lists/l1"), { likesCount: 1 }));
    await assertFails(updateDoc(doc(db(BOB), "lists/l1"), { likesCount: 50 }));
  });

  it("reação só pode ser criada em nome próprio", async () => {
    await assertSucceeds(
      setDoc(doc(db(BOB), "listReactions/x1"), { listId: "l1", userId: BOB, type: "likes" })
    );
    await assertFails(
      setDoc(doc(db(BOB), "listReactions/x2"), { listId: "l1", userId: ALICE, type: "likes" })
    );
  });
});

describe("comentários", () => {
  beforeEach(async () => {
    await seed("lists/l1", { userId: ALICE, title: "Favoritas" });
    await seed("listComments/c1", {
      objectId: "l1",
      objectType: "list",
      userId: ALICE,
      content: "Oi",
      likes: {},
    });
  });

  it("cria comentário apenas em nome próprio", async () => {
    const base = { objectId: "l1", objectType: "list", content: "Legal!" };
    await assertSucceeds(setDoc(doc(db(BOB), "listComments/c2"), { ...base, userId: BOB }));
    await assertFails(setDoc(doc(db(BOB), "listComments/c3"), { ...base, userId: ALICE }));
  });

  it("outro usuário só altera a própria curtida", async () => {
    await assertSucceeds(updateDoc(doc(db(BOB), "listComments/c1"), { likes: { [BOB]: true } }));
    await assertFails(updateDoc(doc(db(BOB), "listComments/c1"), { likes: { carol: true } }));
    await assertFails(updateDoc(doc(db(BOB), "listComments/c1"), { content: "editado" }));
  });

  it("dono da lista pode excluir comentários nela", async () => {
    await seed("listComments/c9", { objectId: "l1", objectType: "list", userId: BOB, content: "x" });
    await assertSucceeds(deleteDoc(doc(db(ALICE), "listComments/c9")));
  });
});

describe("followers", () => {
  it("só segue em nome próprio", async () => {
    await assertSucceeds(
      setDoc(doc(db(BOB), "followers/f1"), { userId: ALICE, followerId: BOB })
    );
    await assertFails(
      setDoc(doc(db(BOB), "followers/f2"), { userId: "carol", followerId: ALICE })
    );
  });

  it("não segue a si mesmo", async () => {
    await assertFails(setDoc(doc(db(BOB), "followers/f3"), { userId: BOB, followerId: BOB }));
  });
});

describe("notifications", () => {
  beforeEach(async () => {
    await seed("notifications/n1", {
      userId: ALICE,
      senderId: BOB,
      message: "Bob começou a seguir você",
      read: false,
    });
  });

  it("destinatário lê e marca como lida", async () => {
    await assertSucceeds(getDoc(doc(db(ALICE), "notifications/n1")));
    await assertSucceeds(updateDoc(doc(db(ALICE), "notifications/n1"), { read: true }));
  });

  it("terceiros não leem notificações alheias", async () => {
    await assertFails(getDoc(doc(db("carol"), "notifications/n1")));
  });

  it("não é possível enviar notificação se passando por outra pessoa", async () => {
    await assertFails(
      setDoc(doc(db("carol"), "notifications/n2"), {
        userId: ALICE,
        senderId: BOB,
        message: "falsa",
      })
    );
    await assertSucceeds(
      setDoc(doc(db("carol"), "notifications/n3"), {
        userId: ALICE,
        senderId: "carol",
        message: "Carol curtiu sua avaliação",
      })
    );
  });
});

describe("watchlist", () => {
  it("só adiciona na própria watchlist", async () => {
    await assertSucceeds(
      setDoc(doc(db(ALICE), "watchlist/alice_1399"), { userId: ALICE, seriesId: 1399 })
    );
    await assertFails(
      setDoc(doc(db(BOB), "watchlist/alice_1"), { userId: ALICE, seriesId: 1 })
    );
  });
});

describe("coleções não previstas", () => {
  it("bloqueia escrita em coleções desconhecidas", async () => {
    await assertFails(setDoc(doc(db(ALICE), "counters/c1"), { value: 999 }));
  });
});
