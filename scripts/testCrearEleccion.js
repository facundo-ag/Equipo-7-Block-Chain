const Votacion = artifacts.require("Votacion");

module.exports = async function(callback) {
  try {
    const votacion = await Votacion.deployed();
    const accounts = await web3.eth.getAccounts();
    console.log("Account 0 (Admin):", accounts[0]);

    // Test calling from Account 0 (deployer)
    console.log("Attempting to call crearEleccion from Account 0...");
    try {
      const tx = await votacion.crearEleccion("Test Eleccion 0", { from: accounts[0] });
      console.log("Success! Tx hash:", tx.tx);
    } catch (e) {
      console.error("Failed from Account 0:", e.message);
    }

    // Test calling from user wallet address by impersonating or using it if we have it?
    // Wait, we don't have the private key of 0x10de37dd9562D9035CDD83134594eF706CA60D24 in Truffle accounts list.
    // But we can check if msg.sender is indeed being compared to 0x10de37dd9562D9035CDD83134594eF706CA60D24.
    // Let's check what the contract thinks about msg.sender == 0x10de... in Solidity by checking who deployed it.
    console.log("Contract Admin:", await votacion.admin());
    
  } catch (error) {
    console.error("General error:", error);
  }
  callback();
};
