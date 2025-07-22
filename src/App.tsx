import { useState } from "react";
import { abi } from "./abi";
import { ethers } from "ethers";

// Type declaration for ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on?: (eventName: string, handler: (...args: any[]) => void) => void;
      removeListener?: (eventName: string, handler: (...args: any[]) => void) => void;
    };
  }
}

const contractAddress = "0x8bb9d856cca8cb916ce11e51eb30971b0d7c1446";
const SEPOLIA_CHAIN_ID = "0xaa36a7";

function App() {
  const [text, setText] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [currentNetwork, setCurrentNetwork] = useState<string>("");

  async function checkNetwork(): Promise<boolean> {
    try {
      if (!window.ethereum) return false;
      
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const networkName = chainId === SEPOLIA_CHAIN_ID ? "Sepolia Testnet" : 
                         chainId === "0x1" ? "Ethereum Mainnet" : 
                         `Unknown Network (${chainId})`;
      
      setCurrentNetwork(networkName);
      
      if (chainId !== SEPOLIA_CHAIN_ID) {
        setError(`Wrong network detected: ${networkName}. Please switch to Sepolia Testnet.`);
        return false;
      }
      
      return true;
    } catch (err) {
      setError("Failed to check network");
      return false;
    }
  }

  async function switchToSepolia(): Promise<boolean> {
    try {
      if (!window.ethereum) return false;
      
      // Try to switch to Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      
      return true;
    } catch (switchError: any) {
      // If Sepolia is not added to MetaMask, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum!.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: SEPOLIA_CHAIN_ID,
              chainName: 'Sepolia Test Network',
              rpcUrls: ['https://rpc.sepolia.org'],
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            }],
          });
          return true;
        } catch (addError) {
          setError("Failed to add Sepolia network to MetaMask");
          return false;
        }
      } else {
        setError("Failed to switch to Sepolia network");
        return false;
      }
    }
  }

  async function requestAccount(): Promise<void> {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found. Please install MetaMask.");
      }
      
      if (window.ethereum.isMetaMask) {
        await window.ethereum.request({ method: "eth_requestAccounts" });
      } else {
        throw new Error("Please use MetaMask as your wallet provider.");
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  }

  const handleSet = async (): Promise<void> => {
    try {
      setError("");
      if (!text) {
        setError("Please enter a message before setting.");
        return;
      }

      if (!window.ethereum || !window.ethereum.isMetaMask) {
        setError("MetaMask not found. Please install MetaMask.");
        return;
      }

      // Check if we're on the correct network
      const isCorrectNetwork = await checkNetwork();
      if (!isCorrectNetwork) {
        return; // Error message is already set by checkNetwork
      }

      await requestAccount();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);

      const tx = await contract.setMessage(text);
      await tx.wait();
      setText("");
      alert("Message set successfully on Sepolia testnet!");
      
    } catch (error: unknown) {
      setError((error as Error).message || "Error setting message");
    }
  };

  const handleGet = async (): Promise<void> => {
    try {
      setError("");
      
      if (!window.ethereum || !window.ethereum.isMetaMask) {
        setError("MetaMask not found. Please install MetaMask.");
        return;
      }

      // Check if we're on the correct network
      const isCorrectNetwork = await checkNetwork();
      if (!isCorrectNetwork) {
        return; // Error message is already set by checkNetwork
      }

      await requestAccount();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, abi, provider);

      const retrievedMessage: string = await contract.getMessage();
      setMessage(retrievedMessage);
      
    } catch (error: unknown) {
      setError((error as Error).message || "Error retrieving message");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Set Message on Smart Contract</h1>
      
      {/* Network Status */}
      <div style={{ 
        padding: "1rem", 
        marginBottom: "1rem", 
        backgroundColor: currentNetwork === "Sepolia Testnet" ? "#d4edda" : "#f8d7da",
        border: `1px solid ${currentNetwork === "Sepolia Testnet" ? "#c3e6cb" : "#f5c6cb"}`,
        borderRadius: "4px"
      }}>
        <strong>Current Network: </strong>
        {currentNetwork || "Not connected"}
        {currentNetwork && currentNetwork !== "Sepolia Testnet" && (
          <div style={{ marginTop: "0.5rem" }}>
            <button 
              onClick={switchToSepolia}
              style={{ 
                padding: "0.5rem 1rem", 
                backgroundColor: "#007bff", 
                color: "white", 
                border: "none", 
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Switch to Sepolia Testnet
            </button>
          </div>
        )}
      </div>
      
      <input
        type="text"
        placeholder="Set message"
        value={text}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setText(e.target.value)
        }
      />
      <button onClick={handleSet}>Set Message</button>
      <button onClick={handleGet}>Get Message</button>
      
      {message && (
        <div>
          <h3>Stored Message:</h3>
          <p>{message}</p>
        </div>
      )}
      
      {error && (
        <div style={{ color: "red", marginTop: "1rem" }}>
          <p>Error: {error}</p>
        </div>
      )}
    </div>
  );
}

export default App;