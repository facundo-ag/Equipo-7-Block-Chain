import React, { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { getContract } from "../utils/contract";

function AdminPanel() {
  const { account, signer, provider } = useWeb3();
  const [votante, setVotante] = useState("");
  const [opcion, setOpcion] = useState("");
  const [votosDetalle, setVotosDetalle] = useState([]);
  const [habilitados, setHabilitados] = useState([]);

  useEffect(() => {
    if (provider) {
      cargarAuditoria();
    }
  }, [provider]);

  const cargarAuditoria = async () => {
    try {
      const contract = getContract(provider);
      
      // Fetch options to map ID to candidate name
      const total = await contract.totalOpciones();
      const opcionesMap = {};
      for (let i = 0; i < total; i++) {
        const opc = await contract.opciones(i);
        opcionesMap[opc.id.toString()] = opc.nombre;
      }

      // Fetch VotoEmitido events
      const filter = contract.filters.VotoEmitido();
      const events = await contract.queryFilter(filter, 0, "latest");
      
      const detalles = events.map(event => {
        const votanteAddress = event.args[0];
        const opcionId = event.args[1].toString();
        return {
          votante: votanteAddress,
          candidato: opcionesMap[opcionId] || "Desconocido"
        };
      });
      setVotosDetalle(detalles);

      // Fetch VotanteHabilitado events
      const filterHabilitados = contract.filters.VotanteHabilitado();
      const eventsHabilitados = await contract.queryFilter(filterHabilitados, 0, "latest");
      const listaHabilitados = eventsHabilitados.map(e => e.args[0]);
      
      // Eliminamos posibles duplicados (aunque el contrato lo previene)
      setHabilitados([...new Set(listaHabilitados)]);
    } catch (error) {
      console.error("Error cargando auditoría", error);
    }
  };

  const handleHabilitar = async (e) => {
    e.preventDefault();
    if (!signer) return alert("Conecta MetaMask primero");
    try {
      const addressTrimmmed = votante.trim();
      const contract = getContract(signer);
      const tx = await contract.habilitarVotante(addressTrimmmed);
      await tx.wait();
      alert("Votante habilitado con éxito!");
      setVotante("");
      cargarAuditoria(); // Refrescar listas
    } catch (error) {
      console.error(error);
      const isRevert = error.message?.includes("missing revert data") || error.message?.includes("revert");
      alert(
        "Error al habilitar votante. " +
        (isRevert ? "Es posible que el votante YA esté habilitado." : "Asegúrate de ser el admin.")
      );
    }
  };

  const handleAgregarOpcion = async (e) => {
    e.preventDefault();
    if (!signer) return alert("Conecta MetaMask primero");
    try {
      const opcionTrimmed = opcion.trim();
      const contract = getContract(signer);
      const tx = await contract.agregarOpcion(opcionTrimmed);
      await tx.wait();
      alert("Candidato agregado con éxito!");
      setOpcion("");
      cargarAuditoria(); // Refrescar listas
    } catch (error) {
      console.error(error);
      alert("Error al agregar opción: " + (error.reason || error.message || "Asegúrate de ser el admin"));
    }
  };

  if (!account) return <h2>Conecta tu billetera MetaMask para administrar.</h2>;

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Panel de Administrador</h1>
      
      <div style={cardStyle}>
        <h3>Habilitar Votante</h3>
        <form onSubmit={handleHabilitar}>
          <input
            type="text"
            placeholder="Dirección (0x...)"
            value={votante}
            onChange={(e) => setVotante(e.target.value)}
            style={inputStyle}
          />
          <button type="submit" style={buttonStyle}>Habilitar</button>
        </form>
      </div>

      <div style={cardStyle}>
        <h3>Agregar Candidato</h3>
        <form onSubmit={handleAgregarOpcion}>
          <input
            type="text"
            placeholder="Nombre del candidato"
            value={opcion}
            onChange={(e) => setOpcion(e.target.value)}
            style={inputStyle}
          />
          <button type="submit" style={buttonStyle}>Agregar</button>
        </form>
      </div>

      <div style={cardStyle}>
        <h3>Votantes Habilitados (Padrón Electoral)</h3>
        {habilitados.length === 0 ? (
          <p>Aún no hay votantes habilitados.</p>
        ) : (
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {habilitados.map((dir, index) => (
              <li key={index} style={{ padding: "8px", borderBottom: "1px solid #eee", fontFamily: "monospace" }}>
                ✅ {dir}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={cardStyle}>
        <h3>Registro de Votos (Auditoría)</h3>
        {votosDetalle.length === 0 ? (
          <p>Aún no se han emitido votos.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Votante</th>
                <th style={thStyle}>Candidato Votado</th>
              </tr>
            </thead>
            <tbody>
              {votosDetalle.map((voto, index) => (
                <tr key={index} style={{ borderBottom: "1px solid #eee", fontFamily: "monospace" }}>
                  <td style={tdStyle}>{voto.votante}</td>
                  <td style={tdStyle}><strong style={{fontFamily: "sans-serif"}}>{voto.candidato}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const cardStyle = {
  padding: "20px",
  marginTop: "20px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  border: "1px solid #e5e7eb"
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  margin: "10px 0",
  borderRadius: "4px",
  border: "1px solid #ccc"
};

const buttonStyle = {
  padding: "10px 15px",
  backgroundColor: "#10b981",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "15px"
};

const thStyle = {
  textAlign: "left",
  padding: "10px",
  backgroundColor: "#e5e7eb",
  borderBottom: "2px solid #d1d5db"
};

const tdStyle = {
  padding: "10px",
  color: "#374151"
};

export default AdminPanel;
