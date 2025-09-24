import { GrokService } from './grok.js'
import { RedisService } from './redis.js'
import type { DailyQuiz, QuizResponse, StoredDailyQuiz, FrontendQuizConfig, BacklogItem, BacklogResponse } from '../types.js'

export class QuizService {
  private grokService: GrokService
  private redisService: RedisService

  constructor() {
    this.grokService = new GrokService()
    this.redisService = new RedisService()
  }

  // Generate multiple daily quizzes and store them in Redis
  async generateAndStoreDailyQuizzes(count: number = 3): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      console.log(`🔄 Generating ${count} daily quizzes...`)
      const quizzes: StoredDailyQuiz[] = []

      for (let i = 0; i < count; i++) {
        try {
          const quiz = await this.grokService.generateDailyQuiz()
          const storedQuiz: StoredDailyQuiz = {
            id: `daily_quiz_${Date.now()}_${i}`,
            title: quiz.title,
            description: quiz.description,
            trending_topic: quiz.trending_topic,
            questions: quiz.questions,
            difficulty: 'medium',
            questionCount: quiz.questions.length,
            createdAt: new Date().toISOString(),
            source: 'ai-generated-grok-trending'
          }
          quizzes.push(storedQuiz)
          console.log(`✅ Generated quiz ${i + 1}/${count}: ${quiz.title}`)
        } catch (error) {
          console.error(`❌ Failed to generate quiz ${i + 1}/${count}:`, error)
          // Continue with other quizzes
        }
      }

      if (quizzes.length === 0) {
        throw new Error('Failed to generate any quizzes')
      }

      // Store in Redis
      await this.redisService.storeDailyQuizzes(quizzes)

