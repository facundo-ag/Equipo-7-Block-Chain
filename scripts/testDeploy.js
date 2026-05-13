const Votacion = artifacts.require("Votacion");

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    console.log("Accounts:", accounts.slice(0, 3));
    const instance = await Votacion.new({ from: accounts[0], gas: 5000000 });
    console.log("Deployed Votacion at", instance.address);
  } catch (error) {
    console.error("DEPLOY ERROR:", error);
  }
  callback();
};