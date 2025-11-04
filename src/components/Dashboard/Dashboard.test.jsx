import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Dashboard should think user is logged in
vi.mock('../../context/AuthContext', () => ({
  UserAuth: () => ({ user: { email: 'test@example.com', user_metadata: { display_name: 'Tester' } } }),
}));

// Mock BattleInvite child to immediately call onCreated when mounted
vi.mock('../BattleInvite/BattleInvite', () => {
  return {
    default: ({ onCreated }) => {
      // Parent shows Enter Battle
      if (typeof onCreated === 'function') {
        onCreated({ inviteToken: 'mock_token', inviteLink: 'http://localhost/battle/mock_token', battleId: 'b_mock' });
      }
      return <div data-testid="mock-battle-invite">Mock Invite</div>;
    },
  };
});

import Dashboard from './Dashboard';

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens invite modal and shows Enter Battle when invite created; Enter Battle navigates', async () => {
    render(<Dashboard />);

    fireEvent.click(screen.getByRole('button', { name: /battle play/i }));

    await waitFor(() => {
      expect(screen.getByTestId('mock-battle-invite')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /enter battle/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /enter battle/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/battle/mock_token');
  });
});
