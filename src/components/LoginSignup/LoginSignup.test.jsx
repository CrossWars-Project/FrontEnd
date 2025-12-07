import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LoginSignup from './LoginSignup';

// --------------------
// MOCKS
// --------------------

// Mock api.js to prevent import.meta.env errors
jest.mock('../../api', () => ({
  createUserStats: jest.fn(),
  getUserStats: jest.fn(),
}));

// Mock supabase client
jest.mock('../../supabaseClient', () => ({
  __esModule: true,
  default: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
    },
  },
}));

// Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  UserAuth: jest.fn(),
}));

// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

beforeAll(() => {
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});


describe('LoginSignup Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default UserAuth mock
    jest.mocked(require('../../context/AuthContext').UserAuth).mockReturnValue({
      user: null,
      session: null,
      loginUser: jest.fn(({ email, password }) => Promise.resolve({ success: true, data: { user: { email }, session: { access_token: 'token' } } })),
      signUpNewUser: jest.fn(() => Promise.resolve({ success: true })),
      setGuestMode: jest.fn(),
    });
  });

  function renderLoginSignup(initialRoute = '/login', redirectTo = null) {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/login" element={<LoginSignup redirectTo={redirectTo} />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route path="/invite/1234" element={<div>Invite Accept</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders email and password inputs', () => {
    renderLoginSignup();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it('allows typing into email and password', () => {
    renderLoginSignup();
    const email = screen.getByPlaceholderText(/email/i);
    const password = screen.getByPlaceholderText(/password/i);
    fireEvent.change(email, { target: { value: 'test@example.com' } });
    fireEvent.change(password, { target: { value: 'password123' } });
    expect(email).toHaveValue('test@example.com');
    expect(password).toHaveValue('password123');
  });

  it('logs in successfully and navigates to dashboard', async () => {
    renderLoginSignup();
    const email = screen.getByPlaceholderText(/email/i);
    const password = screen.getByPlaceholderText(/password/i);
    fireEvent.change(email, { target: { value: 'user@test.com' } });
    fireEvent.change(password, { target: { value: 'pass123' } });

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));


    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('switches to signup mode', () => {
    renderLoginSignup();
    fireEvent.click(screen.getByText(/sign up/i));
    expect(screen.getByText(/create account/i)).toBeInTheDocument();
  });

  it('signs up successfully', async () => {
    renderLoginSignup();
    fireEvent.click(screen.getByText(/sign up/i));

    const email = screen.getByPlaceholderText(/email/i);
    const password = screen.getByPlaceholderText(/password/i);

    fireEvent.change(email, { target: { value: 'newuser@test.com' } });
    fireEvent.change(password, { target: { value: 'newpass123' } });

    fireEvent.click(screen.getByText(/create account/i));

    await waitFor(() => {
      const UserAuthMock = require('../../context/AuthContext').UserAuth();
      expect(UserAuthMock.signUpNewUser).toHaveBeenCalledWith({
        email: 'newuser@test.com',
        password: 'newpass123',
        displayName: '',
      });
    });
  });

  it('plays as guest', async () => {
    renderLoginSignup();
    fireEvent.click(screen.getByText(/play as guest/i));
    const UserAuthMock = require('../../context/AuthContext').UserAuth();
    await waitFor(() => expect(UserAuthMock.setGuestMode).toHaveBeenCalled());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/guestDashboard', { replace: true }));
  });
});
