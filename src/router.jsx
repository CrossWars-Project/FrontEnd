import { createBrowserRouter } from "react-router-dom"
import LoginSignup from "./components/LoginSignup/LoginSignup"
import App from "./App"

export const router = createBrowserRouter([
    {path: "/", element: <App /> },
    {path: "/loginSignup", element: <LoginSignup /> },

])