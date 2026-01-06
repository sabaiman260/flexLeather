import React, { createContext, useState, useContext, useEffect } from "react";
import api from "./index";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem("accessToken");
            if (token) {
                try {
                    const response = await api.get("/auth/me");
                    setUser(response.data.data);
                    setIsLoggedIn(true);
                } catch (error) {
                    console.error("Failed to fetch user on load", error);
                    // Handle token refresh logic here if applicable
                    localStorage.removeItem("accessToken");
                }
            }
            setLoading(false);
        };

        fetchUser();
    }, []);

    const login = (userData, token) => {
        localStorage.setItem("accessToken", token);
        setUser(userData);
        setIsLoggedIn(true);
    };

    const logout = async () => {
        // Call the backend to invalidate the refresh token and clear httpOnly cookies.
        try {
            await api.post("/auth/logout");
        } catch (error) {
            console.error("Server logout failed, proceeding with client-side cleanup.", error);
        } finally {
            // Always clear client-side state regardless of backend success to ensure the UI reflects the logged-out state.
            localStorage.removeItem("accessToken");
            setUser(null);
            setIsLoggedIn(false);
        }
    };

    const value = { user, isLoggedIn, loading, login, logout };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};