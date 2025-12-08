import playedToday from "./checkPlayedToday";

// Generate a UTC string corresponding to a PST date/time
function makeUTCFromPST({ year, month, day, hour, minute = 0, second = 0 }) {
  return new Date(Date.UTC(year, month, day, hour + 8, minute, second)).toISOString();
}

describe("playedToday", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test("returns false when last play was 11pm PST and now is 1am PST next day", () => {
    const lastPlayUTC = makeUTCFromPST({ year: 2025, month: 0, day: 1, hour: 23 });
    const now = new Date(Date.UTC(2025, 0, 2, 9, 0)); // Jan 2, 01:00 PST = 09:00 UTC
    jest.setSystemTime(now);

    expect(playedToday(lastPlayUTC)).toBe(false);
  });

  test("returns true when last play was 9pm PST and now is 11pm PST same day", () => {
    const lastPlayUTC = makeUTCFromPST({ year: 2025, month: 0, day: 1, hour: 21 });
    const now = new Date(Date.UTC(2025, 0, 2, 7, 0)); // Jan 1, 23:00 PST = Jan 2, 07:00 UTC
    jest.setSystemTime(now);

    expect(playedToday(lastPlayUTC)).toBe(true);
  });
});