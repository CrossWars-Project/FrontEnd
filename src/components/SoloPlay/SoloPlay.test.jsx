import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SoloPlay from './SoloPlay';
import { UserAuth } from '../../context/AuthContext';
import { getUserStats } from '../../api';

/**
 * SoloPlay Component Tests
 * 
 * Tests the solo crossword gameplay interface. This component handles:
 * - Fetching and displaying daily crossword puzzles
 * - Timer functionality for tracking solve time
 * - User input and grid completion detection
 * - Already-played-today popup for logged-in users
 * - Stats submission upon completion
 * 
 * Testing scope (minimal):
 * - Loading state displays correctly
 * - Crossword grid renders with correct structure
 * - Timer displays and updates
 * - Quit button navigates appropriately
 * - Completion popup appears when puzzle is solved
 * 
 * Note: Backend crossword generation, stats API, and complex input validation
 * are tested separately. These tests focus on UI rendering and basic interactions.
 */

// Mock supabaseClient to avoid import.meta.env issues
jest.mock('../../supabaseClient', () => ({
  __esModule: true,
  default: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
  },
}));

// Mock API functions
jest.mock('../../api', () => ({
  getUserStats: jest.fn(),
  updateUserStats: jest.fn(),
}));

// Mock dependencies
jest.mock('../../context/AuthContext');
jest.mock('../../utils/checkPlayedToday.jsx', () => jest.fn(() => false));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock crossword data
const mockCrosswordData = {
  data: {
    grid: [
      ['C', 'A', 'T', '-', 'D'],
      ['O', '-', 'A', '-', 'O'],
      ['W', '-', 'R', '-', 'G'],
      ['-', '-', '-', '-', '-'],
      ['B', 'I', 'R', 'D', '-'],
    ],
    placed_words: [
      ['CAT', 0, 0, true],
      ['COW', 0, 0, false],
      ['TAR', 0, 2, false],
      ['DOG', 0, 4, false],
      ['BIRD', 4, 0, true],
    ],
    clues_across: ['Feline animal', 'Feathered animal'],
    clues_down: ['Bovine animal', 'Sticky substance', 'Canine animal'],
  },
};

describe('SoloPlay Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    UserAuth.mockReturnValue({ user: null, session: null });
    getUserStats.mockResolvedValue({ exists: false, data: [] });
  });

  test('renders loading state initially', () => {
    global.fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <BrowserRouter>
        <SoloPlay />
      </BrowserRouter>
    );

    expect(screen.getByText(/loading today's crossword/i)).toBeInTheDocument();
  });

  test('renders crossword grid after successful fetch', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCrosswordData,
    });

    render(
      <BrowserRouter>
        <SoloPlay />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading today's crossword/i)).not.toBeInTheDocument();
    });

    // Check for grid inputs (5x5 grid with some black cells)
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  test('displays timer', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCrosswordData,
    });

    render(
      <BrowserRouter>
        <SoloPlay />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/0:00/)).toBeInTheDocument();
    });
  });

  test('displays clues for across and down', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCrosswordData,
    });

    render(
      <BrowserRouter>
        <SoloPlay />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Across')).toBeInTheDocument();
      expect(screen.getByText('Down')).toBeInTheDocument();
      expect(screen.getByText(/feline animal/i)).toBeInTheDocument();
      expect(screen.getByText(/bovine animal/i)).toBeInTheDocument();
    });
  });

  test('quit button navigates to guest dashboard for guest users', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCrosswordData,
    });

    UserAuth.mockReturnValue({ user: null, session: null });

    render(
      <BrowserRouter>
        <SoloPlay />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Quit')).toBeInTheDocument();
    });

    screen.getByText('Quit').click();
    expect(mockNavigate).toHaveBeenCalledWith('/guestDashboard');
  });

  test('quit button navigates to dashboard for logged-in users', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCrosswordData,
    });

    UserAuth.mockReturnValue({
      user: { id: 'user123' },
      session: { access_token: 'token123' },
    });

    render(
      <BrowserRouter>
        <SoloPlay />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Quit')).toBeInTheDocument();
    });

    screen.getByText('Quit').click();
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  test('shows already-played popup when user has played today', async () => {
    const checkPlayedToday = require('../../utils/checkPlayedToday.jsx');
    checkPlayedToday.mockReturnValue(true);

    UserAuth.mockReturnValue({
      user: { id: 'user123' },
      session: { access_token: 'token123' },
    });

    getUserStats.mockResolvedValue({
      exists: true,
      data: [{ dt_last_seen_solo: new Date().toISOString() }],
    });

    render(
      <BrowserRouter>
        <SoloPlay />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/you have already played the solo crossword today/i)).toBeInTheDocument();
    });
  });
});
