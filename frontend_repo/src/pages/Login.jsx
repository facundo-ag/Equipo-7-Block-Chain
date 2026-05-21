import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";

function Login() {
  const { connectWallet, account, isAdmin } = useWeb3();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    emailOrDni: "",
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

    const { emailOrDni, password } = formData;

    if (!emailOrDni || !password) {
      setMensaje({ tipo: "error", texto: "Complete todos los campos." });
      return;
    }

    setCargando(true);

    try {
      // 1. Autenticar en la Base de Datos Web2
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emailOrDni, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Credenciales inválidas");
      }

      // Guardar sesión en localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // 2. Solicitar conexión de wallet MetaMask
      setMensaje({ tipo: "info", texto: "Autenticación exitosa. Conectando MetaMask..." });
      
      // Conectar wallet si no lo está
      if (!account) {
        await connectWallet();
      }

      // Validar si la cuenta de MetaMask coincide con la registrada
      // Nota: Hacemos la validación si la cuenta está disponible, si no, se validará en el useEffect
      setMensaje({ tipo: "success", texto: "¡Sesión iniciada con éxito! Redirigiendo..." });
      
      setTimeout(() => {
        if (data.user.email.toLowerCase() === "admin@gob.ar" || data.user.dni === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }, 1500);

    } catch (err) {
      setMensaje({ tipo: "error", texto: err.message });
    } finally {
      setCargando(false);
    }
  };

  // Efecto de seguridad: si está logueado pero cambia de wallet a una incorrecta, mostrar advertencia
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && account) {
      const user = JSON.parse(storedUser);
      // Permitimos omitir validación al admin para testing ágil
      const isUserAdmin = user.email.toLowerCase() === "admin@gob.ar" || user.dni === "admin";
      if (!isUserAdmin && user.wallet_address.toLowerCase() !== account.toLowerCase()) {
        setMensaje({
          tipo: "error",
          texto: "⚠️ La cuenta de MetaMask conectada NO coincide con la wallet registrada para este usuario.",
        });
      } else {
        // Limpiar mensaje de advertencia si se conecta la correcta
        setMensaje(prev => prev.texto.includes("coincide") ? { tipo: "", texto: "" } : prev);
      }
    }
  }, [account]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "40px",
          width: "100%",
          maxWidth: "400px",
          borderRadius: "16px",
          boxShadow: "0 10px 25px -5px rgba(15, 44, 89, 0.1), 0 8px 10px -6px rgba(15, 44, 89, 0.05)",
          border: "1px solid #e2e8f0",
          textAlign: "center"
        }}
      >
        <h1 style={{ marginBottom: "10px", color: "#0f2c59", fontWeight: "800", fontSize: "28px" }}>
          Iniciar Sesión
        </h1>
        <p style={{ color: "#64748b", marginBottom: "30px", fontSize: "14px" }}>
          Portal Oficial de Votación Gubernamental
        </p>

        {mensaje.texto && (
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "13px",
              fontWeight: "600",
              backgroundColor: mensaje.tipo === "success" ? "#d1fae5" : mensaje.tipo === "info" ? "#e0f2fe" : "#fee2e2",
              color: mensaje.tipo === "success" ? "#065f46" : mensaje.tipo === "info" ? "#0369a1" : "#991b1b",
              border: `1px solid ${mensaje.tipo === "success" ? "#a7f3d0" : mensaje.tipo === "info" ? "#bae6fd" : "#fecaca"}`,
            }}
          >
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          <div style={groupStyle}>
            <label style={labelStyle}>Email o DNI</label>
            <input
              type="text"
              name="emailOrDni"
              value={formData.emailOrDni}
              onChange={handleChange}
              placeholder="Ingrese su email o DNI"
              style={inputStyle}
              required
            />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Contraseña</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Ingrese su contraseña"
              style={inputStyle}
              required
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{
              ...metamaskButton,
              backgroundColor: cargando ? "#94a3b8" : "#0f2c59",
              cursor: cargando ? "not-allowed" : "pointer"
            }}
          >
            {cargando ? "Iniciando Sesión..." : "Ingresar"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "25px",
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          ¿No tenés cuenta?{" "}
          <span
            onClick={() => navigate("/register")}
            style={{
              color: "#1d4ed8",
              cursor: "pointer",
              fontWeight: "600",
              textDecoration: "underline",
            }}
          >
            Registrate acá
          </span>
        </p>
      </div>
    </div>
  );
}

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
};

const metamaskButton = {
  width: "100%",
  padding: "14px",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "16px",
  cursor: "pointer",
  fontWeight: "bold",
  boxShadow: "0 4px 6px -1px rgba(15, 44, 89, 0.2)",
  marginTop: "10px",
};

export default Login;