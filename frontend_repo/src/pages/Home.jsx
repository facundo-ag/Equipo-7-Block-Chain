import { useNavigate } from "react-router-dom";

function Home() {
    const navigate = useNavigate();
  return (
    <div>


      {/* HERO */}
      <section
        style={{
          padding: "80px 20px",
          textAlign: "center",
          backgroundColor: "#f3f4f6",
          minHeight: "80vh",
        }}
      >
        <h1
          style={{
            fontSize: "50px",
            marginBottom: "20px",
            color: "#111827",
          }}
        >
          Sistema de Votación Blockchain
        </h1>

        <p
          style={{
            fontSize: "20px",
            maxWidth: "800px",
            margin: "0 auto",
            color: "#374151",
            lineHeight: "1.6",
          }}
        >
          Plataforma segura y transparente para elecciones digitales utilizando
          tecnología blockchain y contratos inteligentes en Ethereum.
        </p>

        <div style={{ marginTop: "40px" }}>
          <button style={mainButton} onClick={() => navigate("/voting")}>
            Ir a Votar
          </button>

          <button style={secondaryButton} onClick={() => navigate("/voting")}>
            Ver Resultados
          </button>
        </div>
      </section>

      {/* FEATURES */}
      <section
        style={{
          padding: "60px 20px",
          backgroundColor: "white",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "40px",
            fontSize: "36px",
          }}
        >
          Características del Sistema
        </h2>

        <div
          style={{
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={cardStyle}>
            <h3>Seguridad</h3>
            <p>
              Los votos son protegidos mediante criptografía blockchain.
            </p>
          </div>

          <div style={cardStyle}>
            <h3>Transparencia</h3>
            <p>
              Todas las transacciones quedan registradas en Ethereum.
            </p>
          </div>

          <div style={cardStyle}>
            <h3>Descentralización</h3>
            <p>
              No existe una única entidad que controle la elección.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ESTILOS */

const buttonStyle = {
  marginLeft: "10px",
  padding: "10px 20px",
  border: "none",
  backgroundColor: "#2563eb",
  color: "white",
  borderRadius: "5px",
  cursor: "pointer",
};

const mainButton = {
  padding: "15px 30px",
  fontSize: "18px",
  marginRight: "15px",
  border: "none",
  backgroundColor: "#10b981",
  color: "white",
  borderRadius: "8px",
  cursor: "pointer",
};

const secondaryButton = {
  padding: "15px 30px",
  fontSize: "18px",
  border: "1px solid #111827",
  backgroundColor: "white",
  color: "#111827",
  borderRadius: "8px",
  cursor: "pointer",
};

const cardStyle = {
  width: "300px",
  padding: "30px",
  borderRadius: "10px",
  backgroundColor: "#f9fafb",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  textAlign: "center",
};

export default Home;