import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import BattleInvite from './BattleInvite';
import supabase from '../../supabaseClient';

// Mock supabase
jest.mock('../../supabaseClient', () => ({
  __esModule: true,
  default: {
    auth: { getSession: jest.fn() },
  },
}));

describe('BattleInvite', () => {
  const mockSupabase = supabase;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    Object.assign(navigator, { clipboard: { writeText: jest.fn() } });
    global.alert = jest.fn();
  });

  function renderWithRouter(ui) {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  }

  it('shows loading initially', () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token' } }
    });

    renderWithRouter(<BattleInvite />);
    
    expect(screen.getByText('Creating your battle invite...')).toBeInTheDocument();
  });

  it('shows error if user is not logged in', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null }
    });

    renderWithRouter(<BattleInvite />);

    await waitFor(() => {
      expect(screen.getByText(/You must be logged in/i)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });


  it('shows invite link after successful creation', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'token' } } });
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ invite_token: 'abc123', battle_id: 'battle1' }),
    });

    renderWithRouter(<BattleInvite />);

    await waitFor(() => {
      expect(screen.getByText(/Share this link/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('http://localhost/accept/abc123')).toBeInTheDocument();
      expect(screen.getByText('Copy')).toBeInTheDocument();
      expect(screen.getByText('Or share via:')).toBeInTheDocument();
      expect(screen.getByTitle('Share via Email')).toBeInTheDocument();
      expect(screen.getByTitle('Share via WhatsApp')).toBeInTheDocument();
      expect(screen.getByText('Go to Battle Room')).toBeInTheDocument();
    });
  });

  it('copies invite link to clipboard when copy button clicked', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'token' } } });
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ invite_token: 'abc123', battle_id: 'battle1' }),
    });

    renderWithRouter(<BattleInvite />);

    await waitFor(() => screen.getByText('Copy'));
    fireEvent.click(screen.getByText('Copy'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost/accept/abc123');
    expect(global.alert).toHaveBeenCalledWith('Invite link copied to clipboard!');
  });

  it('shows email and whatsapp share buttons', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'token' } } });
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ invite_token: 'abc123', battle_id: 'battle1' }),
    });

    renderWithRouter(<BattleInvite />);

    await waitFor(() => {
      expect(screen.getByTitle('Share via Email')).toBeInTheDocument();
      expect(screen.getByTitle('Share via WhatsApp')).toBeInTheDocument();
    });
  });

  it('opens WhatsApp when WhatsApp share button clicked', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'token' } } });
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ invite_token: 'abc123', battle_id: 'battle1' }),
    });

    global.open = jest.fn();

    renderWithRouter(<BattleInvite />);

    await waitFor(() => screen.getByTitle('Share via WhatsApp'));
    fireEvent.click(screen.getByTitle('Share via WhatsApp'));
    
    expect(global.open).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/?text='),
      '_blank'
    );
    expect(global.open).toHaveBeenCalledWith(
      expect.stringContaining('http%3A%2F%2Flocalhost%2Faccept%2Fabc123'),
      '_blank'
    );
  });
});
