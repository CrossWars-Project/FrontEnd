import axios from "axios";

// Use VITE_API_URL when provided (production or explicit), otherwise use relative
// path so the dev server proxy can forward requests and avoid CORS.
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// Fetch a path on the API. Default matches the original `/api/data` behavior.
export const getData = async (path = "/api/data") => {
  const res = await API.get(path);
  return res.data;
};

// Convenience helper to fetch users from the backend. If your backend exposes
// `/users` (as your `main.py` shows), call `getUsers()` in the frontend.
export const getUsers = async () => {
  return getData("/users");
};

export const createUser = async (user) => {
  const res = await API.post("/users", user); // your backend /users route
  return res.data;
};

export const loginUser = async (credentials) => {
  const res = await API.post("/login", credentials); // backend login route
  return res.data;
};