module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const targetAddress = "0x1e0733aec6a212e5c7804512e795507b65052e08";
    console.log("Ganache Account 0:", accounts[0]);
    
    const bal0 = await web3.eth.getBalance(accounts[0]);
    console.log("Account 0 balance:", web3.utils.fromWei(bal0, "ether"), "ETH");

    const balBefore = await web3.eth.getBalance(targetAddress);
    console.log("Voter balance before:", web3.utils.fromWei(balBefore, "ether"), "ETH");

    console.log("Sending 10 ETH to voter", targetAddress, "...");
    await web3.eth.sendTransaction({
      from: accounts[0],
      to: targetAddress,
      value: web3.utils.toWei("10", "ether")
    });

    const balAfter = await web3.eth.getBalance(targetAddress);
    console.log("Voter balance after:", web3.utils.fromWei(balAfter, "ether"), "ETH");

  } catch (error) {
    console.error("Error in funding script:", error);
  }
  callback();
};
