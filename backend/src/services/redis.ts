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
}