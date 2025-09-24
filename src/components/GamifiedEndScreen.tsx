import { useState, useEffect } from 'react';

interface GamifiedEndScreenProps {
  score: number;
  totalQuestions: number;
  onClaim: () => void;
  onPlayAgain: () => void;
  onExit: () => void;
  isClaiming?: boolean;
  transactionHash?: string;
}

function GamifiedEndScreen({ 
  score, 
  totalQuestions, 
  onClaim, 
  onPlayAgain, 
  onExit,
  isClaiming = false,
  transactionHash
}: GamifiedEndScreenProps) {
  const [showBox, setShowBox] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);

  const percentage = Math.round((score / totalQuestions) * 100);
  const pointsEarned = score * 10;
  const bonusMultiplier = percentage >= 80 ? 2 : percentage >= 60 ? 1.5 : 1;
  const totalPoints = Math.floor(pointsEarned * bonusMultiplier);

  // Animation sequence
  useEffect(() => {
    const timer1 = setTimeout(() => setShowBox(true), 500);
    return () => clearTimeout(timer1);
  }, []);

  const handleOpenBox = () => {
    setIsOpening(true);
    setTimeout(() => {
      setIsOpened(true);
      setTimeout(() => setShowRewards(true), 500);
    }, 1000);
  };

  const handleClaim = () => {
    setHasClaimed(true);
    onClaim();
  };

  const getRewardEmoji = () => {
    if (percentage >= 90) return "🏆";
    if (percentage >= 80) return "🥇";
    if (percentage >= 70) return "🥈";
    if (percentage >= 60) return "🥉";
    return "📚";
  };

  const getRewardTitle = () => {
    if (percentage >= 90) return "Perfect!";
    if (percentage >= 80) return "Excellent!";
    if (percentage >= 70) return "Great Job!";
    if (percentage >= 60) return "Good Work!";
    return "Keep Learning!";
  };

  const getRewardColor = () => {
    if (percentage >= 90) return "#FFD700";
    if (percentage >= 80) return "#C0C0C0";
    if (percentage >= 70) return "#CD7F32";
    return "#4A90E2";
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "hsl(var(--background))",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Confetti Animation */}
      {showRewards && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1
        }}>
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: "8px",
                height: "8px",
                backgroundColor: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"][i % 5],
                borderRadius: "50%",
                animation: `confetti 3s ease-out ${i * 0.1}s forwards`,
                left: `${Math.random() * 100}%`,
                top: "-10px"
              }}
            />
          ))}
        </div>
      )}

      <div style={{
        background: "#ffffff",
        borderRadius: "24px",
        padding: "3rem",
        textAlign: "center",
        maxWidth: "600px",
        width: "100%",
        boxShadow: "var(--shadow-card)",
        backdropFilter: "blur(2px)",
        position: "relative",
        zIndex: 2,
        border: "1px solid hsl(var(--border))"
      }}>
        {/* Score Display */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{
            fontSize: "2.25rem",
            fontWeight: 800,
            color: "#111827",
            marginBottom: "1rem"
          }}>
            🎉 Quiz Completed!
          </h2>
          <div style={{
            fontSize: "4rem",
            marginBottom: "1rem",
            animation: showRewards ? "bounce 0.6s ease-in-out" : "none"
          }}>
            {getRewardEmoji()}
          </div>
          <h3 style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            color: getRewardColor(),
            marginBottom: "0.5rem"
          }}>
            {getRewardTitle()}
          </h3>
          <p style={{
            fontSize: "1.25rem",
            color: "#6b7280",
            marginBottom: "2rem"
          }}>
            {score}/{totalQuestions} ({percentage}%)
          </p>
        </div>

        {/* Surprise Box */}
        {!isOpened && (
          <div style={{
            marginBottom: "2rem",
            animation: showBox ? "slideInUp 0.5s ease-out" : "none",
            opacity: showBox ? 1 : 0,
            transform: showBox ? "translateY(0)" : "translateY(50px)"
          }}>
            <div
              onClick={!isOpening ? handleOpenBox : undefined}
              style={{
                width: "120px",
                height: "120px",
                margin: "0 auto",
                background: "linear-gradient(45deg, #FFD700, #FFA500)",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "3rem",
                cursor: isOpening ? "default" : "pointer",
                boxShadow: "0 8px 16px rgba(255, 215, 0, 0.3)",
                transition: "all 0.3s ease",
                animation: isOpening ? "shake 0.5s ease-in-out" : "pulse 2s infinite",
                transform: isOpening ? "scale(1.1)" : "scale(1)"
              }}
              onMouseEnter={(e) => {
                if (!isOpening) {
                  e.currentTarget.style.transform = "scale(1.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isOpening) {
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
            >
              {isOpening ? "🎁" : "📦"}
            </div>
            <p style={{
              marginTop: "1rem",
              fontSize: "1.2rem",
              color: "#6b7280",
              fontWeight: "600"
            }}>
              {isOpening ? "Opening..." : "Click to open your reward!"}
            </p>
          </div>
        )}

        {/* Rewards Display */}
        {showRewards && (
          <div style={{
            animation: "fadeInUp 0.5s ease-out",
            marginBottom: "2rem"
          }}>
            <div style={{
              background: "#f0fdf4",
              borderRadius: "16px",
              padding: "2rem",
              border: "2px solid #22c55e"
            }}>
              <h4 style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "#14532d",
                marginBottom: "1rem"
              }}>
                🍋 Rewards Earned!
              </h4>
              <div style={{
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
                marginBottom: "1rem"
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📝</div>
                  <div style={{ fontWeight: 700, color: "#374151" }}>Base Points</div>
                  <div style={{ fontSize: "1.2rem", color: "#16a34a" }}>{pointsEarned}</div>
                </div>
                <div style={{ fontSize: "1.5rem", color: "#6b7280" }}>×</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚡</div>
                  <div style={{ fontWeight: 700, color: "#374151" }}>Bonus</div>
                  <div style={{ fontSize: "1.2rem", color: "#22c55e" }}>{bonusMultiplier}x</div>
                </div>
                <div style={{ fontSize: "1.5rem", color: "#6b7280" }}>=</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🏆</div>
                  <div style={{ fontWeight: 700, color: "#374151" }}>Total</div>
                  <div style={{ fontSize: "1.5rem", color: "#16a34a", fontWeight: 800 }}>{totalPoints}</div>
                </div>
              </div>
              <p style={{
                fontSize: "0.95rem",
                color: "#374151",
                marginTop: "1rem"
              }}>
                {bonusMultiplier > 1 ? `You earned a ${bonusMultiplier}x bonus for your excellent performance!` : "Keep practicing to earn bonus multipliers!"}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "center",
          flexWrap: "wrap"
        }}>
          {showRewards && !hasClaimed && (
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              style={{
                backgroundColor: isClaiming ? "#a3e635" : "#58CC02",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                padding: "1rem 2rem",
                fontSize: "1.1rem",
                fontWeight: 700,
                cursor: isClaiming ? "not-allowed" : "pointer",
                boxShadow: "var(--shadow-button)",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                if (!isClaiming) {
                  e.currentTarget.style.backgroundColor = "#46a001";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isClaiming) {
                  e.currentTarget.style.backgroundColor = "#58CC02";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              {isClaiming ? "Claiming..." : "🎁 Claim Rewards"}
            </button>
          )}

          {hasClaimed && (
            <button
              onClick={onPlayAgain}
              style={{
                backgroundColor: "#0ea5e9",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "1rem 2rem",
                fontSize: "1.1rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 6px rgba(14, 165, 233, 0.3)",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#0284c7";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#0ea5e9";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              🔄 Play Again
            </button>
          )}

          <button
            onClick={onExit}
            style={{
              backgroundColor: "#e5e7eb",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "1rem 2rem",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#d1d5db";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#e5e7eb";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Exit Quiz
          </button>
        </div>

        {/* Transaction Hash */}
        {transactionHash && (
          <div style={{
            marginTop: "2rem",
            padding: "1rem",
            background: "#f0f9ff",
            borderRadius: "8px",
            border: "1px solid #0ea5e9"
          }}>
            <p style={{ fontWeight: 700, marginBottom: "0.5rem", color: "#0c4a6e" }}>
              🔗 Transaction Hash:
            </p>
            <p style={{
              fontSize: "0.8rem",
              wordBreak: "break-all",
              fontFamily: "monospace",
              color: "#0c4a6e",
              backgroundColor: "#ffffff",
              padding: "0.5rem",
              borderRadius: "4px"
            }}>
              {transactionHash}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: scale(1.1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(-5deg); }
          75% { transform: scale(1.1) rotate(5deg); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes confetti {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default GamifiedEndScreen; 