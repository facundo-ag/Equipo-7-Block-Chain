const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "secreto_electoral_de_alta_seguridad_2026";

// --- CONFIGURACIÓN DE TESTNET LOCAL ---
const AUTO_FUND_AMOUNT_ETH = 10; // Cantidad de ETH asignada por defecto a nuevos usuarios

app.use(cors());
app.use(express.json());

// Helper para auto-fondear billeteras registradas si tienen menos de 5 ETH en Ganache
const checkAndFundWallet = async (walletAddress) => {
  if (!walletAddress) return;
  try {
    const rpcUrl = "http://127.0.0.1:8545";
    
    // 1. Obtener balance actual en wei
    const balanceRes = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getBalance",
        params: [walletAddress, "latest"],
        id: 1
      })
    });
    const balanceData = await balanceRes.json();
    
    if (balanceData.result) {
      const balanceHex = balanceData.result;
      const balanceWei = BigInt(balanceHex);
      const limitWei = BigInt("5000000000000000000"); // 5 ETH mínimo
      
      console.log(`[Auto-Funding] Billetera ${walletAddress} balance actual: ${balanceWei} wei.`);
      
      if (balanceWei < limitWei) {
        // Obtener cuentas de Ganache para fondear desde la primera (Account 0)
        const accountsRes = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_accounts",
            params: [],
            id: 2
          })
          
        });
        const accountsData = await accountsRes.json();
        if (accountsData.result && accountsData.result.length > 0) {
          const fromAddress = accountsData.result[0];
          
          // Calcular valor en Wei de forma nativa e ilimitada usando BigInt
          const fundWei = BigInt(AUTO_FUND_AMOUNT_ETH) * BigInt("1000000000000000000");
          const fundHex = "0x" + fundWei.toString(16);
          
          console.log(`[Auto-Funding] Enviando ${AUTO_FUND_AMOUNT_ETH} ETH a ${walletAddress} desde ${fromAddress}...`);
          
          await fetch(rpcUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "eth_sendTransaction",
              params: [{
                from: fromAddress,
                to: walletAddress,
                value: fundHex
              }],
              id: 3
            })
          });
          console.log(`[Auto-Funding] Fondeo exitoso para ${walletAddress}!`);
        }
      }
    }
  } catch (error) {
    console.error("[Auto-Funding] Error al comprobar/fondear billetera automáticamente:", error);
  }
};

// --- ENDPOINTS DE AUTENTICACIÓN ---

// Registro de Votante
app.post("/api/auth/register", (req, res) => {
  const { nombre, apellido, dni, email, password, wallet_address } = req.body;

  if (!nombre || !apellido || !dni || !email || !password || !wallet_address) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  // Cifrar la contraseña
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const sql = `INSERT INTO usuarios (nombre, apellido, dni, email, password_hash, wallet_address, habilitado)
               VALUES (?, ?, ?, ?, ?, ?, 1)`;

  db.run(
    sql,
    [nombre, apellido, dni, email.toLowerCase(), passwordHash, wallet_address.toLowerCase()],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed: usuarios.dni")) {
          return res.status(400).json({ error: "El DNI ingresado ya está registrado" });
        }
        if (err.message.includes("UNIQUE constraint failed: usuarios.email")) {
          return res.status(400).json({ error: "El Email ingresado ya está registrado" });
        }
        if (err.message.includes("UNIQUE constraint failed: usuarios.wallet_address")) {
          return res.status(400).json({ error: "Esta Wallet Ethereum ya está asociada a otra cuenta" });
        }
        return res.status(500).json({ error: "Error al registrar el usuario: " + err.message });
      }

      // Auto-fondear billetera en segundo plano
      checkAndFundWallet(wallet_address);

      res.status(201).json({
        message: "Registro exitoso. ¡Ya podés ingresar y emitir tu voto!",
        id: this.lastID,
      });
    }
  );
});

// Inicio de Sesión (Login)
app.post("/api/auth/login", (req, res) => {
  const { emailOrDni, password } = req.body;

  if (!emailOrDni || !password) {
    return res.status(400).json({ error: "Dato de acceso y contraseña obligatorios" });
  }

  const sql = `SELECT * FROM usuarios WHERE email = ? OR dni = ?`;
  db.get(sql, [emailOrDni.toLowerCase(), emailOrDni], (err, user) => {
    if (err) {
      return res.status(500).json({ error: "Error en el servidor: " + err.message });
    }
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Verificar contraseña
    const passwordValido = bcrypt.compareSync(password, user.password_hash);
    if (!passwordValido) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Auto-fondear billetera si está por debajo del límite
    checkAndFundWallet(user.wallet_address);

    // Crear token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, wallet: user.wallet_address },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        dni: user.dni,
        email: user.email,
        wallet_address: user.wallet_address,
        habilitado: user.habilitado === 1,
      },
    });
  });
});

// --- ENDPOINTS DE ADMINISTRACIÓN (Módulo de Elegibilidad) ---

// Obtener todos los usuarios registrados
app.get("/api/admin/users", (req, res) => {
  // En producción deberíamos verificar que el que llama sea administrador (ej. con un middleware y JWT)
  const sql = `SELECT id, nombre, apellido, dni, email, wallet_address, habilitado FROM usuarios ORDER BY id DESC`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener usuarios: " + err.message });
    }
    res.json(rows.map(user => ({
      ...user,
      habilitado: user.habilitado === 1
    })));
  });
});

// Aprobar/Habilitar un usuario en la base de datos (paso previo o simultáneo a habilitarlo en blockchain)
app.put("/api/admin/users/:id/approve", (req, res) => {
  const { id } = req.params;

  const sql = `UPDATE usuarios SET habilitado = 1 WHERE id = ?`;

  db.run(sql, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: "Error al habilitar votante: " + err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json({ message: "Usuario habilitado con éxito en el padrón Web2" });
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor Express corriendo en http://localhost:${PORT}`);
});
