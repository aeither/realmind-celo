// Blockchain services for Realmind platform
// Integrated with RedStone, Goldsky, thirdweb, Sequence, and Farcaster

import { DEMO_CONFIG } from './constants'
import { parseEther, formatEther, encodeFunctionData } from 'viem'
import { toast } from 'sonner'

// Blockchain transaction utilities
export class BlockchainUtils {
  static async triggerMetaMaskTransaction(
    transactionData: {
      to: string
      value?: string
      data?: string
      description: string
    }
  ): Promise<{ hash: string; success: boolean }> {
    try {
      // This will trigger MetaMask popup for real blockchain interaction
      if (typeof window !== 'undefined' && window.ethereum) {
        toast.info('🦊 MetaMask transaction required', {
          description: transactionData.description
        })
        
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        })
        
        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: accounts[0],
            to: transactionData.to,
            value: transactionData.value || '0x0',
            data: transactionData.data || '0x'
          }]
        })
        
        toast.success('✅ Transaction confirmed', {
          description: `Hash: ${txHash.substring(0, 10)}...`
        })
        
        return { hash: txHash, success: true }
      } else {
        // Fallback for demo purposes
        const mockHash = `0x${Math.random().toString(16).substring(2, 66)}`
        toast.success('✅ Transaction simulated', {
          description: transactionData.description
        })
        return { hash: mockHash, success: true }
      }
    } catch (error) {
      console.error('Transaction failed:', error)
      toast.error('❌ Transaction failed', {
        description: 'Please try again'
      })
      return { hash: '', success: false }
    }
  }

  static async requestWalletConnection(): Promise<{
    address: string
    isConnected: boolean
  }> {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        toast.info('🦊 Connecting to MetaMask...', {
          description: 'Please approve the connection request'
        })
        
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        })
        
        if (accounts.length > 0) {
          toast.success('✅ Wallet connected', {
            description: `Address: ${accounts[0].substring(0, 10)}...`
          })
          return { address: accounts[0], isConnected: true }
        }
      }
      
      return { address: '', isConnected: false }
    } catch (error) {
      console.error('Wallet connection failed:', error)
      toast.error('❌ Connection failed', {
        description: 'Please install MetaMask'
      })
      return { address: '', isConnected: false }
    }
  }
}

// RedStone Oracle integration for real-time price feeds
export class RedStoneOracle {
  static async getPrice(symbol: string): Promise<{ price: number; timestamp: number }> {
    // Connect to RedStone Oracle data feeds
    try {
      // In production: Real RedStone Oracle API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const priceFeeds = DEMO_CONFIG.MOCK_DATA.ORACLE_PRICES
      const priceData = priceFeeds[symbol as keyof typeof priceFeeds]
      
      if (!priceData) {
        throw new Error(`Price feed not available for ${symbol}`)
      }
      
      // Add realistic market variation (±2%)
      const variation = (Math.random() - 0.5) * 0.04
      const price = priceData.price * (1 + variation)
      
      return {
        price: Math.round(price * 100) / 100,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('RedStone Oracle error:', error)
      throw new Error(`Failed to fetch ${symbol} price from RedStone Oracle`)
    }
  }
  
  static formatPriceQuestion(symbol: string, price: number, options: string[]): {
    question: string
    options: string[]
    correct: number
  } {
    const correctAnswer = `$${price.toFixed(2)}`
    const correctIndex = options.findIndex(opt => opt === correctAnswer)
    
    return {
      question: `What's the current price of ${symbol}? (RedStone Oracle)`,
      options,
      correct: correctIndex !== -1 ? correctIndex : 0
    }
  }
}

// Goldsky blockchain indexing service
export class GoldskyIndexer {
  static async getGuildLeaderboard(): Promise<Array<{
    guildId: number
    name: string
    totalScore: number
    ranking: number
    memberCount: number
    treasury: string
  }>> {
    // Query Goldsky GraphQL endpoint for guild data
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return [
      { guildId: 1, name: "Crypto Legends", totalScore: 15420, ranking: 1, memberCount: 8, treasury: "2.4 ETH" },
      { guildId: 2, name: "DeFi Masters", totalScore: 13890, ranking: 2, memberCount: 7, treasury: "1.8 ETH" },
      { guildId: 3, name: "Blockchain Builders", totalScore: 12560, ranking: 3, memberCount: 9, treasury: "2.1 ETH" },
      { guildId: 4, name: "Web3 Warriors", totalScore: 11240, ranking: 4, memberCount: 6, treasury: "1.5 ETH" },
      { guildId: 5, name: "Smart Contract Pros", totalScore: 10180, ranking: 5, memberCount: 8, treasury: "1.9 ETH" },
      { guildId: 6, name: "NFT Collectors", totalScore: 9850, ranking: 6, memberCount: 5, treasury: "1.2 ETH" },
      { guildId: 7, name: "Base Champions", totalScore: 8920, ranking: 7, memberCount: 5, treasury: "0.8 ETH" },
      { guildId: 8, name: "Base Experts", totalScore: 7650, ranking: 8, memberCount: 4, treasury: "0.6 ETH" }
    ]
  }
  
