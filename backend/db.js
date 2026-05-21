const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "database.sqlite");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error al conectar con la base de datos SQLite:", err.message);
  } else {
    console.log("Conectado con éxito a la base de datos SQLite.");
    inicializarTablas();
  }
});

function inicializarTablas() {
  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        dni TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        wallet_address TEXT UNIQUE NOT NULL,
        habilitado INTEGER DEFAULT 1
      )`,
      (err) => {
        if (err) {
          console.error("Error al crear la tabla 'usuarios':", err.message);
        } else {
          console.log("Tabla 'usuarios' verificada/creada correctamente.");
          // Rework: Habilitamos automáticamente a todos los registrados en base de datos
          db.run("UPDATE usuarios SET habilitado = 1", (updateErr) => {
            if (updateErr) {
              console.error("Error al actualizar el padrón local:", updateErr.message);
            } else {
              console.log("Padrón electoral local actualizado/sincronizado automáticamente.");
            }
          });
        }
      }
    );
  });
}

module.exports = db;
