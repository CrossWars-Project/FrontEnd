import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AcceptInvite from "./AcceptInvite";
import supabase from "../../supabaseClient";

// Mock supabase
jest.mock("../../supabaseClient", () => ({
  __esModule: true,
  default: {
    auth: { getSession: jest.fn() },
  },
}));

// Mock react-router-dom navigation and params
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const original = jest.requireActual("react-router-dom");
  return {
    ...original,
    useNavigate: () => mockNavigate,
    useParams: () => ({ inviteToken: "abc123" }),
  };
});

describe("AcceptInvite", () => {
  beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();

  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({}),
    })
  );
});


  it("shows joining message initially", () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: "token" } } });
    render(<AcceptInvite />);
    expect(screen.getByText("Joining battle...")).toBeInTheDocument();
  });

  it("redirects to login if not logged in and not a guest", async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    sessionStorage.removeItem("guestUser");

    render(<AcceptInvite />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/loginSignup", {
        replace: true,
        state: { from: "/accept/abc123" },
      });
    });
  });

  it("calls backend and navigates to battle room on success", async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: "token" } } });
    sessionStorage.setItem("guestUser", "false");

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ battle_id: "battle123" }),
    });

    render(<AcceptInvite />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://127.0.0.1:8000/invites/accept/abc123",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: { Authorization: "Bearer token" },
        })
      );
      expect(sessionStorage.getItem("inviteJoin")).toBe("true");
      expect(mockNavigate).toHaveBeenCalledWith("/battle-room/battle123", {
        replace: true,
        state: { inviteToken: "abc123" },
      });
    });
  });

  it("shows error popup and navigates home when button clicked", async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: "token" } },
    });
    sessionStorage.setItem("guestUser", "false");

    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Invite invalid or expired" }),
    });

    render(<AcceptInvite />);

    // Wait for popup to appear
    await waitFor(() => {
      expect(screen.getByText(/invite error/i)).toBeInTheDocument();
      expect(screen.getByText(/invite invalid or expired/i)).toBeInTheDocument();
    });

    // Click Return Home
    const button = screen.getByText(/return home/i);
    button.click();

    // Assert navigation happens AFTER click
    expect(mockNavigate).toHaveBeenCalledWith("/home", { replace: true });
  });


  it("handles guest user correctly", async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    sessionStorage.setItem("guestUser", "true");

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ battle_id: "battleGuest" }),
    });

    render(<AcceptInvite />);

    await waitFor(() => {
      expect(sessionStorage.getItem("inviteJoin")).toBe("true");
      expect(mockNavigate).toHaveBeenCalledWith("/battle-room/battleGuest", {
        replace: true,
        state: { inviteToken: "abc123" },
      });
    });
  });
});
