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
    return null; // Or you can show a spinner
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
          <li><a href="#home">Home</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Plans</a></li>
          <li><a href="#business">Solution</a></li>
          <li><a href="#process">Process</a></li>
          <li><a href="#team">Team</a></li>
          <li><a href="#contact">Contact</a></li>
          {usuario ? (
            <li className="user-menu">
              <a href="/home" className="user-name">
                {usuario.nombre || 'Dashboards'}
              </a>
            </li>
          ) : (
            <li><a href="/login">Sign In</a></li>
          )}
        </ul>

        <div className="menu-toggle">
          <i className="fas fa-bars"></i>
        </div>
      </div>
    </nav>
  );
}
