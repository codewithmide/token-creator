import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import WalletContextProvider from "./provider/walletContextProvider";
import Navigation from "./components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Token Creator",
  description: "Create, Mint, Transfer, Burn and Delegate a Devnet token",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletContextProvider>
          <Navigation />
          <main>{children}</main>
        </WalletContextProvider>
      </body>
    </html>
  );
}