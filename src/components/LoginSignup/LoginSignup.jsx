import React, { useState } from "react";
import "./LoginSignup.css";

const LoginSignup = () => {
  const [action, setAction] = useState("Login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /*
  * handleSubmit is what will either post a new user to the database in the Sign Up case
  * or verify a user's information with info in the database in the Login case
  */
 const handleSubmit = async () => {
    if (action === "Sign Up") {
      if (!displayName || !email || !password) {
        alert("Please fill out all fields");
        return;
      }

      try {
        const data = await createUser({
          name: displayName,
          email,
          password,
        });
        alert("Account created successfully!");
        console.log("Created user:", data);

        setDisplayName("");
        setEmail("");
        setPassword("");
        setAction("Login");
      } catch (error) {
        console.error(error);
        alert(error.response?.data?.message || "Error creating account");
      }
    } else {
      // Login
      try {
        const data = await loginUser({ email, password });
        alert("Login successful!");
        console.log("Logged in:", data);
        // optionally redirect to /dashboard or save token
      } catch (error) {
        console.error(error);
        alert(error.response?.data?.message || "Login failed");
      }
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
