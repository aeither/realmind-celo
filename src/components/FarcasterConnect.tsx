import { useAccount, useConnect, useDisconnect, useConnectors } from 'wagmi'
import { Button } from './ui/Button'
import { useState } from 'react'
import WalletModal from './WalletModal'

function FarcasterConnect() {
  const { isConnected, address } = useAccount()
  const { connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const connectors = useConnectors()
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)

  const farcasterConnector = connectors.find(c => c.id === 'farcasterMiniApp' || c.id === 'farcaster')
  const hasMultipleConnectors = connectors.length > 1

  if (isConnected && address) {
    return (
      <div className="flex flex-col items-stretch gap-4 p-6 bg-white border-[3px] border-black">
        <div className="flex items-center justify-between">
          <span className="text-sm font-black uppercase">Connected</span>
          <div className="w-2.5 h-2.5 bg-[hsl(var(--celo-green))]"></div>
        </div>
        <div className="text-left">
          <p className="text-xs font-black uppercase text-black">Wallet</p>
          <p className="font-mono text-sm bg-[hsl(var(--celo-tan-2))] px-3 py-2 inline-block border-[3px] border-black">
            {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        </div>
        <Button 
          onClick={() => disconnect()} 
          variant="outline"
          className=""
        >
          Disconnect
        </Button>
      </div>
    )
  }

  const handleConnect = () => {
    if (farcasterConnector) {
      // Prefer Farcaster connector if available
      connect({ connector: farcasterConnector })
    } else if (hasMultipleConnectors) {
      // Show modal if multiple options available
      setIsWalletModalOpen(true)
    } else if (connectors[0]) {
      // Fallback to first connector
      connect({ connector: connectors[0] })
    }
  }

  return (
    <>
      <div className="flex flex-col items-stretch gap-4 p-6 bg-white border-[3px] border-black">
        <div className="text-left">
          <h3 className="text-2xl font-thin tracking-tight leading-none">
            Connect <em className="not-italic italic">Wallet</em>
          </h3>
          <p className="text-sm font-black uppercase text-black mt-2">
            Start playing. Earn rewards. On-chain.
          </p>
        </div>

        <Button
          onClick={handleConnect}
          disabled={isPending || connectors.length === 0}
        >
          {isPending ? 'Connecting...' : hasMultipleConnectors ? 'Connect Wallet' : 'Connect with Farcaster'}
        </Button>

        {connectors.length === 0 && (
          <p className="text-xs font-black uppercase text-red-600">
            No wallet connector found.
          </p>
        )}
      </div>

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  )
}

export default FarcasterConnect
