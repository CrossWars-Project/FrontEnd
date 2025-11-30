import React, { useState } from 'react';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import {
  FaCog, FaSignOutAlt, FaUserFriends, FaUser, FaHashtag,
} from 'react-icons/fa';
import { UserAuth } from '../../context/AuthContext';
import BattleInvite from '../BattleInvite/BattleInvite';
import '../BattleInvite/BattleInvite.css';
import logo from '../assets/logo.png'; //import logo image so correct path is used

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = UserAuth();

  const [showInvite, setShowInvite] = useState(false);
  const [inviteInfo, setInviteInfo] = useState(null);
  const handleBattlePlay = () => setShowInvite(true);
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
            <img src={logo} alt="Cross Wars Logo" className="logo" />
          </div>
        </div>

        {/* Title */}
        <h1 className="dashboard-title">
          Welcome to the Dashboard
          {' '}
          <strong>{ user?.user_metadata?.display_name || user?.email || 'Guest'}</strong>
        </h1>

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

      {showInvite && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowInvite(false)}>×</button>
            <BattleInvite
              onClose={() => setShowInvite(false)}
              onCreated={(info) => {
                setInviteInfo(info);
              }}
            />

            {inviteInfo?.inviteToken && (
              <div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    setShowInvite(false);
                    navigate(`/battle/${inviteInfo.inviteToken}`);
                  }}
                >
                  Enter Battle
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