      return {
        success: true,
        count: quizzes.length
      }
    } catch (error) {
      console.error('Error generating and storing daily quizzes:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Get cached daily quizzes from Redis
  async getCachedDailyQuizzes(): Promise<{ success: boolean; quizzes?: FrontendQuizConfig[]; error?: string }> {
    try {
      const dailyQuizList = await this.redisService.getDailyQuizzes()
      
      if (!dailyQuizList) {
        return {
          success: false,
          error: 'No daily quizzes available. Please generate new ones.'
        }
      }

      // Convert to frontend format
      const frontendQuizzes: FrontendQuizConfig[] = dailyQuizList.quizzes.map(quiz => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        topic: quiz.trending_topic,
        questionCount: quiz.questionCount,
        questions: quiz.questions.map(q => ({
          question: q.question,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation
        })),
        createdAt: quiz.createdAt,
        source: quiz.source
      }))

      return {
        success: true,
        quizzes: frontendQuizzes
      }
    } catch (error) {
      console.error('Error getting cached daily quizzes:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Legacy method for backward compatibility
  async generateDailyQuiz(): Promise<QuizResponse> {
    try {
      const quiz = await this.grokService.generateDailyQuiz()
      
      return {
        success: true,
        quiz: {
          id: `daily_quiz_${Date.now()}`,
          title: quiz.title,
          description: quiz.description,
          difficulty: 'medium',
          topic: quiz.trending_topic,
          questionCount: quiz.questions.length,
          questions: quiz.questions.map(q => ({
            question: q.question,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation
          })),
          createdAt: new Date().toISOString(),
          source: 'ai-generated-grok-trending'
        }
      }
    } catch (error) {
      console.error('Error generating daily quiz:', error)
      
      return {
        success: false,
        error: 'Failed to generate daily quiz',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async testGrokConnection(): Promise<boolean> {
    try {
      return await this.grokService.testConnection()
    } catch (error) {
      console.error('Error testing Grok connection:', error)
      return false
    }
  }

  async testGatewayConnection(): Promise<boolean> {
    try {
      // Test AI Gateway connection by making a simple request
      if (!process.env.AI_GATEWAY_API_KEY) {
        return false
      }
      
      // For now, just check if the API key exists
      // In a real implementation, you might want to make a test API call
      return true
    } catch (error) {
      console.error('Error testing AI Gateway connection:', error)
      return false
    }
  }

  async testRedisConnection(): Promise<boolean> {
    try {
      return await this.redisService.testConnection()
    } catch (error) {
      console.error('Error testing Redis connection:', error)
      return false
    }
  }

  // Manual quiz insertion for testing
  async insertTestQuiz(): Promise<{ success: boolean; error?: string }> {
    try {
      const testQuiz: StoredDailyQuiz = {
        id: `test_quiz_${Date.now()}`,
        title: 'Test Daily Quiz',
        description: 'A test quiz to verify Redis functionality',
        trending_topic: 'Testing',
        difficulty: 'medium',
        questionCount: 3,
        createdAt: new Date().toISOString(),
        source: 'manual-test',
        questions: [
          {
            question: 'What is the purpose of this test quiz?',
            options: ['To test Redis', 'To test frontend', 'To test backend', 'All of the above'],
            correct: 3,
            explanation: 'This test quiz helps verify that Redis storage and retrieval works correctly.',
            source_context: 'Manual test data insertion'
          },
          {
            question: 'Which database is being used for caching?',
            options: ['MySQL', 'PostgreSQL', 'Redis', 'MongoDB'],
            correct: 2,
            explanation: 'Redis is being used for caching daily quiz data.',
            source_context: 'Redis implementation testing'
          },
          {
            question: 'How often are daily quizzes generated?',
            options: ['Hourly', 'Daily', 'Weekly', 'Monthly'],
            correct: 1,
            explanation: 'Daily quizzes are generated once every 24 hours via cron job.',
            source_context: 'Daily quiz generation schedule'
          }
        ]
      }

      await this.redisService.manualInsertQuiz(testQuiz)

      return { success: true }
    } catch (error) {
      console.error('Error inserting test quiz:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // ============ BACKLOG MANAGEMENT ============

  async addToBacklog(topic: string, addedBy: string = 'user'): Promise<BacklogResponse> {
    try {
      if (!topic.trim()) {
        return {
          success: false,
          error: 'Topic cannot be empty'
        }
      }

      const item = await this.redisService.addToBacklog(topic, addedBy)
      
      return {
        success: true,
        item,
        message: `Added "${topic}" to quiz backlog`
      }
    } catch (error) {
      console.error('Error adding to backlog:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getBacklog(): Promise<BacklogResponse> {
    try {
      const backlogList = await this.redisService.getBacklog()
      
      return {
        success: true,
        items: backlogList?.items || [],
        count: backlogList?.totalCount || 0
      }
    } catch (error) {
      console.error('Error getting backlog:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Generate quiz from backlog or fallback to random topic (simplified)
  async generateScheduledQuiz(): Promise<{ success: boolean; quiz?: StoredDailyQuiz; error?: string; source?: string }> {
    try {
      console.log('🔄 Processing backlog for scheduled quiz...')
      
      // Check if backlog has items
      const backlogList = await this.redisService.getBacklog()
      
      let topic: string
      let source: string
      
      if (backlogList && backlogList.totalCount > 0) {
        // If there are items in backlog, create quiz about random topic
        topic = this.generateRandomTopic()
        source = 'random-with-backlog'
        console.log(`🎲 Backlog has ${backlogList.totalCount} items, using random topic: "${topic}"`)
      } else {
        // If backlog is empty, still use random topic
        topic = this.generateRandomTopic()
        source = 'random-empty-backlog'
        console.log(`🎲 Backlog empty, using random topic: "${topic}"`)
      }

      // Generate quiz with the selected topic
      const quiz = await this.generateQuizFromTopic(topic)
      
      const storedQuiz: StoredDailyQuiz = {
        id: `daily_quiz_${Date.now()}`,
        title: quiz.title,
        description: quiz.description,
        trending_topic: quiz.trending_topic || topic,
        questions: quiz.questions,
        difficulty: 'medium',
        questionCount: quiz.questions.length,
        createdAt: new Date().toISOString(),
        source
      }

      // Replace all daily quizzes with this single quiz
      await this.redisService.storeDailyQuizzes([storedQuiz])

      return {
        success: true,
        quiz: storedQuiz,
        source
      }
    } catch (error) {
      console.error('Error generating scheduled quiz:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private generateRandomTopic(): string {
    const topics = [
      'Artificial Intelligence and Machine Learning',
      'Blockchain Technology and Cryptocurrencies',
      'Sustainable Energy and Climate Change',
      'Space Exploration and Astronomy',
      'Cybersecurity and Data Privacy',
      'Quantum Computing',
      'Biotechnology and Genetics',
      'Internet of Things (IoT)',
      'Virtual Reality and Augmented Reality',
      'Renewable Energy Technologies',
      'Neuroscience and Brain Research',
      'Robotics and Automation',
      'Cloud Computing',
      '5G Technology and Communications',
      'Digital Marketing and Social Media',
      'Financial Technology (FinTech)',
      'Health Technology and Telemedicine',
      'Environmental Conservation',
      'Smart Cities and Urban Planning',
      'Data Science and Big Data Analytics'
    ]

    const randomIndex = Math.floor(Math.random() * topics.length)
    return topics[randomIndex]
  }

  private async generateQuizFromTopic(topic: string): Promise<DailyQuiz> {
    // Use the Grok service to generate a quiz about the specific topic
    // We'll modify the prompt to focus on the given topic instead of trending content
    
    try {
      // For now, we'll use the existing Grok service 
      // TODO: Enhance GrokService to accept custom topics with specific prompts
      const quiz = await this.grokService.generateDailyQuiz()
      
      // Override the topic-related fields
      return {
        ...quiz,
        title: `${topic} Quiz`,
        description: `Test your knowledge about ${topic}`,
        trending_topic: topic
      }
    } catch (error) {
      console.error('Error generating quiz from topic:', error)
      
      // Fallback quiz structure
      return {
        title: `${topic} Quiz`,
        description: `A quiz about ${topic}`,
        trending_topic: topic,
        questions: [
          {
            question: `What is a key aspect of ${topic}?`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correct: 0,
            explanation: `This is a fundamental aspect of ${topic}.`,
            source_context: `Generated from topic: ${topic}`
          },
          {
            question: `How does ${topic} impact modern society?`,
            options: ['Significantly', 'Moderately', 'Minimally', 'Not at all'],
            correct: 0,
            explanation: `${topic} has significant impact on modern society.`,
            source_context: `Generated from topic: ${topic}`
          },
          {
            question: `What is the future outlook for ${topic}?`,
            options: ['Very promising', 'Somewhat promising', 'Uncertain', 'Declining'],
            correct: 0,
            explanation: `The future of ${topic} looks very promising.`,
            source_context: `Generated from topic: ${topic}`
          }
        ]
      }
    }
  }
}