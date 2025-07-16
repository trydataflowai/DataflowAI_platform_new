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
    // Opción 1: Usando navigate (React Router)
    navigate('/homeLogin');
    window.location.hash = '#home'; // Asegura que el hash se aplique
    
    // Opción 2: Alternativa directa (descomenta si la anterior no funciona)
    // window.location.href = '/homeLogin#home';
  };

  return (
    <section className={`${styles.sidebar} ${styles.section}`}>
      {/* Contenedor del logo con evento de click */}
      <div className={styles.logoContainer}>
  <a 
    href="/homeLogin#home" 
    style={{ display: 'contents' }}
    onClick={(e) => {
      e.preventDefault();
      navigate('/homeLogin#home');
    }}
  >
    <img 
      src={logo} 
      alt="DataFlow AI Logo" 
      className={styles.logoImage}
    />
  </a>
</div>

      <nav className={styles.nav}>


        <button
          className={styles.button}
          onClick={() => navigate('/homeLogin#home')}
          aria-label="Visualizar Inicio"
        >
          <span className={`${styles.icon} ${styles.emojiWhite}`}>📥</span>
            <span className={styles.text}>Inicio</span>
          <span className={styles.highlight}></span>
        </button>



        <button className={`${styles.button} ${styles.active}`}>
          <span className={`${styles.icon} ${styles.emojiWhite}`}>📊</span>
          <span className={styles.text}>Dashboards</span>
          <span className={styles.highlight}></span>
        </button>

        

        <button className={styles.button}>
          <span className={`${styles.icon} ${styles.emojiWhite}`}>🧠</span>
          <span className={styles.text}>Marketplace</span>
          <span className={styles.highlight}></span>
        </button>

        <button className={styles.button}>
          <span className={`${styles.icon} ${styles.emojiWhite}`}>🧠</span>
          <span className={styles.text}>AI Insights</span>
          <span className={styles.highlight}></span>
        </button>

        <button className={styles.button}>
          <span className={`${styles.icon} ${styles.emojiWhite}`}>🛟</span>
          <span className={styles.text}>Soporte</span>
          <span className={styles.highlight}></span>
        </button>

        <button className={styles.button}>
          <span className={`${styles.icon} ${styles.emojiWhite}`}>👤</span>
          <span className={styles.text}>Profile</span>
          <span className={styles.highlight}></span>
        </button>

        <button className={styles.button} onClick={handleLogout}>
          <span className={`${styles.icon} ${styles.emojiWhite}`}>🚪</span>
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