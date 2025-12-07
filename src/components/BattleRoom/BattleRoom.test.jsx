import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BattleRoom from './BattleRoom';
import supabase from '../../supabaseClient';

/**
 * BattleRoom Test Suite
 * 
 * Tests the multiplayer battle waiting room component that handles:
 * - Authentication (logged-in users and guests)
 * - Waiting for opponent to join
 * - Ready-up mechanics for both players
 * - Real-time updates via Supabase channels
 * - Navigation and error handling
 */

// Mock supabase client with auth and real-time channel support
jest.mock('../../supabaseClient', () => ({
  __esModule: true,
  default: {
    auth: { getSession: jest.fn() },
    channel: jest.fn(() => ({
      on: jest.fn(() => ({ subscribe: jest.fn() })),
    })),
    removeChannel: jest.fn(),
  },
}));

// Mock react-router-dom navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('BattleRoom', () => {
  const mockBattleId = 'battle123';

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    sessionStorage.clear();
  });

  /**
   * Helper function to render BattleRoom with router context
   * Simulates navigating to /battle-room/:battleId route
   */
  function renderBattleRoom() {
    return render(
      <MemoryRouter initialEntries={[`/battle-room/${mockBattleId}`]}>
        <Routes>
          <Route path="/battle-room/:battleId" element={<BattleRoom />} />
        </Routes>
      </MemoryRouter>
    );
  }

  /**
   * Test: Loading State
   * Verifies that loading message displays while fetching battle data
   */
  it('shows loading state initially', () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    sessionStorage.setItem('guestUser', 'true');
    global.fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderBattleRoom();
    
    expect(screen.getByText('Loading battle room...')).toBeInTheDocument();
  });

  /**
   * Test: Authentication Redirect
   * Non-authenticated users (not guests) should be redirected to login
   * with return URL to come back after authentication
   */
  it('redirects to login if not authenticated and not guest', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    sessionStorage.removeItem('guestUser');

    renderBattleRoom();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(`/loginSignup?redirect=/battle-room/${mockBattleId}`);
    });
  });

  /**
   * Test: Waiting for Opponent
   * Shows waiting message when battle is in WAITING state (player2 not joined)
   */
  it('shows waiting message when opponent has not joined', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token', user: { id: 'user1' } } }
    });

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        battle: {
          id: mockBattleId,
          player1_id: 'user1',
          player2_id: null,
          player2_is_guest: false,
          player1_ready: false,
          player2_ready: false,
          status: 'WAITING'
        }
      })
    });

    renderBattleRoom();

    await waitFor(() => {
      expect(screen.getByText('Battle Room')).toBeInTheDocument();
      expect(screen.getByText('Waiting for opponent to join...')).toBeInTheDocument();
    });
  });

  /**
   * Test: Opponent Joined
   * Shows ready-up UI when both players are in the room (status: READY)
   * Displays ready status for both players
   */
  it('shows ready section when opponent has joined', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token', user: { id: 'user1' } } }
    });

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        battle: {
          id: mockBattleId,
          player1_id: 'user1',
          player2_id: 'user2',
          player2_is_guest: false,
          player1_ready: false,
          player2_ready: false,
          status: 'READY'
        }
      })
    });

    renderBattleRoom();

    await waitFor(() => {
      expect(screen.getByText('Opponent joined')).toBeInTheDocument();
      expect(screen.getByText('Click to Ready Up')).toBeInTheDocument();
      expect(screen.getByText('You: Not Ready')).toBeInTheDocument();
      expect(screen.getByText('Opponent: Not Ready')).toBeInTheDocument();
    });
  });

  /**
   * Test: Ready Up Action
   * Clicking ready button calls the /api/battles/:id/ready endpoint
   */
  it('calls ready endpoint when ready button clicked', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token', user: { id: 'user1' } } }
    });

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        battle: {
          id: mockBattleId,
          player1_id: 'user1',
          player2_id: 'user2',
          player2_is_guest: false,
          player1_ready: false,
          player2_ready: false,
          status: 'READY'
        }
      })
    });

    renderBattleRoom();

    await waitFor(() => screen.getByText('Click to Ready Up'));
    
    const readyButton = screen.getByText('Click to Ready Up');
    fireEvent.click(readyButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/battles/${mockBattleId}/ready`),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  /**
   * Test: Ready Button State
   * After clicking ready, button should be disabled to prevent double-clicking
   */
  it('disables ready button after clicking', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token', user: { id: 'user1' } } }
    });

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        battle: {
          id: mockBattleId,
          player1_id: 'user1',
          player2_id: 'user2',
          player2_is_guest: false,
          player1_ready: false,
          player2_ready: false,
          status: 'READY'
        }
      })
    });

    renderBattleRoom();

    await waitFor(() => screen.getByText('Click to Ready Up'));
    
    const readyButton = screen.getByText('Click to Ready Up');
    fireEvent.click(readyButton);

    await waitFor(() => {
      expect(screen.getByText('Ready')).toBeDisabled();
    });
  });

  /**
   * Test: Error Handling
   * Shows error message when battle data fetch fails
   */
  it('shows error message when battle fetch fails', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token', user: { id: 'user1' } } }
    });

    global.fetch.mockResolvedValue({
      ok: false
    });

    renderBattleRoom();

    await waitFor(() => {
      expect(screen.getByText('Failed to load battle.')).toBeInTheDocument();
    });
  });

  /**
   * Test: Guest User Support
   * Guest users (identified by sessionStorage.guestUser) can access battle room
   * without authentication
   */
  it('works for guest users', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    sessionStorage.setItem('guestUser', 'true');

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        battle: {
          id: mockBattleId,
          player1_id: 'user1',
          player2_id: null,
          player2_is_guest: true,
          player1_ready: false,
          player2_ready: false,
          status: 'READY'
        }
      })
    });

    renderBattleRoom();

    await waitFor(() => {
      expect(screen.getByText('Battle Room')).toBeInTheDocument();
      expect(screen.getByText('Opponent joined')).toBeInTheDocument();
    });
  });
});
