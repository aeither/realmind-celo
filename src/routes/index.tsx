import { sdk } from '@farcaster/miniapp-sdk'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import GlobalHeader from '../components/GlobalHeader'
import BottomNavigation from '../components/BottomNavigation'
import { SUPPORTED_CHAIN_IDS } from '../libs/supportedChains'

interface Quiz {
  id: string;
  title: string;
  description: string;
  icon: string;
  questions: number;
  estimatedTime: string;
  category: string;
}

const AVAILABLE_QUIZZES: Quiz[] = [
  {
    id: "web3-basics",
    title: "Web3 Fundamentals",
    description: "Test your knowledge of blockchain, cryptocurrencies, and decentralized applications",
    icon: "🔗",
    questions: 3,
    estimatedTime: "1-2 min",
    category: "Web3"
  },
  {
    id: "crypto-trading",
    title: "Crypto Trading",
    description: "Learn about trading strategies, market analysis, and risk management",
    icon: "📈",
    questions: 3,
    estimatedTime: "1-2 min",
    category: "Finance"
  },
  {
    id: "defi-protocols",
    title: "DeFi Protocols",
    description: "Explore decentralized finance protocols, yield farming, and liquidity pools",
    icon: "🏦",
    questions: 3,
    estimatedTime: "1-2 min",
    category: "DeFi"
  }
];

