import styles from '../../styles/SideBar.module.css';
import { useNavigate } from 'react-router-dom';
import { cerrarSesion } from '../../api/Login';
import logo from '../../assets/Dataflow AI logo ajustado blanco.png';

export const SideBar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    cerrarSesion();         // Borra el token
    navigate('/');          // Redirige al index
  };

  return (
    <section className={`${styles.sidebar} ${styles.section}`}>
      <div className={styles.logoContainer}>
        <img src={logo} alt="DataFlow AI Logo" className={styles.logoImage} />
      </div>

      <nav className={styles.nav}>
        <button className={`${styles.button} ${styles.active}`}>
          <span className={styles.icon}>📊</span>
          <span className={styles.text}>Dashboards</span>
          <span className={styles.highlight}></span>
        </button>

        <button className={styles.button}>
          <span className={styles.icon}>📥</span>
          <span className={styles.text}>Import Data</span>
          <span className={styles.highlight}></span>
        </button>

        <button className={styles.button}>
          <span className={styles.icon}>🧠</span>
          <span className={styles.text}>AI Insights</span>
          <span className={styles.highlight}></span>
        </button>

        <button className={styles.button}>
          <span className={styles.icon}>🛟</span>
          <span className={styles.text}>Soporte</span>
          <span className={styles.highlight}></span>
        </button>

        <button className={styles.button}>
          <span className={styles.icon}>👤</span>
          <span className={styles.text}>Profile</span>
          <span className={styles.highlight}></span>
        </button>

        {/* 🔴 Botón de cerrar sesión */}
        <button className={styles.button} onClick={handleLogout}>
          <span className={styles.icon}>🚪</span>
          <span className={styles.text}>Cerrar sesión</span>
          <span className={styles.highlight}></span>
        </button>
      </nav>

      <div className={styles.footer}>
        <div className={styles.accentLine}></div>
        <p className={styles.footerText}>DataFlowAi</p>
      </div>
    </section>
  );
};