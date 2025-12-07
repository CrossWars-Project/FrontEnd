import { useState, useEffect, useRef } from 'react';
import supabase from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { FaCopy, FaEnvelope, FaWhatsapp, FaTimes } from 'react-icons/fa';
import './BattleInvite.css';


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

    const res = await fetch(`${API_BASE_URL}/invites/create`, {
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

  function shareViaEmail() {
    const subject = encodeURIComponent('Join me for a CrossWars battle!');
    const body = encodeURIComponent(`Hey! I challenge you to a CrossWars battle. Click this link to accept: ${inviteLink}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  function shareViaWhatsApp() {
    const text = encodeURIComponent(`Hey! I challenge you to a CrossWars battle. Click this link to accept: ${inviteLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
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
        <div className="error-message">
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
    <>
      <h2>Battle Invite</h2>
      {inviteLink && (
        <div>
          <p>Share this link with your friend:</p>
          <div className="invite-link-container">
            <input 
              type="text" 
              value={inviteLink} 
              readOnly 
              className="invite-link-input"
            />
            <button 
              onClick={copyLink}
              title="Copy link"
              className="copy-button"
            >
              <FaCopy /> Copy
            </button>
          </div>

          <div className="share-section">
            <p className="share-label">Or share via:</p>
            <div className="share-buttons">
              <button 
                onClick={shareViaEmail}
                className="share-button"
                title="Share via Email"
              >
                <FaEnvelope />
              </button>
              <button 
                onClick={shareViaWhatsApp}
                className="share-button"
                title="Share via WhatsApp"
              >
                <FaWhatsapp />
              </button>
            </div>
          </div>

          {battleId && (
            <button
              className="action-button"
              onClick={() => navigate(`/battle-room/${battleId}`)}
            >
              Go to Battle Room
            </button>
          )}
        </div>
      )}
    </>
  );
}

export default BattleInvite;
