"use client";

import React, { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Metaplex } from "@metaplex-foundation/js";

interface Token {
  address: string;
  name: string;
  symbol: string;
  amount: number;
  image?: string;
}

export default function MintToken() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [tokenMintAddress, setTokenMintAddress] = useState("");
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleValidateToken = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const mintAddress = new PublicKey(tokenMintAddress);
      const metaplex = new Metaplex(connection);

      const tokenMetadata = await metaplex.nfts().findByMint({ mintAddress });

      const token: Token = {
        address: mintAddress.toBase58(),
        name: tokenMetadata.name,
        symbol: tokenMetadata.symbol,
        amount: 0,
        image: tokenMetadata.json?.image,
      };

      setSelectedToken(token);
      setStatus("Token validated successfully!");
    } catch (err) {
      console.error("Error validating token:", err);
      setError("Failed to validate token: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMintToken = async () => {
    if (!publicKey || !selectedToken) return;

    setIsLoading(true);
    setError(null);
    setStatus(null);

    try {
      const mintPublicKey = new PublicKey(selectedToken.address);
      const recipientPublicKey = new PublicKey(recipientAddress);

      const associatedTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        recipientPublicKey
      );

      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          publicKey,
          associatedTokenAccount,
          recipientPublicKey,
          mintPublicKey
        ),
        createMintToInstruction(
          mintPublicKey,
          associatedTokenAccount,
          publicKey,
          BigInt(parseFloat(amount) * Math.pow(10, 9))
        )
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      setStatus("Tokens minted successfully!");
      setSelectedToken(null);
      setAmount("");
      setRecipientAddress("");
    } catch (err) {
      setError("Failed to mint tokens: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Mint Token</h1>
        <p>Please connect your wallet to mint tokens.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-4">Mint Token</h1>
      <input
        type="text"
        placeholder="Enter token mint address"
        value={tokenMintAddress}
        onChange={(e) => setTokenMintAddress(e.target.value)}
        className="w-full p-2 border rounded mb-4 text-black"
      />
      <button
        onClick={handleValidateToken}
        disabled={isLoading}
        className={`w-full font-bold py-2 px-4 rounded ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-700 text-white"
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
            <p>Validating...</p>
          </span>
        ) : (
          "Initialize"
        )}
      </button>
      {status && <p className="mt-4 text-green-500">{status}</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}

      {selectedToken && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Mint {selectedToken.name}</h2>
          <input
            type="text"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded mb-4 text-black"
          />
          <input
            type="text"
            placeholder="Recipient Address"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="w-full p-2 border rounded mb-4 text-black"
          />
          <button
            onClick={handleMintToken}
            disabled={isLoading}
            className={`w-full font-bold py-2 px-4 rounded ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-700 text-white"
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
                <p>Minting...</p>
              </span>
            ) : (
              "Mint Tokens"
            )}
          </button>
          {status && <p className="mt-4 text-green-500">{status}</p>}
          {error && <p className="mt-4 text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}
