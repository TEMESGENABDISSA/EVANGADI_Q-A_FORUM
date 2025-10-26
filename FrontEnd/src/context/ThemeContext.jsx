import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem("evangadi-theme");
    if (savedTheme) {
      return savedTheme === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem("evangadi-theme", isDarkMode ? "dark" : "light");

    // Apply theme to document
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "dark" : "light"
    );

    // Update CSS custom properties
    const root = document.documentElement;
    if (isDarkMode) {
      root.style.setProperty("--bg-primary", "#1a1a1a");
      root.style.setProperty("--bg-secondary", "#2d2d2d");
      root.style.setProperty("--bg-tertiary", "#3a3a3a");
      root.style.setProperty("--text-primary", "#ffffff");
      root.style.setProperty("--text-secondary", "#b3b3b3");
      root.style.setProperty("--text-muted", "#888888");
      root.style.setProperty("--border-color", "#404040");
      root.style.setProperty("--shadow", "0 4px 6px rgba(0, 0, 0, 0.3)");
      root.style.setProperty("--hover-bg", "#404040");
    } else {
      root.style.setProperty("--bg-primary", "#ffffff");
      root.style.setProperty("--bg-secondary", "#f8f9fa");
      root.style.setProperty("--bg-tertiary", "#e9ecef");
      root.style.setProperty("--text-primary", "#212529");
      root.style.setProperty("--text-secondary", "#6c757d");
      root.style.setProperty("--text-muted", "#adb5bd");
      root.style.setProperty("--border-color", "#dee2e6");
      root.style.setProperty("--shadow", "0 4px 6px rgba(0, 0, 0, 0.1)");
      root.style.setProperty("--hover-bg", "#f5f5f5");
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const value = {
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
