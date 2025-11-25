import React, { useState, useEffect, useRef } from "react";
import "./SoloPlay.css";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaClock } from "react-icons/fa";
import { UserAuth } from "../../context/AuthContext";
import { updateUserStats } from "../../api";

const GRID_SIZE = 5;

export default function SoloPlay() {
  const { user, session } = UserAuth();
  const navigate = useNavigate();
  const handleSignOut = () => {
  if (user && session) {
    navigate('/dashboard'); // logged-in dashboard
  } else {
    navigate('/guestDashboard'); // guest dashboard
  }
};

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ---------------- Crossword State ----------------
  const [solution, setSolution] = useState([]);
  const [grid, setGrid] = useState([]);
  const [cluesAcross, setCluesAcross] = useState([]);
  const [cluesDown, setCluesDown] = useState([]);
  const [numberedCells, setNumberedCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [crosswordFetched, setCrosswordFetched] = useState(false);

  // ---------------- Timer State ----------------
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  // ---------------- Completion ----------------
  const [isCompleted, setIsCompleted] = useState(false);

  // ---------------- Send Stats ----------------
  const [hasSentStats, setHasSentStats] = useState(false);

  // ---------------- Fetch Crossword ----------------
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Prevent double fetch using ref (survives React StrictMode remounts)
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    async function fetchCrossword() {
      setLoading(true);
      try {
        // Fetch the daily solo play crossword
        const res = await fetch('http://127.0.0.1:8000/crossword/solo', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error('Failed to fetch crossword');

        const data = await res.json();
        const crossword = data.data;
        if (!crossword || !crossword.grid) throw new Error('No grid returned');

        const formattedGrid = crossword.grid.map((row) => row.map((cell) => (cell === '-' ? ' ' : cell)));

        // --- Numbering Logic: Assign numbers based on backend's placed_words order ---
        const numbered = formattedGrid.map((row) => row.map(() => null));
        
        let clueNumber = 1;
        const acrossClueNumbers = [];
        const downClueNumbers = [];

        // Number cells in the order backend provides them in placed_words
        crossword.placed_words.forEach(([word, row, col, isAcross]) => {
          // Only assign a number if this cell doesn't already have one
          if (numbered[row][col] === null) {
            numbered[row][col] = clueNumber;
            clueNumber++;
          }
          
          // Track which number corresponds to this clue
          if (isAcross) {
            acrossClueNumbers.push(numbered[row][col]);
          } else {
            downClueNumbers.push(numbered[row][col]);
          }
        });

        // Attach backend clues with the correct numbers
        const numberedAcross = crossword.clues_across?.map((clue, i) => ({
          number: acrossClueNumbers[i],
          text: clue,
        })) || [];

        const numberedDown = crossword.clues_down?.map((clue, i) => ({
          number: downClueNumbers[i],
          text: clue,
        })) || [];

        setSolution(formattedGrid);
        setGrid(formattedGrid.map((r) => r.map((c) => (c === ' ' ? null : ''))));
        setCluesAcross(numberedAcross);
        setCluesDown(numberedDown);
        setNumberedCells(numbered);
        setStartTime(Date.now());
        setLoading(false);
        setCrosswordFetched(true);
      } catch (err) {
        console.error('Error fetching crossword:', err);
        setLoading(false);
      }
    }
    fetchCrossword();
  }, []);

  // ---------------- Timer ----------------
  useEffect(() => {
    if (!startTime) return;
    const timer = setInterval(() => {
      if (!isCompleted) setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, isCompleted]);

  // ---------------- Handle Input ----------------
  const handleInput = (row, col, value) => {
    if (solution[row][col] === ' ') return;
    const newGrid = grid.map((r) => [...r]);
    const letter = value.slice(-1).toUpperCase();
    if (/^[A-Z]$/.test(letter)) {
      newGrid[row][col] = letter;
      let nextCol = col + 1;
      while (nextCol < GRID_SIZE && solution[row][nextCol] === ' ') nextCol++;
      if (nextCol < GRID_SIZE) {
        const nextInput = document.getElementById(`cell-${row}-${nextCol}`);
        if (nextInput) nextInput.focus();
      }
    } else if (value === '') {
      newGrid[row][col] = '';
    }
    setGrid(newGrid);
  };

  // ---------------- Win Check ----------------
  useEffect(() => {
    if (!solution.length) return;
    const allCorrect = solution.every((row, r) => row.every((cell, c) => cell === ' ' || grid[r][c]?.toUpperCase() === cell));
    if (allCorrect && !isCompleted) setIsCompleted(true);
  }, [grid, solution, isCompleted]);

  // ---------------- Send Stats ---------------
useEffect(() => {
  if (isCompleted && user && session && !hasSentStats) {
    setHasSentStats(true); // prevent multiple calls

    (async () => {
      try {
        // Try common session token shapes (adapt if your UserAuth uses a different shape)
        const token = session?.access_token || session?.accessToken || null;

        if (!token) {
          console.warn('No session token available; skipping stats update');
          return;
        }

        await updateUserStats(
          {
            num_solo_games: 1, // backend handles increment / better logic
            num_complete_solo: 1,
            fastest_solo_time: elapsed,
            dt_last_seen_solo: new Date().toISOString(),
          },
          token
        );
        console.log('Stats update sent successfully!');
      } catch (err) {
        console.error('Failed to update stats:', err);
      }
    })();
  }
}, [isCompleted, user, session, elapsed, hasSentStats]);

  // ---------------- Progress ----------------
  const userFilled = grid.flat().filter((c) => c && c !== '').length;
  const totalLetters = solution.flat().filter((c) => c !== ' ').length;
  const userProgress = solution.length ? Math.round((userFilled / totalLetters) * 100) : 0;

  // ---------------- Loading ----------------
  if (loading) {
    return (
      <div className="battle-container">
        <div className="loading-popup">
          <p>Loading today's crossword...</p>
        </div>
      </div>
    );
  }

  // ---------------- Render ----------------
  return (
    <div className="battle-container">
      <div className="battle-header">
        <button type="button" className="top-button gray" onClick={handleSignOut}>
          <FaSignOutAlt />
          {' '}
          Quit
        </button>
        <div className="timer-display">
          <FaClock />
          {' '}
          {formatTime(elapsed)}
        </div>
      </div>

      <div className="battle-body">
        {/* Crossword Grid */}
        <div className="crossword-container">
          {grid.map((row, rIdx) => (
            <div key={rIdx} className="row">
              {row.map((cell, cIdx) => (
                <div
                  key={cIdx}
                  className={`cell-wrapper ${solution[rIdx][cIdx] === ' ' ? 'black-cell' : ''}`}
                >
                  {solution[rIdx][cIdx] !== ' ' && (
                    <>
                      {numberedCells[rIdx]?.[cIdx] && (
                        <span className="cell-number">{numberedCells[rIdx][cIdx]}</span>
                      )}
                      <input
                        id={`cell-${rIdx}-${cIdx}`}
                        type="text"
                        maxLength="1"
                        className="cell"
                        value={cell || ''}
                        onChange={(e) => handleInput(rIdx, cIdx, e.target.value)}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Clues */}
        <div className="clues-container">
          <h3>Across</h3>
          <ul>
            {cluesAcross.map((clue) => (
              <li key={`across-${clue.number}`}>
                <strong>
                  {clue.number}
                  .
                </strong>
                {' '}
                {clue.text}
              </li>
            ))}
          </ul>

          <h3>Down</h3>
          <ul>
            {cluesDown.map((clue) => (
              <li key={`down-${clue.number}`}>
                <strong>
                  {clue.number}
                  .
                </strong>
                {' '}
                {clue.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Win Popup */}
      {isCompleted && (
        <div className="popup-overlay">
          <div className="popup">
            <div className="logo-container mb-4">
              <img
                src="src/components/assets/logo.png"
                alt="Cross Wars Logo"
                className="logo"
              />
            </div>

            <h2 className="popup-title"> Puzzle Complete!</h2>

            <div className="popup-content">
              <p className="popup-time">
                You finished in
                {' '}
                <strong>{formatTime(elapsed)}</strong>
                !
              </p>
            </div>

            <div className="popup-actions">
              <button
                className="popup-button"
                onClick={() => {
                  if (user && session) {
                    navigate("/dashboard");
                  } else {
                    navigate("/guestDashboard");
                  }
                }}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}