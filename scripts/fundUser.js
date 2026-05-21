module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const targetAddress = "0x10de37dd9562D9035CDD83134594eF706CA60D24";
    console.log("Ganache Account 0:", accounts[0]);
    
    // Check balance of Account 0
    const bal0 = await web3.eth.getBalance(accounts[0]);
    console.log("Account 0 balance:", web3.utils.fromWei(bal0, "ether"), "ETH");

    // Check balance of targetAddress before
    const balBefore = await web3.eth.getBalance(targetAddress);
    console.log("User target balance before:", web3.utils.fromWei(balBefore, "ether"), "ETH");

    // Send 50 ETH
    console.log("Sending 50 ETH to", targetAddress, "...");
    await web3.eth.sendTransaction({
      from: accounts[0],
      to: targetAddress,
      value: web3.utils.toWei("50", "ether")
    });

    // Check balance after
    const balAfter = await web3.eth.getBalance(targetAddress);
    console.log("User target balance after:", web3.utils.fromWei(balAfter, "ether"), "ETH");

  } catch (error) {
    console.error("Error in funding script:", error);
  }
  callback();
};
