import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';

function Navbar() {
  const { account, connectWallet, disconnectWallet, isAdmin } = useWeb3();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav style={{ backgroundColor: "#111827", color: "white", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h2 onClick={() => navigate("/")} style={{ cursor: "pointer", margin: 0, fontSize: "24px", fontWeight: "bold" }}>
        Blockchain Voting
      </h2>
      
      <div style={{ display: "flex", alignItems: "center" }}>
        {isAdmin && location.pathname !== "/admin" && (
          <button style={{...btnStyle, backgroundColor: "#10b981"}} onClick={() => navigate("/admin")}>
            Panel Admin
          </button>
        )}
        
        {location.pathname !== "/voting" && account && (
          <button style={{...btnStyle, backgroundColor: "#3b82f6"}} onClick={() => navigate("/voting")}>
            Ir a Votar
          </button>
        )}

        {account ? (
          <>
            <span style={{ margin: "0 15px", color: "#10b981", fontWeight: "500" }}>
              {account.substring(0, 6)}...{account.substring(38)}
            </span>
            <button style={{...btnStyle, backgroundColor: "#ef4444"}} onClick={disconnectWallet}>
              Desconectar
            </button>
          </>
        ) : (
          <button style={{...btnStyle, backgroundColor: "#f59e0b"}} onClick={connectWallet}>
            Conectar MetaMask
          </button>
        )}
      </div>
    </nav>
  );
}

const btnStyle = {
  marginLeft: "10px", 
  padding: "10px 20px", 
  border: "none", 
  color: "white", 
  borderRadius: "5px", 
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "15px"
};

export default Navbar;
