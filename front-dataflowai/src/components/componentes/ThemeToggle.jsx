// src/components/componentes/ThemeToggle.jsx

import React from "react";
import { useTheme } from "./ThemeContext";
import styles from "../../styles/ThemeToggle.module.css";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className={styles.wrapper}>
      <button
        onClick={toggleTheme}
        className={`${styles.toggleButton} ${isLight ? styles.light : ""}`}
        aria-label="Toggle theme"
      >
        <div className={styles.toggleCircle}>
          {isLight ? "🌞" : "🌙"}
        </div>
      </button>
    </div>
  );
};
