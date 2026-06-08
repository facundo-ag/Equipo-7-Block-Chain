import React, { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { getContract } from "../utils/contract";
import { parseCandidato } from "../utils/candidateHelper";

function VotingPanel() {
  const { account, provider, signer } = useWeb3();
  
  // Datos del Ciudadano (desde LocalStorage para visualización, validado con Blockchain)
  const [ciudadano, setCiudadano] = useState(null);
  const [esElegibleBlockchain, setEsElegibleBlockchain] = useState(true);
  const [cargandoElegibilidad, setCargandoElegibilidad] = useState(false);

  // Estados de Candidatos para la Votación Activa
  const [candidatos, setCandidatos] = useState([]);
  const [cargandoCandidatos, setCargandoCandidatos] = useState(false);
  const [haVotado, setHaVotado] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  
  // Estado de Transacción
  const [procesandoVoto, setProcesandoVoto] = useState(null); // ID del candidato procesándose
  const [errorInfo, setErrorInfo] = useState("");
  const [exitoInfo, setExitoInfo] = useState("");

  // --- EFECTOS DE INICIALIZACIÓN ---

  // 1. Cargar datos del ciudadano desde localStorage al montar
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCiudadano(JSON.parse(storedUser));
    }
  }, []);

  // 2. Validar que la wallet activa de MetaMask coincida con la registrada en la DB (Padrón)
  useEffect(() => {
    if (account && ciudadano) {
      const match = account.toLowerCase() === ciudadano.wallet_address.toLowerCase();
      setEsElegibleBlockchain(match);
    } else if (account) {
      // Si hay cuenta pero no cargó ciudadano aún, de forma temporal permitimos hasta que lea de localstorage
      setEsElegibleBlockchain(true);
    } else {
      setEsElegibleBlockchain(false);
    }
  }, [account, ciudadano]);

  // 3. Cargar candidatos y verificar estado de voto desde la Blockchain
  useEffect(() => {
    const cargarCandidatosYVoto = async () => {
      if (!provider) return;
      setCargandoCandidatos(true);
      setErrorInfo("");
      setExitoInfo("");
      try {
        const contract = getContract(provider);
        
        // 1. Obtener candidatos globales
        const total = await contract.totalCandidatos();
        const count = Number(total);
        
        let arrCandidatos = [];
        for (let i = 0; i < count; i++) {
          const cand = await contract.candidatos(i);
          arrCandidatos.push(parseCandidato(cand));
        }
        setCandidatos(arrCandidatos);

        // 2. Verificar si el usuario ya votó
        if (account) {
          const votado = await contract.haVotado(account);
          setHaVotado(votado);
        } else {
          setHaVotado(false);
        }
      } catch (e) {
        console.error("Error al cargar datos de candidatos/votos:", e);
        setErrorInfo("Error al consultar el estado de la votación en la blockchain.");
      } finally {
        setCargandoCandidatos(false);
      }
    };

    cargarCandidatosYVoto();
  }, [provider, account]);

  // --- EMISIÓN DE VOTO ---

  const handleEmitirVoto = async (candidatoId) => {
    if (!signer) return alert("Por favor, conecte su wallet MetaMask para continuar.");
    if (!esElegibleBlockchain) {
      return alert("⚠️ Discrepancia de Wallet: Tu cuenta de MetaMask activa no coincide con la wallet registrada en tu padrón. Selecciona la cuenta correcta en tu extensión de MetaMask.");
    }
    if (haVotado) {
      return alert("Usted ya ha emitido su voto en esta elección.");
    }

    if (!window.confirm("¿Está seguro de confirmar su voto soberano en la Blockchain? Esta acción es irreversible.")) {
      return;
    }

    setProcesandoVoto(candidatoId);
    setErrorInfo("");
    setExitoInfo("");

    try {
      const contract = getContract(signer);
      
      // Emitir transacción en la Blockchain
      const tx = await contract.emitirVoto(candidatoId, { gasLimit: 3000000 });
      
      setExitoInfo("Transacción enviada. Esperando confirmación del bloque...");
      
      await tx.wait(); // Esperar confirmación
      
      setExitoInfo("¡Voto registrado y auditado correctamente en la Blockchain de Ethereum!");
      alert("¡Su voto se ha emitido con éxito! Gracias por cumplir con su deber cívico.");
      
      // Recargar candidatos y voto actualizado
      const total = await contract.totalCandidatos();
      const count = Number(total);
      
      let arrCandidatos = [];
      for (let i = 0; i < count; i++) {
        const cand = await contract.candidatos(i);
        arrCandidatos.push(parseCandidato(cand));
      }
      setCandidatos(arrCandidatos);
      setHaVotado(true);
    } catch (err) {
      console.error("Error al emitir voto:", err);
      const msg = err.message?.toLowerCase();
      if (msg?.includes("ya has emitido")) {
        setErrorInfo("Usted ya ha votado en esta elección anteriormente.");
      } else if (msg?.includes("no estas registrado")) {
        setErrorInfo("Su wallet no se encuentra habilitada en el padrón electoral.");
      } else {
        setErrorInfo("La transacción fue cancelada o falló en la red blockchain.");
      }
    } finally {
      setProcesandoVoto(null);
    }
  };

  // --- VISTAS AUXILIARES ---

  if (!account) {
    return (
      <div style={containerStyle}>
        <div style={warningCardStyle}>
          <span style={{ fontSize: "50px", display: "block", marginBottom: "15px" }}>🔑</span>
          <h2 style={{ color: "#0f2c59", fontWeight: "800" }}>Conexión Requerida</h2>
          <p style={{ color: "#64748b", margin: "10px 0 25px 0" }}>
            Debe vincular su wallet MetaMask para ingresar de forma soberana al Cuarto Oscuro Nacional.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={{ color: "#0f2c59", fontWeight: "900", textAlign: "center", marginBottom: "30px" }}>
        🗳️ Cuarto Oscuro Digital Soberano
      </h1>

      {/* DASHBOARD DE DATOS DEL CIUDADANO */}
      <div style={ciudadanoCardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <span style={labelStyle}>CIUDADANO AUTENTICADO</span>
            <h3 style={{ margin: "5px 0", color: "#0f2c59", fontSize: "20px", fontWeight: "800" }}>
              {ciudadano ? `${ciudadano.apellido}, ${ciudadano.nombre}` : "Cargando ciudadano..."}
            </h3>
            <p style={{ fontSize: "14px", color: "#64748b" }}>
              DNI: <strong>{ciudadano ? ciudadano.dni : "..."}</strong> | Wallet: <code style={{ fontSize: "12px" }}>{account}</code>
            </p>
          </div>
          
          <div>
            {cargandoElegibilidad ? (
              <span style={badgeStatusPending}>Verificando Identidad...</span>
            ) : esElegibleBlockchain ? (
              <span style={badgeStatusOk}>✓ WALLET CORRECTA Y VINCULADA</span>
            ) : (
              <span style={badgeStatusError}>⚠️ DISCREPANCIA DE WALLET</span>
            )}
          </div>
        </div>

        {!cargandoElegibilidad && !esElegibleBlockchain && (
          <div style={{
            ...alertContainerStyle,
            backgroundColor: "#fff5f5",
            color: "#c53030",
            borderColor: "#feb2b2",
            borderWidth: "1px",
            borderStyle: "solid"
          }}>
            <strong style={{ fontSize: "16px", display: "block", marginBottom: "8px" }}>
              ⚠️ Discrepancia de Identidad Digital Detectada
            </strong>
            La dirección de MetaMask conectada actualmente (
            <code style={{ 
              backgroundColor: "#fff0f0", 
              padding: "2px 6px", 
              borderRadius: "4px", 
              fontSize: "13px",
              fontWeight: "bold",
              color: "#9b2c2c" 
            }}>
              {account}
            </code>
            ) no coincide con la wallet registrada en tu padrón electoral (
            <code style={{ 
              backgroundColor: "#fff0f0", 
              padding: "2px 6px", 
              borderRadius: "4px", 
              fontSize: "13px",
              fontWeight: "bold",
              color: "#9b2c2c" 
            }}>
              {ciudadano?.wallet_address}
            </code>
            ).
            <br />
            <br />
            <span style={{ fontWeight: "bold" }}>¿Cómo sufragar?</span> Para garantizar la seguridad del voto y la coincidencia con tu identidad cívica, debés abrir tu extensión de MetaMask y cambiar la cuenta activa a la registrada para tu perfil.
          </div>
        )}
      </div>

      {/* DETALLE DE NOTIFICACIONES */}
      {exitoInfo && <div style={successAlertStyle}>{exitoInfo}</div>}
      {errorInfo && <div style={errorAlertStyle}>{errorInfo}</div>}

      {/* CUARTO OSCURO / GRID DE CANDIDATOS */}
      <div style={{ marginTop: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", flexWrap: "wrap", gap: "15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
            <h2 style={{ color: "#0f2c59", fontWeight: "800", margin: 0 }}>
              Postulantes Oficiales
            </h2>
          </div>
          {haVotado && (
            <span style={{
              backgroundColor: "#d1fae5",
              color: "#065f46",
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "bold",
              border: "1px solid #a7f3d0"
            }}>
              ✓ USTED YA HA EMITIDO SU VOTO
            </span>
          )}
        </div>

        {cargandoCandidatos ? (
          <p style={{ textAlign: "center", color: "#64748b", margin: "40px 0" }}>Consultando candidatos en el contrato inteligente...</p>
        ) : candidatos.length === 0 ? (
          <p style={{ color: "#64748b", textAlign: "center", margin: "40px 0" }}>
            No se encuentran postulantes registrados en la blockchain aún.
          </p>
        ) : (
          <div style={candidatesGridStyle}>
            {candidatos.map((cand) => {
              const isHovered = hoveredCard === cand.id;
              const cardColor = cand.color || "#1d4ed8";
              
              return (
                <div 
                  key={cand.id} 
                  onMouseEnter={() => setHoveredCard(cand.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    ...candidateCardStyle,
                    borderColor: haVotado ? "#d1fae5" : isHovered ? cardColor : "#cbd5e1",
                    borderTop: `6px solid ${cardColor}`,
                    boxShadow: isHovered 
                      ? `0 12px 24px -10px ${cardColor}40, 0 4px 20px -2px ${cardColor}15` 
                      : "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    transform: isHovered ? "translateY(-6px)" : "none",
                  }}
                >
                  <div style={{
                    ...candidateBadgeStyle,
                    backgroundColor: `${cardColor}15`,
                    color: cardColor,
                    border: `1.5px solid ${cardColor}30`
                  }}>
                    LISTA #{cand.id + 1}
                  </div>
                  
                  {/* Foto del Candidato con marco del color de partido */}
                  <div style={{ display: "flex", justifyContent: "center", marginTop: "15px", marginBottom: "15px" }}>
                    <div style={{ position: "relative" }}>
                      <img 
                        src={cand.foto} 
                        alt={cand.nombre} 
                        style={{
                          width: "110px",
                          height: "110px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: `3px solid ${cardColor}`,
                          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                          backgroundColor: "#f1f5f9"
                        }}
                      />
                      <span style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        backgroundColor: cardColor,
                        border: "2.5px solid #ffffff",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                      }} />
                    </div>
                  </div>
                  
                  <h3 style={{ color: "#0f2c59", fontSize: "21px", fontWeight: "900", margin: "10px 0 5px 0" }}>
                    {cand.nombre} {cand.apellido}
                  </h3>
                  
                  <p style={{ 
                    color: cardColor, 
                    fontSize: "13px", 
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    margin: "0 0 20px 0",
                    display: "inline-block",
                    padding: "3px 10px",
                    backgroundColor: `${cardColor}08`,
                    borderRadius: "6px"
                  }}>
                    {cand.partido}
                  </p>

                  <button
                    disabled={procesandoVoto !== null || haVotado || !esElegibleBlockchain}
                    onClick={() => handleEmitirVoto(cand.id)}
                    style={{
                      ...voteButtonStyle,
                      backgroundColor: haVotado 
                        ? "#10b981" 
                        : !esElegibleBlockchain 
                          ? "#cbd5e1" 
                          : isHovered 
                            ? `${cardColor}dd` 
                            : cardColor,
                      cursor: (procesandoVoto !== null || haVotado || !esElegibleBlockchain) ? "not-allowed" : "pointer",
                      opacity: (procesandoVoto !== null) ? 0.7 : 1,
                      boxShadow: haVotado 
                        ? "none" 
                        : !esElegibleBlockchain 
                          ? "none" 
                          : isHovered 
                            ? `0 6px 15px ${cardColor}40` 
                            : `0 4px 10px ${cardColor}25`
                    }}
                  >
                    {procesandoVoto === cand.id 
                      ? "Firmando Voto..." 
                      : haVotado 
                        ? "✓ Voto Registrado" 
                        : !esElegibleBlockchain 
                          ? "Padrón no verificado" 
                          : "Emitir Voto"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER DESCENTRALIZADO */}
      <div style={auditFooterStyle}>
        🛡️ Cada voto se procesa a través de un contrato inteligente público de código abierto en la blockchain. Su identidad no es asociada de forma pública a su elección para preservar el voto secreto.
      </div>
    </div>
  );
}

// --- ESTILOS MODERNOS Y GUBERNAMENTALES DE ALTA GAMA ---

const containerStyle = {
  padding: "40px 20px",
  maxWidth: "1000px",
  margin: "0 auto",
  fontFamily: "'Outfit', 'Inter', sans-serif"
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

const ciudadanoCardStyle = {
  backgroundColor: "white",
  padding: "30px",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 6px -1px rgba(15, 44, 89, 0.03), 0 2px 4px -1px rgba(15, 44, 89, 0.01)",
  marginBottom: "30px"
};

const selectionCardStyle = {
  backgroundColor: "white",
  padding: "25px 30px",
  borderRadius: "16px",
  border: "1px solid #cbd5e1",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.03)",
  marginBottom: "30px"
};

const labelStyle = {
  fontSize: "11px",
  letterSpacing: "1.5px",
  color: "#64748b",
  fontWeight: "bold",
  textTransform: "uppercase"
};

const selectStyle = {
  width: "100%",
  padding: "14px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "16px",
  fontWeight: "bold",
  color: "#0f2c59",
  backgroundColor: "#f8fafc",
  cursor: "pointer"
};

const badgeStatusOk = {
  backgroundColor: "#d1fae5",
  color: "#065f46",
  padding: "8px 16px",
  borderRadius: "9999px",
  fontSize: "12px",
  fontWeight: "bold",
  border: "1px solid #a7f3d0"
};

const badgeStatusPending = {
  backgroundColor: "#fef3c7",
  color: "#92400e",
  padding: "8px 16px",
  borderRadius: "9999px",
  fontSize: "12px",
  fontWeight: "bold",
  border: "1px solid #fde68a"
};

const badgeStatusError = {
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  padding: "8px 16px",
  borderRadius: "9999px",
  fontSize: "12px",
  fontWeight: "bold",
  border: "1px solid #fecaca"
};

const alertContainerStyle = {
  marginTop: "20px",
  padding: "15px 20px",
  borderRadius: "8px",
  backgroundColor: "#fffbeb",
  color: "#b45309",
  border: "1px solid #fef3c7",
  fontSize: "14px",
  lineHeight: "1.5",
  textAlign: "left"
};

const successAlertStyle = {
  padding: "15px 20px",
  borderRadius: "10px",
  backgroundColor: "#d1fae5",
  color: "#065f46",
  border: "1px solid #a7f3d0",
  fontWeight: "600",
  fontSize: "14px",
  marginBottom: "25px",
  textAlign: "center"
};

const errorAlertStyle = {
  padding: "15px 20px",
  borderRadius: "10px",
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fecaca",
  fontWeight: "600",
  fontSize: "14px",
  marginBottom: "25px",
  textAlign: "center"
};

const candidatesGridStyle = {
  display: "flex",
  gap: "24px",
  flexWrap: "wrap",
  marginTop: "20px"
};

const candidateCardStyle = {
  flex: "1 1 280px",
  backgroundColor: "white",
  padding: "30px",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  textAlign: "center",
  position: "relative",
  overflow: "hidden",
  transition: "all 0.2s ease"
};

const candidateBadgeStyle = {
  position: "absolute",
  top: "12px",
  left: "12px",
  backgroundColor: "#eff6ff",
  color: "#1d4ed8",
  padding: "4px 10px",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: "bold",
  textTransform: "uppercase"
};

const votesBoxStyle = {
  backgroundColor: "#f8fafc",
  padding: "15px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  marginBottom: "25px"
};

const voteButtonStyle = {
  width: "100%",
  padding: "14px",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "16px",
  fontWeight: "bold",
  boxShadow: "0 4px 6px -1px rgba(29, 78, 216, 0.2)",
  transition: "all 0.2s ease"
};

const auditFooterStyle = {
  marginTop: "60px",
  padding: "20px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  backgroundColor: "#f8fafc",
  color: "#64748b",
  fontSize: "12px",
  lineHeight: "1.6",
  textAlign: "center"
};

export default VotingPanel;

