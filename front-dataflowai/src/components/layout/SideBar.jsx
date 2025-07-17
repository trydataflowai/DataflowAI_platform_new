import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cerrarSesion } from '../../api/Login';
import logo from '../../assets/Dataflow AI logo ajustado blanco.png';
import styles from '../../styles/SideBar.module.css';

const links = [
  { to: "/homeLogin#home", icon: "🏠", label: "Home" },
  { to: "/home",        icon: "📊", label: "Dashboards" },
  { to: "/marketplace", icon: "🛒", label: "Marketplace" },
  { to: "/ai-insights", icon: "🤖", label: "AI Insights" },
  { to: "/support",     icon: "🆘", label: "Support" },
  { to: "/profile",     icon: "👤", label: "Profile" },
];

export const SideBar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    cerrarSesion();
    navigate('/');
  };

  const handleLogoClick = () => {
    navigate('/homeLogin#home');
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.logoContainer}>
        <button
          className={styles.logoButton}
          onClick={handleLogoClick}
          aria-label="View Home"
        >
          <img
            src={logo}
            alt="DataFlow AI Logo"
            className={styles.logoImage}
          />
        </button>
      </div>

      <nav className={styles.nav}>
        {links.map(({ to, icon, label }) => (
          <button
            key={to}
            className={`${styles.button} ${pathname === to ? styles.active : ''}`}
            onClick={() => navigate(to)}
            aria-label={`View ${label}`}
          >
            <span className={`${styles.icon} ${styles.emojiWhite}`}>{icon}</span>
            <span className={styles.text}>{label}</span>
            <span className={styles.highlight} />
          </button>
        ))}

        <button
          className={styles.button}
          onClick={handleLogout}
          aria-label="Log out"
        >
          <span className={`${styles.icon} ${styles.emojiWhite}`}>🚪</span>
          <span className={styles.text}>Log out</span>
          <span className={styles.highlight} />
        </button>
      </nav>

      {/* Toggle collapse button */}
      <div className={styles.toggleContainer}>
        <button
          className={styles.toggleButton}
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '➡️' : '⬅️'}
        </button>
      </div>

      <div className={styles.footer}>
        <div className={styles.accentLine} />
        <p className={styles.footerText}>DataFlow AI</p>
      </div>
    </aside>
);
};
