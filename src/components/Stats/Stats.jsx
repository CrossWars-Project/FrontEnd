import React, { useState, useEffect } from 'react';
import './Stats.css';
import PropTypes from 'prop-types';
import { UserAuth } from '../../context/AuthContext';
import { getUserStats } from '../../api';

export default function Stats({ userStats }) {
  const { user } = UserAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchUserStats = async () => {
      try {
        const response = await getUserStats(user.id);
        setStats(response.data[0] || null);
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError('Could not load stats.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user]);

  // Default values (safe fallbacks)
  const defaultStats = {
    display_name: user?.user_metadata?.display_name || 'user',
    // solo
    streak_count_solo: 0,
    fastest_solo_time: 0,
    num_complete_solo: 0,
    // battle
    streak_count_battle: 0,
    fastest_battle_time: 0,
    num_wins_battle: 0,
  };

  const displayStats = { ...defaultStats, ...(stats || {}) };

  const formatTime = (timeInSeconds) => {
    const totalSeconds = Number(timeInSeconds) || 0;
    if (totalSeconds <= 0) return '—';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) return <p>Loading stats...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="stats-container">
      <div className="logo-container">
        <img src="src/components/assets/logo.png" alt="Cross Wars Logo" className="logo" />
      </div>

      <h2 className="stats-title">
        <strong>{user?.user_metadata?.display_name || displayStats.display_name}</strong>
        {' '}
        Stats
      </h2>

      <div className="stats-grid">
        {/* --- Row 1: Battle stats (move these above the solo stats) --- */}
        {/* Battle Streak */}
        <div className="stat-item">
          <h3>Battle Streak</h3>
          <div className="stat-box">
            <p className="stat-value">{displayStats.streak_count_battle}</p>
            <p className="stat-label">days</p>
          </div>
        </div>

        {/* Fastest Battle */}
        <div className="stat-item">
          <h3>Fastest Battle Time</h3>
          <div className="stat-box">
            <p className="stat-value">{formatTime(displayStats.fastest_battle_time)}</p>
            <p className="stat-label">mm:ss</p>
          </div>
        </div>

        {/* Num Battle Wins */}
        <div className="stat-item">
          <h3>Battle Wins</h3>
          <div className="stat-box">
            <p className="stat-value">{displayStats.num_wins_battle}</p>
            <p className="stat-label">wins</p>
          </div>
        </div>

        {/* --- Row 2: Solo stats --- */}
        {/* Solo Streak */}
        <div className="stat-item">
          <h3>Solo Streak</h3>
          <div className="stat-box">
            <p className="stat-value">{displayStats.streak_count_solo}</p>
            <p className="stat-label">days</p>
          </div>
        </div>

        {/* Fastest Solo */}
        <div className="stat-item">
          <h3>Fastest Solo Time</h3>
          <div className="stat-box">
            <p className="stat-value">{formatTime(displayStats.fastest_solo_time)}</p>
            <p className="stat-label">mm:ss</p>
          </div>
        </div>

        {/* Num Complete Solo */}
        <div className="stat-item">
          <h3>Solo Completions</h3>
          <div className="stat-box">
            <p className="stat-value">{displayStats.num_complete_solo}</p>
            <p className="stat-label">games</p>
          </div>
        </div>
      </div>
    </div>
  );
}

Stats.propTypes = {
  userStats: PropTypes.object,
};