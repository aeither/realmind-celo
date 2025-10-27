import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useAccount, useReadContract, useDisconnect, useConnect, useConnectors } from 'wagmi';
import { formatEther } from 'viem';
import { getContractAddresses, token1ABI } from '../libs/constants';
import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import WalletModal from './WalletModal';

interface GlobalHeaderProps {
  showBackButton?: boolean;
  backTo?: string;
  backText?: string;
}

function GlobalHeader({
  showBackButton = false,
  backTo = "/",
  backText = "← Back"
}: GlobalHeaderProps) {
  const { address, chain, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect } = useConnect();
  const connectors = useConnectors();
  const [isMiniApp, setIsMiniApp] = useState<boolean | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // Detect if running in Farcaster Mini App
  useEffect(() => {
    const detectEnvironment = async () => {
      try {
        const isInMiniApp = await sdk.isInMiniApp();
        setIsMiniApp(isInMiniApp);

        if (isInMiniApp) {
          const context = await sdk.context;
          console.log('Farcaster context:', context.user.username);
        }
      } catch (error) {
        console.error('Error detecting Mini App environment:', error);
        setIsMiniApp(false);
      }
    };

    detectEnvironment();
  }, []);

  const handleConnectWallet = () => {
    const farcasterConnector = connectors.find(c => c.id === 'farcasterMiniApp');

    if (isMiniApp && farcasterConnector) {
      // In Farcaster Mini App, connect directly with Farcaster
      connect({ connector: farcasterConnector });
    } else {
      // In browser, open modal with all wallet options
      setIsWalletModalOpen(true);
    }
  };

  // Get contract addresses based on current chain
  const contractAddresses = chain ? getContractAddresses(chain.id) : null;

  // Get Token1 balance using read contract
  const { data: tokenBalance } = useReadContract({
    address: contractAddresses?.token1ContractAddress as `0x${string}`,
    abi: token1ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && !!contractAddresses,
    },
  });

  // Get Token1 symbol
  const { data: tokenSymbol } = useReadContract({
    address: contractAddresses?.token1ContractAddress as `0x${string}`,
    abi: token1ABI,
    functionName: 'symbol',
    query: {
      enabled: !!address && !!contractAddresses,
    },
  });
  
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: "hsl(var(--block-yellow))",
        border: "var(--outline-thick)",
        borderTop: "none",
        padding: "clamp(0.5rem, 2vw, 1rem) clamp(0.5rem, 2vw, 1.5rem)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        minHeight: "clamp(60px, 12vw, 80px)",
        flexWrap: "nowrap",
        overflow: "hidden"
      }}
    >
      {/* Left side - Realmind text and Back button */}
      <div style={{ display: "flex", alignItems: "center", gap: "clamp(0.25rem, 2vw, 1rem)", flex: "1", minWidth: "0" }}>
        {showBackButton && (
          <Link
            to={backTo}
            className="btn-industrial"
            style={{
              fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
              fontFamily: "var(--font-body)",
              fontWeight: "var(--font-weight-body-black)",
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              background: "hsl(var(--celo-white))",
              color: "hsl(var(--celo-black))",
              border: "var(--outline-medium)",
              padding: "clamp(0.4rem, 1.5vw, 0.6rem) clamp(0.5rem, 2vw, 1rem)",
              transition: "var(--transition-fast)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "hsl(var(--celo-yellow))";
              e.currentTarget.style.color = "hsl(var(--celo-black))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "hsl(var(--celo-white))";
              e.currentTarget.style.color = "hsl(var(--celo-black))";
            }}
          >
            <span className="hidden sm:inline">{backText}</span>
            <span className="sm:hidden">← BACK</span>
          </Link>
        )}
        
        <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.1 }}>
        <Link
          to="/"
          className="text-headline-thin"
          style={{
            color: "hsl(var(--celo-black))",
            textDecoration: "none",
            fontSize: "clamp(1.4rem, 4vw, 3.8rem)",
            fontFamily: "var(--font-headline)",
            fontWeight: "var(--font-weight-headline-thin)",
            letterSpacing: "-0.03em",
            display: "flex",
            alignItems: "center",
            lineHeight: 0.9,
            textTransform: "uppercase"
          }}
        >
          Real<span style={{ fontStyle: "italic", fontWeight: "var(--font-weight-headline-normal)" }}>mind</span>
        </Link>
        </motion.div>
      </div>

      {/* Right side - Token Balance and Connect Button */}
      <motion.div style={{ display: "flex", alignItems: "center", gap: "clamp(0.25rem, 1vw, 0.5rem)", flexShrink: "0" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {/* Token Balance Display */}
        {address && tokenBalance !== undefined && tokenBalance !== 0n && tokenSymbol && (
          <div className="color-block" style={{
            background: "hsl(var(--celo-white))",
            border: "var(--outline-medium)",
            padding: "clamp(0.4rem, 1.5vw, 0.8rem) clamp(0.6rem, 2vw, 1.2rem)"
          }}>
            <div style={{
              color: "hsl(var(--celo-black))",
              fontSize: "clamp(0.75rem, 2vw, 0.9rem)",
              fontFamily: "var(--font-body)",
              fontWeight: "var(--font-weight-body-black)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              textTransform: "uppercase",
              letterSpacing: "0.01em"
            }}>
              <span style={{ fontSize: "0.6rem" }}>●</span>
              <span className="hidden sm:inline">{parseFloat(formatEther(tokenBalance)).toFixed(2)} {tokenSymbol}</span>
              <span className="sm:hidden">{parseFloat(formatEther(tokenBalance)).toFixed(2)}</span>
            </div>
          </div>
        )}
        
        {/* Connect/Disconnect Section */}
        <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.1 }}>
          {isConnected && address ? (
            <div className="color-block" style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(0.4rem, 1vw, 0.8rem)",
              background: "hsl(var(--celo-white))",
              border: "var(--outline-medium)",
              padding: "clamp(0.4rem, 1.5vw, 0.8rem) clamp(0.6rem, 2vw, 1.2rem)",
              fontSize: "0.8rem"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <div style={{
                  width: "8px",
                  height: "8px",
                  background: "hsl(var(--celo-green))",
                  border: "1px solid hsl(var(--celo-black))"
                }}></div>
                <span style={{ 
                  fontFamily: "var(--font-body)", 
                  fontWeight: "var(--font-weight-body-heavy)",
                  color: "hsl(var(--celo-black))",
                  textTransform: "uppercase",
                  fontSize: "0.75rem",
                  letterSpacing: "0.02em"
                }}>
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </div>
              {chain && (
                <span style={{ 
                  color: "hsl(var(--celo-brown))", 
                  fontSize: "0.65rem",
                  fontWeight: "var(--font-weight-body-normal)",
                  textTransform: "uppercase",
                  display: window.innerWidth > 640 ? 'inline' : 'none'
                }}>
                  {chain.name}
                </span>
              )}
              <button
                onClick={() => disconnect()}
                className="btn-industrial"
                style={{
                  background: "hsl(var(--celo-black))",
                  color: "hsl(var(--celo-white))",
                  border: "var(--outline-thin)",
                  fontSize: "0.7rem",
                  padding: "0.3rem 0.6rem",
                  fontWeight: "var(--font-weight-body-black)",
                  transition: "var(--transition-fast)"
                }}
                title="DISCONNECT"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "hsl(var(--celo-yellow))";
                  e.currentTarget.style.color = "hsl(var(--celo-black))";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "hsl(var(--celo-black))";
                  e.currentTarget.style.color = "hsl(var(--celo-white))";
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectWallet}
              disabled={connectors.length === 0}
              className="btn-primary-industrial"
              style={{
                background: "hsl(var(--celo-black))",
                color: "hsl(var(--celo-yellow))",
                border: "var(--outline-medium)",
                padding: "clamp(0.4rem, 1.5vw, 0.8rem) clamp(0.8rem, 2.5vw, 1.5rem)",
                fontSize: "0.8rem",
                fontFamily: "var(--font-body)",
                fontWeight: "var(--font-weight-body-black)",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                cursor: connectors.length === 0 ? "not-allowed" : "pointer",
                opacity: connectors.length === 0 ? 0.5 : 1,
                transition: "var(--transition-fast)"
              }}
              onMouseEnter={(e) => {
                if (connectors.length > 0) {
                  e.currentTarget.style.background = "hsl(var(--celo-yellow))";
                  e.currentTarget.style.color = "hsl(var(--celo-black))";
                }
              }}
              onMouseLeave={(e) => {
                if (connectors.length > 0) {
                  e.currentTarget.style.background = "hsl(var(--celo-black))";
                  e.currentTarget.style.color = "hsl(var(--celo-yellow))";
                }
              }}
            >
              CONNECT
            </button>
          )}
        </motion.div>
      </motion.div>

      {/* Wallet Modal for browser users */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </header>
  );
}

export default GlobalHeader; 