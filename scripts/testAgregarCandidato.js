const Votacion = artifacts.require("Votacion");

module.exports = async function(callback) {
  try {
    const votacion = await Votacion.deployed();
    const accounts = await web3.eth.getAccounts();
    console.log("Account 0 (Admin):", accounts[0]);

    // Test calling from Account 0 (deployer)
    console.log("Attempting to call agregarCandidato from Account 0...");
    try {
      const tx = await votacion.agregarCandidato("Candidato Test de Truffle", { from: accounts[0] });
      console.log("Success! Tx hash:", tx.tx);
      
      const total = await votacion.totalCandidatos();
      console.log("Total candidatos registrados:", total.toString());
      
      const cand = await votacion.candidatos(0);
      console.log("Candidato registrado:", cand.nombre);
    } catch (e) {
      console.error("Failed from Account 0:", e.message);
    }

    console.log("Contract Admin:", await votacion.admin());
    
  } catch (error) {
    console.error("General error:", error);
  }
  callback();
};
