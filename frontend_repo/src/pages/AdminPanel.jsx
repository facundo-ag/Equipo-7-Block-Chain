import React, { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { getContract } from "../utils/contract";
import {
  parseCandidato,
  serializeCandidato,
  PRESET_AVATARS,
  PRESET_COLORS
} from "../utils/candidateHelper";

function AdminPanel() {
  const { account, signer, provider, isAdmin } = useWeb3();
  
  // Estados de Pestañas
  const [activeTab, setActiveTab] = useState("candidatos"); // "candidatos", "auditoria", "padron"

  // Estado para la Pestaña de Candidatos (Web3)
  const [nombreCandidato, setNombreCandidato] = useState("");
  const [apellidoCandidato, setApellidoCandidato] = useState("");
  const [partidoCandidato, setPartidoCandidato] = useState("");
  const [colorCandidato, setColorCandidato] = useState("#1d4ed8");
  const [fotoCandidato, setFotoCandidato] = useState("");
  const [candidatos, setCandidatos] = useState([]);
  const [cargandoCandidatos, setCargandoCandidatos] = useState(false);

  // Estado para la Pestaña de Auditoría
  const [votosDetalle, setVotosDetalle] = useState([]);
  const [cargandoAuditoria, setCargandoAuditoria] = useState(false);

  // Estado para la Pestaña de Padrón Electoral (Web2 DB)
  const [usuarios, setUsuarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [errorUsuarios, setErrorUsuarios] = useState("");

  // --- CARGA DE DATOS ---

  useEffect(() => {
    if (activeTab === "candidatos") {
      if (provider) fetchCandidatosBlockchain();
    } else if (activeTab === "auditoria") {
      if (provider) cargarAuditoriaBlockchain();
    } else if (activeTab === "padron") {
      fetchUsuariosDB();
    }
  }, [provider, activeTab]);

  const fetchUsuariosDB = async () => {
    setCargandoUsuarios(true);
    setErrorUsuarios("");
    try {
      const response = await fetch("http://localhost:5000/api/admin/users");
      if (!response.ok) throw new Error("No se pudieron cargar los ciudadanos registrados.");
      const data = await response.json();
      setUsuarios(data);
    } catch (err) {
      console.error(err);
      setErrorUsuarios("Error de conexión con la base de datos SQLite.");
    } finally {
      setCargandoUsuarios(false);
    }
  };

  // Cargar candidatos desde la Blockchain
  const fetchCandidatosBlockchain = async () => {
    if (!provider) return;
    setCargandoCandidatos(true);
    try {
      const contract = getContract(provider);
      const total = await contract.totalCandidatos();
      const count = Number(total);
      
      const listaCandidatos = [];
      for (let i = 0; i < count; i++) {
        const cand = await contract.candidatos(i);
        listaCandidatos.push(parseCandidato(cand));
      }
      
      setCandidatos(listaCandidatos);
    } catch (e) {
      console.error("Error al cargar candidatos de la blockchain:", e);
    } finally {
      setCargandoCandidatos(false);
    }
  };

  // Agregar candidato a la Votación en la Blockchain
  const handleAgregarCandidato = async (e) => {
    e.preventDefault();
    if (!nombreCandidato.trim()) return alert("Debe ingresar el nombre del postulante.");
    if (!apellidoCandidato.trim()) return alert("Debe ingresar el apellido del postulante.");
    if (!partidoCandidato.trim()) return alert("Debe ingresar el partido político del postulante.");
    if (!signer) return alert("Conecte MetaMask.");

    try {
      const contract = getContract(signer);
      const serialized = serializeCandidato({
        nombre: nombreCandidato,
        apellido: apellidoCandidato,
        partido: partidoCandidato,
        color: colorCandidato,
        foto: fotoCandidato
      });
      const tx = await contract.agregarCandidato(serialized, { gasLimit: 3000000 });
      await tx.wait();
      
      alert("¡Candidato agregado exitosamente a la votación en la Blockchain!");
      setNombreCandidato("");
      setApellidoCandidato("");
      setPartidoCandidato("");
      setColorCandidato("#1d4ed8");
      setFotoCandidato("");
      fetchCandidatosBlockchain();
    } catch (err) {
      console.error(err);
      alert("Error al agregar candidato: " + (err.reason || err.data?.message || err.message));
    }
  };

  // Cargar registros de votos desde la blockchain (Auditoría basada en Eventos)
  const cargarAuditoriaBlockchain = async () => {
    if (!provider) return;
    setCargandoAuditoria(true);
    try {
      const contract = getContract(provider);
      
      // 1. Cargar todos los candidatos para poder mapear los nombres
      const totalCand = await contract.totalCandidatos();
      const countCand = Number(totalCand);
      const candidatosMap = {};
      for (let i = 0; i < countCand; i++) {
        const cand = await contract.candidatos(i);
        const parsed = parseCandidato(cand);
        candidatosMap[i.toString()] = `${parsed.nombre} ${parsed.apellido} (${parsed.partido})`;
      }

      // 2. Fetch VotoEmitido events
      const filter = contract.filters.VotoEmitido();
      const events = await contract.queryFilter(filter, 0, "latest");
      
      const detalles = [];
      for (const event of events) {
        const votanteAddress = event.args[0];
        const candidatoId = Number(event.args[1]);
        
        const candidatoNombre = candidatosMap[candidatoId.toString()] || `Candidato #${candidatoId}`;

        detalles.push({
          votante: votanteAddress,
          candidato: candidatoNombre
        });
      }
      setVotosDetalle(detalles);
    } catch (error) {
      console.error("Error cargando auditoría:", error);
    } finally {
      setCargandoAuditoria(false);
    }
  };

  // Validar conexión de wallet
  if (!account) {
    return (
      <div style={{ 
        padding: "80px 20px", 
        textAlign: "center", 
        fontFamily: "'Outfit', 'Inter', sans-serif",
        backgroundColor: "#f8fafc",
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <div style={{ 
          maxWidth: "500px", 
          backgroundColor: "white", 
          padding: "40px", 
          borderRadius: "16px", 
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
          border: "1px solid #fee2e2"
        }}>
          <span style={{ fontSize: "60px", marginBottom: "20px", display: "block" }}>⚠️</span>
          <h2 style={{ color: "#991b1b", fontWeight: "800", margin: "0 0 10px 0" }}>Billetera No Conectada</h2>
          <p style={{ color: "#64748b", lineHeight: "1.6", fontSize: "15px", marginBottom: "20px" }}>
            Debe conectar su billetera MetaMask para poder ver y gestionar el panel de administración electoral.
          </p>
        </div>
      </div>
    );
  }

  // Restricción estricta de Autoridad Electoral
  if (!isAdmin) {
    return (
      <div style={{ 
        padding: "80px 20px", 
        textAlign: "center", 
        fontFamily: "'Outfit', 'Inter', sans-serif",
        backgroundColor: "#f8fafc",
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <div style={{ 
          maxWidth: "500px", 
          backgroundColor: "white", 
          padding: "40px", 
          borderRadius: "16px", 
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
          border: "1px solid #fee2e2"
        }}>
          <span style={{ fontSize: "60px", marginBottom: "20px", display: "block" }}>⚠️</span>
          <h2 style={{ color: "#991b1b", fontWeight: "800", margin: "0 0 10px 0" }}>Acceso Restringido</h2>
          <p style={{ color: "#64748b", lineHeight: "1.6", fontSize: "15px", marginBottom: "20px" }}>
            Esta es una zona de seguridad exclusiva para autoridades electorales gubernamentales. 
            Su wallet conectada (<code style={{ wordBreak: "break-all" }}>{account}</code>) no cuenta con privilegios de firma criptográfica de administración.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1000px", margin: "0 auto", fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      <h1 style={{ color: "#0f2c59", fontWeight: "900", marginBottom: "30px", textAlign: "center" }}>
        🏛️ Sistema de Gestión y Auditoría Electoral
      </h1>

      {/* MENÚ DE PESTAÑAS GUBERNAMENTALES */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "2px solid #e2e8f0", marginBottom: "30px" }}>
        <button
          onClick={() => setActiveTab("candidatos")}
          style={{
            ...tabButtonStyle,
            borderBottom: activeTab === "candidatos" ? "4px solid #1d4ed8" : "4px solid transparent",
            color: activeTab === "candidatos" ? "#1d4ed8" : "#64748b",
            fontWeight: activeTab === "candidatos" ? "800" : "500",
          }}
        >
          🗳️ Candidatos en Blockchain
        </button>
        <button
          onClick={() => setActiveTab("auditoria")}
          style={{
            ...tabButtonStyle,
            borderBottom: activeTab === "auditoria" ? "4px solid #1d4ed8" : "4px solid transparent",
            color: activeTab === "auditoria" ? "#1d4ed8" : "#64748b",
            fontWeight: activeTab === "auditoria" ? "800" : "500",
          }}
        >
          🔍 Libro de Escrutinio Criptográfico
        </button>
        <button
          onClick={() => setActiveTab("padron")}
          style={{
            ...tabButtonStyle,
            borderBottom: activeTab === "padron" ? "4px solid #1d4ed8" : "4px solid transparent",
            color: activeTab === "padron" ? "#1d4ed8" : "#64748b",
            fontWeight: activeTab === "padron" ? "800" : "500",
          }}
        >
          👥 Padrón Electoral Ciudadano
        </button>
      </div>

      {/* CONTENIDO DE PESTAÑA: GESTIONAR CANDIDATOS */}
      {activeTab === "candidatos" && (
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          
          {/* Lado Izquierdo: Agregar Candidato */}
          <div style={{ flex: "1 1 400px" }}>
            <div style={cardStyle}>
              <h3 style={{ color: "#0f2c59", margin: "0 0 15px 0", fontWeight: "800" }}>Agregar Candidato Oficial</h3>
              <form onSubmit={handleAgregarCandidato} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b", marginBottom: "5px", display: "block" }}>Nombre</label>
                    <input
                      type="text"
                      placeholder="Ej. Juan"
                      value={nombreCandidato}
                      onChange={(e) => setNombreCandidato(e.target.value)}
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b", marginBottom: "5px", display: "block" }}>Apellido</label>
                    <input
                      type="text"
                      placeholder="Ej. Pérez"
                      value={apellidoCandidato}
                      onChange={(e) => setApellidoCandidato(e.target.value)}
                      style={inputStyle}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b", marginBottom: "5px", display: "block" }}>Partido Político</label>
                  <input
                    type="text"
                    placeholder="Ej. Frente Cívico Nacional"
                    value={partidoCandidato}
                    onChange={(e) => setPartidoCandidato(e.target.value)}
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b", marginBottom: "5px", display: "block" }}>Color de Partido</label>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input
                      type="color"
                      value={colorCandidato}
                      onChange={(e) => setColorCandidato(e.target.value)}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        width: "45px",
                        height: "45px",
                        padding: 0,
                        cursor: "pointer",
                        backgroundColor: "transparent"
                      }}
                    />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", flex: 1 }}>
                      {PRESET_COLORS.map((pc) => (
                        <button
                          key={pc.hex}
                          type="button"
                          onClick={() => setColorCandidato(pc.hex)}
                          title={pc.label}
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            backgroundColor: pc.hex,
                            border: colorCandidato === pc.hex ? "3px solid #0f2c59" : "1px solid rgba(0,0,0,0.15)",
                            cursor: "pointer",
                            padding: 0,
                            boxShadow: colorCandidato === pc.hex ? "0 0 5px rgba(0,0,0,0.3)" : "none",
                            transition: "all 0.15s ease"
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b", marginBottom: "5px", display: "block" }}>Foto del Candidato (URL)</label>
                  <input
                    type="url"
                    placeholder="https://ejemplo.com/foto.jpg"
                    value={fotoCandidato}
                    onChange={(e) => setFotoCandidato(e.target.value)}
                    style={inputStyle}
                  />
                  <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginTop: "4px" }}>
                    Dejar vacío para generar un avatar con iniciales dinámicas y color de partido.
                  </span>
                  
                  {/* Avatares preestablecidos */}
                  <div style={{ marginTop: "10px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "bold", color: "#64748b", display: "block", marginBottom: "6px" }}>
                      O elegir foto rápida de muestra:
                    </span>
                    <div style={{ display: "flex", gap: "10px" }}>
                      {PRESET_AVATARS.map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setFotoCandidato(av.url)}
                          style={{
                            padding: "3px",
                            borderRadius: "10px",
                            border: fotoCandidato === av.url ? `3px solid ${colorCandidato}` : "2px solid #e2e8f0",
                            backgroundColor: "white",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxSizing: "border-box",
                            transition: "all 0.15s ease"
                          }}
                        >
                          <img 
                            src={av.url} 
                            alt={av.label} 
                            style={{ width: "38px", height: "38px", borderRadius: "8px", objectFit: "cover" }} 
                          />
                        </button>
                      ))}
                      {fotoCandidato && (
                        <button
                          type="button"
                          onClick={() => setFotoCandidato("")}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#f8fafc",
                            fontSize: "11px",
                            fontWeight: "bold",
                            color: "#64748b",
                            cursor: "pointer"
                          }}
                        >
                          Borrar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <button type="submit" style={actionButtonStyle}>Registrar Candidato</button>
              </form>
            </div>
          </div>

          {/* Lado Derecho: Listado de Candidatos y Recuento en Blockchain */}
          <div style={{ flex: "1 1 500px" }}>
            <div style={cardStyle}>
              <h3 style={{ color: "#0f2c59", margin: "0 0 15px 0", fontWeight: "800" }}>Candidatos y Recuento de Votos</h3>
              {cargandoCandidatos ? (
                <p>Consultando la blockchain...</p>
              ) : candidatos.length === 0 ? (
                <p style={{ color: "#64748b" }}>No hay candidatos registrados en la blockchain aún.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {candidatos.map((cand) => (
                    <div
                      key={cand.id}
                      style={{
                        padding: "12px 15px",
                        borderRadius: "12px",
                        border: `1.5px solid #cbd5e1`,
                        borderLeft: `6px solid ${cand.color}`,
                        backgroundColor: "white",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <img 
                          src={cand.foto} 
                          alt={cand.nombre} 
                          style={{ 
                            width: "48px", 
                            height: "48px", 
                            borderRadius: "50%", 
                            objectFit: "cover",
                            border: `2px solid ${cand.color}`,
                            backgroundColor: "#f1f5f9"
                          }} 
                        />
                        <div>
                          <strong style={{ color: "#0f2c59", fontSize: "16px" }}>{cand.nombre} {cand.apellido}</strong>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                            <span style={{ 
                              fontSize: "11px", 
                              backgroundColor: `${cand.color}15`, 
                              color: cand.color, 
                              padding: "2px 8px", 
                              borderRadius: "4px",
                              fontWeight: "bold"
                            }}>
                              {cand.partido}
                            </span>
                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>ID: {cand.id}</span>
                          </div>
                        </div>
                      </div>
                      <span style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "bold",
                        backgroundColor: `${cand.color}10`,
                        color: cand.color,
                        border: `1px solid ${cand.color}30`
                      }}>
                        {cand.votos} {cand.votos === 1 ? "voto" : "votos"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO DE PESTAÑA: AUDITORÍA */}
      {activeTab === "auditoria" && (
        <div>
          <div style={cardStyle}>
            <h2 style={{ color: "#0f2c59", margin: "0 0 10px 0", fontWeight: "800" }}>Escrutinio y Auditoría Electoral</h2>
            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>
              Este listado recopila de forma directa y descentralizada los eventos de sufragio criptográfico generados por la blockchain.
            </p>

            {cargandoAuditoria ? (
              <p style={{ textAlign: "center" }}>Consultando la cadena de bloques...</p>
            ) : votosDetalle.length === 0 ? (
              <p style={{ color: "#64748b" }}>No se registran votos emitidos en el contrato inteligente aún.</p>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Identidad Votante (Wallet Address)</th>
                    <th style={thStyle}>Candidato Sufragado</th>
                  </tr>
                </thead>
                <tbody>
                  {votosDetalle.map((voto, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "12px" }}>
                        {voto.votante}
                      </td>
                      <td style={tdStyle}><strong style={{ color: "#1d4ed8" }}>{voto.candidato}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* CONTENIDO DE PESTAÑA: PADRÓN ELECTORAL */}
      {activeTab === "padron" && (
        <div style={cardStyle}>
          <h3 style={{ color: "#0f2c59", margin: "0 0 20px 0", fontWeight: "800", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>👥 Ciudadanos Registrados en el Padrón Nacional</span>
            <span style={{ 
              fontSize: "13px", 
              backgroundColor: "#d1fae5", 
              color: "#065f46", 
              padding: "4px 12px", 
              borderRadius: "6px", 
              fontWeight: "bold" 
            }}>
              Base de Datos SQLite Web2.5
            </span>
          </h3>

          {cargandoUsuarios ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: "40px" }}>Consultando base de datos SQLite...</p>
          ) : errorUsuarios ? (
            <div style={{ padding: "15px", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: "8px", border: "1px solid #fecaca", margin: "10px 0" }}>
              {errorUsuarios}
            </div>
          ) : usuarios.length === 0 ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: "40px" }}>No se registran ciudadanos inscritos en el padrón electoral aún.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Ciudadano</th>
                    <th style={thStyle}>DNI</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Wallet Ethereum</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Habilitado</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usr) => (
                    <tr key={usr.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ ...tdStyle, fontWeight: "700", color: "#0f2c59" }}>{usr.apellido}, {usr.nombre}</td>
                      <td style={{ ...tdStyle, fontWeight: "600" }}>{usr.dni}</td>
                      <td style={tdStyle}>{usr.email}</td>
                      <td style={tdStyle}>
                        <code style={{ backgroundColor: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", color: "#0f2c59", fontFamily: "monospace" }}>{usr.wallet_address}</code>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <span style={{ 
                           backgroundColor: "#d1fae5", 
                           color: "#065f46", 
                           padding: "4px 10px", 
                           borderRadius: "9999px", 
                           fontSize: "11px", 
                           fontWeight: "bold",
                           border: "1px solid #a7f3d0"
                         }}>
                          ✓ SI
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ESTILOS INTERNOS DE GOBIERNO */

const tabButtonStyle = {
  padding: "12px 20px",
  backgroundColor: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: "14px",
  transition: "all 0.15s ease-in-out",
};

const cardStyle = {
  padding: "30px",
  backgroundColor: "white",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
  marginBottom: "30px"
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  boxSizing: "border-box",
};

const actionButtonStyle = {
  padding: "12px 20px",
  backgroundColor: "#1d4ed8",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "10px",
};

const thStyle = {
  textAlign: "left",
  padding: "14px",
  backgroundColor: "#f1f5f9",
  color: "#475569",
  borderBottom: "2px solid #cbd5e1",
  fontWeight: "700",
  fontSize: "13px",
  textTransform: "uppercase"
};

const tdStyle = {
  padding: "14px",
  color: "#334155",
  fontSize: "14px"
};

export default AdminPanel;
