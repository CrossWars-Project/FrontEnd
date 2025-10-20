import { createBrowserRouter } from "react-router-dom"
import LoginSignup from "./components/LoginSignup/LoginSignup"
import App from "./App"
import Dashboard from "./components/Dashboard/Dashboard"

export const router = createBrowserRouter([
    {path: "/", element: <App /> },
    {path: "/loginSignup", element: <LoginSignup /> },
    {path: "/dashboard", element: <Dashboard />},

])