import { useConnect } from 'wagmi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { toast } from 'sonner';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connect, connectors, isPending, error } = useConnect();

  const getConnectorIcon = (connectorId: string, connectorName: string) => {
    // Check by ID first
    if (connectorId.includes('metaMask') || connectorId === 'io.metamask') {
      return '🦊';
    }
    if (connectorId === 'walletConnect') {
      return '🔗';
    }
    if (connectorId === 'farcasterMiniApp' || connectorId === 'farcaster') {
      return '🟣';
    }
    if (connectorId === 'injected' || connectorName === 'Injected') {
      return '💳';
    }

    // Check by name as fallback
    if (connectorName.toLowerCase().includes('metamask')) return '🦊';
    if (connectorName.toLowerCase().includes('coinbase')) return '🔵';
    if (connectorName.toLowerCase().includes('wallet')) return '👛';

    return '👛';
  };

  const getConnectorName = (connector: any) => {
    if (connector.name === 'MetaMask' || connector.id === 'io.metamask' || connector.id.includes('metaMask')) {
      return 'MetaMask';
    }
    if (connector.id === 'walletConnect') {
      return 'WalletConnect';
    }
    if (connector.id === 'farcasterMiniApp' || connector.id === 'farcaster') {
      return 'Farcaster';
    }
    if (connector.name === 'Injected' || connector.id === 'injected') {
      return 'Browser Wallet';
    }
    return connector.name;
  };

  const getConnectorDescription = (connectorId: string) => {
    if (connectorId.includes('metaMask') || connectorId === 'io.metamask') {
      return 'Connect with MetaMask browser extension';
    }
    if (connectorId === 'walletConnect') {
      return 'Scan QR code with your mobile wallet';
    }
    if (connectorId === 'farcasterMiniApp' || connectorId === 'farcaster') {
      return 'Connect with Farcaster wallet';
    }
    if (connectorId === 'injected') {
      return 'Connect with browser wallet';
    }
    return 'Connect your wallet';
  };

  // Filter connectors: exclude Farcaster in browser modal (only show in Farcaster app)
  const availableConnectors = connectors.filter(connector => {
    // Always show WalletConnect (works via QR)
    if (connector.id === 'walletConnect') return true;
    // Don't show Farcaster in browser modal
    if (connector.id === 'farcasterMiniApp' || connector.id === 'farcaster') return false;
    return true;
  });

  const handleConnect = async (connector: any) => {
    try {
      connect({ connector });
      onClose();
    } catch (err: any) {
      console.error('Connection error:', err);
      toast.error(err?.message || 'Failed to connect wallet');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Choose a wallet to connect to the app
          </DialogDescription>
        </DialogHeader>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          marginTop: '1rem'
        }}>
          {availableConnectors.map((connector) => {
            const connectorName = getConnectorName(connector);
            const connectorIcon = getConnectorIcon(connector.id, connector.name);
            const connectorDescription = getConnectorDescription(connector.id);

            return (
              <button
                key={connector.id}
                onClick={() => handleConnect(connector)}
                disabled={isPending}
                className="color-block"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  background: 'hsl(var(--celo-white))',
                  border: 'var(--outline-medium)',
                  cursor: isPending ? 'wait' : 'pointer',
                  transition: 'var(--transition-fast)',
                  opacity: isPending ? 0.6 : 1,
                  width: '100%',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!isPending) {
                    e.currentTarget.style.background = 'hsl(var(--celo-yellow))';
                    e.currentTarget.style.borderColor = 'hsl(var(--celo-black))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isPending) {
                    e.currentTarget.style.background = 'hsl(var(--celo-white))';
                  }
                }}
              >
                <span style={{ fontSize: '2rem', minWidth: '40px', textAlign: 'center' }}>
                  {connectorIcon}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '1rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 'var(--font-weight-body-black)',
                    color: 'hsl(var(--celo-black))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    marginBottom: '0.25rem'
                  }}>
                    {connectorName}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 'var(--font-weight-body-normal)',
                    color: 'hsl(var(--celo-brown))',
                    letterSpacing: '0.01em'
                  }}>
                    {connectorDescription}
                  </div>
                </div>
                {isPending && (
                  <div style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 'var(--font-weight-body-heavy)',
                    color: 'hsl(var(--celo-brown))',
                    textTransform: 'uppercase'
                  }}>
                    Connecting...
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            background: 'hsl(0, 70%, 95%)',
            border: '2px solid hsl(0, 70%, 50%)',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-body)',
            fontWeight: 'var(--font-weight-body-heavy)',
            color: 'hsl(0, 70%, 30%)',
            textTransform: 'uppercase',
            letterSpacing: '0.01em'
          }}>
            ⚠️ Error: {error.message}
          </div>
        )}

        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'hsl(var(--celo-yellow))',
          border: 'var(--outline-thin)',
        }}>
          <p style={{
            fontSize: '0.8rem',
            fontFamily: 'var(--font-body)',
            fontWeight: 'var(--font-weight-body-heavy)',
            color: 'hsl(var(--celo-black))',
            textTransform: 'uppercase',
            letterSpacing: '0.01em',
            lineHeight: '1.4'
          }}>
            💡 New to wallets?{' '}
            <a
              href="https://ethereum.org/en/wallets/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'underline',
                color: 'hsl(var(--celo-black))'
              }}
            >
              Learn more
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WalletModal;
