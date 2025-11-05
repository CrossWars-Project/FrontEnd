export default function setGuestMode(setUser, setSession) {
  setUser(null);
  setSession(null);
  localStorage.setItem('guest', 'true');
}