function SplashScreen() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "calc(100vh - 80px)",
        background: "hsl(var(--background))",
        color: "hsl(var(--foreground))",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: "2.25rem",
          fontWeight: 800,
          marginBottom: "1rem",
          textAlign: "center",
        }}
      >
        🍋 Realmind
      </div>
      <div
        style={{
          fontSize: "1.2rem",
          marginBottom: "2rem",
          opacity: 0.9,
          textAlign: "center",
        }}
      >
        Interactive Learning Experience
      </div>
      <div
        style={{
          width: "40px",
          height: "40px",
          border: "3px solid rgba(16,24,40,0.1)",
          borderTop: "3px solid hsl(var(--primary))",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function HomePage() {
  const { chain, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [hasAttemptedChainSwitch, setHasAttemptedChainSwitch] = useState(false);
  const navigate = useNavigate();

  // Countdown timer state
  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [quizCreatedAt, setQuizCreatedAt] = useState<string | null>(null);
  const [currentQuizTitle, setCurrentQuizTitle] = useState<string>('');
  const [currentQuizDescription, setCurrentQuizDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  // Get backend URL from environment
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const initializeFarcasterSDK = async () => {
      try {
        // Initialize any app setup here if needed
        // Only call ready() when your UI is fully loaded
        await sdk.actions.ready();
        setIsAppReady(true);
      } catch (error) {
        console.error('Error initializing Farcaster SDK:', error);
        // Fallback: set app ready even if SDK fails
        setIsAppReady(true);
      }
    };

    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      initializeFarcasterSDK();
    }
  }, [isSDKLoaded]);

  // Countdown timer functions - resets at UTC 00:00
  const calculateCountdown = () => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0); // Next UTC midnight
    
    const timeDiff = tomorrow.getTime() - now.getTime();

    if (timeDiff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  };

  // Fetch current quiz and set countdown
  const fetchQuizInfo = async () => {
    try {
      const res = await fetch(`${backendUrl}/daily-quiz/cached`);
      const data = await res.json();
      
      if (data.success && data.quizzes && data.quizzes.length > 0) {
        const quiz = data.quizzes[0];
        setQuizCreatedAt(quiz.createdAt);
        setCurrentQuizTitle(quiz.title || 'Daily Quiz');
        setCurrentQuizDescription(quiz.description || 'Test your knowledge');
      }
    } catch (error) {
      console.error('Error fetching quiz info:', error);
    }
  };

  // Update countdown every second - resets at UTC 00:00
  useEffect(() => {
    const updateCountdown = () => {
      setCountdown(calculateCountdown());
    };

    updateCountdown(); // Initial update
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch quiz info on component mount
  useEffect(() => {
    fetchQuizInfo();
  }, []);

  // Auto-switch to supported chain if user is connected but on wrong chain
  useEffect(() => {
    const attemptChainSwitch = async () => {
      // Only attempt once to avoid loops
      if (hasAttemptedChainSwitch) return;
      
      // Only if user is connected
      if (!isConnected) return;
      
      // Only if user is on wrong chain
      const currentChainId = chain?.id;
      const supportedChainId = SUPPORTED_CHAIN_IDS[0]; // Get the main supported chain
      
      if (currentChainId && currentChainId !== supportedChainId) {
        try {
          console.log(`Auto-switching from chain ${currentChainId} to supported chain ${supportedChainId}`);
          setHasAttemptedChainSwitch(true); // Set this before switching to avoid loops
          
          await switchChain({ chainId: supportedChainId as 42220 | 8453 });
        } catch (error) {
          console.error('Failed to auto-switch chain:', error);
          // Don't reset hasAttemptedChainSwitch on error to avoid retry loops
        }
      }
    };

    attemptChainSwitch();
  }, [isConnected, chain?.id, switchChain, hasAttemptedChainSwitch]);

  // Start Daily Quiz function
  const startDailyQuiz = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/daily-quiz/cached`);
      const data = await res.json();
      
      if (data.success && data.quizzes && data.quizzes.length > 0) {
        const quiz = data.quizzes[0];
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
        };

        // UTF-8 safe base64 encoding
        const utf8ToBase64 = (str: string): string => {
          return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, 
            (match, p1) => String.fromCharCode(parseInt(p1, 16))
          ));
        };
        
        const encodedQuiz = utf8ToBase64(JSON.stringify(quizConfig));
        const quizUrl = `/quiz-game?quiz=ai-custom&data=${encodedQuiz}`;
        
        // Navigate to quiz
        navigate({ to: quizUrl });
      } else {
        console.error('No daily quiz available');
      }
    } catch (error) {
      console.error('Error starting daily quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen while SDK initializes
  if (!isAppReady) {
    return <SplashScreen />;
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      paddingBottom: "80px", // Space for bottom nav
      background: "#f9fafb"
    }}>
      <GlobalHeader />

      {/* Main Content */}
      <div style={{ 
        paddingTop: "70px", // Proper spacing for header
        padding: "1rem", 
        maxWidth: "1200px", 
        margin: "0 auto"
      }}>
        {/* Welcome Section - More Compact */}
        <div style={{
          textAlign: "center",
          marginBottom: "2rem"
        }}>
          <h2 style={{ fontSize: "1.8rem", marginBottom: "0.5rem", fontWeight: "bold", color: "#111827" }}>
            Interactive Learning
          </h2>
          <p style={{ fontSize: "1rem", color: "#6b7280", maxWidth: "400px", margin: "0 auto" }}>
            Test your knowledge and earn rewards
          </p>
        </div>

        {/* Daily Quiz Section - More Compact */}
        <div style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <h3 style={{ color: "#111827", fontSize: "1.2rem", margin: 0 }}>🎯 Daily Quiz</h3>
            {countdown && (
              <div style={{ color: "#6b7280", fontSize: "0.9rem", fontWeight: "bold" }}>
                Next: {countdown.hours.toString().padStart(2, '0')}:{countdown.minutes.toString().padStart(2, '0')}:{countdown.seconds.toString().padStart(2, '0')}
              </div>
            )}
          </div>
          
          <p style={{ color: "#6b7280", marginBottom: "1rem", fontSize: "0.9rem" }}>
            {currentQuizDescription || "Complete today's quiz to earn points!"}
          </p>
          
          <button
            onClick={startDailyQuiz}
            disabled={loading}
            style={{
              background: "#58CC02",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "all 0.3s ease",
              width: "100%"
            }}
          >
            {loading ? "Loading..." : "🚀 Start Daily Quiz"}
          </button>
        </div>

        {/* AI Quiz Section */}
        <div style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
        }}>
          <h3 style={{ color: "#111827", fontSize: "1.2rem", marginBottom: "0.5rem" }}>🤖 AI Quiz</h3>
          <p style={{ color: "#6b7280", marginBottom: "1rem", fontSize: "0.9rem" }}>
            Generate personalized quizzes on any topic
          </p>
          
          <button
            onClick={() => navigate({ to: '/ai-quiz' })}
            style={{
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.3s ease",
              width: "100%"
            }}
          >
            🧠 Generate AI Quiz
          </button>
        </div>

        {/* Available Quizzes - More Compact */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ color: "#111827", fontSize: "1.2rem", marginBottom: "1rem" }}>📚 Available Quizzes</h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1rem"
          }}>
            {AVAILABLE_QUIZZES.map((quiz) => (
              <div
                key={quiz.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "8px",
                  padding: "1rem",
                  border: "1px solid #e5e7eb",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
                }}
                onClick={() => navigate({ to: '/quiz-game', search: { quiz: quiz.id } })}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{quiz.icon}</div>
                <h4 style={{ color: "#111827", fontSize: "1rem", marginBottom: "0.25rem" }}>{quiz.title}</h4>
                <p style={{ color: "#6b7280", marginBottom: "0.75rem", fontSize: "0.8rem", lineHeight: "1.4" }}>
                  {quiz.description}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#6b7280", fontSize: "0.7rem" }}>
                    {quiz.questions} questions • {quiz.estimatedTime}
                  </span>
                  <span style={{
                    background: "#f3f4f6",
                    color: "#374151",
                    padding: "0.2rem 0.4rem",
                    borderRadius: "4px",
                    fontSize: "0.6rem"
                  }}>
                    {quiz.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

export const Route = createFileRoute('/')({
  component: HomePage,
})