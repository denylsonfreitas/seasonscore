import { describe, expect, it, vi } from "vitest";

vi.mock("../config/supabase", () => ({ supabase: {} }));
vi.mock("./tmdb", () => ({ getLatestEpisode: vi.fn() }));

import { episodeMessage } from "./episodeNotifications";

describe("aviso de novo episódio", () => {
  it("usa o formato T2 · E08 com o nome do episódio", () => {
    expect(
      episodeMessage("Terra da Máfia", { season_number: 2, episode_number: 8, name: "Fim" })
    ).toBe("Novo episódio de Terra da Máfia: T2 · E08 – Fim");
  });

  it("omite o nome quando o TMDB não informa", () => {
    expect(episodeMessage("Dark", { season_number: 1, episode_number: 10, name: " " })).toBe(
      "Novo episódio de Dark: T1 · E10"
    );
  });
});
