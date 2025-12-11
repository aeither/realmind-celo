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
  },
  {
    id: "celo-swap-bridging",
    title: "Swaps & Bridging",
    description: "Learn how to swap tokens and bridge assets safely on CELO",
    icon: "🔄",
    questions: 3,
    estimatedTime: "1-2 min",
    category: "CELO"
  },
  {
    id: "celo-lending-borrowing",
    title: "Lending & Borrowing",
    description: "Understand supplying liquidity and borrowing assets in CELO DeFi",
    icon: "💸",
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

function QuizPage() {
  const { chain, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
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
  const [isHowToPlayExpanded, setIsHowToPlayExpanded] = useState<boolean>(false);
  
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
        paddingBottom: "70px",
        background: "hsl(var(--background))"
      }}>
      <GlobalHeader />

      {/* Main Content */}
      <div style={{
        paddingTop: "80px",
        padding: "clamp(0.8rem, 3vw, 1.5rem)",
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        {/* Hero Section - Compact */}
        <div style={{
          textAlign: "center",
          marginBottom: "1.5rem",
          padding: "1.5rem",
          border: "3px solid hsl(var(--celo-black))",
          position: "relative",
          boxShadow: "4px 4px 0px hsl(var(--celo-black))",
          background: "hsl(var(--celo-yellow))"
        }}>
          <h1 className="text-headline-thin" style={{
            fontSize: "clamp(2rem, 8vw, 3.5rem)",
            marginBottom: "0.8rem",
            color: "hsl(var(--celo-black))",
            textTransform: "uppercase",
            lineHeight: "1",
            margin: "0"
          }}>
            Learn CELO, Earn Rewards
          </h1>

          <p className="text-body-heavy" style={{
            fontSize: "clamp(0.75rem, 2.5vw, 0.9rem)",
            color: "hsl(var(--celo-purple))",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
            fontWeight: "var(--font-weight-body-heavy)",
            lineHeight: "1.3",
            margin: "0"
          }}>
            Master CELO blockchain, Compete for the prize pool
          </p>
        </div>

        {/* How to Play - Expandable Section */}
        <div style={{ marginBottom: "1.5rem" }}>
          <button
            onClick={() => setIsHowToPlayExpanded(!isHowToPlayExpanded)}
            style={{
              width: "100%",
              background: "hsl(var(--celo-white))",
              border: "3px solid hsl(var(--celo-black))",
              padding: "1rem 1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              transition: "var(--transition-fast)",
              boxShadow: "3px 3px 0px hsl(var(--celo-black))"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "hsl(var(--celo-tan-2))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "hsl(var(--celo-white))";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <span style={{ fontSize: "1.5rem" }}>❓</span>
              <h3 className="text-body-black" style={{
                fontSize: "clamp(1rem, 3vw, 1.3rem)",
                margin: "0",
                textTransform: "uppercase",
                color: "hsl(var(--celo-black))"
              }}>
                How to Play
              </h3>
            </div>
            <span style={{
              fontSize: "1.5rem",
              transition: "var(--transition-fast)",
              transform: isHowToPlayExpanded ? "rotate(180deg)" : "rotate(0deg)",
              display: "inline-block"
            }}>
              ▼
            </span>
          </button>

          {isHowToPlayExpanded && (
            <div style={{
              background: "hsl(var(--celo-white))",
              border: "3px solid hsl(var(--celo-black))",
              borderTop: "none",
              padding: "1.5rem",
              boxShadow: "3px 3px 0px hsl(var(--celo-black))"
            }}>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.2rem"
              }}>
                {/* Step 1 */}
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{
                    background: "hsl(var(--celo-yellow))",
                    border: "3px solid hsl(var(--celo-black))",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <span className="text-body-black" style={{
                      fontSize: "1.2rem",
                      color: "hsl(var(--celo-black))"
                    }}>1</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 className="text-body-black" style={{
                      fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                      margin: "0 0 0.3rem 0",
                      textTransform: "uppercase",
                      color: "hsl(var(--celo-black))"
                    }}>
                      Play CELO Quizzes
                    </h4>
                    <p className="text-body-heavy" style={{
                      fontSize: "0.85rem",
                      margin: "0",
                      color: "hsl(var(--celo-brown))",
                      lineHeight: "1.4"
                    }}>
                      Choose from our curated CELO quizzes below and test your blockchain knowledge
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{
                    background: "hsl(var(--celo-yellow))",
                    border: "3px solid hsl(var(--celo-black))",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <span className="text-body-black" style={{
                      fontSize: "1.2rem",
                      color: "hsl(var(--celo-black))"
                    }}>2</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 className="text-body-black" style={{
                      fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                      margin: "0 0 0.3rem 0",
                      textTransform: "uppercase",
                      color: "hsl(var(--celo-black))"
                    }}>
                      Earn XP Points
                    </h4>
                    <p className="text-body-heavy" style={{
                      fontSize: "0.85rem",
                      margin: "0",
                      color: "hsl(var(--celo-brown))",
                      lineHeight: "1.4"
                    }}>
                      Complete quizzes to earn XP points and climb the leaderboard rankings
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{
                    background: "hsl(var(--celo-yellow))",
                    border: "3px solid hsl(var(--celo-black))",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <span className="text-body-black" style={{
                      fontSize: "1.2rem",
                      color: "hsl(var(--celo-black))"
                    }}>3</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 className="text-body-black" style={{
                      fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                      margin: "0 0 0.3rem 0",
                      textTransform: "uppercase",
                      color: "hsl(var(--celo-black))"
                    }}>
                      Claim Real CELO Rewards
                    </h4>
                    <p className="text-body-heavy" style={{
                      fontSize: "0.85rem",
                      margin: "0",
                      color: "hsl(var(--celo-brown))",
                      lineHeight: "1.4"
                    }}>
                      Top players share the prize pool and receive real CELO tokens as rewards
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Available Quizzes - Compact Grid */}
        <div style={{ marginBottom: "2rem" }}>
          <div className="color-block-purple" style={{
            padding: "0.8rem 1.5rem",
            marginBottom: "1.2rem",
            display: "inline-block",
            border: "3px solid hsl(var(--celo-black))",
            boxShadow: "3px 3px 0px hsl(var(--celo-black))"
          }}>
            <h2 className="text-headline-thin" style={{
              fontSize: "clamp(1.3rem, 4vw, 2rem)",
              color: "hsl(var(--celo-white))",
              textTransform: "uppercase",
              margin: "0"
            }}>
              Available <span style={{ fontStyle: "italic" }}>Quizzes</span>
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1rem"
          }}>
            {AVAILABLE_QUIZZES.map((quiz, index) => (
              <div
                key={quiz.id}
                className="quiz-card-raw"
                style={{
                  background: "hsl(var(--celo-white))",
                  cursor: "pointer",
                  transition: "var(--transition-fast)",
                  position: "relative",
                  border: "3px solid hsl(var(--celo-black))",
                  padding: "1rem",
                  boxShadow: "3px 3px 0px hsl(var(--celo-black))"
                }}
                onClick={() => navigate({ to: '/quiz-game', search: { quiz: quiz.id } })}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "hsl(var(--celo-yellow))";
                  e.currentTarget.style.color = "hsl(var(--celo-black))";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "5px 5px 0px hsl(var(--celo-black))";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "hsl(var(--celo-white))";
                  e.currentTarget.style.color = "hsl(var(--celo-black))";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "3px 3px 0px hsl(var(--celo-black))";
                }}
              >
                <div style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  width: "20px",
                  height: "4px",
                  background: `hsl(var(--celo-${index % 2 === 0 ? 'yellow' : 'green'}))`,
                  border: "2px solid hsl(var(--celo-black))"
                }}></div>

                <div style={{
                  fontSize: "2rem",
                  marginBottom: "0.6rem",
                  fontWeight: "var(--font-weight-body-black)"
                }}>{quiz.icon}</div>

                <h3 className="text-body-black" style={{
                  fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
                  marginBottom: "0.5rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                  lineHeight: "1.2"
                }}>{quiz.title}</h3>

                <p className="text-body-heavy" style={{
                  marginBottom: "0.8rem",
                  fontSize: "0.75rem",
                  lineHeight: "1.3",
                  color: "hsl(var(--celo-brown))"
                }}>
                  {quiz.description}
                </p>

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "2px solid hsl(var(--celo-black))",
                  paddingTop: "0.6rem",
                  marginTop: "auto"
                }}>
                  <span className="text-body-heavy" style={{
                    fontSize: "0.65rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                    color: "hsl(var(--celo-brown))"
                  }}>
                    {quiz.questions} Q • {quiz.estimatedTime.toUpperCase()}
                  </span>
                  <div className="color-block" style={{
                    background: "hsl(var(--celo-tan-2))",
                    padding: "0.3rem 0.5rem",
                    fontSize: "0.6rem",
                    fontWeight: "var(--font-weight-body-black)",
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                    border: "2px solid hsl(var(--celo-black))"
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

export const Route = createFileRoute('/quiz')({
  component: QuizPage,
})

