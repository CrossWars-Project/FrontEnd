import React from "react";
import "./GuestDashboard.css";
import { useNavigate } from "react-router-dom";
import { FaCog, FaSignOutAlt, FaUserFriends, FaUser, FaHashtag } from "react-icons/fa";

export default function GuestDashboard() {
  const navigate = useNavigate();

  const handleSoloPlay = () => navigate('/solo');
  const handleStats = () => navigate('/stats');
  const handleSignOut = () => navigate('/');

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        {/* Header Buttons */}
        <div className="top-buttons">
          <button type="button" className="top-button gray" onClick={handleSignOut}>
            <FaSignOutAlt />
            {' '}
            Exit
          </button>
        </div>

        {/* Logo */}
        <div className="logo-container">
          <div className="logo-container">
            <img src="src/components/assets/logo.png" alt="Cross Wars Logo" className="logo" />
          </div>
        </div>

        {/* Title */}
        <h1 className="dashboard-title">Guest Dashboard</h1>

        {/* Buttons */}
        <div className="button-container">
          <button type="button" className="primary-button" onClick={handleSoloPlay}>
            <FaUserFriends />
            {' '}
            Solo Play
          </button>
        </div>
      </div>
    </div>
  );
}
