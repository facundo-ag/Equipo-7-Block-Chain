import { ethers } from "ethers";
import VotacionABI from "../contracts/Votacion.json";

export const CONTRACT_ADDRESS = "0x070b2cbb28E5F470EF0B2AF0D358008F9437b2Ff";

export const getContract = (providerOrSigner) => {
  return new ethers.Contract(CONTRACT_ADDRESS, VotacionABI.abi, providerOrSigner);
};
