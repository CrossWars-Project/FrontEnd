import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from './Dashboard';
import { UserAuth } from '../../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import BattleInvite from '../BattleInvite/BattleInvite';

// Mock Auth Context
jest.mock('../../context/AuthContext', () => ({
  UserAuth: jest.fn(),
}));

// Mock API module to prevent import.meta.env issues
jest.mock('../../api', () => ({
  getUserStats: jest.fn(() => Promise.resolve({ exists: true, data: [{ dt_last_seen_solo: null, dt_last_seen_battle: null }] })),
}));

// Mock BattleInvite to simplify testing
jest.mock('../BattleInvite/BattleInvite', () => (props) => (
  <div data-testid="battle-invite-mock">
    <button onClick={props.onClose}>Close Invite</button>
    <button onClick={() => props.onCreated({ inviteToken: 'abc123' })}>Create Invite</button>
  </div>
));

describe('Dashboard', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(UserAuth).mockReturnValue({ user: { email: 'test@example.com', user_metadata: { display_name: 'TestUser' } } });
  });

  function renderWithRouter(component) {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  }

  it('renders welcome message with user display name', () => {
    renderWithRouter(<Dashboard />);
    expect(screen.getByText(/Welcome to the Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/TestUser/)).toBeInTheDocument();
  });

  it('opens BattleInvite modal when Battle Play clicked', () => {
    renderWithRouter(<Dashboard />);
    const battleButton = screen.getByText(/Battle Play/i);
    fireEvent.click(battleButton);

    expect(screen.getByTestId('battle-invite-mock')).toBeInTheDocument();
  });

  it('closes BattleInvite modal when Close button clicked', () => {
    renderWithRouter(<Dashboard />);
    fireEvent.click(screen.getByText(/Battle Play/i));

    fireEvent.click(screen.getByText(/Close Invite/i));
    expect(screen.queryByTestId('battle-invite-mock')).not.toBeInTheDocument();
  });

  it('calls onCreated from BattleInvite and sets inviteInfo', () => {
    renderWithRouter(<Dashboard />);
    fireEvent.click(screen.getByText(/Battle Play/i));

    fireEvent.click(screen.getByText(/Create Invite/i));
    // The Enter Battle button should now appear
    expect(screen.getByText(/Enter Battle/i)).toBeInTheDocument();
  });
});
