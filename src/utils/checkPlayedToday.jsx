export default function playedToday(dateString) {
  if (!dateString) return false;

  const inputUTC = new Date(dateString);
  if (isNaN(inputUTC)) return false;

  // Convert both dates into America/Los_Angeles calendar time
  const inputLocal = new Date(
    inputUTC.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
  );

  const nowLocal = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
  );

  return (
    inputLocal.getFullYear() === nowLocal.getFullYear() &&
    inputLocal.getMonth() === nowLocal.getMonth() &&
    inputLocal.getDate() === nowLocal.getDate()
  );
}
