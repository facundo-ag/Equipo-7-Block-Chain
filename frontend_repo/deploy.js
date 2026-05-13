import { ethers } from "ethers";
import fs from "fs";

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const signer = await provider.getSigner(0); // First Ganache account

    const artifactRaw = fs.readFileSync("./src/contracts/Votacion.json", "utf8");
    const artifact = JSON.parse(artifactRaw);

    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
    
    console.log("Deploying contract with Ethers...");
    const contract = await factory.deploy();
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log("Deployed at:", address);

    // Write it to contract.js
    let contractJs = fs.readFileSync("./src/utils/contract.js", "utf8");
    contractJs = contractJs.replace(/export const CONTRACT_ADDRESS = ".*";/, `export const CONTRACT_ADDRESS = "${address}";`);
    fs.writeFileSync("./src/utils/contract.js", contractJs);
    console.log("Updated src/utils/contract.js successfully!");
}

main().catch(console.error);
