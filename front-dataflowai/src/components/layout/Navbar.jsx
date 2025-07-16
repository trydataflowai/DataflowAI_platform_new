import '../../styles/Navbar.css';
import logo from '../../assets/Dataflow AI logo ajustado blanco.png';
import { useEffect, useState } from 'react';
import { obtenerInfoUsuario } from '../../api/Usuario';

export function Navbar() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      obtenerInfoUsuario()
        .then(data => {
          setUsuario(data);
          setCargando(false);
        })
        .catch(() => {
          setCargando(false);
        });
    } else {
      setCargando(false);
    }
  }, []);

  const handleCerrarSesion = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (cargando) {
    return null; // O puedes mostrar un spinner
  }

  return (
    <nav className="navbar">
      <div className="container nav-container">
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
          {usuario ? (
            <li className="user-menu">
              <a href="/home" className="user-name">
                {usuario.nombre || 'Dashboards'}
              </a>
            </li>
          ) : (
            <li><a href="/login">Iniciar Sesión</a></li>
          )}
        </ul>

        <div className="menu-toggle">
          <i className="fas fa-bars"></i>
        </div>
      </div>
    </nav>
  );
}