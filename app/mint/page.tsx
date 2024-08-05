'use client';

import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, ParsedAccountData } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createMintToInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Metaplex } from '@metaplex-foundation/js';

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

  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (publicKey) {
      fetchTokens();
    }
  }, [publicKey, connection]);

  const fetchTokens = async () => {
    if (!publicKey) return;

    setIsLoading(true);
    setError(null);

    try {
      const metaplex = new Metaplex(connection);
      
      // Fetch all token accounts owned by the wallet
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID
      });

      const fetchedTokens = await Promise.all(
        tokenAccounts.value.map(async (tokenAccount) => {
          const accountData = tokenAccount.account.data.parsed.info;
          const mintAddress = new PublicKey(accountData.mint);
          const amount = accountData.tokenAmount.uiAmount;

          try {
            const tokenMetadata = await metaplex.nfts().findByMint({ mintAddress });

            return {
              address: mintAddress.toBase58(),
              name: tokenMetadata.name,
              symbol: tokenMetadata.symbol,
              amount: amount,
              image: tokenMetadata.json?.image,
            };
          } catch (error) {
            console.error(`Error fetching metadata for token ${mintAddress.toBase58()}:`, error);
            // Return a basic token object if metadata fetch fails
            return {
              address: mintAddress.toBase58(),
              name: `Unknown Token (${mintAddress.toBase58().slice(0, 4)}...)`,
              symbol: 'UNKNOWN',
              amount: amount,
            };
          }
        })
      );

      console.log("Fetched tokens:", fetchedTokens);
      setTokens(fetchedTokens);
    } catch (err) {
      console.error('Error fetching tokens:', err);
      setError('Failed to fetch tokens: ' + (err as Error).message);
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
      await connection.confirmTransaction(signature, 'confirmed');

      setStatus('Tokens minted successfully!');
      setIsModalOpen(false);
      fetchTokens(); // Refresh the token list
    } catch (err) {
      setError('Failed to mint tokens: ' + (err as Error).message);
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
      {isLoading && !tokens.length ? (
        <p>Loading tokens...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokens.map((token) => (
            <div
              key={token.address}
              className="bg-white p-4 rounded shadow cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setSelectedToken(token);
                setIsModalOpen(true);
              }}
            >
              {token.image && <img src={token.image} alt={token.name} className="w-full h-32 object-cover mb-2" />}
              <h2 className="text-xl font-semibold">{token.name}</h2>
              <p>{token.symbol}</p>
              <p className="text-sm text-gray-500 truncate">{token.address}</p>
              <p>Balance: {token.amount}</p>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && selectedToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Mint {selectedToken.name}</h2>
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
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-700 text-white'
              }`}
            >
              {isLoading ? 'Minting...' : 'Mint Tokens'}
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full mt-2 bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded"
            >
              Cancel
            </button>
            {status && <p className="mt-4 text-green-500">{status}</p>}
            {error && <p className="mt-4 text-red-500">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}