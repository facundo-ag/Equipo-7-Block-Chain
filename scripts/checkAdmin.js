const Votacion = artifacts.require("Votacion");

module.exports = async function(callback) {
  try {
    const votacion = await Votacion.deployed();
    console.log("Contract deployed at:", votacion.address);
    const admin = await votacion.admin();
    console.log("Admin address from contract:", admin);
    
    // Check if crearEleccion exists
    console.log("Functions in contract:", Object.keys(votacion.contract.methods));
  } catch (error) {
    console.error("Error reading contract:", error);
  }
  callback();
};
