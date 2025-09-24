import { createFileRoute } from '@tanstack/react-router'

// AI Quiz functionality temporarily disabled
// TODO: Re-enable when AI quiz feature is ready

function AIQuizPage() {
  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f9fafb'
    }}>
      <h2 style={{ 
        color: '#111827', 
        fontSize: '1.5rem', 
        marginBottom: '1rem',
        fontWeight: '600'
      }}>
        AI Quiz Generator
      </h2>
      <p style={{ 
        color: '#6b7280', 
        fontSize: '1rem',
        marginBottom: '2rem'
      }}>
        This feature is temporarily disabled.
      </p>
      <p style={{ 
        color: '#9ca3af', 
        fontSize: '0.875rem'
      }}>
        Check out our CELO quizzes instead!
      </p>
    </div>
  )
}

export const Route = createFileRoute('/ai-quiz')({
  component: AIQuizPage,
})