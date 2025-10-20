import { useEffect, useState } from "react";
import { getUsers } from "./api";
import LoginSignup from "./components/LoginSignup/LoginSignup.jsx";

function App() {
  const [users, setUsers] = useState([]);
  const [showLogin, setShowLogin] = useState(false); // <-- add this

  useEffect(() => {
    getUsers().then(setUsers);
  }, []);

  // If login is active, render the login/signup screen
  if (showLogin) {
    return <LoginSignup />;
  }

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Crosswars!</h1>

      {/* Button container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column", // stack vertically
          alignItems: "center",
          gap: "1rem",
          marginTop: "1rem",
        }}
      >
        <button
          onClick={() => setShowLogin(true)} // <-- show login on click
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
