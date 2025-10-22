import { Mountain, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Mountain className="h-6 w-6" />
              <h3 className="text-lg font-bold">Hotel del Cerro</h3>
            </div>
            <p className="text-sm text-primary-foreground/80">
              Experiencia única en el corazón del Cerro San Bernardo, Salta, Argentina.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Enlaces rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-accent transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/habitaciones" className="hover:text-accent transition-colors">
                  Habitaciones
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="hover:text-accent transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+54 387 123-4567</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>info@hoteldelcerro.com</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Ubicación</h4>
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 mt-1" />
              <span>Cerro San Bernardo<br />Salta Capital, Argentina</span>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} Hotel del Cerro. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
