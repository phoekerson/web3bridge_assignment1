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
function App() {
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");

  async function requestAccount() {
    await window.ethereum!.request({ method: 'eth_requestAccounts' });
  }

  const handleGet = async () => {
    try {
      if (window.ethereum) {
        await requestAccount();
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, abi, provider);
        
        const retrievedMessage = await contract.getMessage();
        setMessage(retrievedMessage);
        console.log("Retrieved message:", retrievedMessage);
        
      } else {
        console.error("MetaMask not found. Please install MetaMask to use this application.");
        alert("MetaMask not found. Please install MetaMask to use this application.");
      }
    } catch (error: any) {
      console.error("Error getting message:", error);
      alert(error.message || error);
    }
  };

  const handleSet = async () => {
    try {
      if (!text) {
        alert("Please enter a message before setting.");
        return;
      }

      if (window.ethereum) {
        await requestAccount();
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);
        
        const tx = await contract.setMessage(text);
        const txReceipt = await tx.wait();
        console.log("Transaction successful:", txReceipt);
        
        // Clear input and show success
        setText("");
        alert("Message set successfully!");
        
      } else {
        console.error("MetaMask not found. Please install MetaMask to use this application.");
        alert("MetaMask not found. Please install MetaMask to use this application.");
      }
    } catch (error: any) {
      console.error("Error setting message:", error);
      alert(error.message || error);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Set Message on Smart Contract</h1>
      <input
        type="text"
        placeholder="Set message"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={handleSet}>Set Message</button>
      <button onClick={handleGet} style={{ marginLeft: "1rem" }}>Get Message</button>
      
      {message && (
        <div style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "4px" }}>
          <h3>Retrieved Message:</h3>
          <p style={{ fontWeight: "bold", color: "#333" }}>{message}</p>
        </div>
      )}
    </div>
  );
}
