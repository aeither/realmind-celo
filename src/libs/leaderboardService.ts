// Frontend service for leaderboard functionality

export interface TokenHolder {
  address: string;
  balance: string;
}

export interface LeaderboardResponse {
  success: boolean;
  holders?: TokenHolder[];
  error?: string;
  totalHolders?: number;
}

export interface ChainConfig {
  chainId: number;
  chainName: string;
  apiUrl: string;
  scanUrl: string;
}

export class LeaderboardService {
  private backendUrl: string;

  constructor() {
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  }

  /**
   * Get leaderboard data for a specific contract and chain
   */
  async getLeaderboard(
    contractAddress: string,
    chainId: number,
    limit: number = 1000
  ): Promise<LeaderboardResponse> {
    try {
      const response = await fetch(
        `${this.backendUrl}/leaderboard?contract=${contractAddress}&chainId=${chainId}&limit=${limit}`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use the text as error message
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error('Empty response from server');
      }
      
      const data = JSON.parse(responseText);
      return data;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch leaderboard'
      };
    }
  }

  /**
   * Get supported chains from backend
   */
  async getSupportedChains(): Promise<{ success: boolean; chains?: ChainConfig[]; error?: string }> {
    try {
      const response = await fetch(`${this.backendUrl}/leaderboard/chains`);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error('Empty response from server');
      }
      
      const data = JSON.parse(responseText);
      return data;
    } catch (error) {
      console.error('Error fetching supported chains:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch supported chains'
      };
    }
  }

  /**
   * Get scan URL for a contract on a specific chain
   */
  async getScanUrl(
    contractAddress: string,
    chainId: number
  ): Promise<{ success: boolean; scanUrl?: string; error?: string }> {
    try {
      const response = await fetch(
        `${this.backendUrl}/leaderboard/scan-url?contract=${contractAddress}&chainId=${chainId}`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error('Empty response from server');
      }
      
      const data = JSON.parse(responseText);
      return data;
    } catch (error) {
      console.error('Error fetching scan URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get scan URL'
      };
    }
  }

  /**
   * Format balance for display (remove decimals, add thousand separators)
   * Handles BigInt values from Blockscout API
   */
  formatBalance(balance: string, decimals: number = 18): string {
    try {
      if (!balance || balance === '0') return '0';
      
      // Handle BigInt values safely
      const balanceBigInt = BigInt(balance);
      if (balanceBigInt === 0n) return '0';
      
      // Convert from wei to tokens using BigInt math for precision
      const divisor = BigInt(10 ** decimals);
      const tokenAmount = balanceBigInt / divisor;
      
      // For very large numbers, use scientific notation threshold
      if (tokenAmount > BigInt(1000000)) {
        const tokenNum = Number(tokenAmount);
        if (tokenNum >= 1000000) {
          return (tokenNum / 1000000).toFixed(1) + 'M';
        }
        if (tokenNum >= 1000) {
          return (tokenNum / 1000).toFixed(1) + 'K';
        }
      }
      
      // Format with thousand separators
      return tokenAmount.toLocaleString('en-US');
    } catch (error) {
      console.warn('Error formatting balance:', error);
      // Fallback for smaller numbers
      try {
        const num = parseFloat(balance);
        if (num === 0) return '0';
        return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
      } catch {
        return balance;
      }
    }
  }

  /**
   * Truncate address for display
   */
  truncateAddress(address: string, startLength: number = 6, endLength: number = 4): string {
    if (address.length <= startLength + endLength) {
      return address;
    }
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
  }
}

// Create singleton instance
export const leaderboardService = new LeaderboardService();