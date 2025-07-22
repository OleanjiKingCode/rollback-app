import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { Address, isAddress } from "viem";
import { useTokenInfo } from "./useTokenInfo";

export interface TokenValidationResult {
  isValid: boolean;
  isLoading: boolean;
  tokenType: "ERC20" | "ERC721" | null;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  totalSupply: string | null;
  error: string | null;
  contractExists: boolean;
}

export function useTokenValidation(
  tokenAddress: string,
  expectedType?: "ERC20" | "ERC721"
) {
  const publicClient = usePublicClient();
  const { fetchTokenInfo } = useTokenInfo();
  const [result, setResult] = useState<TokenValidationResult>({
    isValid: false,
    isLoading: false,
    tokenType: null,
    name: null,
    symbol: null,
    decimals: null,
    totalSupply: null,
    error: null,
    contractExists: false,
  });

  const validateToken = useCallback(
    async (address: string) => {
      if (!address || !isAddress(address) || !publicClient) {
        setResult({
          isValid: false,
          isLoading: false,
          tokenType: null,
          name: null,
          symbol: null,
          decimals: null,
          totalSupply: null,
          error: !address ? null : "Invalid address format",
          contractExists: false,
        });
        return;
      }

      setResult((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Check if contract exists by getting bytecode
        const bytecode = await publicClient.getCode({
          address: address as Address,
        });

        if (!bytecode || bytecode === "0x") {
          setResult({
            isValid: false,
            isLoading: false,
            tokenType: null,
            name: null,
            symbol: null,
            decimals: null,
            totalSupply: null,
            error: "No contract found at this address",
            contractExists: false,
          });
          return;
        }

        // Try both token types if not specified, or the specified type first
        const typesToTry = expectedType ? [expectedType] : ["ERC20", "ERC721"];
        let tokenInfo: any = null;
        let detectedType: "ERC20" | "ERC721" | null = null;

        for (const type of typesToTry) {
          try {
            const info = await fetchTokenInfo(address, type);
            if (info && (info.name || info.symbol)) {
              tokenInfo = info;
              detectedType = info.type as "ERC20" | "ERC721";
              break;
            }
          } catch (error) {
            // Try next type
            continue;
          }
        }

        if (!tokenInfo || !detectedType) {
          setResult({
            isValid: false,
            isLoading: false,
            tokenType: null,
            name: null,
            symbol: null,
            decimals: null,
            totalSupply: null,
            error: "Contract is not a recognized ERC20 or ERC721 token",
            contractExists: true,
          });
          return;
        }

        // Check if detected type matches expected type
        if (expectedType && detectedType !== expectedType) {
          setResult({
            isValid: false,
            isLoading: false,
            tokenType: detectedType,
            name: tokenInfo.name || null,
            symbol: tokenInfo.symbol || null,
            decimals: tokenInfo.decimals || null,
            totalSupply: null,
            error: `Expected ${expectedType} token but found ${detectedType} token`,
            contractExists: true,
          });
          return;
        }

        const isValid = !!(tokenInfo.name || tokenInfo.symbol);

        setResult({
          isValid,
          isLoading: false,
          tokenType: detectedType,
          name: tokenInfo.name || null,
          symbol: tokenInfo.symbol || null,
          decimals: tokenInfo.decimals || null,
          totalSupply: null, // We don't fetch totalSupply in the basic fetchTokenInfo
          error: null,
          contractExists: true,
        });
      } catch (error: any) {
        setResult({
          isValid: false,
          isLoading: false,
          tokenType: null,
          name: null,
          symbol: null,
          decimals: null,
          totalSupply: null,
          error: error?.message || "Failed to validate token contract",
          contractExists: true,
        });
      }
    },
    [publicClient, fetchTokenInfo, expectedType]
  );

  // Debounce validation to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      validateToken(tokenAddress);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [tokenAddress, validateToken]);

  const retry = useCallback(() => {
    validateToken(tokenAddress);
  }, [tokenAddress, validateToken]);

  return {
    ...result,
    retry,
  };
}
