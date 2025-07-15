import '../../styles/Navbar.css';
import logo from '../../assets/Dataflow AI logo ajustado blanco.png';

export function Navbar() {
  return (
    <nav className="navbar">
      <div className="container nav-container">
        {/* Enlace al ID #home */}
        <a href="#home" className="logo">
          <img
            src={logo}
            alt="Dataflow AI"
            className="profile-img"
          />
        </a>

        <ul className="nav-links">
          <li><a href="#home">Inicio</a></li>
          <li><a href="#features">Características</a></li>
          <li><a href="#pricing">Planes</a></li>
          <li><a href="#business">Solución</a></li>
          <li><a href="#process">Proceso</a></li>
          <li><a href="#team">Equipo</a></li>
          <li><a href="#contact">Contacto</a></li>
          <li><a href="/login">Iniciar Sesión</a></li>
        </ul>

        <div className="menu-toggle">
          <i className="fas fa-bars"></i>
        </div>
      </div>
    </nav>
  );
}
