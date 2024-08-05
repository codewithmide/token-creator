'use client';

import React, { useState } from 'react';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, transfer } from '@solana/spl-token';

export default function TransferToken() {
  const [tokenAddress, setTokenAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTransferToken = async () => {
    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const mintPublicKey = new PublicKey(tokenAddress);
      const fromPublicKey = new PublicKey(fromAddress);
      const toPublicKey = new PublicKey(toAddress);

      const senderKeypair = Keypair.generate();

      const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        senderKeypair,
        mintPublicKey,
        fromPublicKey
      );

      const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        senderKeypair,
        mintPublicKey,
        toPublicKey
      );

      await transfer(
        connection,
        senderKeypair,
        fromTokenAccount.address,
        toTokenAccount.address,
        fromPublicKey,
        BigInt(parseFloat(amount) * Math.pow(10, 9)) // Assuming 9 decimals
      );

      setStatus('Tokens transferred successfully!');
      setError(null);
    } catch (err) {
      setError('Failed to transfer tokens: ' + (err as Error).message);
      setStatus(null);
    }
  };

  return (
    <div className='center flex-col mt-20'>
      <h1 className="text-2xl text-left font-bold mb-4">Transfer Token</h1>
      <div className="space-y-4 max-w-md ">
        <input
          type="text"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="To Address"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <button
          onClick={handleTransferToken}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Transfer Tokens
        </button>
      </div>
      {status && <p className="mt-4 text-green-500">{status}</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
}