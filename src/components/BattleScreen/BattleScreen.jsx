import React, { useState, useEffect, useRef } from "react";
import "./BattleScreen.css";
import { useNavigate, useParams } from "react-router-dom";
import { FaSignOutAlt, FaClock } from "react-icons/fa";
import { UserAuth } from "../../context/AuthContext";
import supabase from "../../supabaseClient";

const GRID_SIZE = 5;

export default function BattlePlay() {
  const { user, session } = UserAuth();
  const { battleId } = useParams();
  const navigate = useNavigate();

  const battleChannelRef = useRef(null); // store channel
  const channelReadyRef = useRef(false); // true when SUBSCRIBED
  const sendRetryRef = useRef(0);

  // ---------------- Crossword State ----------------
  const [solution, setSolution] = useState([]);
  const [grid, setGrid] = useState([]);
  const [cluesAcross, setCluesAcross] = useState([]);
  const [cluesDown, setCluesDown] = useState([]);
  const [numberedCells, setNumberedCells] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ---------------- Timer State ----------------
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  // ---------------- Completion ----------------
  const [isCompleted, setIsCompleted] = useState(false);

  // ---------------- Selection Tracking ----------------
  const [selectedCell, setSelectedCell] = useState(null); // your selection
  const [opponentSelection, setOpponentSelection] = useState({ row: null, col: null });
  

  // ---------------- Fetch Crossword ----------------
  const hasFetchedRef = useRef(false);

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

  useEffect(() => {
    // Prevent double fetch using ref (survives React StrictMode remounts)
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    async function fetchCrossword() {
      setLoading(true);
      try {
        // Fetch the daily battle play crossword
        const res = await fetch('http://127.0.0.1:8000/crossword/battle', {
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
        // setCrosswordFetched(true);
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


  // ---------------- Realtime channel create + listener ----------------
  useEffect(() => {
    if (!battleId) return;

    // Create channel and attach listener BEFORE subscribing
    const channel = supabase.channel(`battle-${battleId}`);

    channel.on(
      "broadcast",
      { event: "cell_selected" },
      (msg) => {
        try {
          const payload = msg.payload ?? {};
          // Coerce to numbers defensively
          const row = payload.row !== undefined ? Number(payload.row) : null;
          const col = payload.col !== undefined ? Number(payload.col) : null;
          const player = payload.player ?? payload.playerId ?? null;
          if (player === (user?.user_id || "guest")) return;
          if (row === null || col === null) return;
          setOpponentSelection({ row, col });
        } catch (e) {
          console.error("Malformed broadcast payload", e);
        }
      }
    );

    // subscribe and mark ready
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        battleChannelRef.current = channel;
        channelReadyRef.current = true;
        sendRetryRef.current = 0;
        // console.log("Supabase realtime subscribed to", battleId);
      }
    });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        // ignore remove errors
      }
      battleChannelRef.current = null;
      channelReadyRef.current = false;
    };
  }, [battleId, user?.id]);

  // ---------------- safe broadcast with retries ----------------
  const broadcastSelection = (row, col) => {
    const attemptSend = () => {
      const ch = battleChannelRef.current;
      const ready = channelReadyRef.current;
      if (!ch || !ready) {
        // try up to 10 times then bail
        if ((sendRetryRef.current ?? 0) < 10) {
          sendRetryRef.current = (sendRetryRef.current ?? 0) + 1;
          setTimeout(attemptSend, 120);
        } else {
          console.warn("Realtime channel not ready; selection not broadcast");
        }
        return;
      }

      ch.send({
        type: "broadcast",
        event: "cell_selected",
        payload: {
          row,
          col,
          player: user?.id || "guest",
        },
      }).catch((err) => {
        console.warn("Realtime send error (will not crash):", err);
      });
    };

    attemptSend();
  };

  // ---------------- Cell focus handler ----------------
  const handleCellFocus = (row, col) => {
    setSelectedCell([row, col]);
    broadcastSelection(row, col);
  };


  // ---------------- Win Check ----------------
  useEffect(() => {
    if (!solution.length) return;
    const allCorrect = solution.every((row, r) => row.every((cell, c) => cell === ' ' || grid[r][c]?.toUpperCase() === cell));
    if (allCorrect && !isCompleted) setIsCompleted(true);
  }, [grid, solution, isCompleted]);

  // ---------------- Progress ----------------
  const userFilled = grid.flat().filter((c) => c && c !== '').length;
  const totalLetters = solution.flat().filter((c) => c !== ' ').length;
  const userProgress = solution.length ? Math.round((userFilled / totalLetters) * 100) : 0;
  
  // ---------------- Loading ----------------
  if (loading) {
    return (
      <div className="battle-container">
        <div className="loading-popup">
          <p>Loading today's battle crossword...</p>
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

      <div className="progress-section">
      {/* USER */}
      <div className="progress-item">
        <h3>You</h3>
        <div className="mini-crossword user">
          {grid.map((row, rIdx) => (
            <div key={`u-row-${rIdx}`} className="mini-row">
                {row.map((_, cIdx) => (
                  <div
                    key={`u-${rIdx}-${cIdx}`}
                    className={`mini-cell ${
                      solution[rIdx][cIdx] === " " ? "mini-black-cell" : ""
                    } ${
                      selectedCell?.[0] === rIdx && selectedCell?.[1] === cIdx
                        ? "mini-highlight-green"
                        : ""
                    }`}
                    onClick={() => handleCellFocus(rIdx, cIdx)}
                  />
                ))}
              </div>
          ))}
        </div>
        <p className="progress-text user">{userProgress}%</p>
      </div>


      {/* OPPONENT */}
      <div className="progress-item">
        <h3>Opponent</h3>
        <div className="mini-crossword opponent">
          {grid.map((row, rIdx) => (
            <div key={`o-row-${rIdx}`} className="mini-row">
                {row.map((_, cIdx) => {
                  const isOpponentHere =
                    opponentSelection?.row === rIdx && opponentSelection?.col === cIdx;
                  return (
                    <div
                      key={`o-${rIdx}-${cIdx}`}
                      className={`mini-cell ${solution[rIdx][cIdx] === " " ? "mini-black-cell" : ""} ${
                        isOpponentHere ? "mini-highlight-blue" : ""
                      }`}
                    />
                  );
                })}
              </div>
          ))}
        </div>
      </div>

    </div>
      <div className="battle-body">
        {/* Crossword Grid */}
        <div className="crossword-container">
          {grid.map((row, rIdx) => (
            <div key={`main-row-${rIdx}`} className="row">
              {row.map((cell, cIdx) => (
                <div
                  key={`main-${rIdx}-${cIdx}`}
                  className={`cell-wrapper ${solution[rIdx][cIdx] === " " ? "black-cell" : ""}`}
                >
                  {solution[rIdx][cIdx] !== " " && (
                    <>
                      {numberedCells[rIdx]?.[cIdx] && (
                        <span className="cell-number">{numberedCells[rIdx][cIdx]}</span>
                      )}
                      <input
                        id={`cell-${rIdx}-${cIdx}`}
                        type="text"
                        maxLength="1"
                        className="cell"
                        value={cell || ""}
                        onChange={(e) => handleInput(rIdx, cIdx, e.target.value)}
                        onFocus={() => handleCellFocus(rIdx, cIdx)}
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