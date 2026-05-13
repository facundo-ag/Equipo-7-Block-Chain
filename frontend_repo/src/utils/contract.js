import { ethers } from "ethers";
import VotacionABI from "../contracts/Votacion.json";

// TODO: Replace with the deployed contract address from Truffle after migration
export const CONTRACT_ADDRESS = "0x5818Df60c3cAa3133a2a8087F41bCBFF7BAa362c";

export const getContract = (providerOrSigner) => {
  return new ethers.Contract(CONTRACT_ADDRESS, VotacionABI.abi, providerOrSigner);
};
