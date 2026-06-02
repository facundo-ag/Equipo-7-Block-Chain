import { ethers } from "ethers";
import VotacionABI from "../contracts/Votacion.json";

export const CONTRACT_ADDRESS = "0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B";

export const getContract = (providerOrSigner) => {
  return new ethers.Contract(CONTRACT_ADDRESS, VotacionABI.abi, providerOrSigner);
};

