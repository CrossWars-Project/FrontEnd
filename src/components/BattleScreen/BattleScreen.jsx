import React, { useState, useEffect, useRef } from "react";
import "./BattleScreen.css";
import { useNavigate, useParams } from "react-router-dom";
import { FaSignOutAlt, FaClock } from "react-icons/fa";
import { UserAuth } from "../../context/AuthContext";
import supabase from "../../supabaseClient";
import { API_BASE_URL } from "../../config";
import { updateBattleStats } from "../../api";

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
  const [inputDisabled, setInputDisabled] = useState(false);



  const handleSignOut = () => {
  if (session?.user?.id) {
    navigate('/dashboard');
  } else {
    navigate('/guestDashboard');
  }
};

  const getPlayerId = () => {
    // Logged-in user
    if (user?.id) return user.id;
    if (user?.user_id) return user.user_id;

    // Guest only if manually triggered, not automatic fallback
    return null;
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
        await startBattle();
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

    channel.on("broadcast", { event: "player_finished" }, async (msg) => {
      try {
        // Lock the board immediately to prevent loser from continuing
        setInputDisabled(true);
        setIsCompleted(true); // stops timer updates and prevents triggering completeBattle if they somehow completed simultaneously

        // Try to fetch battle info to learn who won (backend authoritative)
        const battleRes = await fetch(`${API_BASE_URL}/api/battles/${battleId}`);
        const battleData = await battleRes.json();

        const winnerId = battleData.battle?.winner_id;
        // const myId = session?.user?.id || user?.id || user?.user_id;
        const myId = getPlayerId();


        setDidWin(myId === winnerId);
        setGameOver(true);
        // make sure loser's stats get updated too
        if (session?.access_token) {
          await updateBattleStats(
            {
              winner_id: winnerId,
              fastest_battle_time: elapsed,
              dt_last_seen_battle: new Date().toISOString(),
            },
            session.access_token
          );
        }
      } catch (err) {
        console.error("Error handling player_finished:", err);
        // Even on error, freeze the board so the loser can't keep typing
        setInputDisabled(true);
        setIsCompleted(true);
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
          //player: user?.user_id || user?.id || "guest",
          player: getPlayerId(),


        },
      }).catch((err) => {
        console.warn("Realtime send error (will not crash):", err);
      });
    };

    attemptSend();
  };

  // ---------------- broadcast letter ----------------
  const broadcastCellFill = (row, col, letter) => {
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
            // player: user?.id || "guest",
            player: getPlayerId(),

          },
        })
        .catch((err) => {
          console.warn("broadcast cell_filled error:", err);
        });
    };
    // call the helper
    trySend();
  };

  const broadcastPlayerFinished = () => {
    const trySend = () => {
      if (!battleChannelRef.current || !channelReadyRef.current) {
        if ((sendRetryRef.current ?? 0) < 10) {
          sendRetryRef.current = (sendRetryRef.current ?? 0) + 1;
          setTimeout(trySend, 120);
        } 
        return;
      }

      battleChannelRef.current.send({
        type: "broadcast",
        event: "player_finished",
        payload: {
          // player: user?.id || user?.user_id || "guest",
          player: getPlayerId(),

        },
      }).catch((err) => {
        console.warn("broadcast player_finished error:", err);
      });
    };

    trySend();
  };


  // ---------------- Cell focus handler ----------------
  const handleCellFocus = (row, col) => {
    setSelectedCell([row, col]);
    broadcastSelection(row, col);
  };
// ---------------- Start Battle Once ----------------
async function startBattle() {
  try {
    const accessToken = session?.access_token;

    await fetch(`${API_BASE_URL}/api/battles/${battleId}/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });

  } catch (err) {
    console.error("Error starting battle:", err);
  }
}


  // ---------------- Win Check ----------------
useEffect(() => {
  if (!solution.length) return;
  if (isCompleted) return;

  const allCorrect = solution.every((row, r) =>
    row.every((cell, c) => cell === ' ' || grid[r][c]?.toUpperCase() === cell)
  );

  if (allCorrect && !isCompleted) {
    setIsCompleted(true);
    setInputDisabled(true);
    completeBattle();
  }

  async function completeBattle() {
      try {
        // If another finish event already happened, bail out
        if (gameOver) return;

        // Determine current player's ID
        const myId = getPlayerId();

        const accessToken = session?.access_token;

        // Attempt to mark the battle completed on the backend
        const res = await fetch(`${API_BASE_URL}/api/battles/${battleId}/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken && { "Authorization": `Bearer ${accessToken}` }),
          },
          body: JSON.stringify({}) // backend uses current_user optional dependency
        });

        const data = await res.json();

        // Error handling
        if (!res.ok) {
          console.error("Complete API returned error:", data);

          // Battle no longer in progress, stop further input
          setInputDisabled(true);
          setIsCompleted(true);

          // Try to read current battle to show correct popup
          try {
            const battleRes = await fetch(`${API_BASE_URL}/api/battles/${battleId}`);
            const battleData = await battleRes.json();
            const winnerId = battleData.battle?.winner_id;

            // Update UI to reflect winner
            setDidWin(myId === winnerId);
            setGameOver(true);
          } catch (e) {
            // Fallback if fetching battle fails
            console.error("Error fetching battle after failed complete:", e);
            setDidWin(false);
            setGameOver(true);
          }
          // Exit the function since the battle cannot be completed normally
          return;
        }

        // Success path
        // Battle was completed successfully
          // Determine if the current player is the winner
          // Mark game as over
          // Broadcast to opponent so their game stops
        setDidWin(myId === data.winner_id);
        setGameOver(true);
        broadcastPlayerFinished();
        //collect variables for stats update
        const winnerId = data.winner_id;
        const myElapsed = elapsed;
        // Call backend stats update
        sendBattleStats({
          winnerId,
          time: myElapsed,
        });
      } catch (err) {
        console.error("Error completing battle:", err);
      }
    }
  async function sendBattleStats({ winnerId, time }) {
  try {
    const accessToken = session?.access_token;
    if (!accessToken) return; // skip guest users

    const data = await updateBattleStats(
      {
        winner_id: winnerId,
        fastest_battle_time: time,
        dt_last_seen_battle: new Date().toISOString(),
      },
      accessToken
    );

    console.log("Battle stats updated:", data);
  } catch (err) {
    console.error("Error calling updateBattleStats:", err);
  }
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
                        onChange={(e) => !inputDisabled && handleInput(rIdx, cIdx, e.target.value)}
                        onFocus={() => !inputDisabled && handleCellFocus(rIdx, cIdx)}
                        disabled={inputDisabled}
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
        <div className="battle-popup-overlay">
          <div className="battle-popup-inner">
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