// helper function which checks if the user has already played today.
export default function playedToday(dateString) {
  if (!dateString) return false;

  const playedUTC = new Date(dateString); // this is UTC from Supabase
  const playedLA = toLA(playedUTC);

  const nowLA = toLA(new Date());

  return (
    playedLA.getFullYear() === nowLA.getFullYear() &&
    playedLA.getMonth() === nowLA.getMonth() &&
    playedLA.getDate() === nowLA.getDate()
  );
}

// Convert any date into Los Angeles time
function toLA(date) {
  return new Date(
    date.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
  );
}
