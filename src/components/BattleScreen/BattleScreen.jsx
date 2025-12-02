import React, { useState, useEffect, useRef } from "react";
import "./BattleScreen.css";
import { useNavigate, useParams } from "react-router-dom";
import { FaSignOutAlt, FaClock } from "react-icons/fa";
import { UserAuth } from "../../context/AuthContext";
import supabase from "../../supabaseClient";
import { API_BASE_URL } from "../../config";
import logo from '../assets/logo.png'; //import logo image so correct path is used

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
  const [opponentGrid, setOpponentGrid] = useState([]);

  // ---------------- Fetch Crossword ----------------
  const hasFetchedRef = useRef(false);

  // ---------------- Win State ----------------
  const [gameOver, setGameOver] = useState(false);
  const [didWin, setDidWin] = useState(null); // true = win, false = lose


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
        const res = await fetch(`${API_BASE_URL}/crossword/battle`, {
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
        setOpponentGrid(formattedGrid.map((r) => r.map((c) => (c === ' ' ? null : ''))));
        setCluesAcross(numberedAcross);
        setCluesDown(numberedDown);
        setNumberedCells(numbered);
        setStartTime(Date.now());
        setLoading(false);
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
      try {
        broadcastCellFill(row, col, letter);
      } catch (err) {
        console.warn("broadcastCellFill threw:", err);
      }
      const width = solution[0]?.length ?? GRID_SIZE;
      let nextCol = col + 1;
      while (nextCol < width && solution[row][nextCol] === ' ') nextCol++;
      if (nextCol < width) {
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
          if (player === (user?.id || "guest")) return;
          if (row === null || col === null) return;
          setOpponentSelection({ row, col });
        } catch (e) {
          console.error("Malformed broadcast payload", e);
        }
      }
    );

    channel.on(
      "broadcast",
      { event: "cell_filled" },
      (msg) => {
        const { row, col, letter, player } = msg.payload || {};
        if (player === (user?.id || "guest")) return;
        if (row == null || col == null) return;

        setOpponentGrid((prev) => {
          const copy = prev.map((r) => [...r]);
          copy[row][col] = letter;
          return copy;
        });
      }
    );

    channel.on("broadcast", { event: "player_finished" }, (msg) => {
      const { player } = msg.payload || {};
      if (!player) return;

      // If opponent finished first
      if (player !== (user?.id || user?.user_id)) {
        setDidWin(false);
        setGameOver(true);
      }
    });


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
          player: user?.user_id || user?.id || "guest",

        },
      }).catch((err) => {
        console.warn("Realtime send error (will not crash):", err);
      });
    };

    attemptSend();
  };

  // ---------------- broadcast letter ----------------
  const broadcastCellFill = (row, col, letter) => {
    // Correct and robust send helper (fixed typo and ensured non-throwing)
    // if (letter !== correct) return;
    // get correct letter
    const correct = String(solution[row][col]).toUpperCase();

    // only broadcast if correct
    if (letter.toUpperCase() !== correct) return;
    
    const trySend = () => {
      // If channel isn't ready, schedule a retry without throwing
      if (!battleChannelRef.current || !channelReadyRef.current) {
        if ((sendRetryRef.current ?? 0) < 10) {
          sendRetryRef.current = (sendRetryRef.current ?? 0) + 1;
          setTimeout(trySend, 120);
        } else {
          // give up silently (logged)
          console.warn("Realtime channel not ready; cell_filled not broadcast");
        }
        return;
      }
      battleChannelRef.current
        .send({
          type: "broadcast",
          event: "cell_filled",
          payload: {
            row,
            col,
            letter,
            player: user?.id || "guest",
          },
        })
        .catch((err) => {
          // swallow errors to avoid crashing the input handler
          console.warn("broadcast cell_filled error:", err);
        });
    };
    // call the helper
    trySend();
  };

  // ---------------- Cell focus handler ----------------
  const handleCellFocus = (row, col) => {
    setSelectedCell([row, col]);
    broadcastSelection(row, col);
  };


  // ---------------- Win Check ----------------
  useEffect(() => {
  if (!solution.length) return;

  const allCorrect = solution.every((row, r) =>
    row.every((cell, c) => cell === ' ' || grid[r][c]?.toUpperCase() === cell)
  );

  if (allCorrect && !isCompleted) {
    setIsCompleted(true);

    // Broadcast that this player finished
    if (battleChannelRef.current && channelReadyRef.current) {
      battleChannelRef.current.send({
        type: "broadcast",
        event: "player_finished",
        payload: { player: user?.id || user?.user_id },
      }).catch((err) => console.warn("Error broadcasting finish:", err));
    }

    setDidWin(true);
    setGameOver(true);
  }
}, [grid, solution, isCompleted]);


  // ---------------- Progress ----------------
  const opponentFilled = opponentGrid.flat().filter((c) => c && c !== '').length;
  const totalLetters = solution.flat().filter((c) => c !== ' ').length;
  const opponentProgress = solution.length ? Math.round((opponentFilled / totalLetters) * 100) : 0;

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
                      className={`mini-cell ${solution[rIdx][cIdx] === " " ? "mini-black-cell" : ""}
                      ${opponentGrid?.[rIdx]?.[cIdx] ? "mini-filled-blue" : ""} 
                      ${
                        isOpponentHere ? "mini-highlight-blue" : ""
                      }`}
                    />
                  );
                })}
              </div>
          ))}
        </div>
        <p className="progress-text opponent">{opponentProgress}%</p>
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
      {gameOver && (
        <div className="popup-overlay">
          <div className="popup-inner">
            <h2>{didWin ? "You Win!" : "Better Luck Next Time"}</h2>
            {didWin ? (
              <p>You completed the crossword before your opponent!</p>
            ) : (
              <p>Your opponent finished first.</p>
            )}
            <button onClick={() => navigate("/dashboard")}>Return Home</button>
          </div>
        </div>
      )}


    </div>
  );
}