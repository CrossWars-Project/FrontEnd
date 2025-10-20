import "./HomeScreen.css";
import { useNavigate } from "react-router-dom";

function HomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1>Crosswars!</h1>

      <div className="button-container">
        <button onClick={() => navigate("/loginSignup")}>Login</button>
        <button>Play as Guest</button>
      </div>
    </div>
  );
}

export default HomeScreen;