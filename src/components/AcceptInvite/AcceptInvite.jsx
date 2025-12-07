import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import supabase from "../../supabaseClient";
import { API_BASE_URL } from "../../config";

export default function AcceptInvite() {
  const { inviteToken } = useParams();
  const navigate = useNavigate();
  const hasRun = useRef(false);

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function acceptInvite() {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const isGuest = sessionStorage.getItem("guestUser") === "true";

      // If no token and not a guest, go to login page
      if (!token && !isGuest) {
        sessionStorage.setItem("pendingInviteToken", inviteToken);
        navigate("/loginSignup", { 
          replace: true,
          state: { from: `/accept/${inviteToken}` } 
        });
        return;
      }

      try {
        // Call backend to accept invite (guest or logged-in user)
        const res = await fetch(
          `${API_BASE_URL}/invites/accept/${inviteToken}`,
          {
            method: "POST",
            credentials: "include",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!res.ok) throw new Error("Invite invalid or expired");

        const data = await res.json();

        if (!data.battle_id) throw new Error("No battle_id returned");

        // If backend indicates this join is a guest, persist it
        if (data.is_guest) {
          sessionStorage.setItem("guestUser", "true");
        } else {
          // clear any stale guest flag just in case
          sessionStorage.removeItem("guestUser");
        }

        sessionStorage.removeItem("pendingInviteToken");
        sessionStorage.setItem("inviteJoin", "true");
        

        // Redirect to battleroom
        navigate(`/battle-room/${data.battle_id}`, {
          replace: true,
          state: {inviteToken},
        });

      } catch (err) {
        // console.error(err);
        // navigate("/", { replace: true });
        console.error("Invite error:", err);
        setErrorMessage(err.message || "An unknown error occurred.");
      }
    }

    acceptInvite();
  }, [inviteToken, navigate]);

  // If there's an error, show popup
  if (errorMessage) {
    const isGuest = sessionStorage.getItem("guestUser") === "true";
    const homeRoute = isGuest ? "/" : "/home";

    return (
      <div className="popup-overlay">
        <div className="popup">
          <h2 className="popup-title">Invite Error</h2>
          <p>{errorMessage}</p>

          <button
            onClick={() => navigate(homeRoute, { replace: true })}
            className="popup-button"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Joining battle...</h2>
    </div>
  );
}
