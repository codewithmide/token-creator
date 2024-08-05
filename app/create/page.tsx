'use client';

import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey, 
  Transaction, 
  SystemProgram, 
  Keypair,
} from '@solana/web3.js';
import { 
  createInitializeMintInstruction, 
  TOKEN_PROGRAM_ID, 
  MINT_SIZE 
} from '@solana/spl-token';
import { createCreateMetadataAccountV3Instruction } from "@metaplex-foundation/mpl-token-metadata";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

export default function CreateToken() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [mintAddress, setMintAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [uri, setUri] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateToken = async () => {
    if (!publicKey) {
      setError('Please connect your wallet');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const mintKeypair = Keypair.generate();
      const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

      const createMintAccountInstruction = SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      });

      const initializeMintInstruction = createInitializeMintInstruction(
        mintKeypair.publicKey,
        9,
        publicKey,
        publicKey,
      );

      // Create metadata
      const metadataData = {
        name,
        symbol,
        uri,
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
      };

      const [metadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
        {
          metadata: metadataPDA,
          mint: mintKeypair.publicKey,
          mintAuthority: publicKey,
          payer: publicKey,
          updateAuthority: publicKey,
        },
        {
          createMetadataAccountArgsV3: {
            data: metadataData,
            isMutable: true,
            collectionDetails: null,
          },
        }
      );

      const transaction = new Transaction().add(
        createMintAccountInstruction,
        initializeMintInstruction,
        createMetadataInstruction
      );

      const signature = await sendTransaction(transaction, connection, {
        signers: [mintKeypair],
      });
      await connection.confirmTransaction(signature, 'confirmed');

      setMintAddress(mintKeypair.publicKey.toBase58());
    } catch (err) {
      setError('Failed to create token: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Create Token</h1>
        <p>Please connect your wallet to create a token.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-4">Create Token</h1>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Token Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded text-black"
        />
        <input
          type="text"
          placeholder="Token Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full p-2 border rounded text-black"
        />
        <input
          type="text"
          placeholder="Metadata URI"
          value={uri}
          onChange={(e) => setUri(e.target.value)}
          className="w-full p-2 border rounded text-black"
        />
        <button
          onClick={handleCreateToken}
          disabled={isLoading}
          className={`w-full font-bold py-2 px-4 rounded ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
          ) : (
            'Create New Token'
          )}
        </button>
      </div>
      {mintAddress && (
        <p className="mt-4">
          Token created successfully! Mint address: {mintAddress}
        </p>
      )}
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
}