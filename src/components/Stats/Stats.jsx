import React, { useState, useEffect } from 'react';
import './Stats.css';
import PropTypes from 'prop-types';
import { UserAuth } from '../../context/AuthContext';
import { getUserStats } from '../../api';
import { formatTime } from '../../utils/formatTime';

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

  const defaultStats = {
    display_name: 'user',
    streak_count: 0,
    fastest_solo_time: 0,
    num_wins: 0,
  };

  const displayStats = stats || defaultStats;

  if (loading) return <p>Loading stats...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="stats-container">
      <div className="logo-container">
        <img src="src/components/assets/logo.png" alt="Cross Wars Logo" className="logo" />
      </div>

      <h2 className="stats-title">
        <strong>{user.user_metadata?.display_name}</strong>
        {' '}
        Stats
      </h2>

      <div className="stats-grid">
        <div className="stat-item">
          <h3>Streak</h3>
          <div className="stat-box">
            <p className="stat-value">{displayStats.streak_count}</p>
            <p className="stat-label">days</p>
          </div>
        </div>

        <div className="stat-item">
          <h3>Fastest Solve</h3>
          <div className="stat-box">
            <h3>Your fastest solve is</h3>
            <p className="stat-value">{formatTime(displayStats.fastest_solo_time)}</p>
          </div>
        </div>

        <div className="stat-item">
          <h3>Wins</h3>
          <div className="stat-box">
            <p className="stat-value">{displayStats.num_wins}</p>
            <p className="stat-label">wins</p>
          </div>
        </div>
      </div>
    </div>
  );
}
