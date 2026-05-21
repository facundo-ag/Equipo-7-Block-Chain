const Votacion = artifacts.require("Votacion");

module.exports = async function(callback) {
  try {
    const votacion = await Votacion.deployed();
    const userAddress = "0x10de37dd9562D9035CDD83134594eF706CA60D24";
    
    console.log("Simulating crearEleccion('Elecciones 2026') from", userAddress, "...");
    
    // We encode the transaction ABI
    const data = votacion.contract.methods.crearEleccion("Elecciones 2026").encodeABI();
    
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
