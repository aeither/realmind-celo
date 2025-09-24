import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'

function LandingPage() {
  return (
    <motion.div className="min-h-screen bg-background" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="max-w-6xl mx-auto p-8">
        {/* Hero Section - Poster-like */}
        <motion.div className="poster-section" style={{ 
          textAlign: "left", 
          padding: "clamp(4rem, 10vw, 8rem)", 
          marginBottom: "4rem",
          background: "var(--gradient-hero)",
          position: "relative"
        }} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
          <div style={{
            position: "absolute",
            top: "30px",
            left: "30px",
            fontSize: "4rem",
            opacity: 0.3
          }}>🏛️</div>
          
          <h1 className="text-headline-thin" style={{
            fontSize: "clamp(3rem, 10vw, 8rem)",
            marginBottom: "2rem",
            color: "hsl(var(--celo-white))",
            textTransform: "uppercase",
            letterSpacing: "-0.03em"
          }}>
            Welcome to <span style={{ fontStyle: "italic" }}>Real</span>mind
          </h1>
          
          <div className="color-block-yellow" style={{
            padding: "2rem 3rem",
            marginBottom: "3rem",
            maxWidth: "700px"
          }}>
            <p className="text-body-heavy" style={{
              fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
              color: "hsl(var(--celo-black))",
              textTransform: "uppercase",
              letterSpacing: "0.01em",
              lineHeight: "1.3"
            }}>
              Master blockchain knowledge through gamified quizzes and earn real rewards on Celo networks
            </p>
          </div>
          
          <motion.div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <Link
              to="/contract"
              className="btn-primary-industrial"
              style={{
                padding: "1.5rem 3rem",
                fontSize: "1.1rem",
                fontFamily: "var(--font-body)",
                fontWeight: "var(--font-weight-body-black)",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                textDecoration: "none",
                transition: "var(--transition-fast)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "hsl(var(--celo-yellow))";
                e.currentTarget.style.color = "hsl(var(--celo-black))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "hsl(var(--celo-black))";
                e.currentTarget.style.color = "hsl(var(--celo-yellow))";
              }}
            >
              🎮 START PLAYING
            </Link>

            <Link
              to="/contract"
              className="btn-industrial"
              style={{
                padding: "1.5rem 2.5rem",
                fontSize: "1rem",
                textDecoration: "none",
                transition: "var(--transition-fast)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "hsl(var(--celo-yellow))";
                e.currentTarget.style.color = "hsl(var(--celo-black))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "hsl(var(--celo-white))";
                e.currentTarget.style.color = "hsl(var(--celo-black))";
              }}
            >
              🔧 DEBUG
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <FeatureCard
          icon="🎮"
          title="Onchain Quiz Game"
          description="Play blockchain quizzes with real crypto rewards. Pay to play, earn up to 190% back based on performance!"
          delay="200ms"
        />
        <FeatureCard
          icon="🧠"
          title="Learn & Earn"
          description="Master Web3, DeFi, and Tezos concepts through interactive quizzes with instant feedback."
          delay="400ms"
        />
        <FeatureCard
          icon="🏆"
          title="Leaderboards"
          description="Compete with other learners globally and climb seasonal rankings for extra rewards."
          delay="600ms"
        />
        <FeatureCard
          icon="🪙"
          title="Token Rewards"
          description="Earn TK1 tokens for completing quizzes, with bonus multipliers for perfect scores!"
          delay="800ms"
        />
      </div>

      {/* How It Works */}
      <div className="quiz-card rounded-3xl p-12 text-center animate-bounce-in" style={{ animationDelay: '1000ms' }}>
        <h2 className="text-4xl font-bold text-primary mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <StepCard step="1" title="Connect" description="Connect your wallet to Celo or Base network" />
          <StepCard step="2" title="Choose" description="Select from Web3, DeFi, or Tezos quizzes" />
          <StepCard step="3" title="Play" description="Answer questions and earn tokens" />
          <StepCard step="4" title="Claim" description="Get up to 190% returns for perfect scores!" />
        </div>
      </div>

      {/* Final CTA */}
      <div className="text-center py-16 animate-bounce-in" style={{ animationDelay: '1200ms' }}>
        <h3 className="text-3xl font-bold text-foreground mb-6">Ready to Test Your Knowledge?</h3>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join the Realmind community and start earning rewards for learning blockchain concepts!
        </p>
        <Link
          to="/contract"
          className="inline-block px-12 py-6 bg-gradient-primary text-primary-foreground rounded-3xl 
                       text-xl font-bold quiz-button-glow hover:scale-110 transition-all duration-300 
                       animate-pulse-glow"
        >
          🚀 Start Your Journey
        </Link>
      </div>
    </motion.div>
  );
}

function FeatureCard({ icon, title, description, delay }: {
  icon: string;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div
      className="quiz-card-raw"
      style={{ 
        animationDelay: delay,
        textAlign: "left",
        background: "hsl(var(--celo-white))",
        cursor: "pointer",
        transition: "var(--transition-fast)",
        position: "relative"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "hsl(var(--celo-yellow))";
        e.currentTarget.style.color = "hsl(var(--celo-black))";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "hsl(var(--celo-white))";
        e.currentTarget.style.color = "hsl(var(--celo-black))";
      }}
    >
      <div style={{
        position: "absolute",
        top: "15px",
        right: "15px",
        width: "15px",
        height: "3px",
        background: "hsl(var(--celo-yellow))"
      }}></div>
      
      <div style={{ 
        fontSize: "2.5rem", 
        marginBottom: "1.5rem",
        fontWeight: "var(--font-weight-body-black)"
      }}>{icon}</div>
      
      <h3 className="text-body-black" style={{
        fontSize: "clamp(1.1rem, 2vw, 1.3rem)",
        marginBottom: "1rem",
        textTransform: "uppercase",
        letterSpacing: "0.02em"
      }}>
        {title}
      </h3>
      
      <p className="text-body-heavy" style={{
        fontSize: "0.8rem",
        lineHeight: "1.4",
        opacity: 0.8
      }}>
        {description}
      </p>
    </div>
  );
}

function StepCard({ step, title, description }: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center group">
      <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center 
                      text-2xl font-bold mx-auto mb-4 quiz-button-glow group-hover:animate-celebrate 
                      transition-all duration-300">
        {step}
      </div>
      <h4 className="text-lg font-bold text-foreground mb-2">
        {title}
      </h4>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export const Route = createFileRoute('/landing')({
  component: LandingPage,
}) 