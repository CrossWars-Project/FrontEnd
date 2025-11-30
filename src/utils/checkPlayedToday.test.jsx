import playedToday from "./checkPlayedToday";

describe("playedToday", () => {
  it("returns false for null or undefined dateString", () => {
    expect(playedToday(null)).toBe(false);
    expect(playedToday(undefined)).toBe(false);
  });

  it("returns false for a date that is not today", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(playedToday(yesterday.toISOString())).toBe(false);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    expect(playedToday(lastWeek.toISOString())).toBe(false);
  });

  it("returns true for a date that is today", () => {
    const now = new Date();
    expect(playedToday(now.toISOString())).toBe(true);
  });
});