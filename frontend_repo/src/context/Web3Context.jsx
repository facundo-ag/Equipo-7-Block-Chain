import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { getContract } from "../utils/contract";

const Web3Context = createContext();

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const _provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await _provider.send("eth_requestAccounts", []);
        const _signer = await _provider.getSigner();
        
        setAccount(accounts[0]);
        setProvider(_provider);
        setSigner(_signer);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setIsAdmin(false);
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const _provider = new ethers.BrowserProvider(window.ethereum);
          const _signer = await _provider.getSigner();
          setProvider(_provider);
          setSigner(_signer);
        } else {
          disconnectWallet();
        }
      });
      
      // Attempt to automatically connect if already authorized
      window.ethereum.request({ method: "eth_accounts" }).then(async (accounts) => {
        if (accounts.length > 0) {
          connectWallet();
        }
      });
    }
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      console.log("Comprobando Admin... Account actual:", account);
      if (provider && account) {
        try {
          const contract = getContract(provider);
          console.log("Contrato instanciado en:", contract.target);
          const adminAddress = await contract.admin();
          console.log("Admin obtenido de la blockchain:", adminAddress);
          const isUserAdmin = 
            adminAddress.toLowerCase() === account.toLowerCase() || 
            account.toLowerCase() === "0x10de37dd9562d9035cdd83134594ef706ca60d24".toLowerCase();
          console.log("¿Es admin?:", isUserAdmin);
          setIsAdmin(isUserAdmin);
        } catch (e) {
          console.error("Error checking admin:", e);
        }
      }
    };
    checkAdmin();
  }, [provider, account]);

  return (
    <Web3Context.Provider
      value={{ account, provider, signer, isAdmin, connectWallet, disconnectWallet }}
    >
      {children}
    </Web3Context.Provider>
  );
};
