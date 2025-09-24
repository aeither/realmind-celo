import { DailyQuizSchema, type DailyQuiz } from '../types.js'

interface GrokSearchParameters {
  mode: 'auto' | 'on' | 'off'
  max_search_results: number
  sources: Array<{
    type: string
    post_favorite_count?: number
    post_view_count?: number
  }>
  return_citations: boolean
}

interface GrokMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GrokResponse {
  choices: Array<{
    message: {
      content: string
      parsed?: DailyQuiz
    }
  }>
  usage?: {
    num_sources_used?: number
  }
  citations?: string[]
}

export class GrokService {
  private apiKey: string
  private baseURL = 'https://api.x.ai/v1'

  constructor() {
    const apiKey = process.env.XAI_API_KEY
    if (!apiKey) {
      throw new Error('XAI_API_KEY environment variable is required')
    }
    this.apiKey = apiKey
  }

  async generateDailyQuiz(): Promise<DailyQuiz> {
    const searchParams: GrokSearchParameters = {
      mode: 'on',
      max_search_results: 10,
      sources: [
        {
          type: 'x',
          post_favorite_count: 100,
          post_view_count: 1000
        }
      ],
      return_citations: true
    }

    const messages: GrokMessage[] = [
      {
        role: 'system',
        content: `You are a quiz generator that creates educational quizzes based on trending topics from Twitter/X. 

Your task is to:
1. Analyze the trending Twitter/X content provided
2. Identify the most interesting and educational trending topic
3. Create a 3-question multiple choice quiz about that topic
4. Ensure questions are factual, educational, and based on the trending content
5. Include context from the tweets that inspired each question

Guidelines:
- Focus on topics that are educational, newsworthy, or culturally significant
- Avoid controversial political topics or misinformation
- Questions should test understanding, not just recall
- Each question must have exactly 4 options with only 1 correct answer
- Explanations should be informative and reference the source context`
      },
      {
        role: 'user',
        content: `Based on the trending topics and popular posts from Twitter/X today, create an educational quiz. Focus on topics that are:

1. Trending and relevant today
2. Educational or informative
3. Suitable for a general audience
4. Based on factual information from the posts

Create a quiz with exactly 3 questions, each with 4 multiple choice options. Include the trending topic as the main theme and reference the Twitter context that inspired each question.`
      }
    ]

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'grok-4',
          messages,
          search_parameters: searchParams,
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'daily_quiz',
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  trending_topic: { type: 'string' },
                  questions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        question: { type: 'string' },
                        options: {
                          type: 'array',
                          items: { type: 'string' },
                          minItems: 4,
                          maxItems: 4
                        },
                        correct: { type: 'integer', minimum: 0, maximum: 3 },
                        explanation: { type: 'string' },
                        source_context: { type: 'string' }
                      },
                      required: ['question', 'options', 'correct', 'explanation', 'source_context'],
                      additionalProperties: false
                    },
                    minItems: 3,
                    maxItems: 3
                  }
                },
                required: ['title', 'description', 'trending_topic', 'questions'],
                additionalProperties: false
              }
            }
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Grok API error: ${response.status} - ${errorText}`)
      }

      const data: GrokResponse = await response.json()
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from Grok API')
      }

      // Try to parse structured output first
      if (data.choices[0].message.parsed) {
        return DailyQuizSchema.parse(data.choices[0].message.parsed)
      }

      // Fallback to parsing JSON from content
      const content = data.choices[0].message.content
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsedContent = JSON.parse(jsonMatch[0])
          return DailyQuizSchema.parse(parsedContent)
        }
      } catch (parseError) {
        console.error('Failed to parse JSON from content:', parseError)
      }

      throw new Error('Unable to parse quiz data from Grok response')

    } catch (error) {
      console.error('Error calling Grok API:', error)
      throw error
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'grok-4',
          messages: [
            { role: 'user', content: 'Hello, this is a test message.' }
          ],
          max_tokens: 10
        })
      })

      return response.ok
    } catch (error) {
      console.error('Grok API connection test failed:', error)
      return false
    }
  }
}