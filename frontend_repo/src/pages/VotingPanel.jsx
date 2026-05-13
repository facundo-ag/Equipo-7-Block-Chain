import React, { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { getContract } from "../utils/contract";

function VotingPanel() {
  const { account, provider, signer } = useWeb3();
  const [opciones, setOpciones] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (provider) {
      cargarOpciones();
    }
  }, [provider]);

  const cargarOpciones = async () => {
    try {
      const contract = getContract(provider);
      const total = await contract.totalOpciones();
      let arr = [];
      for (let i = 0; i < total; i++) {
        const opc = await contract.opciones(i);
        arr.push({ id: opc.id.toString(), nombre: opc.nombre, votos: opc.votos.toString() });
      }
      setOpciones(arr);
    } catch (error) {
      console.error("Error cargando opciones", error);
    }
  };

  const handleVotar = async (id) => {
    if (!signer) return alert("Conecta MetaMask para votar");
    try {
      setLoading(true);
      const contract = getContract(signer);
      const tx = await contract.emitirVoto(id);
      await tx.wait();
      alert("Voto emitido correctamente!");
      cargarOpciones(); // Refrescar resultados
    } catch (error) {
      console.error(error);
      alert("Error al emitir el voto. Quizá no estés habilitado o ya votaste.");
    } finally {
      setLoading(false);
    }
  };

  if (!account) return <h2 style={{textAlign: "center", marginTop: "40px"}}>Conecta tu billetera MetaMask para votar.</h2>;

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{textAlign: "center"}}>Sistema de Votación</h1>
      <p style={{textAlign: "center", color: "#6b7280"}}>Tu cuenta: {account}</p>
      
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "40px" }}>
        {opciones.length === 0 ? <p>No hay candidatos registrados.</p> : opciones.map((opc) => (
          <div key={opc.id} style={cardStyle}>
            <h2>{opc.nombre}</h2>
            <p style={{ fontSize: "24px", color: "#2563eb", fontWeight: "bold" }}>{opc.votos} Votos</p>
            <button 
              onClick={() => handleVotar(opc.id)} 
              disabled={loading}
              style={buttonStyle}
            >
              Votar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const cardStyle = {
  flex: "1 1 200px",
  padding: "30px",
  borderRadius: "10px",
  backgroundColor: "#f9fafb",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  textAlign: "center"
};

const buttonStyle = {
  marginTop: "15px",
  padding: "10px 20px",
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  width: "100%",
  fontSize: "16px"
};

export default VotingPanel;
