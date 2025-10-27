import React, { useEffect, useState } from 'react';
import { UserAuth } from '../../context/AuthContext';
import { getUserStats } from '../../api';

function Dashboard() {
  const { session } = UserAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.user) return;
      try {
        const response = await getUserStats(session.user.id);
        if (response.exists) {
          setStats(response.data[0]); // assuming only one stats row per user
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [session]);

  if (loading) return <p>Loading stats...</p>;
  if (!stats) return <p>No stats found for this user.</p>;

  return (
    <h1 className="title">{`${stats.display_name}'s Stats`}</h1>
  );
}
export default Dashboard;
