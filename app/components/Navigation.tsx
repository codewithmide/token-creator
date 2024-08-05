'use client';

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const Navigation = () => {
  return (
    <nav className="bg-gray-800 py-4 px-10 flex justify-between items-center">
      <ul className="flex space-x-6">
        <li>
          <Link href="/" className="text-white hover:text-gray-300">
            Home
          </Link>
        </li>
        <li>
          <Link href="/create" className="text-white hover:text-gray-300">
            Create Token
          </Link>
        </li>
        <li>
          <Link href="/mint" className="text-white hover:text-gray-300">
            Mint Token
          </Link>
        </li>
        <li>
          <Link href="/transfer" className="text-white hover:text-gray-300">
            Transfer Token
          </Link>
        </li>
        <li>
          <Link href="/burn" className="text-white hover:text-gray-300">
            Burn Token
          </Link>
        </li>
        <li>
          <Link href="/delegate" className="text-white hover:text-gray-300">
            Delegate Token
          </Link>
        </li>
      </ul>
      <WalletMultiButton />
    </nav>
  );
};

export default Navigation;