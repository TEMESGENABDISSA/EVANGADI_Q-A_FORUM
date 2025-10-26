import { createContext, useEffect, useState } from "react";
import "./App.css";
import { useNavigate } from "react-router-dom";

import { axiosInstance } from "./utility/axios";
import AppRouter from "./routes/AppRouter.jsx";
import { ThemeProvider } from "./context/ThemeContext";

export const UserState = createContext(); // Create a context for the user data

function App() {
  const [user, setUser] = useState({});
  const navigate = useNavigate();

  const getUserData = async () => {
    const token = localStorage.getItem("Evangadi_Forum");
    if (!token) {
      // Guest mode: do not redirect; allow the app to run without a user
      setUser(null);
      return;
    }
    try {
      const userData = await axiosInstance
        .get("/user/check", { headers: { Authorization: "Bearer " + token } })
        .then((response) => response.data);
      // Extract the user object from the response
      setUser(userData.user);
      // If user is logged in, redirect to home
      navigate("/home");
    } catch (error) {
      // Invalid token → clear and continue as guest
      localStorage.removeItem("Evangadi_Forum");
      setUser(null);
    }
  };

  useEffect(() => {
    getUserData();
  }, []);

  return (
    <ThemeProvider>
      <UserState.Provider value={{ user, setUser }}>
        <AppRouter />
      </UserState.Provider>
    </ThemeProvider>
  );
}

export default App;
