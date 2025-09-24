import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { toast } from 'sonner'
import { quizGameABI } from '../libs/quizGameABI'
import { getContractAddresses } from '../libs/constants'
import { SUPPORTED_CHAIN, SUPPORTED_CHAINS, CURRENCY_CONFIG } from '../libs/supportedChains'
import GlobalHeader from '../components/GlobalHeader'
import { AIQuizGenerator } from '../libs/aiQuizGenerator'

interface QuizSearchParams {
  quiz?: string
  mode?: string
  data?: string
}

// Quiz configurations
const QUIZ_CONFIGS = {
  'web3-basics': {
    id: 'web3-basics',
    title: 'Web3 Basics',
    description: 'Test your knowledge of blockchain fundamentals',
    questions: [
      {
        question: "What is the primary purpose of a blockchain?",
        options: ["To store data", "To create a decentralized, immutable ledger", "To process payments", "To host websites"],
        correct: 1
      },
      {
        question: "What does 'HODL' mean in cryptocurrency?",
        options: ["Hold On for Dear Life", "Hold", "High Order Data Logic", "Hash of Digital Ledger"],
        correct: 1
      },
      {
        question: "What is a smart contract?",
        options: ["A legal document", "Self-executing code on blockchain", "A cryptocurrency", "A wallet"],
        correct: 1
      }
    ]
  },
  'crypto-trading': {
    id: 'crypto-trading',
    title: 'Crypto Trading',
    description: 'Learn about trading strategies, market analysis, and risk management',
    questions: [
      {
        question: "What is a 'bull market' in cryptocurrency?",
        options: ["A market where prices are falling", "A market where prices are rising", "A market with high volatility", "A market with low trading volume"],
        correct: 1
      },
      {
        question: "What does 'FOMO' stand for in trading?",
        options: ["Fear of Missing Out", "Fear of Market Order", "Fast Order Market Option", "Financial Order Management"],
        correct: 0
      },
      {
        question: "What is 'DCA' in cryptocurrency trading?",
        options: ["Daily Crypto Analysis", "Dollar Cost Averaging", "Digital Currency Arbitrage", "Direct Crypto Access"],
        correct: 1
      }
    ]
  },
  'defi-protocols': {
    id: 'defi-protocols',
    title: 'DeFi Protocols',
    description: 'Explore decentralized finance protocols, yield farming, and liquidity pools',
    questions: [
      {
        question: "What is 'yield farming' in DeFi?",
        options: ["Growing crops on blockchain", "Earning rewards by providing liquidity", "Mining cryptocurrency", "Trading tokens"],
        correct: 1
      },
      {
        question: "What is an 'AMM' in DeFi?",
        options: ["Automated Market Maker", "Advanced Mining Method", "Asset Management Module", "Automated Money Market"],
        correct: 0
      },
      {
        question: "What is 'impermanent loss'?",
        options: ["Loss from holding tokens too long", "Loss from providing liquidity to pools", "Loss from trading fees", "Loss from network fees"],
        correct: 1
      }
    ]
  }
} as const

