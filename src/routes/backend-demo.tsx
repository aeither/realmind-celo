import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/backend-demo')({
  component: BackendDemo,
})

// Removed unused interface to fix TypeScript warning

function BackendDemo() {
  const navigate = useNavigate()
  const [response, setResponse] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [topicInput, setTopicInput] = useState<string>('')
  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number } | null>(null)
  const [quizCreatedAt, setQuizCreatedAt] = useState<string | null>(null)
  const [currentQuizTitle, setCurrentQuizTitle] = useState<string>('')
  const [currentQuizDescription, setCurrentQuizDescription] = useState<string>('')
  
  // Get backend URL from environment or default to localhost
  const backendUrl = import.meta.env.VITE_BACKEND_URL

  const makeRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
    setLoading(true)
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      }
      
      if (body) {
        options.body = JSON.stringify(body)
      }

      console.log(`Making ${method} request to: ${backendUrl}${endpoint}`)
      if (body) {
        console.log('Request body:', JSON.stringify(body, null, 2))
      }

      const res = await fetch(`${backendUrl}${endpoint}`, options)
      
      // Log response details
      console.log('Response status:', res.status)
      console.log('Response headers:', Object.fromEntries(res.headers.entries()))
      
      // Get raw response text first
      const responseText = await res.text()
      console.log('Raw response:', responseText)
      
      // Try to parse as JSON
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        // If JSON parsing fails, show the raw response
        setResponse(`HTTP ${res.status} - Raw Response:\n${responseText}\n\nJSON Parse Error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
        return
      }
      
      // Show formatted JSON response
      setResponse(`HTTP ${res.status} - JSON Response:\n${JSON.stringify(data, null, 2)}`)
      
      // Refresh quiz info if quiz-related endpoints were called
      if (endpoint.includes('quiz') || endpoint.includes('cron')) {
        setTimeout(fetchQuizInfo, 1000) // Delay to allow backend processing
      }
    } catch (error) {
      console.error('Request error:', error)
      setResponse(`Network Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck if your backend is running at: ${backendUrl}`)
    } finally {
      setLoading(false)
    }
  }

  const clearResponse = () => {
    setResponse('')
  }

  // Countdown timer functions - resets at UTC 00:00
  const calculateCountdown = () => {
    const now = new Date()
    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(0, 0, 0, 0) // Next UTC midnight
    
    const timeDiff = tomorrow.getTime() - now.getTime()

    if (timeDiff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0 }
    }

    const hours = Math.floor(timeDiff / (1000 * 60 * 60))
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)

    return { hours, minutes, seconds }
  }

  // Fetch current quiz and set countdown
  const fetchQuizInfo = async () => {
    try {
      const res = await fetch(`${backendUrl}/daily-quiz/cached`)
      const data = await res.json()
      
      if (data.success && data.quizzes && data.quizzes.length > 0) {
        const quiz = data.quizzes[0]
        setQuizCreatedAt(quiz.createdAt)
        setCurrentQuizTitle(quiz.title || 'Daily Quiz')
        setCurrentQuizDescription(quiz.description || 'Test your knowledge')
      }
    } catch (error) {
      console.error('Error fetching quiz info:', error)
    }
  }

  // Update countdown every second - resets at UTC 00:00
  useEffect(() => {
    const updateCountdown = () => {
      setCountdown(calculateCountdown())
    }

    updateCountdown() // Initial calculation
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [])

  // Fetch quiz info on component mount
  useEffect(() => {
    fetchQuizInfo()
  }, [])

  // Start Daily Quiz function
  const startDailyQuiz = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${backendUrl}/daily-quiz/cached`)
      const data = await res.json()
      
      if (data.success && data.quizzes && data.quizzes.length > 0) {
        const quiz = data.quizzes[0]
        
        // Convert to frontend format and encode for URL
        const quizConfig = {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          difficulty: quiz.difficulty,
          topic: quiz.topic || quiz.trending_topic,
          questionCount: quiz.questionCount,
          questions: quiz.questions.map((q: any) => ({
            question: q.question,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation
          })),
          createdAt: quiz.createdAt,
          source: quiz.source
        }
        
        // UTF-8 safe base64 encoding
        const utf8ToBase64 = (str: string): string => {
          return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, 
            (match, p1) => String.fromCharCode(parseInt(p1, 16))
          ))
        }
        
        const encodedQuiz = utf8ToBase64(JSON.stringify(quizConfig))
        const quizUrl = `/quiz-game?quiz=ai-custom&data=${encodedQuiz}`
        
        // Navigate to quiz
        navigate({ to: quizUrl })
        
      } else {
        setResponse('No daily quiz available. Process backlog first.')
      }
    } catch (error) {
      setResponse(`Error starting quiz: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Backend Demo - Quiz System</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Control Panel */}
          <div className="space-y-6">
            
            {/* Daily Quiz Countdown */}
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-orange-600">⏰ Daily Quiz Countdown</h2>
              
              {countdown ? (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">Next cron update at UTC 00:00:</p>
                  <div className="flex justify-center space-x-4 mb-4">
                    <div className="bg-orange-100 rounded-lg p-3 min-w-16">
                      <div className="text-2xl font-bold text-orange-600">{countdown.hours.toString().padStart(2, '0')}</div>
                      <div className="text-xs text-orange-500">Hours</div>
                    </div>
                    <div className="bg-orange-100 rounded-lg p-3 min-w-16">
                      <div className="text-2xl font-bold text-orange-600">{countdown.minutes.toString().padStart(2, '0')}</div>
                      <div className="text-xs text-orange-500">Minutes</div>
                    </div>
                    <div className="bg-orange-100 rounded-lg p-3 min-w-16">
                      <div className="text-2xl font-bold text-orange-600">{countdown.seconds.toString().padStart(2, '0')}</div>
                      <div className="text-xs text-orange-500">Seconds</div>
                    </div>
                  </div>
                  
                  {/* Quiz Title and Description */}
                  {currentQuizTitle && (
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 mb-4 border border-orange-200">
                      <h3 className="text-lg font-semibold text-orange-700 mb-2">
                        {currentQuizTitle}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {currentQuizDescription.length > 100 
                          ? `${currentQuizDescription.substring(0, 100)}...` 
                          : currentQuizDescription}
                      </p>
                    </div>
                  )}
                  
                  {quizCreatedAt && (
                    <div className="text-xs text-gray-500 mb-3">
                      Current quiz created: {new Date(quizCreatedAt).toLocaleString()}
                    </div>
                  )}
                  <button
                    onClick={startDailyQuiz}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                    disabled={loading}
                  >
                    🎯 Start Daily Quiz
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">⏳</div>
                  <p className="text-gray-500">No daily quiz found</p>
                  <button
                    onClick={() => makeRequest('/daily-quiz/cached')}
                    className="mt-3 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                    disabled={loading}
                  >
                    Check for Quiz
                  </button>
                </div>
              )}
            </div>
            
            {/* Health Checks */}
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-green-600">🔍 Health Checks</h2>
              <div className="mb-3 text-xs text-gray-500">
                Backend URL: <code className="bg-gray-100 px-1 rounded">{backendUrl}</code>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => makeRequest('/')}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  disabled={loading}
                >
                  Connection Test
                </button>
                <button
                  onClick={() => makeRequest('/health')}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                  disabled={loading}
                >
                  API Health
                </button>
                <button
                  onClick={() => makeRequest('/health/redis')}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                  disabled={loading}
                >
                  Redis Health
                </button>
                <button
                  onClick={() => makeRequest('/health/grok')}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                  disabled={loading}
                >
                  Grok Health
                </button>
              </div>
            </div>

            {/* Backlog Management */}
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-blue-600">📋 Backlog Management</h2>
              
              {/* Add Topic */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Add Topic to Backlog:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="Enter quiz topic..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      const trimmedTopic = topicInput.trim()
                      if (trimmedTopic) {
                        console.log('Adding topic:', trimmedTopic)
                        makeRequest('/backlog/add', 'POST', { 
                          topic: trimmedTopic,
                          addedBy: 'frontend-demo'
                        })
                        setTopicInput('')
                      } else {
                        setResponse('Error: Topic cannot be empty')
                      }
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400"
                    disabled={loading || !topicInput.trim()}
                  >
                    Add Topic
                  </button>
                </div>
              </div>

              {/* Quick Add Buttons */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Quick Add Topics:</p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    'Artificial Intelligence Basics',
                    'Blockchain Technology',
                    'Climate Change Solutions',
                    'Space Exploration',
                    'Quantum Computing'
                  ].map((topic) => (
                    <button
                      key={topic}
                      onClick={() => makeRequest('/backlog/add', 'POST', { 
                        topic,
                        addedBy: 'demo-quick-add'
                      })}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
                      disabled={loading}
                    >
                      + {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Backlog Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => makeRequest('/backlog')}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  disabled={loading}
                >
                  View Backlog
                </button>
                <button
                  onClick={() => makeRequest('/cron/daily-quiz')}
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                  disabled={loading}
                >
                  Process Backlog
                </button>
              </div>
            </div>

            {/* Quiz Management */}
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-purple-600">🧩 Quiz Management</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => makeRequest('/daily-quiz/cached')}
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                  disabled={loading}
                >
                  Get Cached Quizzes
                </button>
                <button
                  onClick={() => makeRequest('/test/insert-quiz')}
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                  disabled={loading}
                >
                  Insert Test Quiz
                </button>
              </div>
            </div>

            {/* Clear Response */}
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-600">🧹 Utilities</h2>
              <button
                onClick={clearResponse}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Clear Response
              </button>
            </div>

          </div>

          {/* Response Panel */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">📝 API Response</h2>
            
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3">Loading...</span>
              </div>
            )}

            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
              <pre>{response || 'Click a button to see API response...\n\nTroubleshooting:\n1. Click "Connection Test" first to check if backend is running\n2. Check browser console (F12) for detailed logs\n3. Ensure backend is running on the correct port'}</pre>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p><strong>Backend URL:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{backendUrl}</code></p>
              <p className="mt-1 text-xs">💡 Check browser console (F12) for detailed request/response logs</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-800">🚀 How to Use This Demo</h3>
          <div className="text-blue-700 space-y-2">
            <p><strong>⏰ Countdown Timer:</strong> Shows time until next quiz update (24h cycle)</p>
            <p><strong>1. Health Checks:</strong> Test if your backend and services are running</p>
            <p><strong>2. Add Topics:</strong> Type topics or use quick-add buttons to populate the backlog</p>
            <p><strong>3. View Backlog:</strong> See all pending topics in chronological order</p>
            <p><strong>4. Process Backlog:</strong> Trigger the daily quiz generation from oldest topic</p>
            <p><strong>5. View Results:</strong> Check cached quizzes to see generated content</p>
            <p><strong>💡 Timer Updates:</strong> Countdown refreshes when you process backlog or check quizzes</p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default BackendDemo