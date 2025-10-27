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
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      path: '/profile'
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      icon: '🏆',
      path: '/leaderboard'
    },
    // {
    //   id: 'ai-quiz',
    //   label: 'AI Quiz',
    //   icon: '🤖',
    //   path: '/ai-quiz'
    // }
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'hsl(var(--celo-white))',
      border: 'var(--outline-thick)',
      borderBottom: 'none',
      padding: '0.5rem 0',
      paddingBottom: `calc(1.5rem + env(safe-area-inset-bottom, 0px))`,
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'stretch'
    }}>
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => navigate({ to: item.path })}
          className={isActive(item.path) ? "color-block-yellow" : ""}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem',
            padding: '1rem 0.8rem',
            background: isActive(item.path) ? 'hsl(var(--celo-yellow))' : 'hsl(var(--celo-white))',
            border: isActive(item.path) ? 'var(--outline-medium)' : 'var(--outline-thin)',
            cursor: 'pointer',
            color: isActive(item.path) ? 'hsl(var(--celo-black))' : 'hsl(var(--celo-black))',
            transition: 'var(--transition-fast)',
            minWidth: '80px',
            height: '70px',
            fontFamily: 'var(--font-body)',
            fontWeight: 'var(--font-weight-body-black)',
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
          }}
          onMouseEnter={(e) => {
            if (!isActive(item.path)) {
              e.currentTarget.style.background = 'hsl(var(--celo-yellow))'
              e.currentTarget.style.color = 'hsl(var(--celo-black))'
              e.currentTarget.style.border = 'var(--outline-medium)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive(item.path)) {
              e.currentTarget.style.background = 'hsl(var(--celo-white))'
              e.currentTarget.style.color = 'hsl(var(--celo-black))'
              e.currentTarget.style.border = 'var(--outline-thin)'
            }
          }}
        >
          <span style={{ 
            fontSize: '1.2rem',
            fontWeight: 'var(--font-weight-body-black)',
            transition: 'var(--transition-fast)',
            display: 'block',
            marginBottom: '0.2rem'
          }}>
            {item.icon}
          </span>
          <span style={{ 
            fontSize: '0.6rem', 
            fontFamily: 'var(--font-body)',
            fontWeight: 'var(--font-weight-body-black)',
            transition: 'var(--transition-fast)',
            textAlign: 'center',
            lineHeight: '1',
            letterSpacing: '0.02em',
            textTransform: 'uppercase'
          }}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  )
}
