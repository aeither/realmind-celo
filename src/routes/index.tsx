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
    id: "celo-basics",
    title: "CELO Basics",
    description: "Learn the fundamentals of CELO blockchain and its Layer 2 capabilities",
    icon: "🌱",
    questions: 3,
    estimatedTime: "1-2 min",
    category: "CELO"
  },
  {
    id: "celo-l2-transition",
    title: "CELO L2 Transition",
    description: "Understanding CELO's evolution from L1 to L2 and key milestones",
    icon: "🚀",
    questions: 3,
    estimatedTime: "1-2 min",
    category: "CELO"
  },
  {
    id: "celo-features",
    title: "CELO Features",
    description: "Explore CELO's unique features like Fee Abstraction and native stablecoins",
    icon: "⚡",
    questions: 3,
    estimatedTime: "1-2 min",
    category: "CELO"
  },
  {
    id: "celo-development",
    title: "Building on CELO",
    description: "Learn about developing applications on CELO with tools and resources",
    icon: "🛠️",
    questions: 3,
    estimatedTime: "1-2 min",
    category: "CELO"
  },
  {
    id: "celo-ecosystem",
    title: "CELO Ecosystem",
    description: "Discover funding opportunities and community programs in CELO",
    icon: "🌍",
    questions: 3,
    estimatedTime: "1-2 min",
    category: "CELO"
  },
  {
    id: "celo-ai-agents",
    title: "AI on CELO",
    description: "Learn about AI applications and agents on the CELO blockchain",
    icon: "🤖",
    questions: 3,
    estimatedTime: "1-2 min",
    category: "CELO"
  }
];

