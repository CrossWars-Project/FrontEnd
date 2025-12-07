import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BattleScreen from './BattleScreen';
import supabase from '../../supabaseClient';

/**
 * BattleScreen Test Suite
 *
 * Tests the active multiplayer battle screen that handles:
 * - Crossword grid rendering
 * - Typing into cells
 * - Timer display
 * - Win condition logic
 * - Realtime opponent updates
 */

// Mock api module to avoid import.meta.env crash
jest.mock('../../api', () => ({
  __esModule: true,
  updateBattleStats: jest.fn(),
}));

// Mock supabase
jest.mock('../../supabaseClient', () => ({
  __esModule: true,
  default: {
    channel: jest.fn(() => ({
      on: jest.fn(() => ({ subscribe: jest.fn() })),
      send: jest.fn(() => Promise.resolve()),
      subscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
  },
}));

// Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  UserAuth: () => ({
    user: { id: 'user1' },
    session: { access_token: 'token' },
  }),
}));

describe('BattleScreen', () => {
  const mockBattleId = 'battle123';

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  /**
   * Helper to render with router
   */
  function renderBattleScreen() {
    return render(
      <MemoryRouter initialEntries={[`/battle/${mockBattleId}`]}>
        <Routes>
          <Route path="/battle/:battleId" element={<BattleScreen />} />
        </Routes>
      </MemoryRouter>
    );
  }

  /**
   * Mock crossword payload used by multiple tests
   */
  const mockCrossword = {
    grid: [
      ['C', 'A', 'T', '-', 'D'],
      ['-', '-', 'A', '-', 'O'],
      ['D', 'O', 'G', '-', 'G'],
      ['-', '-', 'O', '-', '-'],
      ['F', 'O', 'X', '-', '-'],
    ],
    placed_words: [
      ['CAT', 0, 0, true],
      ['DOG', 2, 0, true],
    ],
    clues_across: ['Feline', 'Canine'],
    clues_down: ['Pet', 'Animal'],
  };

  /**
   * Test: Loading state
   */
  it('shows loading state initially', () => {
    global.fetch.mockImplementation(() => new Promise(() => {})); // never resolves

    renderBattleScreen();

    expect(screen.getByText("Loading today's battle crossword...")).toBeInTheDocument();
  });

  /**
   * Test: Renders grid and timer
   */
  it('renders crossword grid and timer', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCrossword }),
    });

    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    renderBattleScreen();

    await waitFor(() => {
      expect(screen.getByText('0:00')).toBeInTheDocument();
      expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0);
    });
  });

  /**
   * Test: Allows typing into a cell
   */
  it('allows typing into a cell', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCrossword }),
    });

    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    renderBattleScreen();

    const inputs = await screen.findAllByRole('textbox');

    fireEvent.change(inputs[0], { target: { value: 'C' } });

    expect(inputs[0]).toHaveValue('C');
  });

  /**
   * Test: Win condition popup
   */
  it('shows win popup when puzzle is completed', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockCrossword }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // start battle
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ winner_id: 'user1' }),
      });

    renderBattleScreen();

    const inputs = await screen.findAllByRole('textbox');

    let idx = 0;
    for (let r = 0; r < mockCrossword.grid.length; r++) {
      for (let c = 0; c < mockCrossword.grid[r].length; c++) {
        if (mockCrossword.grid[r][c] !== '-') {
          fireEvent.change(inputs[idx], {
            target: { value: mockCrossword.grid[r][c] },
          });
          idx++;
        }
      }
    }

    await waitFor(() => {
      expect(screen.getByText('You Win!')).toBeInTheDocument();
    });
  });

  /**
   * Test: Opponent finish event handling
   */
  it('handles opponent finished event', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockCrossword }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // start battle
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          battle: { winner_id: 'user2' },
        }),
      });

    renderBattleScreen();

    const channel = supabase.channel.mock.results[0].value;

    // Find the player_finished handler
    const handlerCall = channel.on.mock.calls.find(
      (call) => call[1]?.event === 'player_finished'
    );
    const handler = handlerCall[2];

    // Simulate opponent finishing
    await handler({});

    await waitFor(() => {
      expect(screen.getByText('Better Luck Next Time')).toBeInTheDocument();
    });
  });
});
