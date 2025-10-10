import { useEffect, useState } from "react";
import { getUsers } from "./api";

function App() {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch users from backend
    getUsers().then(setUsers);
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>React + FastAPI + Supabase</h1>

      <h2>Users</h2>
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              {user.name} ({user.email})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
