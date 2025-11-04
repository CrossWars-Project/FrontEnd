import React, { useState, useEffect } from 'react';
import './BattleScreen.css';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaClock } from 'react-icons/fa';

const GRID_SIZE = 5;

export default function BattleScreen() {
  const navigate = useNavigate();
  const handleSignOut = () => navigate('/guestDashboard');

  // Crossword solution grid (spaces = black squares)
  // Format is " " for a black square
  const solution = [
    ['A', 'N', 'I', 'S', 'E'],
    ['C', 'I', 'D', 'E', 'R'],
    ['K', 'N', 'E', 'E', 'S'],
    [' ', 'J', 'A', 'Y', ' '],
    [' ', 'A', 'L', 'A', ' '],
  ];

  // Player grid state
  const [grid, setGrid] = useState(
    solution.map((row) => row.map((cell) => (cell === ' ' ? null : ''))),
  );

  // Opponent progress (dummy for now)
  // Need to figure out how to make it update
  const [opponentGrid, setOpponentGrid] = useState(
    Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE)
        .fill(false)
        .map(() => Math.random() < 0.4)),
  );

  // Timer + completion modal state
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Timer updates every second
  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted, startTime]);

  // Format time as M:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Handle player input
  const handleInput = (row, col, value) => {
    if (solution[row][col] === ' ') return; // skip black cells

    const newGrid = grid.map((r) => [...r]);
    const letter = value.slice(-1).toUpperCase();

    if (/^[A-Z]$/.test(letter)) {
      newGrid[row][col] = letter;

      // Move to next editable cell
      let nextCol = col + 1;
      while (nextCol < GRID_SIZE && solution[row][nextCol] === ' ') {
        nextCol++;
      }
      if (nextCol < GRID_SIZE) {
        const nextInput = document.getElementById(`cell-${row}-${nextCol}`);
        if (nextInput) nextInput.focus();
      }
    } else if (value === '') {
      newGrid[row][col] = '';
    }

    setGrid(newGrid);
  };

  // Win check runs AFTER grid updates
  // If it's wrong, no indication - user must figure out the mistake.
  // Do we want an option to check?
  useEffect(() => {
    const allCorrect = solution.every((row, r) => row.every(
      (cell, c) => cell === ' ' || grid[r][c]?.toUpperCase() === cell,
    ));
    if (allCorrect && !isCompleted) {
      setIsCompleted(true);
    }
  }, [grid, isCompleted, solution]);

  // Progress calculation
  const userFilled = grid.flat().filter((c) => c && c !== '').length;
  const totalLetters = solution.flat().filter((c) => c !== ' ').length;
  const userProgress = Math.round((userFilled / totalLetters) * 100);

  const opponentFilled = opponentGrid.flat().filter((c) => c).length;
  const opponentProgress = Math.round(
    (opponentFilled / (GRID_SIZE * GRID_SIZE)) * 100,
  );

  // Should take a list of strings in and then need to fix the logic to display
  // Or can I just display all the clues?
  const placeholderClues = [
    '1. Placeholder clue',
    '2. Placeholder clue',
    '3. Placeholder clue',
    '4. Placeholder clue',
    '5. Placeholder clue',
  ];

  // Determine numbering for crossword cells
  const numbering = solution.map((row, rIdx) => row.map((cell, cIdx) => {
    if (cell === ' ') return null;
    const startsAcross = cIdx === 0 || solution[rIdx][cIdx - 1] === ' ';
    const startsDown = rIdx === 0 || solution[rIdx - 1][cIdx] === ' ';
    return !!(startsAcross || startsDown);
  }));

  // Assign actual numbers incrementally
  let num = 1;
  const numberedCells = solution.map((row, rIdx) => row.map((cell, cIdx) => {
    if (numbering[rIdx][cIdx]) return num++;
    return null;
  }));

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
                    <div
                      key={cIdx}
                      className={`mini-cell ${
                        solution[rIdx][cIdx] === ' ' ? 'mini-black-cell' : ''
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>
            <p className="progress-text user">
              {userProgress}
              %
            </p>
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
                        filled ? 'mini-cell-green' : ''
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>
            <p className="progress-text opponent">
              {opponentProgress}
              %
            </p>
          </div>
        </div>

        {/* Timer Display */}
        <div className="timer-display">
          {' '}
          <FaClock />
          {' '}
          {formatTime(elapsed)}
        </div>
      </div>

      <div className="battle-body">
        {/* Crossword grid */}
        <div className="crossword-container">
          {grid.map((row, rIdx) => (
            <div key={rIdx} className="row">
              {row.map((cell, cIdx) => (
                <div
                  key={cIdx}
                  className={`cell-wrapper ${
                    solution[rIdx][cIdx] === ' ' ? 'black-cell' : ''
                  }`}
                >
                  {solution[rIdx][cIdx] !== ' ' && (
                    <>
                      {numberedCells[rIdx][cIdx] && (
                        <span className="cell-number">{numberedCells[rIdx][cIdx]}</span>
                      )}
                      <input
                        id={`cell-${rIdx}-${cIdx}`}
                        type="text"
                        maxLength="1"
                        className="cell"
                        value={cell}
                        onChange={(e) => handleInput(rIdx, cIdx, e.target.value)}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Placeholder clues */}
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

      {/* Win Popup */}
      {isCompleted && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>🎉 Puzzle Complete!</h2>
            <p>
              You finished in
              {formatTime(elapsed)}
              !
            </p>
            <button onClick={() => navigate('/guestDashboard')}>
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
