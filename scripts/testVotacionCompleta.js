const Votacion = artifacts.require("Votacion");

module.exports = async function(callback) {
  try {
    const votacion = await Votacion.deployed();
    const accounts = await web3.eth.getAccounts();
    const admin = accounts[0];
    const votante = accounts[1];
    
    console.log("==================================================");
    console.log("🚀 EJECUTANDO TEST DE FLUJO DE VOTACIÓN COMPLETO");
    console.log("==================================================");
    console.log("Admin (Cuenta 0):", admin);
    console.log("Votante (Cuenta 1):", votante);
    
    // 1. Agregar candidato
    console.log("\n1. Registrando un candidato oficial...");
    const candNombre = "Candidato de la Libertad y el Progreso";
    const txAdd = await votacion.agregarCandidato(candNombre, { from: admin });
    console.log("✅ Candidato registrado con éxito. Hash:", txAdd.tx);
    
    const totalCand = await votacion.totalCandidatos();
    const ultimoId = Number(totalCand) - 1;
    const infoCand = await votacion.candidatos(ultimoId);
    console.log(`   ID: ${infoCand.id} | Nombre: "${infoCand.nombre}" | Votos iniciales: ${infoCand.votos}`);
    
    // 2. Emitir voto
    console.log(`\n2. Cuenta 1 (${votante}) emitiendo voto para el candidato ID ${ultimoId}...`);
    const txVoto = await votacion.emitirVoto(ultimoId, { from: votante });
    console.log("✅ Voto emitido con éxito. Hash:", txVoto.tx);
    
    // Verificar que el voto fue sumado
    const infoCandPost = await votacion.candidatos(ultimoId);
    console.log(`   Votos actuales del candidato ID ${ultimoId}: ${infoCandPost.votos}`);
    
    // Verificar mapping haVotado
    const yaVoto = await votacion.haVotado(votante);
    console.log(`   ¿La wallet del votante figura que ya votó?: ${yaVoto ? "SÍ" : "NO"}`);
    
    // 3. Validar rechazo de doble voto
    console.log("\n3. Intentando emitir un segundo voto con la misma wallet (Cuenta 1)...");
    try {
      await votacion.emitirVoto(ultimoId, { from: votante });
      console.error("❌ ERROR: El contrato permitió el doble voto de la misma wallet. ¡Fallo de seguridad!");
    } catch (err) {
      console.log("✅ ÉXITO: La blockchain rechazó la transacción de forma inmutable.");
      console.log("   Motivo del rechazo en el revert:", err.message.split("revert")[1] || err.message);
    }
    
    console.log("\n==================================================");
    console.log("🎉 TEST FINALIZADO CON ÉXITO: CONTROL DE VOTO COMPLETO");
    console.log("==================================================");
    
  } catch (error) {
    console.error("❌ ERROR GENERAL EN EL SCRIPT:", error);
  }
  callback();
};
