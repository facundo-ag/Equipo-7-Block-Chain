import React, { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { getContract } from "../utils/contract";

function AdminPanel() {
  const { account, signer, provider, isAdmin } = useWeb3();
  
  // Estados de Pestañas
  const [activeTab, setActiveTab] = useState("elecciones"); // "elecciones", "auditoria"

  // Estado para la Pestaña de Elecciones (Web3)
  const [nombreNuevaEleccion, setNombreNuevaEleccion] = useState("");
  const [elecciones, setElecciones] = useState([]);
  const [eleccionSeleccionada, setEleccionSeleccionada] = useState(null);
  const [nombreNuevoCandidato, setNombreNuevoCandidato] = useState("");
  const [candidatos, setCandidatos] = useState([]);
  const [cargandoElecciones, setCargandoElecciones] = useState(false);

  // Estado para la Pestaña de Auditoría
  const [votosDetalle, setVotosDetalle] = useState([]);
  const [cargandoAuditoria, setCargandoAuditoria] = useState(false);

  // Estado para la Pestaña de Padrón Electoral (Web2 DB)
  const [usuarios, setUsuarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [errorUsuarios, setErrorUsuarios] = useState("");

  // --- CARGA DE DATOS ---

  useEffect(() => {
    if (activeTab === "elecciones") {
      if (provider) fetchEleccionesBlockchain();
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

  // Cargar elecciones desde la Blockchain
  const fetchEleccionesBlockchain = async () => {
    if (!provider) return;
    setCargandoElecciones(true);
    try {
      const contract = getContract(provider);
      const total = await contract.totalElecciones();
      const count = Number(total);
      
      const listaElecciones = [];
      for (let i = 0; i < count; i++) {
        const ele = await contract.elecciones(i);
        listaElecciones.push({
          id: Number(ele.id),
          nombre: ele.nombre,
          activa: ele.activa
        });
      }
      
      setElecciones(listaElecciones);
      
      // Si hay una elección seleccionada, actualizar sus candidatos
      if (eleccionSeleccionada !== null) {
        cargarCandidatosEleccion(eleccionSeleccionada);
      }
    } catch (e) {
      console.error("Error al cargar elecciones de la blockchain:", e);
    } finally {
      setCargandoElecciones(false);
    }
  };

  // Cargar candidatos de una elección específica
  const cargarCandidatosEleccion = async (eleccionId) => {
    if (!provider) return;
    try {
      const contract = getContract(provider);
      const totalCands = await contract.totalCandidatos(eleccionId);
      const count = Number(totalCands);
      
      const listaCandidatos = [];
      for (let i = 0; i < count; i++) {
        const cand = await contract.candidatosPorEleccion(eleccionId, i);
        listaCandidatos.push({
          id: Number(cand.id),
          nombre: cand.nombre,
          votos: Number(cand.votos)
        });
      }
      setCandidatos(listaCandidatos);
    } catch (e) {
      console.error("Error al cargar candidatos de la elección:", e);
    }
  };

  // Crear una nueva elección en la Blockchain
  const handleCrearEleccion = async (e) => {
    e.preventDefault();
    if (!nombreNuevaEleccion.trim()) return alert("Debe ingresar un nombre.");
    if (!signer) return alert("Conecte MetaMask.");

    try {
      const contract = getContract(signer);
      const tx = await contract.crearEleccion(nombreNuevaEleccion.trim(), { gasLimit: 3000000 });
      await tx.wait();
      
      alert("¡Instancia de Elección creada correctamente en la Blockchain!");
      setNombreNuevaEleccion("");
      fetchEleccionesBlockchain();
    } catch (err) {
      console.error(err);
      alert("Error al crear la elección: " + (err.reason || err.data?.message || err.message || "Verifique sus permisos de Administrador."));
    }
  };

  // Agregar candidato a una elección en la Blockchain
  const handleAgregarCandidato = async (e) => {
    e.preventDefault();
    if (eleccionSeleccionada === null) return alert("Seleccione una elección primero.");
    if (!nombreNuevoCandidato.trim()) return alert("Debe ingresar el nombre del postulante.");
    if (!signer) return alert("Conecte MetaMask.");

    try {
      const contract = getContract(signer);
      const tx = await contract.agregarCandidato(eleccionSeleccionada, nombreNuevoCandidato.trim(), { gasLimit: 3000000 });
      await tx.wait();
      
      alert("¡Candidato agregado exitosamente a la elección en la Blockchain!");
      setNombreNuevoCandidato("");
      cargarCandidatosEleccion(eleccionSeleccionada);
      fetchEleccionesBlockchain();
    } catch (err) {
      console.error(err);
      alert("Error al agregar candidato: " + (err.reason || err.data?.message || err.message));
    }
  };

  // Eliminar candidato de una elección en la Blockchain
  const handleEliminarCandidato = async (candidatoId) => {
    if (eleccionSeleccionada === null) return;
    if (!signer) return alert("Conecte MetaMask.");

    if (!window.confirm("¿Está seguro de eliminar este candidato antes de la elección?")) return;

    try {
      const contract = getContract(signer);
      const tx = await contract.eliminarCandidato(eleccionSeleccionada, candidatoId, { gasLimit: 3000000 });
      await tx.wait();
      
      alert("Candidato removido con éxito de la Blockchain.");
      cargarCandidatosEleccion(eleccionSeleccionada);
      fetchEleccionesBlockchain();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar candidato: " + (err.reason || err.data?.message || err.message || "Es probable que ya existan votos registrados en el contrato."));
    }
  };

  // Cargar registros de votos desde la blockchain (Auditoría basada en Eventos)
  const cargarAuditoriaBlockchain = async () => {
    if (!provider) return;
    setCargandoAuditoria(true);
    try {
      const contract = getContract(provider);
      
      // 1. Cargar todas las elecciones para poder mapear los nombres
      const totalEle = await contract.totalElecciones();
      const countEle = Number(totalEle);
      const eleccionesMap = {};
      for (let i = 0; i < countEle; i++) {
        const ele = await contract.elecciones(i);
        eleccionesMap[i.toString()] = ele.nombre;
      }

      // 2. Fetch VotoEmitido events
      const filter = contract.filters.VotoEmitido();
      const events = await contract.queryFilter(filter, 0, "latest");
      
      const detalles = [];
      for (const event of events) {
        const eleccionId = event.args[0].toString();
        const votanteAddress = event.args[1];
        const candidatoId = Number(event.args[2]);
        
        let candidatoNombre = "Desconocido";
        try {
          const cand = await contract.candidatosPorEleccion(Number(eleccionId), candidatoId);
          candidatoNombre = cand.nombre;
        } catch (e) {
          // Si el candidato fue eliminado, puede fallar
        }

        detalles.push({
          eleccion: eleccionesMap[eleccionId] || `Elección #${eleccionId}`,
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

  const handleSelectEleccion = (id) => {
    setEleccionSeleccionada(id);
    cargarCandidatosEleccion(id);
  };

  // Forzamos el panel electoral para pruebas de desarrollo local
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

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1000px", margin: "0 auto", fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      <h1 style={{ color: "#0f2c59", fontWeight: "900", marginBottom: "30px", textAlign: "center" }}>
        🏛️ Sistema de Gestión y Auditoría Electoral
      </h1>

      {/* MENÚ DE PESTAÑAS GUBERNAMENTALES */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "2px solid #e2e8f0", marginBottom: "30px" }}>
        <button
          onClick={() => setActiveTab("elecciones")}
          style={{
            ...tabButtonStyle,
            borderBottom: activeTab === "elecciones" ? "4px solid #1d4ed8" : "4px solid transparent",
            color: activeTab === "elecciones" ? "#1d4ed8" : "#64748b",
            fontWeight: activeTab === "elecciones" ? "800" : "500",
          }}
        >
          🗳️ Instancias de Votación Blockchain
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

      {/* CONTENIDO DE PESTAÑA: GESTIONAR ELECCIONES */}
      {activeTab === "elecciones" && (
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          
          {/* Lado Izquierdo: Crear Elección y Listar Elecciones */}
          <div style={{ flex: "1 1 450px" }}>
            <div style={cardStyle}>
              <h3 style={{ color: "#0f2c59", margin: "0 0 15px 0", fontWeight: "800" }}>Crear Instancia de Votación</h3>
              <form onSubmit={handleCrearEleccion} style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Ej. Elecciones Presidenciales 2026"
                  value={nombreNuevaEleccion}
                  onChange={(e) => setNombreNuevaEleccion(e.target.value)}
                  style={{ ...inputStyle, flex: 1, margin: 0 }}
                  required
                />
                <button type="submit" style={actionButtonStyle}>Crear Elección</button>
              </form>
            </div>

            <div style={cardStyle}>
              <h3 style={{ color: "#0f2c59", margin: "0 0 15px 0", fontWeight: "800" }}>Elecciones Registradas en Blockchain</h3>
              {cargandoElecciones ? (
                <p>Consultando la blockchain...</p>
              ) : elecciones.length === 0 ? (
                <p style={{ color: "#64748b" }}>No hay elecciones creadas en el contrato.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {elecciones.map((ele) => (
                    <div
                      key={ele.id}
                      onClick={() => handleSelectEleccion(ele.id)}
                      style={{
                        padding: "15px",
                        borderRadius: "10px",
                        border: eleccionSeleccionada === ele.id ? "2px solid #1d4ed8" : "1px solid #cbd5e1",
                        backgroundColor: eleccionSeleccionada === ele.id ? "#eff6ff" : "white",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "all 0.15s"
                      }}
                    >
                      <div>
                        <strong style={{ color: "#0f2c59" }}>{ele.nombre}</strong>
                        <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>ID de Blockchain: {ele.id}</span>
                      </div>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "bold",
                        backgroundColor: ele.activa ? "#d1fae5" : "#e2e8f0",
                        color: ele.activa ? "#065f46" : "#475569"
                      }}>
                        {ele.activa ? "ACTIVA" : "CERRADA"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lado Derecho: Gestionar Candidatos de la Elección Seleccionada */}
          <div style={{ flex: "1 1 450px" }}>
            <div style={{
              ...cardStyle,
              borderColor: eleccionSeleccionada !== null ? "#1d4ed8" : "#cbd5e1",
              backgroundColor: eleccionSeleccionada !== null ? "white" : "#f8fafc"
            }}>
              {eleccionSeleccionada === null ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                  <span style={{ fontSize: "40px" }}>👈</span>
                  <h3>Seleccione una elección del listado para gestionar candidatos</h3>
                </div>
              ) : (
                <div>
                  <h3 style={{ color: "#0f2c59", margin: "0 0 5px 0", fontWeight: "800" }}>
                    Gestionar Postulantes
                  </h3>
                  <span style={{ fontSize: "13px", color: "#1d4ed8", fontWeight: "bold", display: "block", marginBottom: "20px" }}>
                    Elección Seleccionada: #{eleccionSeleccionada} - {elecciones.find(e => e.id === eleccionSeleccionada)?.nombre}
                  </span>

                  <form onSubmit={handleAgregarCandidato} style={{ display: "flex", gap: "10px", marginBottom: "25px" }}>
                    <input
                      type="text"
                      placeholder="Nombre del candidato oficial"
                      value={nombreNuevoCandidato}
                      onChange={(e) => setNombreNuevoCandidato(e.target.value)}
                      style={{ ...inputStyle, flex: 1, margin: 0 }}
                      required
                    />
                    <button type="submit" style={{ ...actionButtonStyle, backgroundColor: "#1e3a8a" }}>Agregar Candidato</button>
                  </form>

                  <h4 style={{ color: "#0f2c59", fontWeight: "bold", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "12px" }}>
                    Lista Oficial de Postulantes
                  </h4>

                  {candidatos.length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: "14px" }}>Aún no se han agregado candidatos a esta elección en la blockchain.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {candidatos.map((cand) => (
                        <div
                          key={cand.id}
                          style={{
                            padding: "12px 15px",
                            borderRadius: "8px",
                            backgroundColor: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: "700", color: "#334155" }}>{cand.nombre}</span>
                            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Votos en Blockchain: <strong>{cand.votos}</strong></span>
                          </div>
                          <button
                            onClick={() => handleEliminarCandidato(cand.id)}
                            style={{
                              padding: "6px 10px",
                              backgroundColor: "#fee2e2",
                              color: "#991b1b",
                              border: "1px solid #fecaca",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              cursor: "pointer"
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                    <th style={thStyle}>Elección Instanciada</th>
                    <th style={thStyle}>Identidad Votante (Wallet Address)</th>
                    <th style={thStyle}>Candidato Sufragado</th>
                  </tr>
                </thead>
                <tbody>
                  {votosDetalle.map((voto, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={tdStyle}><strong>{voto.eleccion}</strong></td>
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