function QuizGame() {
  const navigate = useNavigate()
  const { quiz: quizId, mode, data } = useSearch({ from: '/quiz-game' }) as QuizSearchParams
  const { address, chain, isConnected } = useAccount()
  const { switchChain } = useSwitchChain()

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<string[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [aiScore, setAiScore] = useState(0)
  const [aiAnswers, setAiAnswers] = useState<string[]>([])
  const [gameResult, setGameResult] = useState<'user_wins' | 'ai_wins' | 'tie' | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)
  const [justCompletedQuiz, setJustCompletedQuiz] = useState(false)
  const [lastUserAnswerCorrect, setLastUserAnswerCorrect] = useState<boolean | null>(null)
  const [lastAiAnswerCorrect, setLastAiAnswerCorrect] = useState<boolean | null>(null)
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false)
  const [isCompletingAiSession, setIsCompletingAiSession] = useState(false)

  // Function to restart the quiz in AI challenge mode
  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0)
    setUserAnswers([])
    setQuizCompleted(false)
    setScore(0)
    setAiScore(0)
    setAiAnswers([])
    setGameResult(null)
    setQuizStarted(true)
  }

  const contractAddresses = chain ? getContractAddresses(chain.id) : null
  
  // Get currency config for current chain
  const currencyConfig = chain ? (CURRENCY_CONFIG[chain.id as keyof typeof CURRENCY_CONFIG] || CURRENCY_CONFIG.default) : CURRENCY_CONFIG.default
  
  // Handle AI-generated quizzes
  let quizConfig = null
  
  // Redirect ai-generated to web3-basics (default fallback)
  if (quizId === 'ai-generated') {
    toast.info('Redirecting to Web3 Basics quiz...')
    navigate({ to: '/quiz-game', search: { quiz: 'web3-basics' } })
    return null
  }
  
  if (quizId === 'ai-custom' && data) {
    try {
      quizConfig = AIQuizGenerator.decodeQuizFromUrl(data)
    } catch (error) {
      console.error('Failed to decode AI quiz data:', error)
      toast.error('Invalid quiz data. Please generate a new quiz.')
    }
  } else if (quizId) {
    quizConfig = QUIZ_CONFIGS[quizId as keyof typeof QUIZ_CONFIGS] || null
  }
  
  const isAiChallengeMode = mode === 'ai-challenge'

  // AI bot logic - 50% accuracy, no timing pressure
  const getAiAnswer = (question: any) => {
    // AI has a 50% chance of getting the answer correct
    const correctChance = 0.50
    const willAnswerCorrectly = Math.random() < correctChance
    
    if (willAnswerCorrectly) {
      return question.options[question.correct]
    } else {
      // Pick a random wrong answer
      const wrongIndices = question.options
        .map((_: any, index: number) => index)
        .filter((index: number) => index !== question.correct)
      const randomWrongIndex = wrongIndices[Math.floor(Math.random() * wrongIndices.length)]
      return question.options[randomWrongIndex]
    }
  }

  // Contract reads
  const { data: userSession } = useReadContract({
    address: contractAddresses?.quizGameContractAddress as `0x${string}`,
    abi: quizGameABI,
    functionName: 'getQuizSession',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && !!contractAddresses,
      refetchInterval: 10000, // Refetch every 10 seconds instead of constantly
      staleTime: 5000, // Consider data fresh for 5 seconds
      retry: 1, // Reduce retry attempts
    },
  });

  const { data: hasActiveQuiz } = useReadContract({
    address: contractAddresses?.quizGameContractAddress as `0x${string}`,
    abi: quizGameABI,
    functionName: 'hasActiveQuiz',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && !!contractAddresses,
      refetchInterval: 10000, // Refetch every 10 seconds instead of constantly
      staleTime: 5000, // Consider data fresh for 5 seconds
      retry: 1, // Reduce retry attempts
    },
  });

  const { data: defaultEntryPrice } = useReadContract({
    address: contractAddresses?.quizGameContractAddress as `0x${string}`,
    abi: quizGameABI,
    functionName: 'defaultEntryPrice',
    query: {
      enabled: !!contractAddresses,
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 10000, // Consider data fresh for 10 seconds
      retry: 1,
    },
  });

  // Extract quiz ID from user session
  const activeQuizId = userSession && typeof userSession === 'object' && 'quizId' in userSession ? (userSession as any).quizId : '';

  // Get entry amount from contract or fallback to hardcoded value
  const entryAmount = defaultEntryPrice ? formatEther(defaultEntryPrice) : '0.00005';

  // Contract writes
  const { writeContract: startQuiz, isPending: isStartPending, data: startHash } = useWriteContract()
  const { writeContract: completeQuiz, isPending: isCompletePending, data: completeHash } = useWriteContract()

  // Wait for transaction receipts
  const { isSuccess: isStartSuccess, isLoading: isStartConfirming } = useWaitForTransactionReceipt({
    hash: startHash,
  })

  const { isSuccess: isCompleteSuccess, isLoading: isCompleteConfirming } = useWaitForTransactionReceipt({
    hash: completeHash,
  })

  // Combined transaction states
  const isStartTransactionPending = isStartPending || isStartConfirming
  const isCompleteTransactionPending = isCompletePending || isCompleteConfirming


  // Effects
  useEffect(() => {
    if (isStartSuccess) {
      toast.success(isAiChallengeMode ? 'AI Challenge started! Beat the bot! 🤖' : 'Quiz started! Good luck! 🎮')
      // Start the quiz timer only after transaction success
      setQuizStarted(true)
    }
  }, [isStartSuccess, isAiChallengeMode])

  useEffect(() => {
    if (isCompleteSuccess) {
      if (isCompletingAiSession) {
        toast.success('AI session completed successfully!')
        setIsCompletingAiSession(false) // Reset the flag
      } else {
        toast.success('Rewards claimed! Check your wallet 🎁')
      }
      setJustCompletedQuiz(true) // Mark that user just completed a quiz
      
      // Navigate to home page immediately after successful claim
      navigate({ to: '/' })
    }
  }, [isCompleteSuccess, navigate, isCompletingAiSession])

  // Reset the justCompletedQuiz flag after 10 seconds to prevent permanent bypass
  useEffect(() => {
    if (justCompletedQuiz) {
      const timer = setTimeout(() => {
        setJustCompletedQuiz(false)
      }, 10000) // Reset after 10 seconds
      
      return () => clearTimeout(timer)
    }
  }, [justCompletedQuiz])

  // Handle quiz start
  const handleStartQuiz = () => {
    if (!address) {
      toast.error('Please connect your wallet first')
      return
    }
    
    if (!quizConfig) {
      toast.error('No quiz configuration found')
      return
    }
    
    try {
      const actualAmount = parseEther(entryAmount)
      
      // For AI-generated quizzes, use a generic quiz ID for the contract
      const contractQuizId = quizId === 'ai-custom' ? 'ai-generated' : quizConfig.id
      
      // Expected correct answers is the total number of questions
      const expectedCorrectAnswers = BigInt(quizConfig.questions.length)
      
      if (!contractAddresses) return;
      startQuiz({
        address: contractAddresses.quizGameContractAddress as `0x${string}`,
        abi: quizGameABI,
        functionName: 'startQuiz',
        args: [contractQuizId, expectedCorrectAnswers],
        value: actualAmount,
      })
    } catch (error) {
      console.error('Error in handleStartQuiz:', error)
      toast.error('Failed to start quiz. Please try again.')
    }
  }

  // Handle quiz answer submission
  const handleQuizAnswer = (answer: string) => {
    if (!quizConfig) return
    
    const newAnswers = [...userAnswers]
    newAnswers[currentQuestionIndex] = answer
    setUserAnswers(newAnswers)

    // Check if user got it right
    const currentQuestion = quizConfig.questions[currentQuestionIndex]
    const userCorrect = answer === currentQuestion.options[currentQuestion.correct]
    setLastUserAnswerCorrect(userCorrect)
    
    if (userCorrect) {
      setScore(prev => prev + 1)
    }

    let aiCorrect = false
    if (isAiChallengeMode) {
      // AI also answers the question (50% chance of being correct)
      const aiAnswer = getAiAnswer(currentQuestion)
      const newAiAnswers = [...aiAnswers]
      newAiAnswers[currentQuestionIndex] = aiAnswer
      setAiAnswers(newAiAnswers)
      
      // Check if AI got it right
      aiCorrect = aiAnswer === currentQuestion.options[currentQuestion.correct]
      setLastAiAnswerCorrect(aiCorrect)
      
      if (aiCorrect) {
        setAiScore(prev => prev + 1)
      }
    }

    // Show feedback for 2 seconds
    setShowAnswerFeedback(true)
    setTimeout(() => {
      setShowAnswerFeedback(false)
      setLastUserAnswerCorrect(null)
      setLastAiAnswerCorrect(null)
      
      if (currentQuestionIndex < quizConfig.questions.length - 1) {
        // Move to next question
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        // Quiz completed - use the already tracked scores
        if (isAiChallengeMode) {
          const finalUserScore = score + (userCorrect ? 1 : 0)
          const finalAiScore = aiScore + (aiCorrect ? 1 : 0)
          
          setScore(finalUserScore)
          setAiScore(finalAiScore)
          
          if (finalUserScore > finalAiScore) {
            setGameResult('user_wins')
          } else if (finalAiScore > finalUserScore) {
            setGameResult('ai_wins')
          } else {
            setGameResult('tie')
          }
        } else {
          // Regular quiz mode - use tracked score
          setScore(score + (userCorrect ? 1 : 0))
        }
        setQuizCompleted(true)
      }
    }, 2000)
  }

  // Handle complete quiz on blockchain
  const handleCompleteQuiz = () => {
    if (!address || !quizConfig) return
    
    // Pass the actual score (number of correct answers) to the contract
    const correctAnswerCount = BigInt(score)
    
    if (!contractAddresses) return;
    completeQuiz({
      address: contractAddresses.quizGameContractAddress as `0x${string}`,
      abi: quizGameABI,
      functionName: 'completeQuiz',
      args: [correctAnswerCount],
    })
  }
  
  // Check if user is connected first
  if (!isConnected) {
    return (
      <motion.div style={{}} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <GlobalHeader />
        <div style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "2rem",
          textAlign: "center"
        }}>
          <h2 style={{ color: "#111827", marginBottom: "1rem" }}>Connect Your Wallet</h2>
          <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
            Please connect your wallet to play this quiz.
          </p>
          <button 
            onClick={() => navigate({ to: '/' })}
            style={{
              backgroundColor: "#58CC02",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Go to Home
          </button>
        </div>
      </motion.div>
    )
  }

  // Check if user is on a supported chain
  const isCorrectChain = chain ? SUPPORTED_CHAINS.some(supportedChain => supportedChain.id === chain.id) : false

  if (!isCorrectChain) {
    return (
      <motion.div style={{}} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <GlobalHeader />
        <div style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "2rem",
          textAlign: "center"
        }}>
          <h2 style={{ color: "#111827", marginBottom: "1rem" }}>Wrong Network</h2>
          <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
            Please switch to {SUPPORTED_CHAIN.name} to play this quiz.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button 
              onClick={() => switchChain({ chainId: SUPPORTED_CHAIN.id })}
              style={{
                backgroundColor: "#58CC02",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Switch to {SUPPORTED_CHAIN.name}
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  // Redirect if no quiz ID or invalid quiz ID
  if (!quizId || !quizConfig) {
    return (
      <motion.div style={{}} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <GlobalHeader />
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem", textAlign: "center" }}>
          <h2 style={{ color: "#111827", marginBottom: "1rem" }}>Quiz Not Found</h2>
          <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
            The requested quiz could not be found.
          </p>
          <button 
            onClick={() => navigate({ to: '/' })}
            style={{
              backgroundColor: "#58CC02",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Back to Quiz Selection
          </button>
        </div>
      </motion.div>
    )
  }

  // Check if user has an active quiz session but for a different quiz
  // Don't show blocking screen if user just completed a quiz (prevents showing after claiming rewards)
  const shouldSkipDueToCompletion = justCompletedQuiz
  
  // Don't show blocking screen during transaction processing (user should see completion screen with "Claiming..." status)
  const shouldSkipDuringTransaction = isCompleteTransactionPending
  
  // Don't show blocking screen during active gameplay (user is already playing a quiz)
  const shouldSkipDuringGameplay = quizStarted || quizCompleted || isStartSuccess
  
  // Handle direct completion of AI-generated quiz session
  const handleCompleteAiSession = () => {
    if (!address || !contractAddresses) return
    
    // Set flag to keep showing AI session screen
    setIsCompletingAiSession(true)
    
    // Complete with 0 score (no reward)
    const correctAnswerCount = BigInt(0)
    
    completeQuiz({
      address: contractAddresses.quizGameContractAddress as `0x${string}`,
      abi: quizGameABI,
      functionName: 'completeQuiz',
      args: [correctAnswerCount],
    })
  }
  
  if ((hasActiveQuiz && activeQuizId && activeQuizId !== quizId && !shouldSkipDueToCompletion && !shouldSkipDuringTransaction && !shouldSkipDuringGameplay) || isCompletingAiSession) {
    // Special handling for AI-generated quiz sessions
    if (activeQuizId === 'ai-generated' || isCompletingAiSession) {
      // Show the AI session recovery screen
      return (
        <motion.div style={{}} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <GlobalHeader />
          <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem", textAlign: "center" }}>
            <h2 style={{ color: "#111827", marginBottom: "1rem" }}>AI Quiz Session Found</h2>
            <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
              You have an active AI-generated quiz session, but the original quiz data cannot be recovered. 
              Complete it now without rewards to start fresh.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button 
                onClick={handleCompleteAiSession}
                disabled={isCompleteTransactionPending}
                style={{
                  backgroundColor: isCompleteTransactionPending ? "#9ca3af" : "#58CC02",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.75rem 1.5rem",
                  fontSize: "1rem",
                  fontWeight: 700,
                  cursor: isCompleteTransactionPending ? "not-allowed" : "pointer",
                  opacity: isCompleteTransactionPending ? 0.6 : 1
                }}
              >
                {isCompleteTransactionPending ? (isCompletePending ? "Confirm in wallet..." : "Completing...") : "Complete Session"}
              </button>
              <button 
                onClick={() => navigate({ to: '/' })}
                style={{
                  backgroundColor: "#e5e7eb",
                  color: "#111827",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.75rem 1.5rem",
                  fontSize: "1rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Back to Selection
              </button>
            </div>
          </div>
        </motion.div>
      )
    }
    
    return (
      <motion.div style={{}} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <GlobalHeader />
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem", textAlign: "center" }}>
          <h2 style={{ color: "#111827", marginBottom: "1rem" }}>Active Quiz Session</h2>
          <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
            You have an active quiz session for "{String(activeQuizId)}". Please complete it first.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button 
              onClick={() => navigate({ to: '/quiz-game', search: { quiz: activeQuizId } })}
              style={{
                backgroundColor: "#58CC02",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Continue Active Quiz
            </button>
            <button 
              onClick={() => navigate({ to: '/' })}
              style={{
                backgroundColor: "#e5e7eb",
                color: "#111827",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Back to Selection
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  // If quiz is completed, show end screen
  if (quizCompleted && quizConfig) {
    const percentage = Math.round((score / quizConfig.questions.length) * 100)
    
    if (isAiChallengeMode) {
      // AI Challenge completion screen
      return (
        <div style={{}}>
          <GlobalHeader />
          <div style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "2rem",
            textAlign: "center"
          }}>
            <div style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "3rem",
              border: "1px solid hsl(var(--border))",
              boxShadow: "var(--shadow-card)"
            }}>
              {gameResult === 'ai_wins' && (
                <>
                  <h2 style={{ color: "#ef4444", marginBottom: "1rem", fontSize: "1.75rem", fontWeight: 800 }}>
                    🤖 AI Bot Wins!
                  </h2>
                  <p style={{ color: "#374151", marginBottom: "2rem", fontSize: "1.05rem" }}>
                    The AI bot scored <strong>{aiScore}</strong> while you scored <strong>{score}</strong> out of {quizConfig.questions.length}.
                  </p>
                  <p style={{ color: "#ef4444", marginBottom: "2rem", fontSize: "1.1rem", fontWeight: 600 }}>
                    No bonus XP - you need to beat the AI to earn extra rewards!
                  </p>
                  <button
                    onClick={handleCompleteQuiz}
                    disabled={isCompleteTransactionPending}
                    style={{
                      backgroundColor: isCompleteTransactionPending ? "#9ca3af" : "#58CC02",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      padding: "1rem 2rem",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      cursor: isCompleteTransactionPending ? "not-allowed" : "pointer",
                      opacity: isCompleteTransactionPending ? 0.6 : 1
                    }}
                  >
                    {isCompleteTransactionPending ? (isCompletePending ? "Confirm in wallet..." : "Completing...") : "✅ Complete Quiz Anyway"}
                  </button>
                </>
              )}
              
              {gameResult === 'user_wins' && (
                <>
                  <h2 style={{ color: "#22c55e", marginBottom: "1rem", fontSize: "1.75rem", fontWeight: 800 }}>
                    🎉 You Beat the AI!
                  </h2>
                  <p style={{ color: "#374151", marginBottom: "2rem", fontSize: "1.05rem" }}>
                    You scored <strong>{score}</strong> while the AI scored <strong>{aiScore}</strong> out of {quizConfig.questions.length}.
                  </p>
                  <div style={{
                    background: "#f0fdf4",
                    border: "1px solid #22c55e",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    marginBottom: "2rem"
                  }}>
                    <h3 style={{ color: "#14532d", marginBottom: "1rem", fontWeight: 800 }}>🪙 Your Rewards</h3>
                    <p style={{ color: "#374151", margin: "0.5rem 0" }}>
                      Tokens: {entryAmount} {currencyConfig.symbol} × 1000 = {parseFloat(entryAmount) * 1000} XP3
                    </p>
                    <p style={{ color: "#374151", margin: "0.5rem 0" }}>
                      AI Challenge Bonus: 20% extra for beating the AI!
                    </p>
                  </div>
                  <button
                    onClick={handleCompleteQuiz}
                    disabled={isCompleteTransactionPending}
                    style={{
                      backgroundColor: isCompleteTransactionPending ? "#9ca3af" : "#58CC02",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      padding: "1rem 2rem",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      cursor: isCompleteTransactionPending ? "not-allowed" : "pointer",
                      opacity: isCompleteTransactionPending ? 0.6 : 1
                    }}
                  >
                    {isCompleteTransactionPending ? (isCompletePending ? "Confirm in wallet..." : "Confirming on blockchain...") : "🎁 Claim Rewards"}
                  </button>
                </>
              )}
              
              {gameResult === 'tie' && (
                <>
                  <h2 style={{ color: "#f59e0b", marginBottom: "1rem", fontSize: "1.75rem", fontWeight: 800 }}>
                    🤝 It's a Tie!
                  </h2>
                  <p style={{ color: "#374151", marginBottom: "2rem", fontSize: "1.05rem" }}>
                    Both you and the AI scored <strong>{score}</strong> out of {quizConfig.questions.length}. Great job!
                  </p>
                  <div style={{
                    background: "#fff7ed",
                    border: "1px solid #f59e0b",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    marginBottom: "2rem"
                  }}>
                    <h3 style={{ color: "#92400e", marginBottom: "1rem", fontWeight: 800 }}>🪙 Your Rewards</h3>
                    <p style={{ color: "#374151", margin: "0.5rem 0" }}>
                      No bonus for ties - beat the AI to earn extra XP!
                    </p>
                  </div>
                  <button
                    onClick={handleCompleteQuiz}
                    disabled={isCompleteTransactionPending}
                    style={{
                      backgroundColor: isCompleteTransactionPending ? "#9ca3af" : "#58CC02",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      padding: "1rem 2rem",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      cursor: isCompleteTransactionPending ? "not-allowed" : "pointer",
                      opacity: isCompleteTransactionPending ? 0.6 : 1
                    }}
                  >
                    {isCompleteTransactionPending ? (isCompletePending ? "Confirm in wallet..." : "Confirming on blockchain...") : "🎁 Claim Rewards"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )
    } else {
      // Regular quiz completion screen
      return (
        <div style={{}}>
          <GlobalHeader />
          <div style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "2rem",
            textAlign: "center"
          }}>
            <div style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "3rem",
              border: "1px solid hsl(var(--border))",
              boxShadow: "var(--shadow-card)"
            }}>
              <h2 style={{ color: "#111827", marginBottom: "1rem", fontSize: "1.75rem", fontWeight: 800 }}>
                🎉 Quiz Completed!
              </h2>
              <p style={{ color: "#374151", marginBottom: "2rem", fontSize: "1.05rem" }}>
                You scored <strong>{score} out of {quizConfig.questions.length}</strong> questions correctly ({percentage}%).
              </p>
              
              <div style={{
                background: "#f0fdf4",
                border: "1px solid #22c55e",
                borderRadius: "12px",
                padding: "1.5rem",
                marginBottom: "2rem"
              }}>
                <h3 style={{ color: "#14532d", marginBottom: "1rem", fontWeight: 800 }}>🪙 Your Rewards</h3>
                <p style={{ color: "#374151", margin: "0.5rem 0" }}>
                  Bonus: {score === quizConfig.questions.length ? '20% additional tokens for all correct answers!' : 'Better luck next time!'}
                </p>
              </div>

              <button
                onClick={handleCompleteQuiz}
                disabled={isCompletePending}
                style={{
                  backgroundColor: isCompletePending ? "#9ca3af" : "#58CC02",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "1rem 2rem",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  cursor: isCompletePending ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  minWidth: "140px",
                  opacity: isCompletePending ? 0.6 : 1
                }}
              >
                {isCompletePending ? "Claiming..." : "🎁 Claim Rewards"}
              </button>
            </div>
          </div>
        </div>
      )
    }
  }

  // If quiz is active and user has started it, show current question
  // Special case: Allow web3-basics to start immediately when user has AI session (no payment needed)
  const shouldStartWebBasicsForAiSession = hasActiveQuiz && activeQuizId === 'ai-generated' && quizId === 'web3-basics'
  
  if ((isStartSuccess || (hasActiveQuiz && activeQuizId === quizId) || shouldStartWebBasicsForAiSession) && quizConfig && !quizCompleted) {
    const currentQuestion = quizConfig.questions[currentQuestionIndex]
    
    return (
      <div style={{}}>
        <GlobalHeader />
        <div style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "clamp(1rem, 4vw, 2rem)"
        }}>
          {isAiChallengeMode && (
            <div style={{
              background: "#f8fafc",
              border: "2px solid #3b82f6",
              borderRadius: "12px",
              padding: "1rem",
              marginBottom: "1rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "2rem"
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 600 }}>YOU</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#22c55e" }}>{score}</div>
                {showAnswerFeedback && lastUserAnswerCorrect !== null && (
                  <div style={{ fontSize: "0.7rem", marginTop: "0.25rem", fontWeight: 600, color: lastUserAnswerCorrect ? "#22c55e" : "#ef4444" }}>
                    {lastUserAnswerCorrect ? "✓ Correct!" : "✗ Wrong"}
                  </div>
                )}
              </div>
              <div style={{ fontSize: "1.2rem", color: "#6b7280", fontWeight: 600 }}>VS</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 600 }}>AI BOT</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ef4444" }}>{aiScore}</div>
                {showAnswerFeedback && lastAiAnswerCorrect !== null && (
                  <div style={{ fontSize: "0.7rem", marginTop: "0.25rem", fontWeight: 600, color: lastAiAnswerCorrect ? "#22c55e" : "#ef4444" }}>
                    {lastAiAnswerCorrect ? "✓ Correct!" : "✗ Wrong"}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <h2 style={{ 
            color: "#111827", 
            marginBottom: "2rem", 
            textAlign: "center", 
            fontWeight: 800,
            fontSize: "clamp(1.25rem, 5vw, 1.5rem)"
          }}>
            {isAiChallengeMode ? '🤖 AI Challenge' : (quizId === 'ai-custom' ? '🤖 ' + quizConfig.title : quizConfig.title)} - Question {currentQuestionIndex + 1} of {quizConfig.questions.length}
          </h2>
          
          
          <div style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "clamp(1.5rem, 5vw, 2rem)",
            border: "1px solid hsl(var(--border))",
            boxShadow: "var(--shadow-card)",
            marginBottom: "2rem"
          }}>
            <h3 style={{ 
              color: "#111827", 
              marginBottom: "1.5rem", 
              fontSize: "clamp(1rem, 4vw, 1.25rem)", 
              fontWeight: 700,
              lineHeight: "1.4"
            }}>
              {currentQuestion.question}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {currentQuestion.options.map((option, index) => {
                const isCorrectAnswer = index === currentQuestion.correct
                const showCorrectAnswer = showAnswerFeedback && lastUserAnswerCorrect !== null
                
                return (
                  <button
                    key={index}
                    onClick={() => !showAnswerFeedback && handleQuizAnswer(option)}
                    disabled={showAnswerFeedback}
                    style={{
                      backgroundColor: showCorrectAnswer && isCorrectAnswer ? "#dcfce7" : "#ffffff",
                      border: `2px solid ${showCorrectAnswer && isCorrectAnswer ? "#22c55e" : "hsl(var(--border))"}`,
                      borderRadius: "8px",
                      padding: "clamp(0.75rem, 3vw, 1rem)",
                      fontSize: "clamp(0.9rem, 3.5vw, 1rem)",
                      cursor: showAnswerFeedback ? "not-allowed" : "pointer",
                      transition: "all 0.3s ease",
                      textAlign: "left",
                      color: "#111827",
                      lineHeight: "1.4",
                      minHeight: "clamp(3rem, 12vw, 4rem)",
                      opacity: showAnswerFeedback ? 0.8 : 1,
                      position: "relative"
                    }}
                    onMouseEnter={(e) => {
                      if (!showAnswerFeedback) {
                        e.currentTarget.style.backgroundColor = "hsl(var(--quiz-selected))"
                        e.currentTarget.style.borderColor = "hsl(var(--primary))"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!showAnswerFeedback) {
                        e.currentTarget.style.backgroundColor = "#ffffff"
                        e.currentTarget.style.borderColor = "hsl(var(--border))"
                      } else if (isCorrectAnswer) {
                        e.currentTarget.style.backgroundColor = "#dcfce7"
                        e.currentTarget.style.borderColor = "#22c55e"
                      }
                    }}
                  >
                    {option}
                    {showCorrectAnswer && isCorrectAnswer && (
                      <span style={{
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#22c55e",
                        fontWeight: "bold"
                      }}>✓</span>
                    )}
                  </button>
                )
              })}
            </div>
            
            {showAnswerFeedback && (
              <div style={{
                marginTop: "1rem",
                textAlign: "center",
                color: "#6b7280",
                fontSize: "0.9rem"
              }}>
                Next question in {Math.ceil(2)}s...
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Main quiz start interface
  return (
    <motion.div style={{}} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <GlobalHeader />
      <div style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "clamp(1rem, 4vw, 2rem)"
      }}>
        <div style={{
          background: "#ffffff",
          borderRadius: "20px",
          padding: "2rem",
          margin: "1rem",
          textAlign: "center",
          maxWidth: "400px",
          marginLeft: "auto",
          marginRight: "auto"
        }}>
          {/* Title - Clean and Minimal */}
          <h1 style={{ 
            color: "#000000", 
            marginBottom: "0.5rem", 
            fontSize: "1.75rem", 
            fontWeight: "300",
            letterSpacing: "-0.02em"
          }}>
            {quizConfig?.title || "Quiz"}
          </h1>
          
          {/* Mode Selection - Clear State */}
          <div style={{
            background: "#f8f9fa",
            borderRadius: "12px",
            padding: "1rem",
            marginBottom: "2rem",
            border: "1px solid #e9ecef"
          }}>
            <div style={{ fontSize: "0.9rem", color: "#666666", marginBottom: "1rem" }}>
              Play → Earn XP → Climb Leaderboard → Win Rewards
            </div>
            
            {/* Mode Toggle */}
            <div style={{ 
              display: "flex", 
              gap: "0.5rem", 
              marginBottom: "1rem",
              background: "#ffffff",
              borderRadius: "8px",
              padding: "4px",
              border: "1px solid #e1e5e9"
            }}>
              <button
                onClick={() => navigate({ to: '/quiz-game', search: { quiz: quizId, ...(data && { data }) } })}
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  backgroundColor: !isAiChallengeMode ? "#000000" : "transparent",
                  color: !isAiChallengeMode ? "white" : "#666666"
                }}
              >
                Normal
              </button>
              <button
                onClick={() => navigate({ to: '/quiz-game', search: { quiz: quizId, mode: 'ai-challenge', ...(data && { data }) } })}
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  backgroundColor: isAiChallengeMode ? "#007AFF" : "transparent",
                  color: isAiChallengeMode ? "white" : "#666666"
                }}
              >
                AI Challenge
              </button>
            </div>
            
            {/* Mode Description */}
            <div style={{ fontSize: "0.8rem", color: "#999999", textAlign: "center" }}>
              {isAiChallengeMode ? (
                "Compete vs AI bot • Beat AI score for 20% bonus XP"
              ) : (
                `${quizConfig?.questions.length || 0} questions • 20% bonus for perfect score`
              )}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartQuiz}
            disabled={isStartTransactionPending || !address}
            style={{
              backgroundColor: isStartTransactionPending || !address ? "#cccccc" : (isAiChallengeMode ? "#007AFF" : "#000000"),
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "1rem",
              fontSize: "1rem",
              fontWeight: "500",
              cursor: isStartTransactionPending || !address ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              opacity: isStartTransactionPending || !address ? 0.6 : 1,
              width: "100%"
            }}
          >
            {isStartTransactionPending ? "Starting..." : (isAiChallengeMode ? "Start AI Challenge" : "Start Quiz")}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export const Route = createFileRoute('/quiz-game')({
  component: QuizGame,
  validateSearch: (search): QuizSearchParams => ({
    quiz: search.quiz as string,
    mode: search.mode as string,
    data: search.data as string,
  }),
})