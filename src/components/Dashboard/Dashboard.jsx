/* import React, { useState } from "react";

const Dashboard = () => {
    return(
        <h1 className="title">Guest Dashboard</h1>
    )
}
export default Dashboard; */
import React from 'react';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import {
  FaCog, FaSignOutAlt, FaUserFriends, FaUser, FaHashtag,
} from 'react-icons/fa';

export default function Dashboard() {
  const navigate = useNavigate();

  const handleBattlePlay = () => navigate('/battle');
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
        <h1 className="dashboard-title">Dashboard</h1>

        {/* Buttons */}
        <div className="button-container">
          <button type="button" className="primary-button" onClick={handleBattlePlay}>
            <FaUserFriends />
            {' '}
            Battle Play
          </button>
          <button type="button" className="secondary-button" onClick={handleSoloPlay}>
            <FaUser />
            {' '}
            Solo Play
          </button>
          <button type="button" className="secondary-button gray" onClick={handleStats}>
            <FaHashtag />
            {' '}
            Stats
          </button>
        </div>
      </div>
    </div>
  );
}
