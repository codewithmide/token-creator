'use client';

import React, { useState } from 'react';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, burn } from '@solana/spl-token';

export default function BurnToken() {
  const [tokenAddress, setTokenAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBurnToken = async () => {
    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const mintPublicKey = new PublicKey(tokenAddress);
      const ownerPublicKey = new PublicKey(ownerAddress);

      const ownerKeypair = Keypair.generate();

      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        ownerKeypair,
        mintPublicKey,
        ownerPublicKey
      );

      await burn(
        connection,
        ownerKeypair,
        tokenAccount.address,
        mintPublicKey,
        ownerPublicKey,
        BigInt(parseFloat(amount) * Math.pow(10, 9)) // Assuming 9 decimals
      );

      setStatus('Tokens burned successfully!');
      setError(null);
    } catch (err) {
      setError('Failed to burn tokens: ' + (err as Error).message);
      setStatus(null);
    }
  };

  return (
    <div className='center flex-col mt-20'>
      <h1 className="text-2xl max-w-md font-bold mb-4">Burn Token</h1>
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
          placeholder="Amount to Burn"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <button
          onClick={handleBurnToken}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Burn Tokens
        </button>
      </div>
      {status && <p className="mt-4 text-green-500">{status}</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
}