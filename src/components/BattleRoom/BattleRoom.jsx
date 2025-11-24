import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../../supabaseClient";
import "./BattleRoom.css";

export default function BattleRoom() {
  const { battleId } = useParams();
  const navigate = useNavigate();

  const [battle, setBattle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userReady, setUserReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userIsPlayer1, setUserIsPlayer1] = useState(null);

  // -----------------------------------------------------------
  // Fetch battle from backend
  // -----------------------------------------------------------
  useEffect(() => {
    async function fetchBattle() {
      const { data: { session } } = await supabase.auth.getSession();
      const isGuest = sessionStorage.getItem("guestUser") === "true";

      if (!session && !isGuest) {
        navigate(`/loginSignup?redirect=/battle-room/${battleId}`);
        return;
      }

      const userId = session?.user?.id || null;
      setCurrentUserId(userId);

      const headers = session ? { Authorization: `Bearer ${session.access_token}` } : {};
      const res = await fetch(`http://127.0.0.1:8000/api/battles/${battleId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...headers },
        credentials: "include",
        //body: JSON.stringify({})
      });

      if (!res.ok) {
        setLoading(false);
        return setBattle(null);
      }

      const { battle: data } = await res.json();
      setBattle(data);

      const opponentExists = !!data.player2_id || data.player2_is_guest;
      setOpponentJoined(opponentExists);

      // Ready states
     
      const isP1 = session?.user?.id === data.player1_id;
      const isP2 = session?.user?.id === data.player2_id || (!session?.user?.id && data.player2_is_guest);

      // default:
      let userIsP1Value = null;

      if (isP1) userIsP1Value = true;
      else if (isP2) userIsP1Value = false;

      setUserIsPlayer1(userIsP1Value);


      setUserReady(isP1 ? data.player1_ready : data.player2_ready);
      setOpponentReady(isP1 ? data.player2_ready : data.player1_ready);

      setCurrentUserId(session?.user?.id || "guest");

      setLoading(false);
    }

    fetchBattle();
  }, [battleId, navigate]);

  // -----------------------------------------------------------
  // Supabase Realtime listener for ready updates
  // -----------------------------------------------------------
  useEffect(() => {
    if (!battle) return;

    const channel = supabase
      .channel(`battle-${battleId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "battles", filter: `id=eq.${battleId}` },
        (payload) => {
          const newRow = payload.new;
          if (!newRow) return;

          // Opponent joined if player2 exists
          const opponentExists = !!newRow.player2_id || newRow.player2_is_guest;
          setOpponentJoined(opponentExists);

          // Ready states
          setUserReady(userIsPlayer1 ? newRow.player1_ready : newRow.player2_ready);
          setOpponentReady(userIsPlayer1 ? newRow.player2_ready : newRow.player1_ready);


          if (newRow.player1_ready && newRow.player2_ready) {
            navigate(`/battle/${battleId}/play`);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [battle, battleId, userIsPlayer1, navigate]);

  // -----------------------------------------------------------
  // Handle Ready button
  // -----------------------------------------------------------
  async function handleReady() {
    setUserReady(true); // optimistic UI update

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const headers = {
        "Content-Type": "application/json",
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {})
      };

      await fetch(`http://127.0.0.1:8000/api/battles/${battleId}/ready`, {
        method: "POST",
        credentials: "include",
        headers,
      });
    } catch (err) {
      console.error("[BattleRoom] handleReady error:", err);
    }
  }


  // -----------------------------------------------------------
  // Render UI
  // -----------------------------------------------------------
  if (loading) return <div className="battle-room">Loading battle room...</div>;
  if (!battle) return <div className="battle-room">Failed to load battle.</div>;

  return (
    <div className="battle-room">
      <h1>Battle Room</h1>
      {!opponentJoined && <p className="waiting">Waiting for opponent to join...</p>}

      {opponentJoined && (
        <>
          <p className="joined">Opponent joined</p>
          <div className="ready-section">
            <button disabled={userReady} className="ready-btn" onClick={handleReady}>
              {userReady ? "Ready" : "Click to Ready Up"}
            </button>
            <p>You: {userReady ? "Ready" : "Not Ready"}</p>
            <p>Opponent: {opponentReady ? "Ready" : "Not Ready"}</p>
          </div>
          {userReady && opponentReady && <p className="starting">Starting the battle...</p>}
        </>
      )}
    </div>
  );
}
