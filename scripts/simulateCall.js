const Votacion = artifacts.require("Votacion");

module.exports = async function(callback) {
  try {
    const votacion = await Votacion.deployed();
    const userAddress = "0x10de37dd9562d9035edd83134594ef706ea60d24";
    
    console.log("Simulating agregarCandidato('Candidato de Prueba') from", userAddress, "...");
    
    // We encode the transaction ABI
    const data = votacion.contract.methods.agregarCandidato("Candidato de Prueba").encodeABI();
    
    try {
      const result = await web3.eth.call({
        from: userAddress,
        to: votacion.address,
        data: data
      });
      console.log("Simulation succeeded! Result:", result);
    } catch (e) {
      console.error("Simulation failed! Error message:", e.message);
      console.error("Error details:", JSON.stringify(e, null, 2));
    }
  } catch (error) {
    console.error("General error:", error);
  }
  callback();
};
