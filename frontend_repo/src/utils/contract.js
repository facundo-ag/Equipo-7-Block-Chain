import { ethers } from "ethers";
import VotacionABI from "../contracts/Votacion.json";

export const CONTRACT_ADDRESS = "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab";

export const getContract = (providerOrSigner) => {
  return new ethers.Contract(CONTRACT_ADDRESS, VotacionABI.abi, providerOrSigner);
};

