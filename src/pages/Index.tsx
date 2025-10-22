import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mountain, Wifi, Coffee, Dumbbell, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hotel-hero.jpg";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0" style={{ background: 'var(--gradient-overlay)' }} />
        
        <div className="relative z-10 text-center text-white px-4">
          <Mountain className="h-16 w-16 mx-auto mb-6 animate-pulse" />
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Hotel del Cerro
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
            Tu refugio en las alturas del Cerro San Bernardo
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/habitaciones">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
                Ver Habitaciones
              </Button>
            </Link>
            <Link to="/contacto">
              <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur border-white text-white hover:bg-white/20">
                Contactar
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6 text-primary">Bienvenidos</h2>
          <p className="text-lg text-muted-foreground mb-8">
            En el corazón del emblemático Cerro San Bernardo, nuestro hotel ofrece una experiencia 
            única donde la naturaleza se encuentra con el confort moderno. Disfruta de vistas 
            panorámicas incomparables de la ciudad de Salta y las montañas circundantes.
          </p>
          <p className="text-lg text-muted-foreground">
            Con habitaciones diseñadas pensando en tu descanso, servicios de primera clase y 
            la calidez de la hospitalidad salteña, te invitamos a vivir una estadía inolvidable.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-primary">Nuestros Servicios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Wifi className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">WiFi Premium</h3>
              <p className="text-sm text-muted-foreground">
                Internet de alta velocidad en todas las instalaciones
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Utensils className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Restaurante</h3>
              <p className="text-sm text-muted-foreground">
                Gastronomía regional e internacional
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Coffee className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Desayuno Buffet</h3>
              <p className="text-sm text-muted-foreground">
                Productos frescos y regionales cada mañana
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Spa & Gym</h3>
              <p className="text-sm text-muted-foreground">
                Relájate y mantente activo durante tu estadía
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6 text-primary">¿Listo para tu próxima aventura?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Reserva tu habitación ahora y descubre la magia del Cerro San Bernardo
          </p>
          <Link to="/habitaciones">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Hacer una Reserva
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
