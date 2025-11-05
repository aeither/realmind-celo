import { Redis } from '@upstash/redis'
import type { DailyQuizList, StoredDailyQuiz, BacklogItem, BacklogList } from '../types.js'

export class RedisService {
  private redis: Redis

  constructor() {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables are required')
    }

    this.redis = new Redis({
      url,
      token,
    })
  }

  private getTodayKey(): string {
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD format
    return `daily_quizzes:${today}`
  }

  private getExpiresAt(): string {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0) // Set to midnight tomorrow
    return tomorrow.toISOString()
  }

  async storeDailyQuizzes(quizzes: StoredDailyQuiz[]): Promise<void> {
    try {
      const todayKey = this.getTodayKey()
      
      const dailyQuizList: DailyQuizList = {
        quizzes,
        generatedAt: new Date().toISOString(),
        expiresAt: this.getExpiresAt()
      }

      // Store the quiz list
      await this.redis.set(todayKey, JSON.stringify(dailyQuizList))

      // Set TTL for 48 hours (in case we want to keep yesterday's data briefly)
      await this.redis.expire(todayKey, 60 * 60 * 48)

      console.log(`✅ Stored ${quizzes.length} daily quizzes in Redis with key: ${todayKey}`)
    } catch (error) {
      console.error('❌ Failed to store daily quizzes in Redis:', error)
      throw error
    }
  }

  async getDailyQuizzes(): Promise<DailyQuizList | null> {
    try {
      const todayKey = this.getTodayKey()
      const data = await this.redis.get(todayKey)

      if (!data) {
        console.log(`📭 No daily quizzes found for key: ${todayKey}`)
        return null
      }

      if (typeof data === 'string') {
        const parsed = JSON.parse(data) as DailyQuizList
        console.log(`📬 Retrieved ${parsed.quizzes.length} daily quizzes from Redis`)
        return parsed
      }

      // Handle case where data is already parsed (Upstash sometimes does this)
      const dailyQuizList = data as DailyQuizList
      console.log(`📬 Retrieved ${dailyQuizList.quizzes.length} daily quizzes from Redis`)
      return dailyQuizList
      
    } catch (error) {
      console.error('❌ Failed to get daily quizzes from Redis:', error)
      throw error
    }
  }

  async clearDailyQuizzes(): Promise<void> {
    try {
      const todayKey = this.getTodayKey()
      await this.redis.del(todayKey)
      console.log(`🗑️ Cleared daily quizzes for key: ${todayKey}`)
    } catch (error) {
      console.error('❌ Failed to clear daily quizzes:', error)
      throw error
    }
  }

  // Test connection and basic functionality
  async testConnection(): Promise<boolean> {
    try {
      const testKey = 'test_connection'
      const testValue = { timestamp: new Date().toISOString(), test: true }
      
      // Test set
      await this.redis.set(testKey, JSON.stringify(testValue))
      
      // Test get
      const result = await this.redis.get(testKey)
      
      // Test delete
      await this.redis.del(testKey)
      
      console.log('✅ Redis connection test successful')
      return !!result
    } catch (error) {
      console.error('❌ Redis connection test failed:', error)
      return false
    }
  }

  // Get all keys (for debugging)
  async getAllKeys(): Promise<string[]> {
    try {
      return await this.redis.keys('*')
    } catch (error) {
      console.error('❌ Failed to get all keys:', error)
      return []
    }
  }

  // Manual data insertion helper (for testing)
  async manualInsertQuiz(quiz: StoredDailyQuiz): Promise<void> {
    try {
      const existing = await this.getDailyQuizzes()
      const quizzes = existing?.quizzes || []
      
      // Add the new quiz
      quizzes.push(quiz)
      
      // Store updated list
      await this.storeDailyQuizzes(quizzes)
      
      console.log(`✅ Manually inserted quiz: ${quiz.title}`)
    } catch (error) {
      console.error('❌ Failed to manually insert quiz:', error)
      throw error
    }
  }

  // ============ BACKLOG MANAGEMENT ============

  private getBacklogKey(): string {
    return 'quiz_backlog'
  }

  async addToBacklog(topic: string, addedBy: string = 'user'): Promise<BacklogItem> {
    try {
      const backlogKey = this.getBacklogKey()
      
      // Get existing backlog
      const existingBacklog = await this.getBacklog()
      
      // Create new backlog item
      const newItem: BacklogItem = {
        id: `backlog_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        topic: topic.trim(),
        addedBy,
        addedAt: new Date().toISOString()
      }

      // Add to existing items
      const items = existingBacklog?.items || []
      items.push(newItem)
      
      // Sort by date (older items first - FIFO queue)
      items.sort((a, b) => {
        return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
      })

      // Update backlog
      const updatedBacklog: BacklogList = {
        items,
        totalCount: items.length,
        lastUpdated: new Date().toISOString()
      }

      await this.redis.set(backlogKey, JSON.stringify(updatedBacklog))
      
      console.log(`✅ Added to backlog: "${topic}"`)
      return newItem
    } catch (error) {
      console.error('❌ Failed to add to backlog:', error)
      throw error
    }
  }

  async getBacklog(): Promise<BacklogList | null> {
    try {
      const backlogKey = this.getBacklogKey()
      const data = await this.redis.get(backlogKey)

      if (!data) {
        console.log('📭 No backlog items found')
        return null
      }

      if (typeof data === 'string') {
        const parsed = JSON.parse(data) as BacklogList
        console.log(`📬 Retrieved ${parsed.items.length} backlog items`)
        return parsed
      }

      // Handle case where data is already parsed
      const backlogList = data as BacklogList
      console.log(`📬 Retrieved ${backlogList.items.length} backlog items`)
      return backlogList
      
    } catch (error) {
      console.error('❌ Failed to get backlog:', error)
      throw error
    }
  }

  async getNextBacklogItem(): Promise<BacklogItem | null> {
    try {
      const backlog = await this.getBacklog()
      
      if (!backlog || backlog.items.length === 0) {
        console.log('📭 No backlog items')
        return null
      }

      // Get the first item (oldest by timestamp)
      const nextItem = backlog.items[0]
      
      console.log(`🎯 Next backlog item: "${nextItem.topic}" (${nextItem.addedAt})`)
      return nextItem
    } catch (error) {
      console.error('❌ Failed to get next backlog item:', error)
      throw error
    }
  }

  async removeBacklogItem(itemId: string): Promise<void> {
    try {
      const backlog = await this.getBacklog()
      
      if (!backlog) {
        throw new Error('No backlog found')
      }

      const item = backlog.items.find(i => i.id === itemId)
      if (!item) {
        throw new Error(`Backlog item ${itemId} not found`)
      }

      // Remove the item from the list
      const updatedItems = backlog.items.filter(i => i.id !== itemId)
      
      const updatedBacklog: BacklogList = {
        items: updatedItems,
        totalCount: updatedItems.length,
        lastUpdated: new Date().toISOString()
      }

      const backlogKey = this.getBacklogKey()
      await this.redis.set(backlogKey, JSON.stringify(updatedBacklog))
      
      console.log(`🗑️ Removed backlog item: "${item.topic}"`)
    } catch (error) {
      console.error('❌ Failed to remove backlog item:', error)
      throw error
    }
  }

  async clearAllBacklogItems(): Promise<void> {
    try {
      const backlogKey = this.getBacklogKey()
      await this.redis.del(backlogKey)
      console.log('🗑️ Cleared all backlog items')
    } catch (error) {
      console.error('❌ Failed to clear all backlog items:', error)
      throw error
    }
  }

  // ============ FARCASTER USERNAME MAPPING ============

  private getFarcasterMappingKey(address: string): string {
    return `farcaster:${address.toLowerCase()}`
  }

  async storeFarcasterMapping(address: string, username: string, fid: number, pfpUrl?: string): Promise<void> {
    try {
      const key = this.getFarcasterMappingKey(address)
      const data = {
        username,
        fid,
        pfpUrl: pfpUrl || '',
        updatedAt: new Date().toISOString()
      }

      await this.redis.set(key, JSON.stringify(data))
      console.log(`✅ Stored Farcaster mapping: ${address.slice(0, 10)}... -> @${username} (pfp: ${pfpUrl ? 'YES' : 'NO'})`)
    } catch (error) {
      console.error('❌ Failed to store Farcaster mapping:', error)
      throw error
    }
  }

  async getFarcasterMapping(address: string): Promise<{ username: string; fid: number; pfpUrl?: string; updatedAt?: string } | null> {
    try {
      const key = this.getFarcasterMappingKey(address)
      const data = await this.redis.get(key)

      if (!data) {
        return null
      }

      if (typeof data === 'string') {
        const parsed = JSON.parse(data)
        return { username: parsed.username, fid: parsed.fid, pfpUrl: parsed.pfpUrl, updatedAt: parsed.updatedAt }
      }

      // Handle case where data is already parsed
      return { 
        username: (data as any).username, 
        fid: (data as any).fid, 
        pfpUrl: (data as any).pfpUrl,
        updatedAt: (data as any).updatedAt
      }
    } catch (error) {
      console.error('❌ Failed to get Farcaster mapping:', error)
      return null
    }
  }

  async getBulkFarcasterMappings(addresses: string[], skipCache: boolean = false): Promise<Record<string, { username: string; fid: number; pfpUrl?: string }>> {
    try {
      const mappings: Record<string, { username: string; fid: number; pfpUrl?: string }> = {}
      const uncachedAddresses: string[] = []

      if (skipCache) {
        console.log(`⚡ Skipping cache, fetching all ${addresses.length} addresses fresh`)
        uncachedAddresses.push(...addresses)
      } else {
        // First, check Redis cache for all addresses
        for (const address of addresses) {
          const mapping = await this.getFarcasterMapping(address)
          if (mapping) {
            // Refetch if cached without pfpUrl (empty string or undefined)
            // This ensures we always try to get the profile picture
            const hasPfpUrl = mapping.pfpUrl && mapping.pfpUrl.trim() !== ''
            
            if (!hasPfpUrl) {
              console.log(`🔄 Refetching ${address.slice(0, 10)}... (cached without pfpUrl, username: @${mapping.username})`)
              uncachedAddresses.push(address)
            } else {
              mappings[address.toLowerCase()] = mapping
            }
          } else {
            uncachedAddresses.push(address)
          }
        }
        
        console.log(`📦 Cache hit: ${Object.keys(mappings).length} / ${addresses.length} addresses`)
      }

      // If we have uncached addresses, fetch from Neynar API
      if (uncachedAddresses.length > 0) {
        console.log(`🔍 Fetching ${uncachedAddresses.length} addresses from Neynar API`)
        console.log(`🔍 Uncached addresses:`, uncachedAddresses.map(a => a.slice(0, 10) + '...'))
        
        const neynarApiKey = process.env.NEYNAR_API_KEY
        if (!neynarApiKey) {
          console.warn('⚠️ NEYNAR_API_KEY not configured, skipping Neynar fetch')
          return mappings
        }

        try {
          // Neynar API supports up to 350 addresses per request
          const chunkSize = 350
          for (let i = 0; i < uncachedAddresses.length; i += chunkSize) {
            const chunk = uncachedAddresses.slice(i, i + chunkSize)
            const addressList = chunk.join(',')
            
            console.log(`📡 Calling Neynar for chunk of ${chunk.length} addresses`)
            const response = await fetch(
              `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${addressList}&address_types=custody_address,verified_address`,
              {
                headers: {
                  'x-api-key': neynarApiKey,
                  'Content-Type': 'application/json',
                },
              }
            )

            if (response.ok) {
              const data = await response.json()
              console.log(`📬 Neynar returned data for ${Object.keys(data).length} addresses`)
              
              // Log which addresses were found and which weren't
              const foundAddresses = Object.keys(data).map(k => k.toLowerCase())
              const notFound = chunk.filter(addr => !foundAddresses.includes(addr.toLowerCase()))
              if (notFound.length > 0) {
                console.log(`⚠️ Not found in Neynar:`, notFound.map(a => a.slice(0, 10) + '...'))
              }
              
              // Process Neynar response and cache the results
              for (const [addr, users] of Object.entries(data)) {
                if (Array.isArray(users) && users.length > 0) {
                  const user = users[0] as any
                  const username = user.username
                  const fid = user.fid
                  const pfpUrl = user.pfp_url || user.pfp?.url || ''
                  
                  console.log(`✅ Found @${username} (FID ${fid}) for ${addr.slice(0, 10)}... pfpUrl: ${pfpUrl ? 'YES' : 'NO'}`)
                  
                  if (username && fid) {
                    // Store in cache for future requests (including pfp)
                    await this.storeFarcasterMapping(addr, username, fid, pfpUrl)
                    mappings[addr.toLowerCase()] = { username, fid, pfpUrl }
                  }
                } else {
                  console.log(`⚠️ Empty user array for ${addr.slice(0, 10)}...`)
                }
              }
            } else {
              const errorText = await response.text()
              console.error(`❌ Neynar API error: ${response.status} ${response.statusText}`)
              console.error(`❌ Error details:`, errorText.slice(0, 200))
              console.error(`❌ Failed addresses:`, chunk.map(a => a.slice(0, 10) + '...'))
            }
          }
          
          const newFetched = Object.keys(mappings).length - (addresses.length - uncachedAddresses.length)
          console.log(`✅ Fetched ${newFetched} new mappings from Neynar (out of ${uncachedAddresses.length} requested)`)
        } catch (error) {
          console.error('❌ Failed to fetch from Neynar API:', error)
        }
      }

      console.log(`✅ Retrieved ${Object.keys(mappings).length} Farcaster mappings out of ${addresses.length} addresses`)
      return mappings
    } catch (error) {
      console.error('❌ Failed to get bulk Farcaster mappings:', error)
      return {}
    }
  }
}