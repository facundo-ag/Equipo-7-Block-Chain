import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';

function Navbar() {
  const { account, connectWallet, disconnectWallet, isAdmin } = useWeb3();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  }, [location]); // Actualiza el usuario cuando cambia de ruta

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    disconnectWallet();
    setUser(null);
    navigate("/login");
  };

  return (
    <nav style={{ 
      backgroundColor: "#0f2c59", 
      color: "white", 
      padding: "15px 40px", 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center",
      borderBottom: "3px solid #1d4ed8",
      boxShadow: "0 4px 10px rgba(15, 44, 89, 0.15)",
      fontFamily: "'Outfit', 'Inter', sans-serif"
    }}>
      <div 
        onClick={() => navigate("/")} 
        style={{ 
          cursor: "pointer", 
          display: "flex", 
          alignItems: "center", 
          gap: "10px" 
        }}
      >
        <span style={{ fontSize: "28px" }}>🏛️</span>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", letterSpacing: "0.5px" }}>
            GOBIERNO NACIONAL
          </h2>
          <span style={{ fontSize: "11px", letterSpacing: "1px", color: "#93c5fd", fontWeight: "bold" }}>
            PADRÓN ELECTORAL BLOCKCHAIN
          </span>
        </div>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {user ? (
          <>
            <span style={{ marginRight: "10px", fontSize: "14px", color: "#f8fafc" }}>
              Bienvenido, <strong>{user.nombre} {user.apellido}</strong>
              <span style={{ fontSize: "12px", color: "#93c5fd", display: "block" }}>DNI: {user.dni}</span>
            </span>

            {/* Si es el admin de la blockchain (Cuenta 0) u otra cuenta logueada, mostrar botón Admin forzado */}
            {location.pathname !== "/admin" && (
              <button 
                style={{...btnStyle, backgroundColor: "#1e3a8a", border: "1px solid #3b82f6"}} 
                onClick={() => navigate("/admin")}
              >
                Panel Electoral
              </button>
            )}
            
            {location.pathname !== "/voting" && (
              <button 
                style={{...btnStyle, backgroundColor: "#10b981"}} 
                onClick={() => navigate("/voting")}
              >
                Elecciones
              </button>
            )}

            {account ? (
              <span style={{ 
                margin: "0 10px", 
                backgroundColor: "#1e293b", 
                padding: "8px 12px", 
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#34d399",
                border: "1px solid #334155"
              }}>
                🔗 {account.substring(0, 6)}...{account.substring(38)}
              </span>
            ) : (
              <button style={{...btnStyle, backgroundColor: "#f59e0b"}} onClick={connectWallet}>
                Vincular MetaMask
              </button>
            )}

            <button style={{...btnStyle, backgroundColor: "#ef4444"}} onClick={handleLogout}>
              Salir
            </button>
          </>
        ) : (
          <>
            {location.pathname !== "/login" && (
              <button style={{...btnStyle, backgroundColor: "transparent", border: "1px solid #f8fafc"}} onClick={() => navigate("/login")}>
                Ingresar
              </button>
            )}
            {location.pathname !== "/register" && (
              <button style={{...btnStyle, backgroundColor: "#10b981"}} onClick={() => navigate("/register")}>
                Registrarse
              </button>
            )}
          </>
        )}
      </div>
    </nav>
  );
}

const btnStyle = {
  padding: "10px 18px", 
  border: "none", 
  color: "white", 
  borderRadius: "8px", 
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "13px",
  letterSpacing: "0.5px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  transition: "all 0.2s ease-in-out"
};

export default Navbar;

