import { createRootRoute, Outlet } from '@tanstack/react-router'
import GlobalHeader from '../components/GlobalHeader'

export const Route = createRootRoute({
  component: () => (
    <div style={{ 
      minHeight: '100vh',
      background: 'hsl(var(--background))',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <GlobalHeader />
      <main style={{ 
        flex: '1',
        paddingTop: 'clamp(70px, 8vw, 80px)',
        paddingBottom: 'clamp(60px, 10vw, 80px)',
        position: 'relative',
        background: 'hsl(var(--background))',
        minHeight: 'calc(100vh - 160px)'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'var(--gradient-hero)',
          zIndex: 1
        }}></div>
        <Outlet />
      </main>
      <div style={{
        position: 'fixed',
        bottom: '100px',
        right: '20px',
        width: '8px',
        height: '60px',
        background: 'hsl(var(--celo-purple))',
        border: 'var(--outline-thin)',
        zIndex: 10,
        display: 'none'
      }} className="hidden lg:block"></div>
    </div>
  ),
})