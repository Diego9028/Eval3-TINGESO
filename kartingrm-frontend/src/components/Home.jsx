import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  
  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const features = [
    {
      title: "Nueva Reserva",
      description: "Reserva tu kart de forma rápida y sencilla",
      action: "Reservar Ahora",
      route: "/reservas"
    },
    {
      title: "Disponibilidad Semanal",
      description: "Consulta los horarios disponibles en tiempo real",
      action: "Ver Disponibilidad",
      route: "/rack"
    },
    {
      title: "Reportes de Ingresos",
      description: "Accede a estadísticas detalladas del negocio",
      action: "Ver Reportes",
      route: "/reportes"
    }
  ];

  const handleNavigation = (route) => {
    navigate(route);
  };

  return (
    <div style={{ 
      padding: "2rem", 
      maxWidth: "1200px", 
      margin: "0 auto",
      fontFamily: "Arial, sans-serif" 
    }}>
      {/* Header con información de estado */}
      <header style={{ 
        marginBottom: "2rem",
        textAlign: "center" 
      }}>
        <h1 style={{ 
          color: "#2c3e50", 
          marginBottom: "0.5rem",
          fontSize: "2.5rem" 
        }}>
          KartingRM
        </h1>
        <p style={{ 
          color: "#7f8c8d", 
          fontSize: "1.1rem",
          margin: "0" 
        }}>
          Sistema de Gestión de Reservas • {currentDate}
        </p>
        <div style={{
          backgroundColor: "#27ae60",
          color: "white",
          padding: "0.5rem 1rem",
          borderRadius: "20px",
          display: "inline-block",
          marginTop: "1rem",
          fontSize: "0.9rem"
        }}>
          Sistema Operativo
        </div>
      </header>

      {/* Descripción clara y concisa */}
      <section style={{ 
        backgroundColor: "#f8f9fa",
        padding: "1.5rem",
        borderRadius: "8px",
        marginBottom: "2rem",
        border: "1px solid #e9ecef"
      }}>
        <h2 style={{ 
          color: "#495057",
          marginBottom: "1rem",
          fontSize: "1.5rem" 
        }}>
          Bienvenido al Sistema de Reservas
        </h2>
        <p style={{ 
          lineHeight: "1.6",
          color: "#6c757d",
          fontSize: "1.1rem",
          margin: "0" 
        }}>
          Gestiona reservas de karts de manera eficiente. Nuestro sistema automatiza 
          tarifas, descuentos y disponibilidad para ofrecerte la mejor experiencia 
          de reserva en línea.
        </p>
      </section>

      {/* Invitación para nuevos usuarios */}
      <section style={{ 
        backgroundColor: "#e8f4fd",
        padding: "1.5rem",
        borderRadius: "8px",
        marginBottom: "2rem",
        border: "1px solid #bee5eb",
        textAlign: "center"
      }}>
        <h2 style={{ 
          color: "#0c5460",
          marginBottom: "1rem",
          fontSize: "1.4rem" 
        }}>
          ¿Eres nuevo en la página?
        </h2>
        <p style={{ 
          lineHeight: "1.6",
          color: "#155724",
          fontSize: "1rem",
          margin: "0 0 1.5rem 0" 
        }}>
          ¡Únete a nuestra comunidad de karting y diviertete compitiendo con tus amigos!
        </p>
        <button 
          style={{
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            padding: "0.75rem 2rem",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "1.1rem",
            fontWeight: "bold",
            transition: "background-color 0.3s ease"
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = "#218838"}
          onMouseLeave={(e) => e.target.style.backgroundColor = "#28a745"}
          onClick={() => handleNavigation("/register")}
        >
          Registrarse Ahora
        </button>
        <p style={{ 
          fontSize: "0.9rem",
          color: "#6c757d",
          margin: "0.75rem 0 0 0" 
        }}>
          Es rápido, fácil y completamente gratuito
        </p>
      </section>

      {/* Acciones principales y descripciones claras */}
      <section>
        <h2 style={{ 
          color: "#495057",
          marginBottom: "1.5rem",
          fontSize: "1.5rem" 
        }}>
          ¿Qué deseas hacer hoy?
        </h2>
        <div style={{ 
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem" 
        }}>
          {features.map((feature, index) => (
            <div 
              key={index}
              style={{
                backgroundColor: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                border: "2px solid #e9ecef",
                transition: "all 0.3s ease",
                cursor: "pointer",
                textAlign: "center"
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = "#3498db";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = "#e9ecef";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
            >
              <h3 style={{ 
                color: "#2c3e50",
                marginBottom: "0.5rem",
                fontSize: "1.3rem" 
              }}>
                {feature.title}
              </h3>
              <p style={{ 
                color: "#7f8c8d",
                marginBottom: "1rem",
                lineHeight: "1.5" 
              }}>
                {feature.description}
              </p>
              <button style={{
                backgroundColor: "#3498db",
                color: "white",
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "bold",
                transition: "background-color 0.3s ease"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#2980b9"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#3498db"}
              onClick={() => handleNavigation(feature.route)}
              >
                {feature.action}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Información adicional colapsable */}
      <details style={{ 
        marginTop: "2rem",
        backgroundColor: "#f8f9fa",
        padding: "1rem",
        borderRadius: "8px",
        border: "1px solid #e9ecef"
      }}>
        <summary style={{ 
          cursor: "pointer",
          fontWeight: "bold",
          color: "#495057",
          fontSize: "1.1rem",
          padding: "0.5rem 0"
        }}>
          Información Técnica del Sistema
        </summary>
        <div style={{ 
          marginTop: "1rem",
          padding: "1rem",
          backgroundColor: "white",
          borderRadius: "6px",
          border: "1px solid #dee2e6"
        }}>
          <p style={{ 
            lineHeight: "1.6",
            color: "#6c757d",
            margin: "0" 
          }}>
            Tecnologías utilizadas: {" "}
            <a href="https://spring.io/projects/spring-boot" target="_blank" rel="noreferrer"
               style={{ color: "#3498db", textDecoration: "none" }}>
              Spring Boot
            </a>{" "}
            (Backend), {" "}
            <a href="https://react.dev/" target="_blank" rel="noreferrer"
               style={{ color: "#3498db", textDecoration: "none" }}>
              React con Material-UI
            </a>{" "}
            (Frontend), {" "}
            <a href="https://www.postgresql.org/" target="_blank" rel="noreferrer"
               style={{ color: "#3498db", textDecoration: "none" }}>
              PostgreSQL
            </a>{" "}
            (Base de datos). Desplegado con Docker y Docker Compose.
          </p>
        </div>
      </details>
    </div>
  );
};

export default Home;