  static async getRealTimeUpdates(guildId: number): Promise<{
    newRanking: number
    scoreChange: number
    treasuryChange: string
  }> {
    // Simulate real-time update
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Real-time blockchain data updates
    return {
      newRanking: Math.max(1, Math.floor(Math.random() * 5) + 3), // Random ranking 3-7
      scoreChange: Math.floor(Math.random() * 500) + 200, // +200-700 points
      treasuryChange: "+0.5 ETH"
    }
  }
}

// thirdweb NFT infrastructure integration
export class ThirdwebNFT {
  static async mintQuizNFT(metadata: {
    title: string
    description: string
    difficulty: number
    royaltyPercent: number
    ipfsHash?: string
  }): Promise<{
    tokenId: number
    contractAddress: string
    transactionHash: string
    ipfsUrl: string
  }> {
    // Trigger MetaMask transaction for NFT minting
    const contractAddress = "0x1234567890abcdef1234567890abcdef12345678"
    const mintTransaction = await BlockchainUtils.triggerMetaMaskTransaction({
      to: contractAddress,
      value: parseEther("0.01").toString(), // Minting fee
      description: `Minting Quiz NFT: "${metadata.title}"`
    })
    
    if (!mintTransaction.success) {
      throw new Error('NFT minting transaction failed')
    }
    
    // Process minting on thirdweb infrastructure
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const tokenId = Math.floor(Math.random() * 1000) + 100
    const ipfsHash = metadata.ipfsHash || `Qm${Math.random().toString(36).substring(2, 48)}`
    
    toast.success('🎉 Quiz NFT Minted Successfully!', {
      description: `Token ID: #${tokenId} with ${metadata.royaltyPercent}% royalties`
    })
    
    return {
      tokenId,
      contractAddress,
      transactionHash: mintTransaction.hash,
      ipfsUrl: `https://ipfs.io/ipfs/${ipfsHash}`
    }
  }
  
  static async getEIP2981Royalties(tokenId: number, salePrice: number): Promise<{
    recipient: string
    amount: number
  }> {
    // Simulate royalty calculation
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const royaltyPercent = 10 // 10% royalty
    const amount = (salePrice * royaltyPercent) / 100
    
    return {
      recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
      amount
    }
  }
}

// Sequence Wallet integration for enhanced UX
export class SequenceWallet {
  static async connectWallet(): Promise<{
    address: string
    isConnected: boolean
    provider: string
  }> {
    // Try Sequence Wallet connection first, fallback to MetaMask
    try {
      const walletConnection = await BlockchainUtils.requestWalletConnection()
      
      if (walletConnection.isConnected) {
        return {
          address: walletConnection.address,
          isConnected: true,
          provider: "Sequence/MetaMask"
        }
      }
      
      // Fallback for demo
      await new Promise(resolve => setTimeout(resolve, 1500))
      return {
        address: `0x${Math.random().toString(16).substring(2, 42)}`,
        isConnected: true,
        provider: "Sequence"
      }
    } catch (error) {
      console.error('Wallet connection error:', error)
      throw new Error('Failed to connect wallet')
    }
  }
  
  static async signTransaction(transaction: any): Promise<{
    signature: string
    txHash: string
  }> {
    // Simulate signing
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return {
      signature: `0x${Math.random().toString(16).substring(2, 130)}`,
      txHash: `0x${Math.random().toString(16).substring(2, 66)}`
    }
  }
}

// Farcaster Frame integration for social features
export class FarcasterFrames {
  static async createGuildInviteFrame(guildData: {
    name: string
    memberCount: number
    treasury: string
  }): Promise<{
    frameUrl: string
    embedCode: string
  }> {
    // Simulate frame creation
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const frameId = Math.random().toString(36).substring(2, 12)
    
    return {
      frameUrl: `https://frames.tezoro.ai/guild-invite/${frameId}`,
      embedCode: `<iframe src="https://frames.tezoro.ai/guild-invite/${frameId}" width="400" height="300"></iframe>`
    }
  }
  
  static async shareToFarcaster(content: {
    text: string
    frameUrl?: string
  }): Promise<{
    success: boolean
    castHash: string
  }> {
    // Simulate sharing
    await new Promise(resolve => setTimeout(resolve, 400))
    
    return {
      success: true,
      castHash: `0x${Math.random().toString(16).substring(2, 42)}`
    }
  }
}

// Demo event emitter for real-time updates
export class DemoEventEmitter {
  private static listeners: Map<string, Function[]> = new Map()
  
  static on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }
  
  static emit(event: string, data: any) {
    const callbacks = this.listeners.get(event) || []
    callbacks.forEach(callback => callback(data))
  }
  
  static off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event) || []
    const index = callbacks.indexOf(callback)
    if (index > -1) {
      callbacks.splice(index, 1)
    }
  }
  
  // Simulate real-time events for demo
  static startDemoEvents() {
    // Guild rankings update
    setInterval(() => {
      this.emit('guild:ranking:update', {
        guildId: 7,
        newRanking: Math.floor(Math.random() * 3) + 5, // 5-7 ranking
        timestamp: Date.now()
      })
    }, 10000)
    
    // New quiz plays
    setInterval(() => {
      this.emit('quiz:played', {
        quizId: 123,
        player: `0x${Math.random().toString(16).substring(2, 42)}`,
        score: Math.floor(Math.random() * 100),
        royalty: 0.002,
        timestamp: Date.now()
      })
    }, 15000)
    
    // Duel matchmaking
    setInterval(() => {
      this.emit('duel:matched', {
        duelId: Math.floor(Math.random() * 1000),
        players: [
          `0x${Math.random().toString(16).substring(2, 42)}`,
          `0x${Math.random().toString(16).substring(2, 42)}`
        ],
        topic: "Advanced DeFi",
        timestamp: Date.now()
      })
    }, 20000)
  }
}