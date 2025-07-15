//C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\07 DataFlow WebSite\front-dataflowai\src\components\footer.jsx
import  '../../styles/Navbar.css';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <h3>Dataflow AI</h3>
            <p>Transformando datos en decisiones inteligentes para las PYMES.</p>
            <div className="footer-social">
              <a href="#" className="social-icon"><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="social-icon"><i className="fab fa-twitter"></i></a>
              <a href="#" className="social-icon"><i className="fab fa-linkedin-in"></i></a>
              <a href="#" className="social-icon"><i className="fab fa-instagram"></i></a>
            </div>
          </div>

          <div className="footer-col">
            <h3>Enlaces</h3>
            <ul className="footer-links">
              <li><a href="#features">Características</a></li>
              <li><a href="#pricing">Planes</a></li>
              <li><a href="#business">Solución</a></li>
              <li><a href="#process">Proceso</a></li>
              <li><a href="#team">Equipo</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Recursos</h3>
            <ul className="footer-links">
              <li><a href="#">Documentación</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Tutoriales</a></li>
              <li><a href="#">Centro de Ayuda</a></li>
              <li><a href="#">API</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Legal</h3>
            <ul className="footer-links">
              <li><a href="#">Términos de Servicio</a></li>
              <li><a href="#">Política de Privacidad</a></li>
              <li><a href="#">Cookies</a></li>
              <li><a href="#">Seguridad</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2023 Dataflow AI. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}