import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted() to ensure mock is available at the top level
const mockSupabase = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
  },
}));

// Now the mock can access mockSupabase safely
vi.mock('../../supabaseClient', () => ({
  default: mockSupabase
}));

// Import component AFTER mocking
import BattleInvite from './BattleInvite';

const mockFetch = vi.fn()
const mockClipboard = { writeText: vi.fn() }
const mockAlert = vi.fn()

describe('BattleInvite Component', () => {
    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();

        global.fetch = mockFetch
        global.alert = mockAlert
        Object.assign(navigator, { clipboard: mockClipboard })

        Object.defineProperty(window, 'location', {
            value: { origin: 'http://localhost:5173' },
            writable: true
        })
    })

    afterEach(() => {
        vi.restoreAllMocks();
    })

    describe('Auto-Creation on Mount', () => {
        // === TEST NEW BEHAVIOR: Auto-creates invite on mount ===
        it('should show loading state initially', () => {
            // Mock delayed response to test loading state
            let resolvePromise
            const promise = new Promise((resolve) => { resolvePromise = resolve })
            mockFetch.mockReturnValue(promise)
            
            mockSupabase.auth.getSession.mockResolvedValue({
                data: { session: { access_token: 'valid_token' } }
            })

            render(<BattleInvite />)

            // Should show loading message immediately
            expect(screen.getByText('Battle Invite')).toBeInTheDocument()
            expect(screen.getByText('Creating your battle invite...')).toBeInTheDocument()
            
            // Clean up - resolve the promise
            resolvePromise({
                ok: true,
                json: async () => ({ invite_token: 'test_token', battle_id: 'battle_123' })
            })
        })

        it('should automatically create invite for authenticated user', async () => {
            // Mock successful session and API call
            mockSupabase.auth.getSession.mockResolvedValue({
                data: { session: { access_token: 'valid_token_123' } }
            })

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    invite_token: 'auto_invite_abc123',
                    battle_id: 'battle_456'
                })
            })

            render(<BattleInvite />)

            // Wait for auto-creation to complete
            await waitFor(() => {
                expect(screen.getByText(/share this link/i)).toBeInTheDocument()
                expect(screen.getByText('http://localhost:5173/battle/auto_invite_abc123')).toBeInTheDocument()
                expect(screen.getByText('Copy Link')).toBeInTheDocument()
            })

            // Verify API was called automatically
            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/invites/create',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer valid_token_123'
                    }
                }
            )
        })

        it('should show error when user not logged in', async () => {
            // Mock no session
            mockSupabase.auth.getSession.mockResolvedValue({
                data: { session: null }
            })

            render(<BattleInvite />)

            // Wait for error to appear
            await waitFor(() => {
                expect(screen.getByText('Error: You must be logged in to invite players to battle.')).toBeInTheDocument()
                expect(screen.getByText('Try Again')).toBeInTheDocument()
            })

            // Verify no API call was made
            expect(mockFetch).not.toHaveBeenCalled()
        })

        it('should handle API errors gracefully', async () => {
            mockSupabase.auth.getSession.mockResolvedValue({
                data: { session: { access_token: 'valid_token' } }
            })

            mockFetch.mockResolvedValue({
                ok: false,
                json: async () => ({ detail: 'Invalid or expired token' })
            })

            render(<BattleInvite />)

            await waitFor(() => {
                expect(screen.getByText('Error: Invalid or expired token')).toBeInTheDocument()
                expect(screen.getByText('Try Again')).toBeInTheDocument()
            })
        })
    })

    describe('Retry Functionality', () => {
        it('should retry creation when Try Again button clicked', async () => {
            // First: Mock auth failure
            mockSupabase.auth.getSession.mockResolvedValueOnce({
                data: { session: null }
            })

            render(<BattleInvite />)

            // Wait for error state
            await waitFor(() => {
                expect(screen.getByText('Try Again')).toBeInTheDocument()
            })

            // Then: Mock successful auth for retry
            mockSupabase.auth.getSession.mockResolvedValueOnce({
                data: { session: { access_token: 'retry_token' } }
            })

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ invite_token: 'retry_abc123', battle_id: 'retry_battle' })
            })

            // Click retry button
            fireEvent.click(screen.getByText('Try Again'))

            // Should show success state
            await waitFor(() => {
                expect(screen.getByText(/share this link/i)).toBeInTheDocument()
                expect(screen.getByText('http://localhost:5173/battle/retry_abc123')).toBeInTheDocument()
            })
        })
    })

    describe('Copy Link Functionality', () => {
        beforeEach(async () => {
            // Setup successful invite creation
            mockSupabase.auth.getSession.mockResolvedValue({
                data: { session: { access_token: 'valid_token' } }
            })

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    invite_token: 'copy_test_token',
                    battle_id: 'battle_copy'
                })
            })
        })

        it('should copy invite link to clipboard', async () => {
            render(<BattleInvite />)
            
            // Wait for invite to be created
            await waitFor(() => {
                expect(screen.getByText('Copy Link')).toBeInTheDocument()
            })

            // Click copy button
            fireEvent.click(screen.getByText('Copy Link'))

            // Verify clipboard and alert
            expect(mockClipboard.writeText).toHaveBeenCalledWith(
                'http://localhost:5173/battle/copy_test_token'
            )
            expect(mockAlert).toHaveBeenCalledWith('Invite link copied to clipboard!')
        })
    })

    describe('Link Accessibility', () => {
        it('should render accessible invite link', async () => {
            mockSupabase.auth.getSession.mockResolvedValue({
                data: { session: { access_token: 'valid_token' } }
            })

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ invite_token: 'a11y_token', battle_id: 'battle_a11y' })
            })

            render(<BattleInvite />)

            await waitFor(() => {
                const inviteLink = screen.getByRole('link')
                expect(inviteLink).toHaveAttribute('target', '_blank')
                expect(inviteLink).toHaveAttribute('rel', 'noopener noreferrer')
                expect(inviteLink).toHaveAttribute('href', 'http://localhost:5173/battle/a11y_token')
            })
        })
    })
})