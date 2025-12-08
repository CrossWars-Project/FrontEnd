// checkPlayedToday.test.js
process.env.TZ = "America/Los_Angeles"; // Force LA timezone for stable tests

import playedToday from "./checkPlayedToday";

describe("playedToday (PST version)", () => {
  it("returns false for null or undefined dateString", () => {
    expect(playedToday(null)).toBe(false);
    expect(playedToday(undefined)).toBe(false);
  });

  it("returns false for a date that is not today", () => {
    const now = new Date();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    expect(playedToday(yesterday.toISOString())).toBe(false);

    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);

    expect(playedToday(lastWeek.toISOString())).toBe(false);
  });

  it("returns true for a date that is today", () => {
    const now = new Date();
    expect(playedToday(now.toISOString())).toBe(true);
  });

  it("handles edge case near midnight correctly", () => {
    const laNow = new Date();
    laNow.setHours(23, 50, 0, 0);

    const justNow = new Date(laNow);
    expect(playedToday(justNow.toISOString())).toBe(true);

    // Simulate 20 minutes later → next LA calendar day
    const laNextDay = new Date(laNow);
    laNextDay.setMinutes(laNow.getMinutes() + 20);

    // Should be false because it's tomorrow in LA time
    expect(playedToday(laNextDay.toISOString())).toBe(false);
  });

});
