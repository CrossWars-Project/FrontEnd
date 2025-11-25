import './HomeScreen.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaPlay } from 'react-icons/fa';

function HomeScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if the user was sent here with a redirect (e.g. from an invite link)
  const params = new URLSearchParams(location.search);
  const redirectTo = params.get("redirect");


  const handlePlayAsGuest = () => {
    if (redirectTo) {
      navigate(`/guestDashboard?redirect=${encodeURIComponent(redirectTo)}`);
    } else {
      navigate("/guestDashboard");
    }
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
            type="button"
            className="primary-button"
            onClick={() => navigate('/loginSignup')}
          >
            <FaUser />
            {' '}
            Log In / Sign Up
          </button>
          <button type="button" className="guest-button" onClick={handlePlayAsGuest}>
            <FaPlay />
            {' '}
            Play as Guest
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomeScreen;
