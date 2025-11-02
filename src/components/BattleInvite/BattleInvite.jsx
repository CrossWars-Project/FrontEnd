import { useState, useEffect } from 'react'
import supabase from '../../supabaseClient'

function BattleInvite(){
    const [inviteLink, setInviteLink] = useState(null)
    const [battleId, setBattleId] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    //auto-create invite when component mounts
    useEffect(() => {
        createInvite()
    }, [])


    async function createInvite(){
        setLoading(true)
        setError(null)
        try{
            //Get auth token

            const {data : {session}} = await supabase.auth.getSession()

            if (!session){
                setError('You must be logged in to invite players to battle.')
                return
            }

            //Call backend to create invite 
            const response = await fetch('http://localhost:8000/invites/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                }
            })

            //Handle bad response
            if (!response.ok){
                const errorData = await response.json()
                setError(errorData.detail || 'Failed to create invite.')
                return
            }

            //Handele good response, extract invite token
            const data = await response.json()

            //build invite link
            const link = `${window.location.origin}/battle/${data.invite_token}`
            
            console.log('Invite Link:', link)//for testing show invite link in console

            setInviteLink(link)
            setBattleId(data.battle_id)
        } catch (err){
            console.error('Error creating battle:', err)
            setError(err.message )
        } finally {
            setLoading(false)
        }
    }

    function copyLink(){
        navigator.clipboard.writeText(inviteLink)
        alert('Invite link copied to clipboard!')

    }

    if (loading){
        return (
                <div>
                    <h2>Battle Invite</h2>
                    <p>Creating your battle invite...</p>
                </div>
            )
    }

    if (error){
        return (
                <div>
                    <h2>Battle Invite</h2>
                    <div style={{ color: 'red' }}>
                        <p>Error: {error}</p>
                        <button onClick={createInvite}>Try Again</button>
                    </div>
                </div>
            )
    }

    // Show success state with invite link
    return(
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
                </div>
            )}
        </div>
    )
}

export default BattleInvite