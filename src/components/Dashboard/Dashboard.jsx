import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import {
  FaCog, FaSignOutAlt, FaUserFriends, FaUser, FaHashtag,
} from 'react-icons/fa';
import { UserAuth } from '../../context/AuthContext';
import BattleInvite from '../BattleInvite/BattleInvite';
import '../BattleInvite/BattleInvite.css';
import { getUserStats } from '../../api';
import playedToday from '../../utils/checkPlayedToday.jsx';
import logo from '../assets/logo.png'; //import logo image so correct path is used

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = UserAuth();

  const [showInvite, setShowInvite] = useState(false);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  //battle play only creates an invite if the user has not played today
  const handleBattlePlay = () => {
    if (playedToday(stats?.dt_last_seen_battle)) {
      setPopupMessage("You have already played the battle crossword today!");
      return;
    }
    setShowInvite(true);
  };
  //solo play only navigates to the game if the user has not played today
  const handleSoloPlay = () => {
    if (playedToday(stats?.dt_last_seen_solo)) {
      setPopupMessage("You have already played the solo crossword today!");
      return;
    }
    navigate('/solo');
  };
  const handleStats = () => navigate('/stats');
  const handleSignOut = () => navigate('/');

  // fetch user stats on component mount. This is to get the date of the user's last played game for solo and battle.
  useEffect(() => {
  async function fetchStats() {
    if (!user?.id) return;
    try {
      const res = await getUserStats(user.id);
      if (res.exists && res.data.length > 0) {
        setStats(res.data[0]);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }
  fetchStats();
}, [user]);

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

      {/* popup for if user has already played today. */}
      {popupMessage && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>{popupMessage}</p>
            <button className="primary-button" onClick={() => setPopupMessage("")}>
              OK
            </button>
          </div>
        </div>
      )}
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
