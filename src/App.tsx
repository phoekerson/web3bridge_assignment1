import { useState } from "react";
import { abi } from "./abi";
import { ethers } from "ethers";

const contractAddress = "0x8bb9d856cca8cb916ce11e51eb30971b0d7c1446";

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

function App() {
  const [text, setText] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

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

      if (window.ethereum && window.ethereum.isMetaMask) {
        await requestAccount();
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);

        const tx = await contract.setMessage(text);
        await tx.wait();
        setText("");
        alert("Message set successfully!");
      } else {
        setError("MetaMask not found. Please install MetaMask.");
      }
    } catch (error: unknown) {
      setError((error as Error).message || "Error setting message");
    }
  };

  const handleGet = async (): Promise<void> => {
    try {
      setError("");
      if (window.ethereum && window.ethereum.isMetaMask) {
        await requestAccount();
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, abi, provider);

        const retrievedMessage: string = await contract.getMessage();
        setMessage(retrievedMessage);
      } else {
        setError("MetaMask not found. Please install MetaMask.");
      }
    } catch (error: unknown) {
      setError((error as Error).message || "Error retrieving message");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Set Message on Smart Contract</h1>
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