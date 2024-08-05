"use client";

import React, { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import {
  approve,
  getAssociatedTokenAddress,
  createApproveInstruction,
} from "@solana/spl-token";

export default function DelegateToken() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [tokenAddress, setTokenAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [delegateAddress, setDelegateAddress] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelegateToken = async () => {
    if (!publicKey) {
      setError("Please connect your wallet");
      return;
    }

    try {
      const mintPublicKey = new PublicKey(tokenAddress);
      const delegatePublicKey = new PublicKey(delegateAddress);

      // Get the associated token account address
      const tokenAccountAddress = await getAssociatedTokenAddress(
        mintPublicKey,
        publicKey
      );

      // Create the approve instruction
      const approveInstruction = createApproveInstruction(
        tokenAccountAddress,
        delegatePublicKey,
        publicKey,
        BigInt(parseFloat(amount) * Math.pow(10, 9))
      );

      // Create and send the transaction
      const transaction = new Transaction().add(approveInstruction);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      setStatus("Tokens delegated successfully!");
      setError(null);
    } catch (err) {
      setError("Failed to delegate tokens: " + (err as Error).message);
      setStatus(null);
    }
  };

  return (
    <div className="center flex-col mt-20">
      <h1 className="text-2xl font-bold mb-4">Delegate Token</h1>
      <div className="space-y-4 max-w-md">
        <input
          type="text"
          placeholder="Token Address"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Amount to Delegate"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Delegate Address"
          value={delegateAddress}
          onChange={(e) => setDelegateAddress(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <button
          onClick={handleDelegateToken}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          disabled={!publicKey}
        >
          Delegate Tokens
        </button>
      </div>
      {status && <p className="mt-4 text-green-500">{status}</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
}
