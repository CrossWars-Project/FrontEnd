import React, { useState, useEffect } from "react";
import "./Stats.css";
import { UserAuth } from '../../context/AuthContext';
import { getUserStats } from "../../api";

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
        setStats(response);
      } catch (err) {
        console.error("Error fetching user stats:", err);
        setError("Could not load stats.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user]);

  const defaultStats = {
    username: "user",
    streak: 90,
    fastestSolve: 70,
    wins: 42,
  };

  const displayStats = stats || userStats || defaultStats;

  const formatTime = (timeInSeconds) => {
    const totalSeconds = Number(timeInSeconds) || 0;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0
      ? `${minutes}:${seconds.toString().padStart(2, "0")}`
      : `:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading) return <p>Loading stats...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="stats-container">
      <div className="logo-container">
        <img src="src/components/assets/logo.png" alt="Cross Wars Logo" className="logo" />
      </div>

      <h2 className="stats-title">
        <strong>{user.user_metadata?.display_name}</strong> Stats
      </h2>

      <div className="stats-grid">
        <div className="stat-item">
          <h3>Streak</h3>
          <div className="stat-box">
            <p className="stat-value">{displayStats.streak}</p>
            <p className="stat-label">days</p>
          </div>
        </div>

        <div className="stat-item">
          <h3>Fastest Solve</h3>
          <div className="stat-box">
            <h3>Your fastest solve is</h3>
            <p className="stat-value">{formatTime(displayStats.fastestSolve)}</p>
          </div>
        </div>

        <div className="stat-item">
          <h3>Wins</h3>
          <div className="stat-box">
            <p className="stat-value">{displayStats.wins}</p>
            <p className="stat-label">wins</p>
          </div>
        </div>
      </div>
    </div>
  );
}
