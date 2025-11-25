import { createBrowserRouter } from 'react-router-dom';
import LoginSignup from './components/LoginSignup/LoginSignup';
import App from './App';
import Dashboard from './components/Dashboard/Dashboard';
import GuestDashboard from './components/GuestDashboard/GuestDashboard';
import SoloPlay from './components/SoloPlay/SoloPlay';
import Stats from './components/Stats/Stats';

import BattleInvite from './components/BattleInvite/BattleInvite';
import BattleScreen from './components/BattleScreen/BattleScreen';
import BattleRoom from "./components/BattleRoom/BattleRoom";
import AcceptInvite from "./components/AcceptInvite/AcceptInvite";

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/loginSignup', element: <LoginSignup /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/guestDashboard', element: <GuestDashboard /> },
  
  // Battle Flow
  {
    path: '/battle-invite/:battleId', // when user creates an invite
    element: <BattleInvite />,
  },
  {
    path: '/accept/:inviteToken', // Player 2 clicks invite link
    element: <AcceptInvite />,
  },
  {
    path: '/battle-room/:battleId', // both users gather here before battle
    element: <BattleRoom />,
  },
  {
    path: '/battle/:battleId/play', // main gameplay screen
    element: <BattleScreen />,
  },


  // SOLO
  { path: "/solo", element: <SoloPlay /> },
  { path: "/stats", element: <Stats /> },
  /*
  { path: '/battle', element: <BattleScreen /> },
  { path: '/battle/:inviteToken', element: <BattleScreen /> },
  { path: '/solo', element: <SoloPlay /> },
  { path: '/stats', element: <Stats /> },
  { path: '/battleInvite', element: <BattleInvite /> },
  { path: "/battle/:inviteToken", element: <AcceptInvite /> },
  { path: "/game/:battleId", element: <BattleRoom /> },
  { path: "/game/:battleId/play", element: <BattleScreen /> },*/

]);

export default router;
