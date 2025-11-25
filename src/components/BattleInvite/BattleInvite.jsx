import { useState, useEffect, useRef } from 'react';
import supabase from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';


function BattleInvite({ onClose, onCreated }) {
  const [inviteLink, setInviteLink] = useState(null);
  const [battleId, setBattleId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const hasCreatedInvite = useRef(false);


  // auto-create invite when component mounts

  useEffect(() => {
    if(!hasCreatedInvite.current) {
      hasCreatedInvite.current = true;
      createInvite();
    }
    
  }, []);


  async function createInvite() {
  setLoading(true);
  setError(null);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("You must be logged in.");
      return;
    }

    const res = await fetch("http://localhost:8000/invites/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!res.ok) {
      const errData = await res.json();
      setError(errData.detail || "Failed to create invite");
      return;
    }

    const data = await res.json();

    // BattleInvite.jsx
    const inviteUrl = `${window.location.origin}/accept/${data.invite_token}`;

    setInviteLink(inviteUrl);
    setBattleId(data.battle_id);

    // ✅ Player 1 immediately enters the battle room
    //navigate(`/battle-room/${data.battle_id}`);

  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}

  
  function copyLink() {
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  }

  
  if (loading) {
    return (
      <div>
        <h2>Battle Invite</h2>
        <p>Creating your battle invite...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2>Battle Invite</h2>
        <div style={{ color: 'red' }}>
          <p>
            Error:
            {error}
          </p>
          <button onClick={createInvite}>Try Again</button>
        </div>
      </div>
    );
  }

  // Show success state with invite link
  return (
    <div>
      <h2>Battle Invite</h2>
      {inviteLink && (
        <div>
          <p>Share this link with your friend:</p>
          <a href={inviteLink} target="_blank" rel="noopener noreferrer">
            {inviteLink}
          </a>
          <br />
          <button onClick={copyLink}>Copy Link</button>

          {battleId && (
            <button
              style={{ marginLeft: "10px",
                       marginRight: "10px"   
               }}
              onClick={() => navigate(`/battle-room/${battleId}`)}
              
            >
              Go to Battle Room
            </button>
          )}

          {onClose && (
            <button onClick={onClose}>
              Close
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default BattleInvite;
