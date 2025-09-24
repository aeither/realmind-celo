import { createFileRoute } from '@tanstack/react-router'
import GlobalHeader from '../components/GlobalHeader'
import AIQuizGenerator from '../components/AIQuizGenerator'
import BottomNavigation from '../components/BottomNavigation'

function AIQuizPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      paddingBottom: '80px', // Space for bottom nav
      background: '#f9fafb'
    }}>
      <GlobalHeader />

      {/* Main Content */}
      <div style={{ 
        paddingTop: "70px", // Proper spacing for header
        padding: "1rem", 
        maxWidth: "1200px", 
        margin: "0 auto"
      }}>
        {/* Header Section */}
        <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          <h2 style={{ color: "#111827", fontSize: "1.4rem", marginBottom: "0.5rem" }}>
            Create Custom Quizzes
          </h2>
          <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
            Generate personalized quizzes on any topic using AI!
          </p>
        </div>
        
        {/* AI Quiz Generator Component with proper spacing */}
        <div style={{ padding: "0 0.5rem" }}>
          <AIQuizGenerator />
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export const Route = createFileRoute('/ai-quiz')({
  component: AIQuizPage,
})