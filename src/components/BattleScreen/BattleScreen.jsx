import React, { useState, useEffect } from "react";
import "./BattleScreen.css";
import { useNavigate } from "react-router-dom";
import { FaCog, FaSignOutAlt, FaUserFriends, FaUser, FaHashtag } from "react-icons/fa";


const GRID_SIZE = 5;


export default function BattleScreen() {
  const navigate = useNavigate();
  const handleSignOut = () => navigate('/guestDashboard');
  // 5x5 crossword grid state for player
  const [grid, setGrid] = useState(
    Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(""))
  );

  // Generate random opponent progress pattern
  const [opponentGrid, setOpponentGrid] = useState(
    Array(GRID_SIZE)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE)
          .fill(false)
          .map(() => Math.random() < 0.4) // ~40% cells filled (green), random to be later replaced
      )
  );

  // Handle player input
  const handleInput = (row, col, value) => {
    if (value.match(/^[A-Za-z]?$/)) {
      const newGrid = grid.map((r) => [...r]);
      newGrid[row][col] = value.toUpperCase();
      setGrid(newGrid);
    }
  };

  // Calculate user and opponent completion
  const userFilled = grid.flat().filter((c) => c !== "").length;
  const userProgress = Math.round((userFilled / (GRID_SIZE * GRID_SIZE)) * 100);

  const opponentFilled = opponentGrid.flat().filter((c) => c).length;
  const opponentProgress = Math.round(
    (opponentFilled / (GRID_SIZE * GRID_SIZE)) * 100
  );

  const placeholderClues = [
    "1. Placeholder clue",
    "2. Placeholder clue",
    "3. Placeholder clue",
    "4. Placeholder clue",
    "5. Placeholder clue",
  ];

  return (
    <div className="battle-container">
      <div className="battle-header">
        <button type="button" className="top-button gray" onClick={handleSignOut}>
                    <FaSignOutAlt />
                    {' '}
                    Quit
                  </button>

        <div className="progress-section">
          <div className="progress-item">
            <h3>username</h3>
            <div className="mini-crossword user">
              {grid.map((row, rIdx) => (
                <div key={rIdx} className="mini-row">
                  {row.map((_, cIdx) => (
                    <div key={cIdx} className="mini-cell"></div>
                  ))}
                </div>
              ))}
            </div>
            <p className="progress-text user">{userProgress}%</p>
          </div>

          <div className="progress-item">
            <h3>opponent</h3>
            <div className="mini-crossword opponent">
              {opponentGrid.map((row, rIdx) => (
                <div key={rIdx} className="mini-row">
                  {row.map((filled, cIdx) => (
                    <div
                      key={cIdx}
                      className={`mini-cell ${
                        filled ? "mini-cell-green" : ""
                      }`}
                    ></div>
                  ))}
                </div>
              ))}
            </div>
            <p className="progress-text opponent">{opponentProgress}%</p>
          </div>
        </div>
      </div>

      <div className="battle-body">
        {/* Player Crossword */}
        <div className="crossword-container">
          {grid.map((row, rIdx) => (
            <div key={rIdx} className="row">
              {row.map((cell, cIdx) => (
                <input
                  key={cIdx}
                  type="text"
                  maxLength="1"
                  className="cell"
                  value={cell}
                  onChange={(e) => handleInput(rIdx, cIdx, e.target.value)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Placeholder Clues */}
        <div className="clues-container">
          <h3>Across</h3>
          <ul>
            {placeholderClues.map((clue, i) => (
              <li key={i}>{clue}</li>
            ))}
          </ul>
          <h3>Down</h3>
          <ul>
            {placeholderClues.map((clue, i) => (
              <li key={i}>{clue}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
