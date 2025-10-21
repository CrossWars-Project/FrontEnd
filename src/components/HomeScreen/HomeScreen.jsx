import "./HomeScreen.css";
import { useNavigate } from "react-router-dom";

function HomeScreen() {
  const navigate = useNavigate();

  const handlePlayAsGuest = () => {
    navigate("/dashboard");
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <div className="logo-container">
          <img src="/logo.png" alt="Cross Wars Logo" className="logo" />
        </div>

        <h1 className="home-title">Cross Wars</h1>

        <div className="button-container">
          <button
            className="primary-button"
            onClick={() => navigate("/loginSignup")}
          >
            Log In / Sign Up
          </button>
          <button className="guest-button" onClick={handlePlayAsGuest}>
            ▶ Play as Guest
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomeScreen;