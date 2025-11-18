import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../../supabaseClient";
import "./BattleRoom.css";

export default function BattleRoom() {
  const { battleId } = useParams();
  const navigate = useNavigate();

  const [battle, setBattle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playerNumber, setPlayerNumber] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [opponentJoined, setOpponentJoined] = useState(false);

  // -----------------------------------------------------------
  // Fetch battle and determine player
  // -----------------------------------------------------------
  useEffect(() => {
    async function checkAuthAndFetch() {
      const { data: { session } } = await supabase.auth.getSession();
      const isGuest = sessionStorage.getItem("guestUser") === "true";

      if (!session && !isGuest) {
        navigate(`/loginSignup?redirect=/battle-room/${battleId}`);
        return;
      }

      async function fetchBattle() {
        const headers = session ? { Authorization: `Bearer ${session.access_token}` } : {};
        const maxRetries = 12;
        const delay = 500;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          const res = await fetch(`http://127.0.0.1:8000/api/battles/${battleId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            credentials: "include",
            body: JSON.stringify({})
          });

          if (res.ok) {
            const { battle: data } = await res.json();

            // Determine playerNum
            const savedPlayerNum = sessionStorage.getItem(`battle-${battleId}-player`);
            let playerNum;
            if (savedPlayerNum) {
              playerNum = parseInt(savedPlayerNum, 10);
            } else {
              const isInviteJoin = sessionStorage.getItem("inviteJoin") === "true";
              playerNum = isInviteJoin ? 2 : 1;
              sessionStorage.setItem(`battle-${battleId}-player`, playerNum);
              sessionStorage.removeItem("inviteJoin");
            }
            setPlayerNumber(playerNum);

            // Determine opponent joined immediately
            let opponentExists = false;
            if (playerNum === 1) {
              opponentExists = Boolean(data.player2_id) || Boolean(data.player2_is_guest);
            } else {
              opponentExists = Boolean(data.player1_id) || Boolean(data.player1_is_guest);
            }
            setOpponentJoined(opponentExists);

            // Set ready flags from battle
            const player1Ready = Boolean(data.player1_ready);
            const player2Ready = Boolean(data.player2_ready);
            setPlayerReady(playerNum === 1 ? player1Ready : player2Ready);
            setOpponentReady(playerNum === 1 ? player2Ready : player1Ready);

            setBattle(data);
            setLoading(false);
            return;
          }

          if (res.status === 404) {
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          console.error("Error loading battle:", res.status);
          break;
        }

        setLoading(false);
        setBattle(null);
      }

      fetchBattle();
    }

    checkAuthAndFetch();
  }, [battleId, navigate]);

  // -----------------------------------------------------------
  // Supabase Realtime listener for opponent join and ready
  // -----------------------------------------------------------
  useEffect(() => {
    if (!playerNumber) return;

    const channel = supabase
      .channel(`battle-${battleId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "battles", filter: `id=eq.${battleId}` },
        (payload) => {
          const newRow = payload.new;
          if (!newRow) return;

          // Detect opponent joined
          if (playerNumber === 1) {
            setOpponentJoined(Boolean(newRow.player2_id) || Boolean(newRow.player2_is_guest));
          } else {
            setOpponentJoined(Boolean(newRow.player1_id) || Boolean(newRow.player1_is_guest));
          }

          // Update ready states
          if (playerNumber === 1) {
            setOpponentReady(Boolean(newRow.player2_ready));
            setPlayerReady(Boolean(newRow.player1_ready));
          } else {
            setOpponentReady(Boolean(newRow.player1_ready));
            setPlayerReady(Boolean(newRow.player2_ready));
          }

          // Navigate when both ready
          if ((newRow.player1_ready && newRow.player2_ready)) {
            navigate(`/battle/${battleId}/play`);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [battleId, playerNumber, navigate]);

  // -----------------------------------------------------------
  // Handle Ready button (optimistic update)
  // -----------------------------------------------------------
  async function handleReady() {
    setPlayerReady(true); // optimistic update

    try {
      await fetch(`http://127.0.0.1:8000/api/battles/${battleId}/ready`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerNumber })
      }).catch(() => {});
    } catch (err) {
      console.error('[BattleRoom] handleReady error:', err);
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
      <p>You are Player {playerNumber ?? "?"}</p>

      {!opponentJoined && <p className="waiting">Waiting for opponent to join...</p>}

      {opponentJoined && (
        <>
          <p className="joined">Opponent joined</p>
          <div className="ready-section">
            <button disabled={playerReady} className="ready-btn" onClick={handleReady}>
              {playerReady ? "Ready" : "Click to Ready Up"}
            </button>
            <p>Opponent: {opponentReady ? "Ready" : "Not Ready"}</p>
          </div>
          {playerReady && opponentReady && <p className="starting">Starting the battle...</p>}
        </>
      )}
    </div>
  );
}
