'use client';

import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction } from '@solana/spl-token';

export default function TransferToken() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [tokenAddress, setTokenAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTransferToken = async () => {
    if (!publicKey) {
      setError('Please connect your wallet.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setStatus(null);

      const mintPublicKey = new PublicKey(tokenAddress);
      const toPublicKey = new PublicKey(toAddress);

      const fromTokenAddress = await getAssociatedTokenAddress(mintPublicKey, publicKey);
      const toTokenAddress = await getAssociatedTokenAddress(mintPublicKey, toPublicKey);

      const transaction = new Transaction();

      const toTokenAccount = await connection.getAccountInfo(toTokenAddress);
      
      if (!toTokenAccount) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            toTokenAddress,
            toPublicKey,
            mintPublicKey
          )
        );
      }

      transaction.add(
        createTransferInstruction(
          fromTokenAddress,
          toTokenAddress,
          publicKey,
          BigInt(parseFloat(amount) * Math.pow(10, 9)),
          []
        )
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      setStatus('Tokens transferred successfully!');
      setTokenAddress('');
      setAmount('');
      setToAddress('');
    } catch (err) {
      setError('Failed to transfer tokens: ' + (err instanceof Error ? err.message : String(err)));
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="center flex-col mx-auto mt-20">
      <h1 className="text-2xl max-w-md font-bold mb-4">Transfer Token</h1>
      <div className="space-y-4 max-w-md">
        <input
          type="text"
          placeholder="Token Mint Address"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          className="w-full p-2 border rounded text-black"
        />
        <input
          type="text"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border rounded text-black"
        />
        <input
          type="text"
          placeholder="Recipient Address"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          className="w-full p-2 border rounded text-black"
        />
        <button
          onClick={handleTransferToken}
          disabled={isLoading || !publicKey}
          className={`w-full font-bold py-2 px-4 rounded ${
            isLoading || !publicKey ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? 'Transferring...' : 'Transfer Tokens'}
        </button>
        {status && <p className="mt-4 text-green-500">{status}</p>}
        {error && <p className="mt-4 text-red-500">{error}</p>}
      </div>
    </div>
  );
}