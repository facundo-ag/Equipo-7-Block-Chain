const Votacion = artifacts.require("Votacion");

module.exports = async function(callback) {
  try {
    const userAddress = "0x10de37dd9562d9035edd83134594ef706ea60d24";
    const balance = await web3.eth.getBalance(userAddress);
    console.log("Balance of", userAddress, "on local RPC:", web3.utils.fromWei(balance, "ether"), "ETH");

    const accounts = await web3.eth.getAccounts();
    console.log("Ganache accounts and their balances:");
    for (let i = 0; i < accounts.length; i++) {
      const bal = await web3.eth.getBalance(accounts[i]);
      console.log(`Account ${i} (${accounts[i]}): ${web3.utils.fromWei(bal, "ether")} ETH`);
    }
  } catch (error) {
    console.error("Error checking balance:", error);
  }
  callback();
};
