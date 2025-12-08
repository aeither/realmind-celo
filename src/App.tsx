import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { WagmiProvider, cookieToInitialState } from 'wagmi'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { AaveProvider } from '@aave/react'
import { base } from 'wagmi/chains'
import { routeTree } from './routeTree.gen'
import { config } from './wagmi'
import { FarcasterProvider } from './contexts/FarcasterContext'
import { aaveClient } from './aaveClient'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const queryClient = new QueryClient()

function App() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  // Get cookie state for wallet persistence
  const cookie = typeof document !== 'undefined' ? document.cookie : ''
  const initialState = cookie ? cookieToInitialState(config, cookie) : undefined

  return (
    <FarcasterProvider>
      <WagmiProvider config={config} initialState={initialState}>
        <QueryClientProvider client={queryClient}>
          <AaveProvider client={aaveClient}>
            <OnchainKitProvider
              apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY}
              chain={base}
            >
              <RouterProvider router={router} />
              <Toaster
              theme="light"
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  color: '#1f2937',
                  borderRadius: '12px'
                },
              }}
            />
            </OnchainKitProvider>
          </AaveProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </FarcasterProvider>
  )
}

export default App
