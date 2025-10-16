import { useEffect, useState } from "react";
import { getUsers } from "./api";

function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch users from backend
    getUsers().then(setUsers);
  }, []);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Crosswars!</h1>

      {/* Play as Guest button */}
      <button
        style={{
          marginTop: "1rem",
          padding: "0.6rem 1.2rem",
          fontSize: "1rem",
          backgroundColor: "#000000",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Play as Guest
      </button>

      {/* Login button */}
      <button
        style={{
          marginTop: "1rem",
          padding: "0.6rem 1.2rem",
          fontSize: "1rem",
          backgroundColor: "#000000",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Login
      </button>
    </div>
  );
}

export default App;
