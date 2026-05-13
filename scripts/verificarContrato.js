const Votacion = artifacts.require("Votacion");

module.exports = async function(callback) {
  try {
    console.log("=== VERIFICACIÓN DEL CONTRATO DE VOTACIÓN ===");

    // Obtener instancia desplegada
    const votacion = await Votacion.deployed();
    console.log("✅ Contrato desplegado en:", votacion.address);

    // Obtener cuentas
    const accounts = await web3.eth.getAccounts();
    console.log("✅ Cuentas disponibles:", accounts.length);

    // Verificar admin
    const admin = await votacion.admin();
    console.log("✅ Admin del contrato:", admin);

    // Agregar opciones
    console.log("\n--- AGREGANDO OPCIONES ---");
    await votacion.agregarOpcion("Candidato A", { from: accounts[0] });
    console.log("✅ Opción 'Candidato A' agregada");

    await votacion.agregarOpcion("Candidato B", { from: accounts[0] });
    console.log("✅ Opción 'Candidato B' agregada");

    const totalOpciones = await votacion.totalOpciones();
    console.log("✅ Total de opciones:", totalOpciones.toString());

    // Habilitar votantes
    console.log("\n--- HABILITANDO VOTANTES ---");
    await votacion.habilitarVotante(accounts[1], { from: accounts[0] });
    console.log("✅ Votante habilitado:", accounts[1]);

    await votacion.habilitarVotante(accounts[2], { from: accounts[0] });
    console.log("✅ Votante habilitado:", accounts[2]);

    // Emitir votos
    console.log("\n--- EMITIENDO VOTOS ---");
    await votacion.emitirVoto(0, { from: accounts[1] });
    console.log("✅ Voto emitido por", accounts[1], "para opción 0");

    await votacion.emitirVoto(1, { from: accounts[2] });
    console.log("✅ Voto emitido por", accounts[2], "para opción 1");

    // Consultar resultados
    console.log("\n--- RESULTADOS ---");
    const votosA = await votacion.consultarRecuentoVotos(0);
    const votosB = await votacion.consultarRecuentoVotos(1);

    console.log("✅ Votos para Candidato A:", votosA.toString());
    console.log("✅ Votos para Candidato B:", votosB.toString());

    console.log("\n🎉 TODAS LAS FUNCIONALIDADES VERIFICADAS EXITOSAMENTE!");

  } catch (error) {
    console.error("❌ ERROR:", error.message);
  }

  callback();
};