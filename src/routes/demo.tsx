import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { toast } from 'sonner'
import { quizGameABI } from '../libs/quizGameABI'
import { getContractAddresses } from '../libs/constants'
import GlobalHeader from '../components/GlobalHeader'

interface Task {
  id: number
  title: string
  description: string
  completed: boolean
  component: React.ReactNode
}

function DemoPage() {
  const { address, chain } = useAccount()
  const [currentStep, setCurrentStep] = useState(1)
  const [completedTasks, setCompletedTasks] = useState<number[]>([])
  const [autoPlay, setAutoPlay] = useState(false)

  const contractAddresses = chain ? getContractAddresses(chain.id) : null

  // Contract writes for demo
  const { writeContract: startQuiz, isPending: isStartPending, data: startHash } = useWriteContract()
  const { writeContract: completeQuiz, isPending: isCompletePending, data: completeHash } = useWriteContract()

  // Wait for transaction receipts
  const { isSuccess: isStartSuccess } = useWaitForTransactionReceipt({ hash: startHash })
  const { isSuccess: isCompleteSuccess } = useWaitForTransactionReceipt({ hash: completeHash })

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay) return

    const timers = [
      setTimeout(() => completeTask(1), 5000),  // Step 1: 5 seconds
      setTimeout(() => completeTask(2), 15000), // Step 2: 15 seconds
      setTimeout(() => completeTask(3), 25000), // Step 3: 25 seconds
      setTimeout(() => completeTask(4), 35000), // Step 4: 35 seconds
    ]

    return () => timers.forEach(timer => clearTimeout(timer))
  }, [autoPlay])

  // Effects for task completion
  useEffect(() => {
    if (isStartSuccess) {
      toast.success('Step 1 completed! 🎮')
      completeTask(1)
    }
  }, [isStartSuccess])

  useEffect(() => {
    if (isCompleteSuccess) {
      toast.success('Step 4 completed! 🎁')
      completeTask(4)
    }
  }, [isCompleteSuccess])

  const completeTask = (taskId: number) => {
    if (!completedTasks.includes(taskId)) {
      setCompletedTasks(prev => [...prev, taskId])
      setCurrentStep(Math.min(currentStep + 1, 4))
    }
  }

  const handleStartQuiz = () => {
    if (!address) return
    
    const actualAmount = parseEther('0.0001')
    
    // Demo quiz expects 3 questions to be answered correctly
    const expectedCorrectAnswers = BigInt(3)
    
    if (!contractAddresses) return;
    startQuiz({
      address: contractAddresses.quizGameContractAddress as `0x${string}`,
      abi: quizGameABI,
      functionName: 'startQuiz',
      args: ['demo-quiz', expectedCorrectAnswers],
      value: actualAmount,
    })
  }

  const handleCompleteQuiz = () => {
    if (!address) return
    
    if (!contractAddresses) return;
    completeQuiz({
      address: contractAddresses.quizGameContractAddress as `0x${string}`,
      abi: quizGameABI,
      functionName: 'completeQuiz',
      args: [BigInt(3)], // Perfect score for demo
    })
  }

  const tasks: Task[] = [
    {
      id: 1,
      title: "Solo Quiz",
      description: "Start and complete a quiz on-chain",
      completed: completedTasks.includes(1),
      component: (
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">🎮 Solo Quiz Demo</h3>
          <p className="mb-4">Start a quiz and earn tokens</p>
          <button
            onClick={handleStartQuiz}
            disabled={isStartPending}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50"
          >
            {isStartPending ? 'Starting...' : 'Start Quiz'}
          </button>
        </div>
      )
    },
    {
      id: 2,
      title: "PvP Duel",
      description: "Simulate a PvP quiz battle",
      completed: completedTasks.includes(2),
      component: (
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">⚔️ PvP Duel Demo</h3>
          <p className="mb-4">Battle with RedStone Oracle</p>
          <button
            onClick={() => completeTask(2)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 transition-all"
          >
            Simulate Duel
          </button>
        </div>
      )
    },
    {
      id: 3,
      title: "Guild System",
      description: "Create and manage a guild",
      completed: completedTasks.includes(3),
      component: (
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">🏰 Guild System Demo</h3>
          <p className="mb-4">Form a guild and start battle</p>
          <button
            onClick={() => completeTask(3)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 transition-all"
          >
            Create Guild
          </button>
        </div>
      )
    },
    {
      id: 4,
      title: "NFT Quiz",
      description: "Complete the final quiz and claim rewards",
      completed: completedTasks.includes(4),
      component: (
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">🎨 NFT Quiz Demo</h3>
          <p className="mb-4">Complete quiz and claim rewards</p>
          <button
            onClick={handleCompleteQuiz}
            disabled={isCompletePending}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50"
          >
            {isCompletePending ? 'Completing...' : 'Complete Quiz'}
          </button>
        </div>
      )
    }
  ]

  return (
    <div style={{ paddingTop: '70px' }}>
      <GlobalHeader />
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🎮 Realmind Demo</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Experience the full 4-step journey of Realmind
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${(completedTasks.length / 4) * 100}%` }}
            ></div>
          </div>
          
          {/* Task Counter */}
          <div className="text-2xl font-bold mb-6">
            {completedTasks.length}/4 Tasks Completed
          </div>

          {/* Auto Play Toggle */}
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              autoPlay 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {autoPlay ? 'Stop Auto Play' : 'Start Auto Play'}
          </button>
        </div>

        {/* Task Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`quiz-card rounded-2xl p-6 transition-all duration-300 ${
                task.completed 
                  ? 'ring-2 ring-green-500 bg-green-50' 
                  : currentStep === task.id 
                    ? 'ring-2 ring-primary scale-105' 
                    : 'hover:scale-105'
              }`}
            >
              <div className="flex items-center mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                  task.completed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {task.completed ? '✓' : task.id}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{task.title}</h3>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                </div>
              </div>
              
              {currentStep === task.id && !task.completed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {task.component}
                </motion.div>
              )}
              
              {task.completed && (
                <div className="text-center text-green-600 font-bold">
                  ✓ Completed!
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Completion Message */}
        {completedTasks.length === 4 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mt-8 p-6 bg-green-50 rounded-2xl border-2 border-green-200"
          >
            <h2 className="text-2xl font-bold text-green-800 mb-2">🎉 Demo Completed!</h2>
            <p className="text-green-700">
              You've successfully completed all 4 tasks of the Realmind demo!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/demo')({
  component: DemoPage,
})
