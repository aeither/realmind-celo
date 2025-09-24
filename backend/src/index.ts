import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { gateway } from '@ai-sdk/gateway'
import { generateObject } from 'ai'
import { z } from 'zod'
import 'dotenv/config'
import { QuizService } from './services/quiz.js'
import { LeaderboardService } from './services/leaderboard.js'

const app = new Hono()

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  })
)

app.get('/', (c) => {
  return c.json({
    message: 'Backend2 - AI Quiz Generator with Backlog Scheduler & Redis Cache',
    version: '3.0.0',
    endpoints: [
      '/health', 
      '/generate-quiz', 
      '/daily-quiz', 
      '/daily-quiz/cached',
      '/backlog',
      '/backlog/add',
      '/cron/daily-quiz',
      '/test/insert-quiz',
      '/health/gateway',
      '/health/redis',
      '/leaderboard',
      '/leaderboard/chains'
    ]
  })
})

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
})

const QuizSchema = z.object({
  title: z.string(),
  description: z.string(),
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      answer: z.number().int().min(0).max(3),
      explanation: z.string()
    })
  )
})

app.post('/generate-quiz', async (c) => {
  try {
    if (!process.env.AI_GATEWAY_API_KEY) {
      return c.json({
        error: 'AI Gateway API key not configured'
      }, 500)
    }

    const body = await c.req.json()
    const { topic, difficulty = 'medium' } = body
    const questionCount = 3 // Fixed to 3 questions

    if (!topic) {
      return c.json({
        error: 'Topic is required'
      }, 400)
    }

    console.log(`Generating quiz for topic: "${topic}" with difficulty: ${difficulty}`)
    
    const { object } = await generateObject({
      model: gateway('cerebras/llama-3.1-8b'),
      schema: QuizSchema,
      prompt: `Generate a ${difficulty} level quiz about "${topic}" with exactly 3 questions.

Requirements:
- Each question should have exactly 4 multiple choice options
- Only one correct answer per question (use index 0-3 for the "answer" field)
- Include a brief explanation for each correct answer
- Questions should be educational and test understanding
- Title should be descriptive
- Description should explain what the quiz covers
- Return the response in valid JSON format

Topic: ${topic}
Difficulty: ${difficulty}
Number of questions: 3

Example format:
{
  "title": "Sample Quiz",
  "description": "A sample quiz description",
  "questions": [
    {
      "question": "What is 2+2?",
      "options": ["3", "4", "5", "6"],
      "answer": 1,
      "explanation": "2+2 equals 4"
    }
  ]
}`
    })
    
    console.log('Quiz generated successfully:', object.title)

    // Transform the response to match frontend expectations
    const transformedQuiz = {
      id: `quiz_${Date.now()}`,
      title: object.title,
      description: object.description,
      difficulty,
      topic,
      questionCount: object.questions.length,
      createdAt: new Date().toISOString(),
      questions: object.questions.map(q => ({
        question: q.question,
        options: q.options,
        correct: q.answer, // Map answer to correct for frontend
        explanation: q.explanation
      }))
    }

    return c.json({
      success: true,
      quiz: transformedQuiz
    })

  } catch (error) {
    console.error('Error generating quiz:', error)
    
    // More detailed error handling
    let errorMessage = 'Failed to generate quiz'
    let errorDetails = 'Unknown error'
    
    if (error instanceof Error) {
      errorDetails = error.message
      
      // Check for specific error types
      if (error.message.includes('API key')) {
        errorMessage = 'Invalid API key configuration'
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please try again later.'
      } else if (error.message.includes('model')) {
        errorMessage = 'Model configuration error'
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network connection error'
      }
    }
    
    return c.json({
      success: false,
      error: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Initialize services
const quizService = new QuizService()
const leaderboardService = new LeaderboardService()

// Daily Quiz Endpoint - Get the latest daily quiz
app.get('/daily-quiz', async (c) => {
  try {
    const result = await quizService.generateDailyQuiz()
    
    if (result.success) {
      return c.json(result)
    } else {
      return c.json(result, 500)
    }
  } catch (error) {
    console.error('Error in daily quiz endpoint:', error)
    return c.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Cached Daily Quiz Endpoint - Get today's cached quizzes from Redis
app.get('/daily-quiz/cached', async (c) => {
  try {
    const result = await quizService.getCachedDailyQuizzes()
    
    if (result.success) {
      return c.json({
        success: true,
        quizzes: result.quizzes,
        count: result.quizzes?.length || 0,
        timestamp: new Date().toISOString()
      })
    } else {
      return c.json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      }, 404)
    }
  } catch (error) {
    console.error('Error in cached daily quiz endpoint:', error)
    return c.json({
      success: false,
      error: 'Failed to get cached daily quizzes',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Backlog Endpoints
app.post('/backlog/add', async (c) => {
  try {
    const body = await c.req.json()
    const { topic, addedBy = 'api' } = body

    if (!topic || typeof topic !== 'string') {
      return c.json({
        success: false,
        error: 'Topic is required and must be a string'
      }, 400)
    }

    const result = await quizService.addToBacklog(topic.trim(), addedBy)
    
    if (result.success) {
      return c.json({
        success: true,
        message: result.message,
        item: result.item,
        timestamp: new Date().toISOString()
      })
    } else {
      return c.json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      }, 400)
    }
  } catch (error) {
    console.error('Error in add to backlog endpoint:', error)
    return c.json({
      success: false,
      error: 'Failed to add to backlog',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

app.get('/backlog', async (c) => {
  try {
    const result = await quizService.getBacklog()
    
    if (result.success) {
      return c.json({
        success: true,
        items: result.items,
        count: result.count,
        timestamp: new Date().toISOString()
      })
    } else {
      return c.json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      }, 500)
    }
  } catch (error) {
    console.error('Error in get backlog endpoint:', error)
    return c.json({
      success: false,
      error: 'Failed to get backlog',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Cron Job Endpoint - For automated daily quiz generation from backlog (stores in Redis)
app.get('/cron/daily-quiz', async (c) => {
  try {
    // Verify this is a cron request (optional security check)
    const authHeader = c.req.header('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    console.log('Cron job triggered: Processing backlog for daily quiz')
    const result = await quizService.generateScheduledQuiz()
    
    if (result.success) {
      console.log(`Daily quiz generated successfully from ${result.source}`)
      return c.json({
        success: true,
        message: 'Daily quiz processed from backlog and stored successfully',
        source: result.source,
        quiz_title: result.quiz?.title,
        quiz_topic: result.quiz?.trending_topic,
        timestamp: new Date().toISOString()
      })
    } else {
      console.error('Failed to process backlog for daily quiz:', result.error)
      return c.json({
        success: false,
        error: 'Failed to process backlog for daily quiz',
        details: result.error,
        timestamp: new Date().toISOString()
      }, 500)
    }
  } catch (error) {
    console.error('Error in cron endpoint:', error)
    return c.json({
      success: false,
      error: 'Cron job failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Test endpoint to manually insert a quiz
app.get('/test/insert-quiz', async (c) => {
  try {
    const result = await quizService.insertTestQuiz()
    
    if (result.success) {
      return c.json({
        success: true,
        message: 'Test quiz inserted successfully',
        timestamp: new Date().toISOString()
      })
    } else {
      return c.json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      }, 500)
    }
  } catch (error) {
    console.error('Error in test insert endpoint:', error)
    return c.json({
      success: false,
      error: 'Failed to insert test quiz',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Health check for AI Gateway
app.get('/health/gateway', async (c) => {
  try {
    const isConnected = await quizService.testGatewayConnection()
    
    return c.json({
      status: isConnected ? 'healthy' : 'unhealthy',
      service: 'ai_gateway',
      timestamp: new Date().toISOString()
    }, isConnected ? 200 : 503)
  } catch (error) {
    return c.json({
      status: 'error',
      service: 'ai_gateway',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Health check for Redis
app.get('/health/redis', async (c) => {
  try {
    const isConnected = await quizService.testRedisConnection()
    
    return c.json({
      status: isConnected ? 'healthy' : 'unhealthy',
      service: 'redis',
      timestamp: new Date().toISOString()
    }, isConnected ? 200 : 503)
  } catch (error) {
    return c.json({
      status: 'error',
      service: 'redis',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Leaderboard Endpoints
app.get('/leaderboard', async (c) => {
  try {
    const contractAddress = c.req.query('contract')
    const chainIdParam = c.req.query('chainId')
    const limitParam = c.req.query('limit')

    if (!contractAddress) {
      return c.json({
        success: false,
        error: 'Contract address is required'
      }, 400)
    }

    if (!chainIdParam) {
      return c.json({
        success: false,
        error: 'Chain ID is required'
      }, 400)
    }

    const chainId = parseInt(chainIdParam)
    const limit = limitParam ? parseInt(limitParam) : 50

    if (isNaN(chainId)) {
      return c.json({
        success: false,
        error: 'Invalid chain ID'
      }, 400)
    }

    if (isNaN(limit) || limit <= 0 || limit > 1000) {
      return c.json({
        success: false,
        error: 'Limit must be between 1 and 1000'
      }, 400)
    }

    const result = await leaderboardService.getLeaderboard(contractAddress, chainId, limit)
    
    if (result.success) {
      return c.json({
        success: true,
        holders: result.holders,
        totalHolders: result.totalHolders,
        chainId,
        contractAddress,
        timestamp: new Date().toISOString()
      })
    } else {
      return c.json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      }, 500)
    }
  } catch (error) {
    console.error('Error in leaderboard endpoint:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch leaderboard',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Get supported chains
app.get('/leaderboard/chains', async (c) => {
  try {
    const chains = leaderboardService.getSupportedChains()
    
    return c.json({
      success: true,
      chains,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in chains endpoint:', error)
    return c.json({
      success: false,
      error: 'Failed to get supported chains',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Get scan URL for a contract on specific chain
app.get('/leaderboard/scan-url', async (c) => {
  try {
    const contractAddress = c.req.query('contract')
    const chainIdParam = c.req.query('chainId')

    if (!contractAddress) {
      return c.json({
        success: false,
        error: 'Contract address is required'
      }, 400)
    }

    if (!chainIdParam) {
      return c.json({
        success: false,
        error: 'Chain ID is required'
      }, 400)
    }

    const chainId = parseInt(chainIdParam)
    
    if (isNaN(chainId)) {
      return c.json({
        success: false,
        error: 'Invalid chain ID'
      }, 400)
    }

    const scanUrl = leaderboardService.getScanUrl(contractAddress, chainId)
    
    if (scanUrl) {
      return c.json({
        success: true,
        scanUrl,
        chainId,
        contractAddress,
        timestamp: new Date().toISOString()
      })
    } else {
      return c.json({
        success: false,
        error: 'Unsupported chain ID',
        timestamp: new Date().toISOString()
      }, 400)
    }
  } catch (error) {
    console.error('Error in scan URL endpoint:', error)
    return c.json({
      success: false,
      error: 'Failed to get scan URL',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

export default app

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  import('@hono/node-server').then(({ serve }) => {
    const port = process.env.PORT || 3000
    console.log(`🚀 Starting server on port ${port}`)
    
    serve({
      fetch: app.fetch,
      port: parseInt(port.toString()),
    })
    
    console.log(`✅ Server running at http://localhost:${port}`)
  }).catch(console.error)
}