import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";

function Login() {
  const { connectWallet, account } = useWeb3();
  const navigate = useNavigate();

  useEffect(() => {
    if (account) {
      navigate("/voting"); // Redirige al panel de votación al conectarse
    }
  }, [account, navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "40px",
          width: "400px",
          borderRadius: "10px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}
      >
        <h1 style={{ marginBottom: "10px", color: "#111827" }}>
          Iniciar Sesión
        </h1>
        <p style={{ color: "#6b7280", marginBottom: "30px" }}>
          Conecta tu billetera para acceder al sistema de votación blockchain
        </p>

        <button onClick={connectWallet} style={metamaskButton}>
          Conectar MetaMask
        </button>
      </div>
    </div>
  );
}

const metamaskButton = {
  width: "100%",
  padding: "14px",
  backgroundColor: "#f59e0b",
  color: "white",
  border: "none",
  borderRadius: "5px",
  fontSize: "16px",
  cursor: "pointer",
  fontWeight: "bold"
};

export default Login;