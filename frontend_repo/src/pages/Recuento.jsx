import React, { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { getContract, CONTRACT_ADDRESS } from "../utils/contract";
import { useNavigate } from "react-router-dom";

function Recuento() {
  const { account, provider } = useWeb3();
  const navigate = useNavigate();

  const [candidatos, setCandidatos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorInfo, setErrorInfo] = useState("");
  const [totalVotos, setTotalVotos] = useState(0);

  // Función para consultar los votos en tiempo real en la Blockchain
  const cargarRecuento = async () => {
    if (!provider) {
      setErrorInfo("Debe vincular su wallet MetaMask para consultar de forma soberana el escrutinio en la blockchain.");
      return;
    }
    setCargando(true);
    setErrorInfo("");
    try {
      const contract = getContract(provider);
      const total = await contract.totalCandidatos();
      const count = Number(total);

      let arrCandidatos = [];
      let sumaVotos = 0;
      for (let i = 0; i < count; i++) {
        const cand = await contract.candidatos(i);
        const votos = Number(cand.votos);
        arrCandidatos.push({
          id: Number(cand.id),
          nombre: cand.nombre,
          votos: votos
        });
        sumaVotos += votos;
      }

      // Ordenar candidatos por votos (mayor a menor) para un escrutinio más claro
      arrCandidatos.sort((a, b) => b.votos - a.votos);

      setCandidatos(arrCandidatos);
      setTotalVotos(sumaVotos);
    } catch (e) {
      console.error("Error al cargar recuento:", e);
      setErrorInfo("Error al consultar el contrato inteligente en la red Ethereum. Verifique su proveedor Web3.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRecuento();
  }, [provider]);

  // Si no hay provider (MetaMask desconectado o no instalado)
  if (!provider) {
    return (
      <div style={containerStyle}>
        <div style={warningCardStyle}>
          <span style={{ fontSize: "50px", display: "block", marginBottom: "15px" }}>🔒</span>
          <h2 style={{ color: "#0f2c59", fontWeight: "800" }}>Conexión Requerida para Auditoría</h2>
          <p style={{ color: "#64748b", margin: "10px 0 25px 0" }}>
            El escrutinio se ejecuta de manera soberana leyendo directamente la red de nodos de la Blockchain.
            Por favor, conecte su wallet MetaMask para verificar los resultados auditados.
          </p>
          <button 
            onClick={() => navigate("/")} 
            style={{...actionButtonStyle, backgroundColor: "#0f2c59", color: "white"}}
          >
            Volver al Menú Principal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <span style={{ fontSize: "40px", display: "block", marginBottom: "10px" }}>🇦🇷</span>
        <span style={subtitleStyle}>AUDITORÍA ELECTORAL NACIONAL</span>
        <h1 style={titleStyle}>Escrutinio Oficial Provisorio</h1>
        <p style={descriptionStyle}>
          Resultados en tiempo real leídos directamente desde el contrato inteligente descentralizado.
        </p>
      </header>

      {/* DASHBOARD DE MÉTRICAS */}
      <div style={dashboardGridStyle}>
        <div style={metricCardStyle}>
          <span style={metricLabelStyle}>TOTAL DE SUFRAGIOS</span>
          <h2 style={metricValueStyle}>{totalVotos}</h2>
          <span style={metricFootStyle}>Votos en Blockchain</span>
        </div>

        <div style={metricCardStyle}>
          <span style={metricLabelStyle}>POSTULANTES REGISTRADOS</span>
          <h2 style={metricValueStyle}>{candidatos.length}</h2>
          <span style={metricFootStyle}>Listas Oficializadas</span>
        </div>

        <div style={metricCardStyle}>
          <span style={metricLabelStyle}>CONTRATO INTELIGENTE</span>
          <h2 style={{...metricValueStyle, fontSize: "14px", overflowWrap: "break-word", margin: "15px 0", color: "#1d4ed8"}}>
            <code>{CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-10)}</code>
          </h2>
          <span style={metricFootStyle}>Dirección Inmutable</span>
        </div>
      </div>

      {errorInfo && <div style={errorAlertStyle}>{errorInfo}</div>}

      {/* LISTA Y RECUPERACIÓN DE RESULTADOS */}
      <div style={resultsContainerStyle}>
        <div style={resultsHeaderStyle}>
          <h3 style={{ margin: 0, color: "#0f2c59", fontWeight: "800" }}>
            Desglose de Candidatos y Porcentajes
          </h3>
          <button 
            onClick={cargarRecuento} 
            disabled={cargando}
            style={refreshButtonStyle}
          >
            {cargando ? "Actualizando..." : "🔄 Actualizar Resultados"}
          </button>
        </div>

        {cargando ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            Cargando el escrutinio de la Blockchain de forma inmutable...
          </div>
        ) : candidatos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            No se encuentran postulantes registrados en el Smart Contract.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            {candidatos.map((cand, index) => {
              const porcentaje = totalVotos > 0 ? ((cand.votos / totalVotos) * 100).toFixed(2) : "0.00";
              const esGanador = index === 0 && cand.votos > 0;

              return (
                <div 
                  key={cand.id} 
                  style={{
                    ...candidateRowStyle,
                    borderColor: esGanador ? "#34d399" : "#e2e8f0",
                    boxShadow: esGanador ? "0 4px 14px rgba(52, 211, 153, 0.08)" : "none"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{
                        backgroundColor: esGanador ? "#d1fae5" : "#eff6ff",
                        color: esGanador ? "#065f46" : "#1d4ed8",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}>
                        LISTA #{cand.id + 1}
                      </span>
                      <h4 style={{ margin: 0, color: "#0f2c59", fontSize: "18px", fontWeight: "800" }}>
                        {cand.nombre} {esGanador && "👑"}
                      </h4>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                      <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>
                        {cand.votos} sufragios
                      </span>
                      <strong style={{ fontSize: "20px", color: esGanador ? "#059669" : "#1e3a8a", fontWeight: "900" }}>
                        {porcentaje}%
                      </strong>
                    </div>
                  </div>

                  {/* BARRA DE PROGRESO PREMIUM */}
                  <div style={progressBarBgStyle}>
                    <div style={{
                      ...progressBarFillStyle,
                      width: `${porcentaje}%`,
                      backgroundColor: esGanador ? "#10b981" : "#1d4ed8"
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "40px" }}>
        <button 
          onClick={() => navigate("/")} 
          style={{...actionButtonStyle, backgroundColor: "#0f2c59", color: "white"}}
        >
          Ir al Menú Principal
        </button>
      </div>

      <footer style={auditFooterStyle}>
        🛡️ <strong>Garantía de Auditoría Democrática:</strong> Cada voto emitido interactúa directamente con la máquina virtual de Ethereum.
        Las firmas criptográficas e inmutabilidad garantizan que el escrutinio provisto es 100% auditable por la ciudadanía soberana.
      </footer>
    </div>
  );
}

// --- ESTILOS MODERNOS Y GUBERNAMENTALES DE ALTA GAMA ---

const containerStyle = {
  padding: "40px 20px",
  maxWidth: "1000px",
  margin: "0 auto",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  textAlign: "left"
};

const headerStyle = {
  textAlign: "center",
  marginBottom: "40px"
};

const titleStyle = {
  color: "#0f2c59",
  fontWeight: "900",
  fontSize: "38px",
  margin: "10px 0",
  letterSpacing: "-0.5px"
};

const subtitleStyle = {
  fontSize: "12px",
  letterSpacing: "3px",
  color: "#1d4ed8",
  fontWeight: "bold",
  textTransform: "uppercase"
};

const descriptionStyle = {
  color: "#64748b",
  fontSize: "16px",
  maxWidth: "600px",
  margin: "0 auto"
};

const warningCardStyle = {
  backgroundColor: "white",
  padding: "40px",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 25px -5px rgba(15, 44, 89, 0.05)",
  textAlign: "center",
  maxWidth: "500px",
  margin: "60px auto"
};

const actionButtonStyle = {
  padding: "14px 28px",
  borderRadius: "10px",
  border: "none",
  fontWeight: "bold",
  fontSize: "15px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(15, 44, 89, 0.15)",
  transition: "all 0.2s ease"
};

const dashboardGridStyle = {
  display: "flex",
  gap: "20px",
  flexWrap: "wrap",
  marginBottom: "40px"
};

const metricCardStyle = {
  flex: "1 1 280px",
  backgroundColor: "white",
  padding: "24px",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 6px -1px rgba(15, 44, 89, 0.02)",
  textAlign: "center"
};

const metricLabelStyle = {
  fontSize: "11px",
  letterSpacing: "1.5px",
  color: "#64748b",
  fontWeight: "bold",
  textTransform: "uppercase",
  display: "block"
};

const metricValueStyle = {
  fontSize: "36px",
  fontWeight: "900",
  color: "#0f2c59",
  margin: "12px 0 6px 0"
};

const metricFootStyle = {
  fontSize: "12px",
  color: "#94a3b8"
};

const errorAlertStyle = {
  padding: "15px 20px",
  borderRadius: "10px",
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fecaca",
  fontWeight: "600",
  fontSize: "14px",
  marginBottom: "30px",
  textAlign: "center"
};

const resultsContainerStyle = {
  backgroundColor: "white",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  padding: "30px",
  boxShadow: "0 4px 6px -1px rgba(15, 44, 89, 0.02)"
};

const resultsHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "2px solid #f1f5f9",
  paddingBottom: "15px",
  marginBottom: "25px",
  flexWrap: "wrap",
  gap: "15px"
};

const refreshButtonStyle = {
  backgroundColor: "transparent",
  border: "1.5px solid #cbd5e1",
  color: "#0f2c59",
  borderRadius: "8px",
  padding: "8px 16px",
  fontSize: "13px",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "all 0.2s ease"
};

const candidateRowStyle = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "20px",
  transition: "all 0.2s ease"
};

const progressBarBgStyle = {
  width: "100%",
  height: "10px",
  backgroundColor: "#e2e8f0",
  borderRadius: "9999px",
  overflow: "hidden"
};

const progressBarFillStyle = {
  height: "100%",
  borderRadius: "9999px",
  transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
};

const auditFooterStyle = {
  marginTop: "50px",
  borderTop: "1px solid #e2e8f0",
  paddingTop: "20px",
  color: "#94a3b8",
  fontSize: "13px",
  lineHeight: "1.6",
  textAlign: "center"
};

export default Recuento;
