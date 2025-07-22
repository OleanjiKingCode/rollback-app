import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Blockchain explorer utilities
const EXPLORER_URLS: Record<number, { baseUrl: string; name: string }> = {
  // Mainnets
  1: { baseUrl: "https://etherscan.io", name: "Etherscan" }, 
  8453: { baseUrl: "https://basescan.org", name: "BaseScan" }, // Base
  137: { baseUrl: "https://polygonscan.com", name: "PolygonScan" }, // Polygon
  42161: { baseUrl: "https://arbiscan.io", name: "Arbiscan" }, // Arbitrum
  56: { baseUrl: "https://bscscan.com", name: "BscScan" }, // BSC

  // Testnets
  11155111: {
    baseUrl: "https://sepolia.etherscan.io",
    name: "Sepolia Etherscan",
  }, // Sepolia
  84532: { baseUrl: "https://sepolia.basescan.org", name: "Base Sepolia" }, // Base Sepolia
  80001: {
    baseUrl: "https://mumbai.polygonscan.com",
    name: "Mumbai PolygonScan",
  }, // Polygon Mumbai
  421614: { baseUrl: "https://sepolia.arbiscan.io", name: "Arbitrum Sepolia" }, // Arbitrum Sepolia
  97: { baseUrl: "https://testnet.bscscan.com", name: "BSC Testnet" }, // BSC Testnet
};

/**
 * Get the blockchain explorer URL for a given chain and address/transaction
 */
export function getExplorerUrl(
  chainId: number,
  address: string,
  type: "address" | "token" | "tx" = "address"
): string {
  const explorer = EXPLORER_URLS[chainId];

  if (!explorer) {
    // Fallback to a generic explorer or the most common one
    console.warn(
      `No explorer configured for chain ${chainId}, falling back to Etherscan`
    );
    return `https://etherscan.io/${type}/${address}`;
  }

  return `${explorer.baseUrl}/${type}/${address}`;
}

/**
 * Get the explorer name for a given chain
 */
export function getExplorerName(chainId: number): string {
  return EXPLORER_URLS[chainId]?.name || "Block Explorer";
}
