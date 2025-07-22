import { useCallback } from "react";
import { usePublicClient } from "wagmi";
import { Address } from "viem";
import { ERC20_ABI, ERC721_ABI } from "@/config/contracts";

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  type: "ERC20" | "ERC721";
}

export function useTokenInfo() {
  const publicClient = usePublicClient();

  const fetchTokenInfo = useCallback(
    async (
      tokenAddress: string,
      tokenType: string
    ): Promise<Partial<TokenInfo>> => {
      if (!publicClient) return {};

      try {
        if (tokenType === "ERC20") {
          const [symbol, name, decimals] = await Promise.all([
            publicClient.readContract({
              address: tokenAddress as `0x${string}`,
              abi: ERC20_ABI,
              functionName: "symbol",
            }),
            publicClient.readContract({
              address: tokenAddress as `0x${string}`,
              abi: ERC20_ABI,
              functionName: "name",
            }),
            publicClient.readContract({
              address: tokenAddress as `0x${string}`,
              abi: ERC20_ABI,
              functionName: "decimals",
            }),
          ]);

          return {
            symbol: symbol as string,
            name: name as string,
            decimals: decimals as number,
            type: "ERC20" as const,
          };
        } else if (tokenType === "ERC721") {
          const [symbol, name] = await Promise.all([
            publicClient.readContract({
              address: tokenAddress as `0x${string}`,
              abi: ERC721_ABI,
              functionName: "symbol",
            }),
            publicClient.readContract({
              address: tokenAddress as `0x${string}`,
              abi: ERC721_ABI,
              functionName: "name",
            }),
          ]);

          return {
            symbol: symbol as string,
            name: name as string,
            decimals: 0,
            type: "ERC721" as const,
          };
        }
      } catch (err) {
        console.error(`Error fetching token info for ${tokenAddress}:`, err);
        return {
          symbol: "UNKNOWN",
          name: "Unknown Token",
          decimals: 18,
          type: tokenType as "ERC20" | "ERC721",
        };
      }

      return {};
    },
    [publicClient]
  );

  return {
    fetchTokenInfo,
  };
}
