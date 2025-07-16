// src/components/SideBar.jsx

import styles from '../../styles/SideBar.module.css';
import { useNavigate } from 'react-router-dom';
import { cerrarSesion } from '../../api/Login';
import logo from '../../assets/Dataflow AI logo ajustado blanco.png';

export const SideBar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    cerrarSesion();
    navigate('/');
  };

  const handleLogoClick = () => {
    navigate('/homeLogin#home');
  };

  return (
    <section className={`${styles.sidebar} ${styles.section}`}>
      {/* Logo container with invisible button overlay */}
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
        <button
          className={styles.button}
          onClick={() => navigate('/homeLogin#home')}
          aria-label="View Home"
        >
          <span className={`${styles.icon} ${styles.emojiWhite}`}>🏠</span>
          <span className={styles.text}>Home</span>
          <span className={styles.highlight}></span>
        </button>

        <button
          className={`${styles.button} ${styles.active}`}
          onClick={() => navigate('/dashboards')}
          aria-label="View Dashboards"
        >
          <span className={`${styles.icon} ${styles.emojiWhite}`}>📊</span>
          <span className={styles.text}>Dashboards</span>
          <span className={styles.highlight}></span>
        </button>

        <button
          className={styles.button}
          onClick={() => navigate('/marketplace')}
          aria-label="View Marketplace"
        >
          <span className={`${styles.icon} ${styles.emojiWhite}`}>🛒</span>
          <span className={styles.text}>Marketplace</span>
          <span className={styles.highlight}></span>
        </button>

        <button
          className={styles.button}
          onClick={() => navigate('/ai-insights')}
          aria-label="View AI Insights"
        >
          <span className={`${styles.icon} ${styles.emojiWhite}`}>🤖</span>
          <span className={styles.text}>AI Insights</span>
          <span className={styles.highlight}></span>
        </button>

        <button
          className={styles.button}
          onClick={() => navigate('/support')}
          aria-label="View Support"
        >
          <span className={`${styles.icon} ${styles.emojiWhite}`}>🆘</span>
          <span className={styles.text}>Support</span>
          <span className={styles.highlight}></span>
        </button>

        <button
          className={styles.button}
          onClick={() => navigate('/profile')}
          aria-label="View Profile"
        >
          <span className={`${styles.icon} ${styles.emojiWhite}`}>👤</span>
          <span className={styles.text}>Profile</span>
          <span className={styles.highlight}></span>
        </button>

        <button className={styles.button} onClick={handleLogout} aria-label="Log out">
          <span className={`${styles.icon} ${styles.emojiWhite}`}>🚪</span>
          <span className={styles.text}>Log out</span>
          <span className={styles.highlight}></span>
        </button>
      </nav>

      <div className={styles.footer}>
        <div className={styles.accentLine}></div>
        <p className={styles.footerText}>DataFlow AI</p>
      </div>
    </section>
  );
};