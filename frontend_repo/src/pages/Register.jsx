import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";

function Register() {
  const { account, connectWallet } = useWeb3();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    password: "",
  });

  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: "", texto: "" });

    const { nombre, apellido, dni, email, password } = formData;

    if (!nombre || !apellido || !dni || !email || !password) {
      setMensaje({ tipo: "error", texto: "Por favor, complete todos los campos." });
      return;
    }

    if (!account) {
      setMensaje({
        tipo: "error",
        texto: "Debe conectar su billetera MetaMask para asociar su cuenta electoral.",
      });
      return;
    }

    setCargando(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          apellido,
          dni,
          email,
          password,
          wallet_address: account,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al realizar el registro");
      }

      setMensaje({
        tipo: "success",
        texto: "¡Registro exitoso! Redirigiendo a la página principal...",
      });

      // Redirigir a la página principal después de 3 segundos
      setTimeout(() => {
        navigate("/");
      }, 3000);

    } catch (err) {
      setMensaje({ tipo: "error", texto: err.message });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          width: "100%",
          maxWidth: "500px",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 10px 25px -5px rgba(15, 44, 89, 0.1), 0 8px 10px -6px rgba(15, 44, 89, 0.05)",
          border: "1px solid #e2e8f0",
        }}
      >
        {/* TITULO */}
        <h1
          style={{
            textAlign: "center",
            marginBottom: "10px",
            color: "#0f2c59",
            fontWeight: "800",
            fontSize: "28px",
          }}
        >
          Registro de Votante
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#64748b",
            marginBottom: "30px",
            fontSize: "14px",
          }}
        >
          Complete sus datos oficiales para participar en las elecciones gubernamentales
        </p>

        {mensaje.texto && (
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px",
              fontWeight: "500",
              textAlign: "center",
              backgroundColor: mensaje.tipo === "success" ? "#d1fae5" : "#fee2e2",
              color: mensaje.tipo === "success" ? "#065f46" : "#991b1b",
              border: `1px solid ${mensaje.tipo === "success" ? "#a7f3d0" : "#fecaca"}`,
            }}
          >
            {mensaje.texto}
          </div>
        )}

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit}>
          {/* NOMBRE */}
          <div style={groupStyle}>
            <label style={labelStyle}>Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ingrese su nombre completo"
              style={inputStyle}
              required
            />
          </div>

          {/* APELLIDO */}
          <div style={groupStyle}>
            <label style={labelStyle}>Apellido</label>
            <input
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              placeholder="Ingrese su apellido"
              style={inputStyle}
              required
            />
          </div>

          {/* DNI */}
          <div style={groupStyle}>
            <label style={labelStyle}>DNI (Documento Nacional de Identidad)</label>
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              placeholder="Ingrese su número de DNI"
              style={inputStyle}
              required
            />
          </div>

          {/* EMAIL */}
          <div style={groupStyle}>
            <label style={labelStyle}>Correo Electrónico</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="nombre@ejemplo.com"
              style={inputStyle}
              required
            />
          </div>

          {/* PASSWORD */}
          <div style={groupStyle}>
            <label style={labelStyle}>Contraseña</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Cree una contraseña segura"
              style={inputStyle}
              required
            />
          </div>

          {/* WALLET */}
          <div style={groupStyle}>
            <label style={labelStyle}>Wallet Ethereum Oficial</label>
            {account ? (
              <div
                style={{
                  ...inputStyle,
                  backgroundColor: "#f1f5f9",
                  color: "#334155",
                  fontWeight: "600",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: "1px solid #cbd5e1"
                }}
              >
                <span>{account.slice(0, 8)}...{account.slice(-8)}</span>
                <span style={{ color: "#10b981", fontSize: "12px", fontWeight: "bold" }}>● Vinculada</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={connectWallet}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "#f59e0b",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  marginTop: "8px",
                  transition: "background-color 0.2s"
                }}
              >
                Conectar MetaMask para Vincular Wallet
              </button>
            )}
          </div>

          {/* BOTON */}
          <button
            type="submit"
            disabled={cargando}
            style={{
              ...registerButton,
              backgroundColor: cargando ? "#94a3b8" : "#0f2c59",
              cursor: cargando ? "not-allowed" : "pointer"
            }}
          >
            {cargando ? "Registrando..." : "Registrarme en el Padrón"}
          </button>
        </form>

        {/* FOOTER */}
        <p
          style={{
            textAlign: "center",
            marginTop: "25px",
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          ¿Ya tenés cuenta?{" "}
          <span
            onClick={() => navigate("/login")}
            style={{
              color: "#1d4ed8",
              cursor: "pointer",
              fontWeight: "600",
              textDecoration: "underline",
            }}
          >
            Iniciar sesión
          </span>
        </p>
      </div>
    </div>
  );
}

/* ESTILOS */

const groupStyle = {
  marginBottom: "18px",
};

const labelStyle = {
  display: "block",
  fontSize: "14px",
  fontWeight: "600",
  color: "#334155",
  marginBottom: "6px",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "15px",
  boxSizing: "border-box",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const registerButton = {
  width: "100%",
  padding: "14px",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "16px",
  fontWeight: "bold",
  marginTop: "10px",
  boxShadow: "0 4px 6px -1px rgba(15, 44, 89, 0.2)",
  transition: "background-color 0.2s, transform 0.1s"
};

export default Register;