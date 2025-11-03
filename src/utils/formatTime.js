export function formatTime(timeInSeconds) {
  const totalSeconds = Number(timeInSeconds) || 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0
    ? `${minutes}:${seconds.toString().padStart(2, '0')}`
    : `:${seconds.toString().padStart(2, '0')}`;
}
