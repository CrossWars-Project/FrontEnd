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

  const { session, signUpNewUser, loginUser} = UserAuth(); 
  const navigate = useNavigate()

  /*
  * handleSubmit is what will either post a new user to the database in the Sign Up case
  * or verify a user's information with info in the database in the Login case
  */
 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    if (action === "Sign Up") {
      const result = await signUpNewUser({ email, password });
      if (result.success) {
        navigate("/Dashboard");
      } else {
        console.error(result.error);
      }
    } else {
      const result = await loginUser({ email, password });
      if (result.success) {
        navigate("/dashboard");
      } else {
        console.error(result.error);
      }
    }
  } catch (err) {
    console.error("An unexpected error occurred: ", err);
  } finally {
    setLoading(false);
  }
};
 

  // is the actual structure of the Login/Sign Up component. Corresponds to the LoginSignup.css file
  // which chooses the colors/alignment etc of everything
  return (
    <div className="container">
      <div className="header">
        {/*The header of the box is chosen to be 'Login' or 'Sign Up' depending on which button the user has clicked*/}
        <div className="text">{action}</div>
      </div>

      <div className="inputs">
        {/* Only show Display Name field when you are in the Sign Up space */}
        {action === "Sign Up" && (
          <div className="input">
            <input 
                type="text" 
                placeholder="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)} 
            />
          </div>
        )}

        <div className="input">
          <input 
            type="email" 
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
             />
        </div>

        <div className="input">
          <input 
            type="password" 
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)} />
        </div>
      </div>
      <div className="submit-container">
        {/* The submit button reads Login or Create Account based on whether we are in Login or Sign Up page*/}
        <div className="submit" onClick={handleSubmit}>
          {action === "Login" ? "Login" : "Create Account"}
        </div>
      </div>
      
      {/* This container is responsible for rendering either "No account yet? Sign up"
        or "Already have an account? Login" depending on which page you are on*/}
      <div className="no-account-container">
        {action === "Login" ? (
          <>
            <div className="no-account-txt">No account yet?</div>
            <div
              className="submit gray"
              onClick={() => setAction("Sign Up")}
            >
              Sign Up
            </div>
          </>
        ) : (
          <>
            <div className="no-account-txt">Already have an account?</div>
            <div
              className="submit gray"
              onClick={() => setAction("Login")}
            >
              Login
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginSignup;
