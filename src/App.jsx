import { useEffect, useState } from "react";
import { getUsers } from "./api";

function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    getUsers().then(setUsers);
  }, []);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Crosswars!</h1>

      {/* Button container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column", // stack vertically
          alignItems: "center",
          gap: "1rem", // space between buttons
          marginTop: "1rem",
          
        }}
      >
        <button
          style={{
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

        <button
          style={{
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
      </div>
    </div>
  );
}

export default App;
