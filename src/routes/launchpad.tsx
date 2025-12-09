import { createFileRoute, useNavigate } from '@tanstack/react-router'
import GlobalHeader from '../components/GlobalHeader'
import BottomNavigation from '../components/BottomNavigation'

function LaunchpadPage() {
  const navigate = useNavigate()

  const tiles = [
    {
      title: 'Profile',
      description: 'View your wallet identity and Farcaster profile.',
      icon: '👤',
      path: '/profile',
      accent: '#eef2ff',
    },
    {
      title: 'Aave',
      description: 'Deposit and borrow with the Realmind vault.',
      icon: '🏦',
      path: '/aave',
      accent: '#ecfeff',
    },
    {
      title: 'Swap',
      description: 'Swap tokens quickly on CELO.',
      icon: '🔄',
      path: '/swap',
      accent: '#fef3c7',
    },
    {
      title: 'More coming soon',
      description: 'New quests and tools are on the way.',
      icon: '✨',
      path: undefined,
      accent: '#f3f4f6',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px', background: 'hsl(var(--background))' }}>
      <GlobalHeader />

      <div
        style={{
          paddingTop: '90px',
          padding: 'clamp(1rem, 3vw, 1.5rem)',
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            marginBottom: '1.25rem',
            background: 'hsl(var(--celo-white))',
            border: '3px solid hsl(var(--celo-black))',
            borderRadius: '16px',
            padding: '1.2rem',
            boxShadow: '6px 6px 0px hsl(var(--celo-black))',
          }}
        >
          <p
            style={{
              margin: 0,
              textTransform: 'uppercase',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'hsl(var(--celo-black))',
            }}
          >
            Realmind Launchpad
          </p>
          <h1 style={{ margin: '0.35rem 0 0 0', fontSize: 'clamp(1.8rem, 5vw, 2.4rem)' }}>
            Jump into the app experiences
          </h1>
          <p style={{ margin: '0.35rem 0 0 0', color: 'hsl(var(--celo-brown))', fontWeight: 600 }}>
            Quick links to profile, DeFi tools, swaps, and upcoming modules.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
          }}
        >
          {tiles.map((tile) => {
            const disabled = !tile.path
            return (
              <div
                key={tile.title}
                style={{
                  background: tile.accent,
                  border: '3px solid hsl(var(--celo-black))',
                  borderRadius: '14px',
                  padding: '1rem',
                  boxShadow: '4px 4px 0px hsl(var(--celo-black))',
                }}
              >
                <div style={{ fontSize: '1.6rem' }}>{tile.icon}</div>
                <h3 style={{ margin: '0.4rem 0 0.2rem 0' }}>{tile.title}</h3>
                <p style={{ margin: 0, color: '#4b5563', fontWeight: 600 }}>{tile.description}</p>
                <button
                  onClick={() => tile.path && navigate({ to: tile.path })}
                  disabled={disabled}
                  style={{
                    marginTop: '0.8rem',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '2px solid hsl(var(--celo-black))',
                    background: disabled ? '#e5e7eb' : 'white',
                    color: disabled ? '#9ca3af' : 'hsl(var(--celo-black))',
                    fontWeight: 800,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  {disabled ? 'Stay tuned' : 'Open →'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}

export const Route = createFileRoute('/launchpad')({
  component: LaunchpadPage,
})
