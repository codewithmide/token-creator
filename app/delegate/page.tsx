"use client";

import React, { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
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
  const [isLoading, setIsLoading] = useState(false);

  const handleDelegateToken = async () => {
    if (!publicKey) {
      setError("Please connect your wallet");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatus(null);

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
        BigInt(parseFloat(amount) * Math.pow(10, 9)) // Assuming 9 decimals
      );

      // Create and send the transaction
      const transaction = new Transaction().add(approveInstruction);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      setStatus("Tokens delegated successfully!");
      setTokenAddress("");
      setAmount("");
      setDelegateAddress("");
    } catch (err) {
      setError(
        "Failed to delegate tokens: " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setIsLoading(false);
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
          className="w-full p-2 border rounded text-black"
        />
        <input
          type="text"
          placeholder="Amount to Delegate"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border rounded text-black"
        />
        <input
          type="text"
          placeholder="Delegate Address"
          value={delegateAddress}
          onChange={(e) => setDelegateAddress(e.target.value)}
          className="w-full p-2 border rounded text-black"
        />
        <button
          onClick={handleDelegateToken}
          className={`w-full font-bold py-2 px-4 rounded ${
            isLoading || !publicKey
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-purple-500 hover:bg-purple-700 text-white"
          }`}
          disabled={isLoading || !publicKey}
        >
          {isLoading ? (
            <span className="center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p>Delegating...</p>
            </span>
          ) : (
            "Delegate Tokens"
          )}
        </button>
      </div>
      {status && <p className="mt-4 text-green-500 w-full center">{status}</p>}
      {error && <p className="mt-4 text-red-500 w-full center">{error}</p>}
    </div>
  );
}
