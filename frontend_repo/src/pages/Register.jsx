function Register() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          width: "500px",
          padding: "40px",
          borderRadius: "10px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        {/* TITULO */}
        <h1
          style={{
            textAlign: "center",
            marginBottom: "10px",
            color: "#111827",
          }}
        >
          Registro de Votante
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#6b7280",
            marginBottom: "30px",
          }}
        >
          Complete sus datos para participar en la elección
        </p>

        {/* FORMULARIO */}
        <form>
          {/* NOMBRE */}
          <div style={groupStyle}>
            <label>Nombre</label>

            <input
              type="text"
              placeholder="Ingrese su nombre"
              style={inputStyle}
            />
          </div>

          {/* APELLIDO */}
          <div style={groupStyle}>
            <label>Apellido</label>

            <input
              type="text"
              placeholder="Ingrese su apellido"
              style={inputStyle}
            />
          </div>

          {/* DNI */}
          <div style={groupStyle}>
            <label>DNI</label>

            <input
              type="text"
              placeholder="Ingrese su DNI"
              style={inputStyle}
            />
          </div>

          {/* EMAIL */}
          <div style={groupStyle}>
            <label>Email</label>

            <input
              type="email"
              placeholder="Ingrese su email"
              style={inputStyle}
            />
          </div>

          {/* PASSWORD */}
          <div style={groupStyle}>
            <label>Contraseña</label>

            <input
              type="password"
              placeholder="Ingrese su contraseña"
              style={inputStyle}
            />
          </div>

          {/* WALLET */}
          <div style={groupStyle}>
            <label>Wallet Ethereum</label>

            <input
              type="text"
              placeholder="0x..."
              style={inputStyle}
            />
          </div>

          {/* BOTON */}
          <button style={registerButton}>
            Registrarse
          </button>
        </form>

        {/* FOOTER */}
        <p
          style={{
            textAlign: "center",
            marginTop: "25px",
            color: "#6b7280",
          }}
        >
          Ya tienes cuenta? Iniciar sesión
        </p>
      </div>
    </div>
  );
}

/* ESTILOS */

const groupStyle = {
  marginBottom: "20px",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "8px",
  borderRadius: "5px",
  border: "1px solid #d1d5db",
  fontSize: "16px",
  boxSizing: "border-box",
};

const registerButton = {
  width: "100%",
  padding: "14px",
  backgroundColor: "#10b981",
  color: "white",
  border: "none",
  borderRadius: "5px",
  fontSize: "16px",
  cursor: "pointer",
};

export default Register;