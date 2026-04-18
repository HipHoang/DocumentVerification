import { useState } from "react";
import { getContract } from "./utils/contract";

function App() {
  const [account, setAccount] = useState("");
  const [result, setResult] = useState("");

  const connectWallet = async () => {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setAccount(accounts[0]);
  };

  const verify = async () => {
  try {
    const contract = await getContract();

    console.log("ADDRESS:", contract.target);

    const hash = "0x" + "0".repeat(64);

    const data = await contract.verifyCertificate(hash);

    console.log("DATA:", data);

    setResult(JSON.stringify(data));
  } catch (err) {
    console.error("ERROR:", err);
  }
};


  return (
    <div style={{ padding: 20 }}>
      <h1>DApp</h1>

      <button onClick={connectWallet}>Connect</button>
      <button onClick={verify}>Verify</button>

      <p>{account}</p>
      <p>{result}</p>
    </div>
  );
}

export default App;