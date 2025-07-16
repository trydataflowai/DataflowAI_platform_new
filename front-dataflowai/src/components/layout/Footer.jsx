//C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\07 DataFlow WebSite\front-dataflowai\src\components\footer.jsx
import  '../../styles/Navbar.css';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <h3>Dataflow AI</h3>
            <p>Transforming data into smart decisions for SMEs.</p>
            <div className="footer-social">
              <a href="#" className="social-icon"><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="social-icon"><i className="fab fa-twitter"></i></a>
              <a href="#" className="social-icon"><i className="fab fa-linkedin-in"></i></a>
              <a href="#" className="social-icon"><i className="fab fa-instagram"></i></a>
            </div>
          </div>

          <div className="footer-col">
            <h3>Links</h3>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Plans</a></li>
              <li><a href="#business">Solution</a></li>
              <li><a href="#process">Process</a></li>
              <li><a href="#team">Team</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Resources</h3>
            <ul className="footer-links">
              <li><a href="#">Documentation</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Tutorials</a></li>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">API</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Legal</h3>
            <ul className="footer-links">
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Cookies</a></li>
              <li><a href="#">Security</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2023 Dataflow AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
