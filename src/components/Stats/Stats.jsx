import React, { useState } from "react";
import "./Stats.css";

export default function Stats({ userStats }) {

  // Temporary placeholder data while userStats aren't available
  const defaultStats = userStats || {
    username: "user",
    streak: 90,
    fastestSolve: 70, // noted in seconds
    wins: 42,
  };

  // Use default stats for show, until we connect with the real user stats
  const stats = userStats || defaultStats;

  // Format time as m:ss, will take in second count
  const formatTime = (timeInSeconds) => {
    const totalSeconds = Number(timeInSeconds) || 0;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0
      ? `${minutes}:${seconds.toString().padStart(2, "0")}`
      : `:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="stats-container">
        <div className="logo-container">
          <img src="src/components/assets/logo.png" alt="Cross Wars Logo" className="logo" />
        </div>

      <h2 className="stats-title">
        <i>{userStats?.username || "user"}</i> Stats
      </h2>

      <div className="stats-grid">
        <div className="stat-item">
          <h3>Streak</h3>
          <div className="stat-box">
            <p className="stat-value">{stats.streak}</p>
            <p className="stat-label">days</p>
          </div>
        </div>

        <div className="stat-item">
          <h3>Fastest Solve</h3>
          <div className="stat-box">
            <h3>Your fastest solve is</h3>
            <p className="stat-value">{formatTime(stats.fastestSolve)}</p>
          </div>
        </div>

        <div className="stat-item">
          <h3>Wins</h3>
          <div className="stat-box">
            <p className="stat-value">{stats.wins}</p>
            <p className="stat-label">wins</p>
          </div>
        </div>
      </div>
    </div>
  );
}