import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAccount, useDisconnect, useReadContract, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { getContractAddresses } from '../libs/constants';
import { quizGameABI } from '../libs/quizGameABI';
import { SUPPORTED_CHAIN, SUPPORTED_CHAINS, CURRENCY_CONFIG } from '../libs/supportedChains';

// Available quiz configurations
const QUIZ_CONFIGS = {
  'web3-basics': {
    id: 'web3-basics',
    title: 'Web3 Basics',
    description: 'Test your knowledge of blockchain fundamentals',
    questions: 5
  },
  'defi-fundamentals': {
    id: 'defi-fundamentals', 
    title: 'DeFi Fundamentals',
    description: 'Learn about decentralized finance protocols',
    questions: 5
  },
  'coredao': {
    id: 'coredao',
    title: 'Core DAO Ecosystem',
    description: 'Learn about the Core blockchain ecosystem',
    questions: 5
  }
} as const;

function QuizGameContract() {
  const { address, chain, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();

  // Get contract addresses based on current chain
  const contractAddresses = chain ? getContractAddresses(chain.id) : null;
  
  // Get currency config for current chain
  const currencyConfig = chain ? (CURRENCY_CONFIG[chain.id as keyof typeof CURRENCY_CONFIG] || CURRENCY_CONFIG.default) : CURRENCY_CONFIG.default;

  // State for quiz interaction (minimal state needed for this component)
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Contract reads
  const { data: userSession } = useReadContract({
    address: contractAddresses?.quizGameContractAddress as `0x${string}`,
    abi: quizGameABI,
    functionName: 'getQuizSession',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && !!contractAddresses,
    },
  });

  const { data: hasActiveQuiz } = useReadContract({
    address: contractAddresses?.quizGameContractAddress as `0x${string}`,
    abi: quizGameABI,
    functionName: 'hasActiveQuiz',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && !!contractAddresses,
    },
  });

  // Extract quiz ID from user session
  const activeQuizId = (userSession as any)?.quizId || '';

  // Contract writes
  const { writeContract: startQuiz, isPending: isStartPending, data: startHash } = useWriteContract();
  const { writeContract: completeQuiz, isPending: isCompletePending, data: completeHash } = useWriteContract();

  // Wait for transaction receipts
  const { data: startReceipt, isSuccess: isStartSuccess } = useWaitForTransactionReceipt({
    hash: startHash,
  });

  const { data: completeReceipt, isSuccess: isCompleteSuccess } = useWaitForTransactionReceipt({
    hash: completeHash,
  });

  // Show quiz when start is successful
  useEffect(() => {
    if (isStartSuccess) {
      toast.success('Quiz started! Good luck! 🎮');
      setShowQuiz(true);
    }
  }, [isStartSuccess]);

  // Reset quiz when claim is successful
  useEffect(() => {
    if (isCompleteSuccess) {
      toast.success('Rewards claimed! Check your wallet 🎁');
    }
  }, [isCompleteSuccess]);



  // Check if user is connected first
  if (!isConnected) {
    return (
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "2rem",
        textAlign: "center"
      }}>
        <h2 style={{ color: "#111827", marginBottom: "1rem" }}>Connect Your Wallet</h2>
        <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
          Please connect your wallet to play the quiz game.
        </p>
        <button 
          onClick={() => window.location.href = '/'}
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
    );
  }

  // Check if user is on a supported chain
  const isCorrectChain = chain ? SUPPORTED_CHAINS.some(supportedChain => supportedChain.id === chain.id) : false;

  // If not on correct chain, show network switch options
  if (!isCorrectChain) {
    return (
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "2rem",
        textAlign: "center"
      }}>
        <h2 style={{ color: "#111827", marginBottom: "1rem" }}>Wrong Network</h2>
        <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
          Please switch to {SUPPORTED_CHAIN.name} to play the quiz game.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "2rem" }}>
          <button 
            onClick={() => switchChain({ chainId: SUPPORTED_CHAIN.id })}
            style={{
              backgroundColor: "#58CC02",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 1.5rem",
              fontSize: "0.9rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
          >
            Switch to {SUPPORTED_CHAIN.name}
          </button>
        </div>
        <button 
          onClick={() => disconnect()}
          style={{
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "0.75rem 1.5rem",
            fontSize: "0.9rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.3s ease"
          }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  // If user has active session, show the quiz
  if (hasActiveQuiz && activeQuizId) {
    const activeQuizConfig = QUIZ_CONFIGS[activeQuizId as keyof typeof QUIZ_CONFIGS];
    
    return (
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "2rem",
        textAlign: "center"
      }}>
        <div style={{
          background: "#f0fdf4",
          border: "1px solid #22c55e",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "2rem",
          textAlign: "left"
        }}>
          <h4 style={{ margin: "0 0 0.5rem 0", color: "#15803d" }}>🔄 Active Quiz Session</h4>
          <p style={{ margin: "0 0 1rem 0", color: "#374151", fontSize: "0.9rem" }}>
            You have an active quiz session: <strong>{activeQuizConfig?.title || activeQuizId}</strong>
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link
              to="/quiz-game"
              search={{ quiz: activeQuizId }}
              style={{
                backgroundColor: "#58CC02",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.3s ease",
                textDecoration: "none",
                display: "inline-block"
              }}
            >
              Continue Quiz
            </Link>
            <button
              onClick={() => {
                if (!contractAddresses) return;
                completeQuiz({
                  address: contractAddresses.quizGameContractAddress as `0x${string}`,
                  abi: quizGameABI,
                  functionName: 'completeQuiz',
                  args: [BigInt(Math.floor(Math.random() * 100) + 1)],
                });
              }}
              disabled={isCompletePending}
              style={{
                backgroundColor: isCompletePending ? "#9ca3af" : "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: isCompletePending ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                opacity: isCompletePending ? 0.6 : 1
              }}
            >
              {isCompletePending ? "Completing..." : "Complete Session"}
            </button>
          </div>
        </div>
      </div>
    );
  }



  // Main quiz interface
  return (
    <div style={{
      maxWidth: "800px",
      margin: "0 auto",
      padding: "2rem"
    }}>
      <h1 style={{ 
        color: "hsl(var(--primary))", 
        textAlign: "center", 
        marginBottom: "2rem",
        fontSize: "2rem",
        fontWeight: 800
      }}>
        🍋 Realmind Quiz Game
      </h1>

      {/* Game Rules */}
      <div style={{
        background: "#ffffff",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "2rem",
        border: "1px solid hsl(var(--border))",
        boxShadow: "var(--shadow-card)"
      }}>
        <h3 style={{ color: "#111827", marginBottom: "1rem", fontWeight: 800 }}>📋 How It Works:</h3>
        <ul style={{ 
          color: "#374151", 
          lineHeight: "1.7",
          paddingLeft: "1.5rem",
          margin: 0
        }}>
          <li>🎯 Choose a quiz topic below</li>
          <li>📝 Answer all questions in the quiz</li>
          <li>✅ Get all answers correct for bonus tokens (10-90%)</li>
          <li>🪙 Receive XP points</li>
          <li>⏰ Complete within 1 hour of starting</li>
        </ul>
      </div>

      {/* Available Quizzes */}
      <div style={{
        background: "#ffffff",
        borderRadius: "12px",
        padding: "2rem",
        marginBottom: "2rem",
        border: "1px solid hsl(var(--border))",
        boxShadow: "var(--shadow-card)"
      }}>
        <h3 style={{ color: "#111827", marginBottom: "1.5rem", textAlign: "center", fontWeight: 800 }}>
          🎮 Select a Quiz
        </h3>
        
        <div style={{ 
          display: "grid", 
          gap: "1rem", 
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))"
        }}>
          {Object.values(QUIZ_CONFIGS).map((quiz) => (
            <Link
              key={quiz.id}
              to="/quiz-game"
              search={{ quiz: quiz.id }}
              style={{
                background: "#ffffff",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                padding: "1.5rem",
                textDecoration: "none",
                transition: "all 0.3s ease",
                display: "block"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "hsl(var(--quiz-selected))";
                e.currentTarget.style.borderColor = "hsl(var(--primary))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.borderColor = "hsl(var(--border))";
              }}
            >
              <h4 style={{ color: "#111827", marginBottom: "0.5rem", fontWeight: 700 }}>{quiz.title}</h4>
              <p style={{ color: "#374151", fontSize: "0.9rem", margin: "0 0 0.5rem 0" }}>
                {quiz.description}
              </p>
              <p style={{ color: "#6b7280", fontSize: "0.8rem", margin: 0 }}>
                {quiz.questions} questions
              </p>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}

export default QuizGameContract;
