import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Stats from './Stats';
import { UserAuth } from '../../context/AuthContext';
import { getUserStats } from '../../api';

/**
 * Stats Component Tests
 * 
 * Tests the user statistics display page.
 * Backend testing covers stats calculation logic; frontend tests focus on:
 * - Rendering stats data correctly
 * - Loading states
 * - Error handling
 * - Time formatting
 * - Navigation
 */

// Mock dependencies
jest.mock('../../context/AuthContext', () => ({
  UserAuth: jest.fn(),
}));

jest.mock('../../api', () => ({
  getUserStats: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Stats Component', () => {
  const mockUser = {
    id: 'user123',
    user_metadata: {
      display_name: 'TestUser',
    },
  };

  const mockStats = {
    display_name: 'TestUser',
    streak_count_solo: 5,
    fastest_solo_time: 120,
    num_complete_solo: 10,
    streak_count_battle: 3,
    fastest_battle_time: 90,
    num_wins_battle: 7,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    UserAuth.mockReturnValue({ user: mockUser });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <Stats />
      </MemoryRouter>
    );
  };

  it('shows loading state initially', () => {
    getUserStats.mockReturnValue(new Promise(() => {})); // Never resolves
    renderComponent();
    
    expect(screen.getByText('Loading stats...')).toBeInTheDocument();
  });

  it('displays stats after successful fetch', async () => {
    getUserStats.mockResolvedValue({ data: [mockStats] });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('TestUser')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Solo streak
      expect(screen.getByText('2:00')).toBeInTheDocument(); // Fastest solo time
      expect(screen.getByText('10')).toBeInTheDocument(); // Solo completions
      expect(screen.getByText('3')).toBeInTheDocument(); // Battle streak
      expect(screen.getByText('1:30')).toBeInTheDocument(); // Fastest battle time
      expect(screen.getByText('7')).toBeInTheDocument(); // Battle wins
    });
  });

  it('shows error message on fetch failure', async () => {
    getUserStats.mockRejectedValue(new Error('API Error'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Could not load stats.')).toBeInTheDocument();
    });
  });


  it('formats time correctly', async () => {
    getUserStats.mockResolvedValue({
      data: [{
        fastest_solo_time: 185, // 3:05
        fastest_battle_time: 45,  // 0:45
      }],
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('3:05')).toBeInTheDocument();
      expect(screen.getByText('0:45')).toBeInTheDocument();
    });
  });
});
