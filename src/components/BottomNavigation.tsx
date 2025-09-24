import { useNavigate, useLocation } from '@tanstack/react-router'

export default function BottomNavigation() {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: '🏠',
      path: '/'
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      icon: '🏆',
      path: '/leaderboard'
    },
    {
      id: 'ai-quiz',
      label: 'AI Quiz',
      icon: '🤖',
      path: '/ai-quiz'
    }
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid #e5e7eb',
      padding: '0.25rem 0',
      paddingBottom: `calc(1rem + env(safe-area-inset-bottom, 0px))`,
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)'
    }}>
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => navigate({ to: item.path })}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            padding: '0.75rem 0.5rem',
            background: isActive(item.path) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            color: isActive(item.path) ? '#3b82f6' : '#6b7280',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            width: '70px',
            height: '60px',
            position: 'relative',
            transform: isActive(item.path) ? 'translateY(-2px)' : 'translateY(0)'
          }}
          onMouseEnter={(e) => {
            if (!isActive(item.path)) {
              e.currentTarget.style.background = 'rgba(107, 114, 128, 0.1)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive(item.path)) {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.transform = 'translateY(0)'
            }
          }}
        >
          <span style={{ 
            fontSize: '1.5rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isActive(item.path) ? 'scale(1.1)' : 'scale(1)'
          }}>
            {item.icon}
          </span>
          <span style={{ 
            fontSize: '0.65rem', 
            fontWeight: isActive(item.path) ? '600' : '500',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            textAlign: 'center',
            lineHeight: '1.2'
          }}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  )
}
