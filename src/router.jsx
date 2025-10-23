import { createBrowserRouter } from "react-router-dom"
import LoginSignup from "./components/LoginSignup/LoginSignup"
import App from "./App"
import Dashboard from "./components/Dashboard/Dashboard"
import GuestDashboard from "./components/GuestDashboard/GuestDashboard"
import BattleScreen from "./components/BattleScreen/BattleScreen"
import SoloPlay from "./components/SoloPlay/SoloPlay"
import Stats from "./components/Stats/Stats"

export const router = createBrowserRouter([
    {path: "/", element: <App /> },
    {path: "/loginSignup", element: <LoginSignup /> },
    {path: "/dashboard", element: <Dashboard />},
    {path: "/guestDashboard", element: <GuestDashboard />},
    {path: "/battle", element: <BattleScreen />},
    {path: "/solo", element: <SoloPlay />},
    {path: "/stats", element: <Stats />},

])