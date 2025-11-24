import React, { useState } from "react";
import "./LoginSignup.css";
import { useNavigate, useLocation } from "react-router-dom";
import { UserAuth } from "../../context/AuthContext";
import { createUserStats, getUserStats } from "../../api";

function LoginSignup() {
  const [action, setAction] = useState("Login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { signUpNewUser, loginUser, setGuestMode } = UserAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // redirect target from invite or default
  const redirectTo = location.state?.from || new URLSearchParams(location.search).get("redirect") || "/dashboard";

  const MIN_PASSWORD_LENGTH = 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (action === 'Sign Up') {
        // alert user if the password they tried is too short
        if (!password || password.length < MIN_PASSWORD_LENGTH) {
          alert(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
          setLoading(false);
          return;
        }
        const result = await signUpNewUser({ email, password, displayName });
        if (result.success) {
          // show message telling user to verify their email
          alert('Sign-up successful! Please verify your email before logging in.');
          setAction('Login'); // redirect to login screen
        } else {
          // show returned error message (ex: invalid email) if present
          alert(result.error?.message || result.error || 'Sign-up failed');
        }
      } else {
        const result = await loginUser({ email, password });
        if (!result.success) {
          alert(result.error?.message || result.error || "An unexpected error occurred");
          return;
        }

        const { user } = result.data;

        try {
          const statsResponse = await getUserStats(user.id);
          if (!statsResponse.exists) {
            await createUserStats({
              id: user.id,
              display_name: user.user_metadata?.display_name || user.email.split("@")[0],
            });
          }
        } catch (err) {
          console.error("Error creating stats:", err);
        }

        // Navigate to invite accept or dashboard
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAsGuest = async () => {
    setGuestMode();
    sessionStorage.setItem("guestUser", "true");

    // Navigate back to invite accept page if exists
    navigate(redirectTo, { replace: true });
  };

  let buttonText = loading ? "Loading..." : action === "Login" ? "Log In" : "Create Account";

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-container">
          <img src="src/components/assets/logo.png" alt="Cross Wars Logo" className="logo" />
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

        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />

        <button type="button" onClick={handleSubmit} className="primary-button" disabled={loading}>
          {buttonText}
        </button>

        <div className="toggle-container">
          <p className="toggle-text">{action === "Login" ? "No account yet?" : "Already have an account?"}</p>
          <button type="button" onClick={() => setAction(action === "Login" ? "Sign Up" : "Login")} className="secondary-button">
            {action === "Login" ? "Sign Up" : "Log In"}
          </button>
        </div>

        {action === "Login" && (
          <button type="button" onClick={handlePlayAsGuest} className="guest-button">
            ▶ Play as Guest
          </button>
        )}
      </div>
    </div>
  );
}

export default LoginSignup;
