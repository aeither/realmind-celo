import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'

function LandingPage() {
  return (
    <motion.div className="min-h-screen bg-background" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="max-w-6xl mx-auto p-8">
        {/* Hero Section */}
        <motion.div className="text-center py-16 quiz-card rounded-3xl mb-12" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
          <motion.div className="text-8xl mb-6" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }}>🏛️</motion.div>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Welcome to Realmind
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Master blockchain knowledge through gamified quizzes and earn real rewards on Celo and Base networks.
            Challenge yourself, climb leaderboards, and get rewarded for learning!
          </p>
          <motion.div className="flex gap-4 justify-center flex-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <Link
              to="/contract"
              className="px-8 py-4 bg-gradient-primary text-primary-foreground rounded-2xl text-lg font-semibold 
                         quiz-button-glow hover:scale-105 transition-all duration-300 animate-bounce-in"
              style={{ animationDelay: '200ms' }}
            >
              🎮 Start Playing
            </Link>

            <Link
              to="/contract"
              className="px-6 py-3 bg-muted text-muted-foreground border border-border rounded-xl 
                         text-base font-medium hover:bg-secondary hover:text-foreground hover:scale-105 
                         transition-all duration-300 animate-bounce-in"
              style={{ animationDelay: '600ms' }}
            >
              🔧 Debug
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
      className="quiz-card rounded-2xl p-6 text-center hover:scale-105 transition-all duration-300 animate-bounce-in group"
      style={{ animationDelay: delay }}
    >
      <div className="text-5xl mb-4 group-hover:animate-celebrate">{icon}</div>
      <h3 className="text-xl font-bold text-primary mb-3">
        {title}
      </h3>
      <p className="text-muted-foreground leading-relaxed text-sm">
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