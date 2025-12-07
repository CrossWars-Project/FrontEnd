import axios from 'axios';

// Use VITE_API_URL when provided (production or explicit), otherwise use relative
// path so the dev server proxy can forward requests and avoid CORS.
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// Fetch a path on the API. Default matches the original `/api/data` behavior.
export const getData = async (path = '/api/data') => {
  const res = await API.get(path);
  return res.data;
};

// Convenience helper to fetch users from the backend. If your backend exposes
// `/users` (as your `main.py` shows), call `getUsers()` in the frontend.
export const getUsers = async () => getData('/users');

export const createUser = async (user) => {
  const res = await API.post('/users', user); // your backend /users route
  return res.data;
};

// this adds a newly created user to the stats table with default stats
export const createUserStats = async (user, token) => {
  if (!token) {
    // Fail fast so caller knows they must pass a token
    throw new Error('createUserStats requires an Authorization token');
  }

  const res = await API.post('/stats/create_user_stats', user, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

// find the stats for a specific user using their ID
export const getUserStats = async (userId) => {
  const res = await API.get(`/stats/get_user_stats/${userId}`);
  return res.data;
};

// updates a user's stats in the stats table after they play a game
// accepts (payload, token) and sends Authorization: Bearer <token>
export const updateUserStats = async (userStats, token) => {
  if (!token) {
    throw new Error('updateUserStats requires an Authorization token');
  }

  const res = await API.put('/stats/update_user_stats', userStats, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return res.data;
};

// updates a user's battle stats after a battle game
// result should include winner_id to indicate who won and elapsed time.
export const updateBattleStats = async (payload, token) => {
  if (!token) {
    // Guest user → backend will just ignore, but we skip the call to avoid noise
    return { success: true, message: 'Guest user - no stats updated.' };
  }

  const res = await API.put('/stats/update_battle_stats', payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return res.data;
};

export const loginUser = async (credentials) => {
  const res = await API.post('/login', credentials); // backend login route
  return res.data;
};
