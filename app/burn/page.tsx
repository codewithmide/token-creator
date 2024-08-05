"use client";

import React, { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createBurnInstruction,
} from "@solana/spl-token";

export default function BurnToken() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [tokenAddress, setTokenAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleBurnToken = async () => {
    if (!publicKey) {
      setError("Please connect your wallet.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setStatus(null);

      const mintPublicKey = new PublicKey(tokenAddress);

      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintPublicKey,
        publicKey
      );

      const burnAmount = BigInt(parseFloat(amount) * Math.pow(10, 9));

      const transaction = new Transaction().add(
        createBurnInstruction(
          associatedTokenAddress,
          mintPublicKey,
          publicKey,
          burnAmount
        )
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      setStatus("Tokens burned successfully!");
      setTokenAddress("");
      setAmount("");
    } catch (err) {
      setError(
        "Failed to burn tokens: " +
          (err instanceof Error ? err.message : String(err))
      );
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="center flex-col mt-20">
      <h1 className="text-2xl max-w-md font-bold mb-4">Burn Token</h1>
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
          placeholder="Amount to Burn"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border rounded text-black"
        />
        <button
          onClick={handleBurnToken}
          disabled={isLoading || !publicKey}
          className={`w-full font-bold py-2 px-4 rounded ${
            isLoading || !publicKey
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-500 hover:bg-red-700 text-white"
          }`}
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
              <p>Burning...</p>
            </span>
          ) : (
            "Burn Tokens"
          )}
        </button>
      </div>
      {status && <p className="mt-4 text-green-500">{status}</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
}
