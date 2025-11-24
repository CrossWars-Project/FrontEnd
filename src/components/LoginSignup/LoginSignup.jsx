import React, { useState } from 'react';
import './LoginSignup.css';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../../context/AuthContext';
import { createUserStats, getUserStats } from '../../api';

function LoginSignup() {
  const [action, setAction] = useState('Login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { signUpNewUser, loginUser, setGuestMode } = UserAuth();
  const navigate = useNavigate();

  const MIN_PASSWORD_LENGTH = 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (action === 'Sign Up') {
        if (action === 'Sign Up') {
        // alert user if the password they tried is too short
        if (!password || password.length < MIN_PASSWORD_LENGTH) {
          alert(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
          setLoading(false);
          return;
        }
        const result = await signUpNewUser({ email, password, displayName });
        // if a new user is successfully created, we want to add them to stats table and then
        // take them to the dashboard.
        if (result.success) {
          // show a friendly message (e.g., toast or inline text)
          alert('Sign-up successful! Please verify your email before logging in.');
          setAction('Login'); // redirect to login screen
        }
      } else {
        const result = await loginUser({ email, password });
        if (!result.success) {
          // Show the error message directly
          alert(result.error?.message || result.error || 'An unexpected error occurred');
          return;
        }

        if (result.success) {
          const { user } = result.data;

          try {
          // ✅ Check if stats already exist
            const statsResponse = await getUserStats(user.id);
            if (!statsResponse.exists) {
              await createUserStats({
                id: user.id,
                display_name: user.user_metadata?.display_name || user.email.split('@')[0], // fallback
              });
            }
          } catch (err) {
            console.error('Error while checking/creating stats:', err);
          // Not fatal — allow navigation
          }
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('An unexpected error occurred:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAsGuest = () => {
    setGuestMode();
    navigate('/guestDashboard');
  };

  let buttonText;
  if (loading) {
    buttonText = 'Loading...';
  } else if (action === 'Login') {
    buttonText = 'Log In';
  } else {
    buttonText = 'Create Account';
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-container">
          <img src="src/components/assets/logo.png" alt="Cross Wars Logo" className="logo" />
        </div>

        <h1 className="title">{action === 'Login' ? 'Log in' : 'Sign up'}</h1>

        {action === 'Sign Up' && (
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

        <button type="button" onClick={handleSubmit} className="primary-button" disabled={loading}>
          {buttonText}
        </button>

        <div className="toggle-container">
          <p className="toggle-text">
            {action === 'Login' ? 'No account yet?' : 'Already have an account?'}
          </p>
          <button
            type="button"
            onClick={() => setAction(action === 'Login' ? 'Sign Up' : 'Login')}
            className="secondary-button"
          >
            {action === 'Login' ? 'Sign Up' : 'Log In'}
          </button>
        </div>

        {action === 'Login' && (
          <button type="button" onClick={handlePlayAsGuest} className="guest-button">
            ▶ Play as Guest
          </button>
        )}
      </div>
    </div>
  );
}

export default LoginSignup;
