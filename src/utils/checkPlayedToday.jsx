// helper function which checks if the user has already played today.
export default function playedToday(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}