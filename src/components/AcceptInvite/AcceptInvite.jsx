import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import supabase from "../../supabaseClient";

export default function AcceptInvite() {
  const { inviteToken } = useParams();
  const navigate = useNavigate();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function acceptInvite() {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const isGuest = sessionStorage.getItem("guestUser") === "true";

      // If no token and not a guest, go to login page
      if (!token && !isGuest) {
        navigate("/loginSignup", {
          replace: true,
          state: { from: `/accept/${inviteToken}` },
        });
        return;
      }

      try {
        // Call backend to accept invite (guest or logged-in user)
        const res = await fetch(
          `http://127.0.0.1:8000/invites/accept/${inviteToken}`,
          {
            method: "POST",
            credentials: "include",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!res.ok) throw new Error("Invite invalid or expired");

        const data = await res.json();

        if (!data.battle_id) throw new Error("No battle_id returned");
        
        sessionStorage.setItem("inviteJoin", "true");

        // Redirect to battleroom
        navigate(`/battle-room/${data.battle_id}`, { 
          replace: true,
          state: { inviteToken },
        });

      } catch (err) {
        console.error(err);
        navigate("/", { replace: true });
      }
    }

    acceptInvite();
  }, [inviteToken, navigate]);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Joining battle...</h2>
    </div>
  );
}
