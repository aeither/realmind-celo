import { RedisService } from './redis.js'

export interface TokenHolder {
  address: string
  balance: string
}

export interface LeaderboardResponse {
  success: boolean
  holders?: TokenHolder[]
  error?: string
  totalHolders?: number
}

export interface ChainConfig {
  chainId: number
  chainName: string
  blockscoutApiUrl: string
  scanUrl: string
}

// Blockscout API response interfaces
interface BlockscoutAddress {
  ens_domain_name: string | null
  hash: string
  implementations: any[]
  is_contract: boolean
  is_scam: boolean
  is_verified: boolean
  metadata: any
  name: string | null
  private_tags: any[]
  proxy_type: string | null
  public_tags: any[]
  watchlist_names: any[]
}

interface BlockscoutTokenHolder {
  address: BlockscoutAddress
  token_id: string | null
  value: string
}

interface BlockscoutResponse {
  items: BlockscoutTokenHolder[]
  next_page_params: any | null
}

export class LeaderboardService {
  private redisService: RedisService
  
  // Supported chains configuration with Blockscout APIs
  private chains: { [chainId: number]: ChainConfig } = {
    8453: { // Base
      chainId: 8453,
      chainName: 'Base',
      blockscoutApiUrl: 'https://base.blockscout.com/api/v2',
      scanUrl: 'https://basescan.org'
    },
    42220: { // Celo
      chainId: 42220,
      chainName: 'Celo',
      blockscoutApiUrl: 'https://celo.blockscout.com/api/v2',
      scanUrl: 'https://celoscan.io'
    }
  }

  constructor() {
    this.redisService = new RedisService()
  }

  /**
   * Get token holders for a specific contract and chain using Blockscout API with pagination
   */
  async getTokenHolders(
    contractAddress: string, 
    chainId: number,
    limit: number = 1000
  ): Promise<LeaderboardResponse> {
    try {
      const chainConfig = this.chains[chainId]
      if (!chainConfig) {
        return {
          success: false,
          error: `Unsupported chain ID: ${chainId}. Supported chains: ${Object.keys(this.chains).join(', ')}`
        }
      }

      // Check Redis cache first (cache for 5 minutes)
      const cacheKey = `leaderboard:blockscout:${chainId}:${contractAddress}:${limit}`
      let cachedResult = null
      try {
        // Use the redis client directly for general get/set operations
        const redisClient = (this.redisService as any).redis
        if (redisClient) {
          cachedResult = await redisClient.get(cacheKey)
        }
      } catch (error) {
        console.log('Cache lookup failed, proceeding with fresh request')
      }
      
      if (cachedResult) {
        console.log(`📋 Returning cached leaderboard for ${chainConfig.chainName}`)
        return typeof cachedResult === 'string' ? JSON.parse(cachedResult) : cachedResult
      }

      console.log(`🔍 Fetching up to ${limit} token holders from ${chainConfig.chainName} Blockscout for contract: ${contractAddress}`)
      
      // Fetch all pages until we reach the limit or no more data
      const allHolders: TokenHolder[] = []
      let nextPageParams: any = null
      let pageCount = 0
      const maxPages = Math.ceil(limit / 50) // Blockscout returns max 50 per page

      do {
        pageCount++
        
        // Build API URL with pagination params
        let apiUrl = `${chainConfig.blockscoutApiUrl}/tokens/${contractAddress}/holders`
        if (nextPageParams) {
          const params = new URLSearchParams()
          Object.entries(nextPageParams).forEach(([key, value]) => {
            params.append(key, String(value))
          })
          apiUrl += `?${params.toString()}`
        }

        console.log(`📡 Fetching page ${pageCount}/${maxPages}: ${apiUrl}`)
        
        const response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Realmind-Leaderboard/1.0'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Blockscout API request failed: ${response.status} ${response.statusText}`)
        }

        const data: BlockscoutResponse = await response.json()

        if (!data.items || !Array.isArray(data.items)) {
          console.log('No more items or invalid response format')
          break
        }

        // Add holders from this page
        const pageHolders: TokenHolder[] = data.items.map((item) => ({
          address: item.address.hash,
          balance: item.value
        }))

        allHolders.push(...pageHolders)
        console.log(`📄 Page ${pageCount}: Added ${pageHolders.length} holders (total: ${allHolders.length})`)

        // Check if we've reached our limit
        if (allHolders.length >= limit) {
          console.log(`🎯 Reached limit of ${limit} holders`)
          break
        }

        // Set up for next page
        nextPageParams = data.next_page_params
        
        // Safety check to prevent infinite loops
        if (pageCount >= maxPages) {
          console.log(`⚠️ Reached max pages (${maxPages}), stopping pagination`)
          break
        }

      } while (nextPageParams && Object.keys(nextPageParams).length > 0)

      // Limit the final result
      const holders = allHolders.slice(0, limit)

      const result: LeaderboardResponse = {
        success: true,
        holders,
        totalHolders: holders.length
      }

      // Cache the result for 5 minutes
      try {
        const redisClient = (this.redisService as any).redis
        if (redisClient) {
          await redisClient.set(cacheKey, JSON.stringify(result))
          await redisClient.expire(cacheKey, 300) // 5 minutes
        }
      } catch (error) {
        console.log('Failed to cache result, continuing without cache')
      }

      console.log(`✅ Fetched ${holders.length} token holders from ${chainConfig.chainName} Blockscout across ${pageCount} pages`)
      return result

    } catch (error) {
      console.error('Error fetching token holders from Blockscout:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get leaderboard - simplified to just call getTokenHolders directly
   */
  async getLeaderboard(
    contractAddress: string,
    chainId: number,
    limit: number = 1000
  ): Promise<LeaderboardResponse> {
    // With Blockscout API, we can get holders directly sorted by balance
    return this.getTokenHolders(contractAddress, chainId, limit)
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): ChainConfig[] {
    return Object.values(this.chains)
  }

  /**
   * Get chain configuration by ID
   */
  getChainConfig(chainId: number): ChainConfig | null {
    return this.chains[chainId] || null
  }

  /**
   * Get scan URL for a token contract on a specific chain
   */
  getScanUrl(contractAddress: string, chainId: number): string | null {
    const chainConfig = this.chains[chainId]
    if (!chainConfig) {
      return null
    }
    // For Blockscout, use the blockscout URL format
    if (chainConfig.blockscoutApiUrl.includes('blockscout')) {
      const baseUrl = chainConfig.blockscoutApiUrl.replace('/api/v2', '')
      return `${baseUrl}/token/${contractAddress}?tab=holders`
    }
    // Fallback to traditional scan URL
    return `${chainConfig.scanUrl}/token/${contractAddress}#balances`
  }
}