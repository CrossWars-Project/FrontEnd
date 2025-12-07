import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import GuestDashboard from './GuestDashboard';
import { UserAuth } from '../../context/AuthContext';

/**
 * GuestDashboard Test Suite
 * 
 * Tests the guest user landing page that provides:
 * - Solo play access with guest mode activation
 * - Exit navigation back to home screen
 * - Simplified UI for unauthenticated users
 */

// Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  UserAuth: jest.fn(),
}));

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('GuestDashboard', () => {
  const mockSetGuestMode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    UserAuth.mockReturnValue({
      setGuestMode: mockSetGuestMode,
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <GuestDashboard />
      </MemoryRouter>
    );
  };

  it('renders guest dashboard with title and logo', () => {
    renderComponent();
    
    expect(screen.getByText('Guest Dashboard')).toBeInTheDocument();
    expect(screen.getByAltText('Cross Wars Logo')).toBeInTheDocument();
  });

  it('shows solo play and exit buttons', () => {
    renderComponent();
    
    expect(screen.getByText('Solo Play')).toBeInTheDocument();
    expect(screen.getByText('Exit')).toBeInTheDocument();
  });

  it('navigates to solo play and sets guest mode when solo play clicked', () => {
    renderComponent();
    
    const soloButton = screen.getByText('Solo Play');
    fireEvent.click(soloButton);
    
    expect(mockSetGuestMode).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/solo');
  });

  it('navigates to home when exit clicked', () => {
    renderComponent();
    
    const exitButton = screen.getByText('Exit');
    fireEvent.click(exitButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
