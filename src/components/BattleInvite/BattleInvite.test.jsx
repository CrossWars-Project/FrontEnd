import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BattleInvite from './BattleInvite';

// === Mock Supabase client ===
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
  },
};

jest.mock('../../supabaseClient', () => ({
  __esModule: true,
  default: mockSupabase,
}));

// === Mock globals ===
const mockFetch = jest.fn();
const mockClipboard = { writeText: jest.fn() };
const mockAlert = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  global.fetch = mockFetch;
  global.alert = mockAlert;
  Object.assign(navigator, { clipboard: mockClipboard });

  Object.defineProperty(window, 'location', {
    value: { origin: 'http://localhost:5173' },
    writable: true,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('BattleInvite Component', () => {
  describe('Auto-Creation on Mount', () => {
    it('should show loading state initially', async () => {
      // Mock delayed response to test loading state
      let resolvePromise;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValue(promise);

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'valid_token' } },
      });

      render(<BattleInvite />);

      expect(screen.getByText('Battle Invite')).toBeInTheDocument();
      expect(screen.getByText('Creating your battle invite...')).toBeInTheDocument();

      // Resolve the pending promise to avoid open handles
      resolvePromise({
        ok: true,
        json: async () => ({
          invite_token: 'test_token',
          battle_id: 'battle_123',
        }),
      });
    });

    it('should automatically create invite for authenticated user', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'valid_token_123' } },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          invite_token: 'auto_invite_abc123',
          battle_id: 'battle_456',
        }),
      });

      render(<BattleInvite />);

      await waitFor(() => {
        expect(screen.getByText(/share this link/i)).toBeInTheDocument();
        expect(
          screen.getByText('http://localhost:5173/battle/auto_invite_abc123'),
        ).toBeInTheDocument();
        expect(screen.getByText('Copy Link')).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/invites/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_token_123',
        },
      });
    });

    it('should show error when user not logged in', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      });

      render(<BattleInvite />);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Error: You must be logged in to invite players to battle.',
          ),
        ).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'valid_token' } },
      });

      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ detail: 'Invalid or expired token' }),
      });

      render(<BattleInvite />);

      await waitFor(() => {
        expect(
          screen.getByText('Error: Invalid or expired token'),
        ).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });
  });

  describe('Retry Functionality', () => {
    it('should retry creation when Try Again button clicked', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
      });

      render(<BattleInvite />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: { access_token: 'retry_token' } },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          invite_token: 'retry_abc123',
          battle_id: 'retry_battle',
        }),
      });

      fireEvent.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(screen.getByText(/share this link/i)).toBeInTheDocument();
        expect(
          screen.getByText('http://localhost:5173/battle/retry_abc123'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Copy Link Functionality', () => {
    beforeEach(async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'valid_token' } },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          invite_token: 'copy_test_token',
          battle_id: 'battle_copy',
        }),
      });
    });

    it('should copy invite link to clipboard', async () => {
      render(<BattleInvite />);

      await waitFor(() => {
        expect(screen.getByText('Copy Link')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Copy Link'));

      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        'http://localhost:5173/battle/copy_test_token',
      );
      expect(mockAlert).toHaveBeenCalledWith('Invite link copied to clipboard!');
    });
  });

  describe('Link Accessibility', () => {
    it('should render accessible invite link', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'valid_token' } },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          invite_token: 'a11y_token',
          battle_id: 'battle_a11y',
        }),
      });

      render(<BattleInvite />);

      await waitFor(() => {
        const inviteLink = screen.getByRole('link');
        expect(inviteLink).toHaveAttribute('target', '_blank');
        expect(inviteLink).toHaveAttribute('rel', 'noopener noreferrer');
        expect(inviteLink).toHaveAttribute(
          'href',
          'http://localhost:5173/battle/a11y_token',
        );
      });
    });
  });
});