function SplashScreen() {
  return (
    <div className="poster-section" style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "calc(100vh - 120px)",
      background: "hsl(var(--background))",
      color: "hsl(var(--foreground))",
      position: "relative"
    }}>
      <div style={{
        position: "absolute",
        top: "20px",
        right: "20px",
        width: "60px",
        height: "10px",
        background: "hsl(var(--celo-yellow))",
        border: "var(--outline-medium)"
      }}></div>
      
      <h1 className="text-headline-thin" style={{
        fontSize: "clamp(3rem, 10vw, 8rem)",
        fontFamily: "var(--font-headline)",
        fontWeight: "var(--font-weight-headline-thin)",
        letterSpacing: "-0.03em",
        marginBottom: "2rem",
        textAlign: "center",
        textTransform: "uppercase"
      }}>
        Real<span style={{ fontStyle: "italic" }}>mind</span>
      </h1>
      
      <div className="color-block-purple" style={{
        padding: "1.5rem 3rem",
        textAlign: "center",
        marginBottom: "3rem"
      }}>
        <p className="text-body-heavy" style={{
          fontSize: "clamp(1rem, 2vw, 1.4rem)",
          fontFamily: "var(--font-body)",
          fontWeight: "var(--font-weight-body-heavy)",
          textTransform: "uppercase",
          letterSpacing: "0.02em",
          color: "hsl(var(--celo-white))"
        }}>
          Interactive Learning System
        </p>
      </div>
      
      <div style={{
        width: "4px",
        height: "40px",
        background: "hsl(var(--celo-yellow))",
        border: "var(--outline-thin)",
        animation: "flash-raw 1.5s linear infinite"
      }}></div>
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
      paddingBottom: "120px",
      background: "hsl(var(--background))"
    }}>
      <GlobalHeader />

      {/* Main Content */}
      <div style={{ 
        paddingTop: "20px",
        padding: "clamp(1rem, 4vw, 2rem)", 
        maxWidth: "100%",
        margin: "0"
      }}>
        {/* Hero Section - Mobile Optimized */}
        <div className="poster-section" style={{
          textAlign: "left",
          marginBottom: "2rem",
          padding: "clamp(1rem, 4vw, 3rem)",
          background: "var(--gradient-hero)",
          position: "relative",
          minHeight: "auto",
          display: "block"
        }}>
          <div style={{
            position: "absolute",
            top: "15px",
            left: "15px",
            width: "clamp(40px, 8vw, 80px)",
            height: "clamp(4px, 1vw, 8px)",
            background: "hsl(var(--celo-yellow))"
          }}></div>
          
          <h1 className="text-headline-thin" style={{ 
            fontSize: "clamp(2rem, 12vw, 6rem)", 
            marginBottom: "clamp(1rem, 4vw, 1.5rem)",
            color: "hsl(var(--celo-white))",
            textTransform: "uppercase",
            lineHeight: "0.85",
            textShadow: "2px 2px 0px hsl(var(--celo-black))",
            wordBreak: "break-word",
            hyphens: "auto"
          }}>
            Learn<br className="sm:hidden" /> <span style={{ fontStyle: "italic", color: "hsl(var(--celo-yellow))" }}>& Earn</span>
          </h1>
          
          <div className="color-block-yellow" style={{
            display: "block",
            padding: "clamp(1rem, 4vw, 2.5rem)",
            maxWidth: "100%",
            width: "100%",
            border: "clamp(2px, 0.5vw, 3px) solid hsl(var(--celo-black))",
            boxShadow: "clamp(2px, 1vw, 4px) clamp(2px, 1vw, 4px) 0px hsl(var(--celo-black))",
            marginTop: "clamp(1rem, 3vw, 2rem)"
          }}>
            <p className="text-body-heavy" style={{
              fontSize: "clamp(0.9rem, 3.5vw, 1.4rem)",
              color: "hsl(var(--celo-black))",
              textTransform: "uppercase",
              letterSpacing: "clamp(0.01em, 0.5vw, 0.03em)",
              fontWeight: "var(--font-weight-body-black)",
              lineHeight: "clamp(1.2, 2vw, 1.3)",
              margin: "0",
              wordBreak: "break-word",
              hyphens: "auto"
            }}>
              Master blockchain knowledge through gamified quizzes
            </p>
          </div>
        </div>

        {/* Daily Quiz Section - More Compact */}
        {/* <div style={{
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
        </div> */}

        {/* AI Quiz Section */}
        {/* <div style={{
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
        </div> */}

        {/* Available Quizzes - Bold Grid */}
        <div style={{ marginBottom: "2rem" }}>
          <div className="color-block-purple" style={{ 
            padding: "1.5rem 2rem", 
            marginBottom: "2rem", 
            display: "inline-block" 
          }}>
            <h2 className="text-headline-thin" style={{ 
              fontSize: "clamp(1.5rem, 4vw, 2.5rem)", 
              color: "hsl(var(--celo-white))",
              textTransform: "uppercase"
            }}>
              Available <span style={{ fontStyle: "italic" }}>Quizzes</span>
            </h2>
          </div>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "1.5rem"
          }}>
            {AVAILABLE_QUIZZES.map((quiz, index) => (
              <div
                key={quiz.id}
                className="quiz-card-raw"
                style={{
                  background: "hsl(var(--celo-white))",
                  cursor: "pointer",
                  transition: "var(--transition-fast)",
                  position: "relative"
                }}
                onClick={() => navigate({ to: '/quiz-game', search: { quiz: quiz.id } })}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "hsl(var(--celo-yellow))";
                  e.currentTarget.style.color = "hsl(var(--celo-black))";
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 0px hsl(var(--celo-black))";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "hsl(var(--celo-white))";
                  e.currentTarget.style.color = "hsl(var(--celo-black))";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  position: "absolute",
                  top: "15px",
                  right: "15px",
                  width: "20px",
                  height: "4px",
                  background: `hsl(var(--celo-${index % 2 === 0 ? 'yellow' : 'green'}))`
                }}></div>
                
                <div style={{ 
                  fontSize: "2rem", 
                  marginBottom: "1rem",
                  fontWeight: "var(--font-weight-body-black)"
                }}>{quiz.icon}</div>
                
                <h3 className="text-body-black" style={{ 
                  fontSize: "clamp(1.1rem, 2vw, 1.4rem)", 
                  marginBottom: "1rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.02em"
                }}>{quiz.title}</h3>
                
                <p className="text-body-heavy" style={{ 
                  marginBottom: "1.5rem", 
                  fontSize: "0.85rem", 
                  lineHeight: "1.4",
                  opacity: 0.8
                }}>
                  {quiz.description}
                </p>
                
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  borderTop: "var(--outline-thin)",
                  paddingTop: "1rem"
                }}>
                  <span className="text-body-heavy" style={{ 
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.02em"
                  }}>
                    {quiz.questions} QUESTIONS • {quiz.estimatedTime.toUpperCase()}
                  </span>
                  <div className="color-block" style={{
                    background: "hsl(var(--celo-tan-2))",
                    padding: "0.3rem 0.6rem",
                    fontSize: "0.6rem",
                    fontWeight: "var(--font-weight-body-black)",
                    textTransform: "uppercase",
                    letterSpacing: "0.02em"
                  }}>
                    {quiz.category}
                  </div>
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