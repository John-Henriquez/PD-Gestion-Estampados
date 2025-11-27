import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Instagram } from 'lucide-react';
import '../../styles/components/footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Sección 1: Info Empresa */}
        <div className="footer-section">
          <h3 className="footer-title">Vibra Estampados</h3>
          <p className="footer-text">
            Transformamos tus ideas en productos únicos. Expertos en personalización de textiles y
            artículos promocionales con la mejor calidad del mercado.
          </p>
        </div>

        {/* Sección 2: Enlaces Rápidos */}
        <div className="footer-section">
          <h3 className="footer-title">Navegación</h3>
          <ul className="footer-links">
            <li>
              <Link to="/shop"> Tienda </Link>
            </li>
            <li>
              <Link to="/home">Inicio</Link>
            </li>
            {/* Puedes agregar más enlaces aquí */}
          </ul>
        </div>

        {/* Sección 3: Contacto */}
        <div className="footer-section">
          <h3 className="footer-title">Contáctanos</h3>
          <ul className="footer-links">
            <li>
              <MapPin size={18} />
              <span>Concepción, Chile</span>
            </li>
            <li>
              <Phone size={18} />
              <span>+56 9 1234 5678</span>
            </li>
            <li>
              <Mail size={18} />
              <span>contacto@vibraestampados.cl</span>
            </li>
            <li>
              <a
                href="https://www.instagram.com/vibra_estampados?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={18} /> @vibraestampados
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} Vibra Estampados. Todos los derechos reservados.
      </div>
    </footer>
  );
};

export default Footer;
