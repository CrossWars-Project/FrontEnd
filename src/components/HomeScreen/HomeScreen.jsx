import "./HomeScreen.css";
import { useNavigate } from "react-router-dom";
import { FaUser, FaPlay} from "react-icons/fa";


function HomeScreen() {
  const navigate = useNavigate();

  const handlePlayAsGuest = () => {
    navigate("/guestDashboard");
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <div className="logo-container">
          <img src="src/components/assets/logo.png" alt="Cross Wars Logo" className="logo" />
        </div>

        <h1 className="home-title">Cross Wars</h1>

        <div className="button-container">
          <button
            className="primary-button"
            onClick={() => navigate("/loginSignup")}
          >
            <FaUser /> Log In / Sign Up
          </button>
          <button className="guest-button" onClick={handlePlayAsGuest}>
            <FaPlay /> Play as Guest
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomeScreen;