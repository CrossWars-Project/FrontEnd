import formatTime from "../src/utils/formatTime";

describe('formatTime', () => {
  test('formats seconds less than a minute', () => {
    expect(formatTime(0)).toBe(':00');
    expect(formatTime(5)).toBe(':05');
    expect(formatTime(59)).toBe(':59');
  });

  test('formats seconds into minutes and seconds', () => {
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(75)).toBe('1:15');
    expect(formatTime(125)).toBe('2:05');
  });

  test('handles non-numeric input gracefully', () => {
    expect(formatTime(null)).toBe(':00');
    expect(formatTime(undefined)).toBe(':00');
    expect(formatTime('abc')).toBe(':00');
  });

  test('handles exact multiples of minutes', () => {
    expect(formatTime(120)).toBe('2:00');
    expect(formatTime(180)).toBe('3:00');
  });
});
