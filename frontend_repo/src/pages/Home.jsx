import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { getContract } from "../utils/contract";

function Home() {
  const navigate = useNavigate();
  const { account, provider } = useWeb3();
  const [user, setUser] = useState(null);
  
  // Estadísticas Web3
  const [stats, setStats] = useState({
    elecciones: 0,
    candidatos: 0,
    cargando: true
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const fetchBlockchainStats = async () => {
      if (provider) {
        try {
          const contract = getContract(provider);
          const totalElecciones = await contract.totalElecciones();
          const count = Number(totalElecciones);
          
          let totalCandidatosCount = 0;
          for (let i = 0; i < count; i++) {
            const candCount = await contract.totalCandidatos(i);
            totalCandidatosCount += Number(candCount);
          }

          setStats({
            elecciones: count,
            candidatos: totalCandidatosCount,
            cargando: false
          });
        } catch (e) {
          console.error("Error fetching stats from blockchain:", e);
          setStats(prev => ({ ...prev, cargando: false }));
        }
      } else {
        setStats(prev => ({ ...prev, cargando: false }));
      }
    };
    fetchBlockchainStats();
  }, [provider]);

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      
      {/* SECCIÓN HERO INSTITUCIONAL */}
      <section
        style={{
          padding: "80px 20px",
          textAlign: "center",
          background: "linear-gradient(135deg, #0f2c59 0%, #1e3a8a 100%)",
          color: "white",
          borderBottom: "6px solid #1d4ed8",
          boxShadow: "0 10px 30px rgba(15, 44, 89, 0.15)",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <span style={{ fontSize: "60px", display: "block", marginBottom: "15px" }}>🏛️</span>
          
          <span style={{ 
            fontSize: "12px", 
            letterSpacing: "3px", 
            color: "#93c5fd", 
            fontWeight: "bold",
            display: "block",
            textTransform: "uppercase",
            marginBottom: "10px"
          }}>
            República Argentina • Sistema Nacional Electoral
          </span>

          <h1
            style={{
              fontSize: "44px",
              fontWeight: "900",
              marginBottom: "20px",
              lineHeight: "1.2",
              letterSpacing: "-0.5px"
            }}
          >
            Portal Oficial de Votación Blockchain
          </h1>

          <p
            style={{
              fontSize: "18px",
              maxWidth: "700px",
              margin: "0 auto 40px auto",
              color: "#bfdbfe",
              lineHeight: "1.6",
              fontWeight: "300"
            }}
          >
            Garantizamos la transparencia, seguridad y la inmutabilidad de cada sufragio nacional utilizando
            contratos inteligentes y criptografía de vanguardia en Ethereum.
          </p>

          <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
            {user ? (
              <>
                <button 
                  style={{...mainButton, backgroundColor: "#10b981", boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)"}} 
                  onClick={() => navigate("/voting")}
                >
                  🗳️ Ingresar al Cuarto Oscuro
                </button>
                <button 
                  style={{...secondaryButton, backgroundColor: "transparent", color: "white", border: "2px solid white"}} 
                  onClick={() => navigate("/admin")}
                >
                  ⚙️ Administrar Elecciones
                </button>
              </>
            ) : (
              <>
                <button 
                  style={{...mainButton, backgroundColor: "#1d4ed8", boxShadow: "0 4px 14px rgba(29, 78, 216, 0.4)"}} 
                  onClick={() => navigate("/login")}
                >
                  🔑 Iniciar Sesión Oficial
                </button>
                <button 
                  style={{...secondaryButton, backgroundColor: "white", color: "#0f2c59", border: "none"}} 
                  onClick={() => navigate("/register")}
                >
                  📝 Inscribirse en el Padrón
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* SECCIÓN ESTADÍSTICAS EN TIEMPO REAL */}
      <section style={{ padding: "50px 20px", maxWidth: "1100px", margin: "-40px auto 40px auto" }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "30px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)",
          border: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "30px"
        }}>
          <div style={{ textAlign: "center", minWidth: "200px" }}>
            <span style={{ fontSize: "36px", display: "block" }}>🇦🇷</span>
            <span style={{ fontSize: "14px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>
              Estado del Sistema
            </span>
            <h3 style={{ margin: "5px 0 0 0", color: "#10b981", fontSize: "20px", fontWeight: "800" }}>
              🟢 ONLINE
            </h3>
          </div>

          <div style={{ width: "1px", height: "60px", backgroundColor: "#e2e8f0" }}></div>

          <div style={{ textAlign: "center", minWidth: "200px" }}>
            <span style={{ fontSize: "14px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>
              Elecciones Activas
            </span>
            <h3 style={{ margin: "5px 0 0 0", color: "#0f2c59", fontSize: "32px", fontWeight: "900" }}>
              {stats.cargando ? "..." : stats.elecciones}
            </h3>
          </div>

          <div style={{ width: "1px", height: "60px", backgroundColor: "#e2e8f0" }}></div>

          <div style={{ textAlign: "center", minWidth: "200px" }}>
            <span style={{ fontSize: "14px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>
              Postulantes Registrados
            </span>
            <h3 style={{ margin: "5px 0 0 0", color: "#0f2c59", fontSize: "32px", fontWeight: "900" }}>
              {stats.cargando ? "..." : stats.candidatos}
            </h3>
          </div>
        </div>
      </section>

      {/* SECCIÓN DE GARANTÍAS */}
      <section style={{ padding: "40px 20px", maxWidth: "1100px", margin: "0 auto 60px auto" }}>
        <h2
          style={{
            textAlign: "center",
            marginBottom: "10px",
            color: "#0f2c59",
            fontSize: "28px",
            fontWeight: "800"
          }}
        >
          Garantías Criptográficas e Institucionales
        </h2>
        <p style={{ textAlign: "center", color: "#64748b", marginBottom: "40px", maxWidth: "600px", margin: "0 auto 40px auto", fontSize: "15px" }}>
          Nuestra tecnología híbrida asegura un proceso democrático blindado contra cualquier intento de manipulación.
        </p>

        <div
          style={{
            display: "flex",
            gap: "24px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={cardStyle}>
            <span style={{ fontSize: "40px", display: "block", marginBottom: "15px" }}>🔒</span>
            <h3 style={{ color: "#0f2c59", fontWeight: "700", marginBottom: "10px" }}>Seguridad Criptográfica</h3>
            <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.5" }}>
              Los votos emitidos se encriptan y se asocian de forma irrevocable a la blockchain. Ninguna entidad estatal ni hacker puede modificar tu decisión.
            </p>
          </div>

          <div style={cardStyle}>
            <span style={{ fontSize: "40px", display: "block", marginBottom: "15px" }}>🛡️</span>
            <h3 style={{ color: "#0f2c59", fontWeight: "700", marginBottom: "10px" }}>Identidad Única Validada</h3>
            <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.5" }}>
              Validamos tu identidad real con tu DNI único mediante base de datos cifrada y te habilitamos en la blockchain de forma unívoca, evitando votos duplicados.
            </p>
          </div>

          <div style={cardStyle}>
            <span style={{ fontSize: "40px", display: "block", marginBottom: "15px" }}>📊</span>
            <h3 style={{ color: "#0f2c59", fontWeight: "700", marginBottom: "10px" }}>Transparencia Absoluta</h3>
            <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.5" }}>
              El escrutinio y los candidatos viven directamente en contratos inteligentes autoejecutables. Cualquier ciudadano o auditor internacional puede verificar el recuento.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ESTILOS INTERNOS */

const mainButton = {
  padding: "16px 32px",
  fontSize: "16px",
  fontWeight: "bold",
  border: "none",
  color: "white",
  borderRadius: "10px",
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
};

const secondaryButton = {
  padding: "16px 32px",
  fontSize: "16px",
  fontWeight: "bold",
  borderRadius: "10px",
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
};

const cardStyle = {
  width: "300px",
  padding: "30px",
  borderRadius: "16px",
  backgroundColor: "white",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
  textAlign: "center",
  border: "1px solid #f1f5f9",
};

export default Home;