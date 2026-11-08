import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatNotificationDate, formatRelativeTime } from "./dateUtils";

const NOW = new Date("2026-06-15T12:00:00Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms);
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("dateUtils", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  describe("formatRelativeTime", () => {
    it.each([
      [null, "recentemente"],
      [ago(10 * 1000), "agora mesmo"],
      [ago(1 * MIN), "há 1 minuto"],
      [ago(5 * MIN), "há 5 minutos"],
      [ago(2 * HOUR), "há 2 horas"],
      [ago(1 * DAY), "há 1 dia"],
      [ago(14 * DAY), "há 2 semanas"],
      [ago(60 * DAY), "há 2 meses"],
      [ago(800 * DAY), "há 2 anos"],
    ])("%s → %s", (date, expected) => {
      expect(formatRelativeTime(date)).toBe(expected);
    });
  });

  describe("formatNotificationDate", () => {
    it("usa formatos curtos para datas recentes", () => {
      expect(formatNotificationDate(undefined)).toBe("Agora");
      expect(formatNotificationDate(ago(30 * 1000))).toBe("Agora");
      expect(formatNotificationDate(ago(15 * MIN))).toBe("15m atrás");
      expect(formatNotificationDate(ago(3 * HOUR))).toBe("3h atrás");
      expect(formatNotificationDate(ago(2 * DAY))).toBe("2d atrás");
    });

    it("mostra o ano para datas de anos anteriores", () => {
      expect(formatNotificationDate(new Date("2024-03-10T12:00:00Z"))).toMatch(/2024/);
    });
  });
});
