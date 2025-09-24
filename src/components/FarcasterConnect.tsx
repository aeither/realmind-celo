import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from './ui/Button'

function FarcasterConnect() {
  const { isConnected, address } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">Connected</span>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Wallet Address:</p>
          <p className="font-mono text-xs bg-gray-100 px-3 py-1 rounded-md mt-1">
            {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        </div>
        <Button 
          onClick={() => disconnect()} 
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Connect your Farcaster wallet to start playing quiz games and earning rewards
        </p>
      </div>
      
      <Button
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isPending}
        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </Button>
      
      {connectors.length === 0 && (
        <p className="text-xs text-red-500 text-center">
          No Farcaster connector found. Make sure you're opening this app from Farcaster.
        </p>
      )}
    </div>
  )
}

export default FarcasterConnect
