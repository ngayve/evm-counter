import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { ethers } from 'ethers';
import { WASM_PRECOMPILE_ABI, WASM_PRECOMPILE_ADDRESS } from '@sei-js/evm';

declare global {
  interface Window {
    ethereum: any;
  }
}

function App() {
  const [count, setCount] = useState<string>();
  const [wasmcontract, setWasmcontract] = useState<ethers.Contract>();
  const [isIncrementing, setIsIncrementing] = useState(false);
  const CONTRACT_ADDRESS = "sei14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9sh9m79m";
  
  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const { chainId } = await provider.getNetwork();
      console.log("chainId network: ", chainId);
      const devnetChainId = '713715';
      if (chainId !== BigInt(devnetChainId)) {
        alert("Wallet is not connected to Sei EVM devnet");
        return;
      }

      const signer = await provider.getSigner();
      const wasmPrecompileContract = new ethers.Contract(WASM_PRECOMPILE_ADDRESS, WASM_PRECOMPILE_ABI, signer)
      console.log('Runner Contract:', wasmPrecompileContract);
      setWasmcontract(wasmPrecompileContract);
      
    } else {
      alert("No EVM compatible wallet installed");
    }
  }

  const fetchCount = async () => {
    if (!wasmcontract) {
      return;
    }
    const queryMsg = { get_count: {} };
    const queryResponse = await wasmcontract.query(
      CONTRACT_ADDRESS, 
      ethers.toUtf8Bytes(JSON.stringify(queryMsg))
    );
    const { count } = JSON.parse(ethers.toUtf8String(queryResponse));
    console.log('count =', count);
    setCount(count);
  }

  useEffect(() => {
    fetchCount();
  }, [wasmcontract]);

  const incrementCount = async () => {
    if (!wasmcontract) {
      return;
    }

    setIsIncrementing(true);

    const executeMsg = { increment: {} };
    // Execute message to increment the count on the contract
    const executeResponse = await wasmcontract.execute(
      CONTRACT_ADDRESS,
      ethers.toUtf8Bytes(JSON.stringify(executeMsg)),
      ethers.toUtf8Bytes(JSON.stringify([])) // Used for sending fund if need
    );
    console.log("executeResponse: ", executeResponse);
    // Wait for the transaction to be confirmed
    await executeResponse.wait();
    console.log(executeResponse);
    setIsIncrementing(false);
    await fetchCount();
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        { wasmcontract ? (
          <div>
            <h1>Count is {count}</h1>
            <button disabled={isIncrementing} onClick={incrementCount}>
              {isIncrementing ? "incrementing..." : "increment"}
            </button>
          </div>
        ) : (
          <button onClick={connectWallet}>Connect Wallet</button>
        )}
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
