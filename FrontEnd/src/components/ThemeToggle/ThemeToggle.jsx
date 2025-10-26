import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { FaSun, FaMoon } from "react-icons/fa";
import styles from "./themeToggle.module.css";

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      className={styles.themeToggle}
      onClick={toggleTheme}
      title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
      aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
    >
      <div
        className={`${styles.toggleSlider} ${
          isDarkMode ? styles.dark : styles.light
        }`}
      >
        <div className={styles.toggleIcon}>
          {isDarkMode ? <FaMoon /> : <FaSun />}
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
