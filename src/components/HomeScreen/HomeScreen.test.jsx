import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomeScreen from './HomeScreen';

//mock the react-router navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('renders logo, title, and buttons', () => {
    render(
      <MemoryRouter>
        <HomeScreen />
      </MemoryRouter>
    );

    // logo image
    expect(screen.getByAltText(/Cross Wars Logo/i)).toBeInTheDocument();

    // title text
    expect(screen.getByText(/Cross Wars/i)).toBeInTheDocument();

    // buttons
    expect(screen.getByRole('button', { name: /log in \/ sign up/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play as guest/i })).toBeInTheDocument();
  });

  test('navigates to /loginSignup when "Log In / Sign Up" is clicked', () => {
    render(
      <MemoryRouter>
        <HomeScreen />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /log in \/ sign up/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/loginSignup');
  });

  test('navigates to /guestDashboard when "Play as Guest" is clicked', () => {
    render(
      <MemoryRouter>
        <HomeScreen />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /play as guest/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/guestDashboard');
  });
});
