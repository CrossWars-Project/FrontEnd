import React, { useState } from "react";
import "./LoginSignup.css";
import { UserAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const LoginSignup = () => {
  const [action, setAction] = useState("Login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { signUpNewUser, loginUser } = UserAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (action === "Sign Up") {
        const result = await signUpNewUser({ email, password });
        if (result.success) navigate("/dashboard");
      } else {
        const result = await loginUser({ email, password });
        if (result.success) navigate("/dashboard");
      }
    } catch (err) {
      console.error("An unexpected error occurred:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAsGuest = () => {
    navigate("/dashboard");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-container">
          <img src="/logo.png" alt="Cross Wars Logo" className="logo" />
        </div>

        <h1 className="title">{action === "Login" ? "Log in" : "Sign up"}</h1>

        {action === "Sign Up" && (
          <input
            type="text"
            placeholder="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input"
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />

        <button
          onClick={handleSubmit}
          className="primary-button"
          disabled={loading}
        >
          {loading
            ? "Loading..."
            : action === "Login"
            ? "Log In"
            : "Create Account"}
        </button>

        <div className="toggle-container">
          <p className="toggle-text">
            {action === "Login" ? "No account yet?" : "Already have an account?"}
          </p>
          <button
            onClick={() =>
              setAction(action === "Login" ? "Sign Up" : "Login")
            }
            className="secondary-button"
          >
            {action === "Login" ? "Sign Up" : "Log In"}
          </button>
        </div>

        {action === "Login" && (
          <button onClick={handlePlayAsGuest} className="guest-button">
            ▶ Play as Guest
          </button>
        )}
      </div>
    </div>
  );
};

export default LoginSignup;
