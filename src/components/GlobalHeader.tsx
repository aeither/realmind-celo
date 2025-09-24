import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useAccount, useReadContract, useConnect, useDisconnect } from 'wagmi';
import { formatEther } from 'viem';
import { getContractAddresses, token1ABI } from '../libs/constants';

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
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  
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
        background: "hsl(var(--celo-yellow))",
        borderBottom: "3px solid hsl(var(--celo-black))",
        padding: "0.75rem clamp(0.5rem, 3vw, 2rem)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "stretch"
      }}
    >
      {/* Left side - Realmind text and Back button */}
      <div style={{ display: "flex", alignItems: "center", gap: "clamp(0.5rem, 4vw, 2rem)" }}>
        {showBackButton && (
          <Link
            to={backTo}
            style={{
              color: "hsl(var(--celo-black))",
              textDecoration: "none",
              fontSize: "clamp(0.9rem, 3vw, 1rem)",
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              border: "3px solid hsl(var(--celo-black))",
              padding: "0.4rem 0.8rem",
              background: "hsl(var(--celo-yellow))"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "hsl(var(--celo-black))";
              e.currentTarget.style.color = "hsl(var(--celo-yellow))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "hsl(var(--celo-yellow))";
              e.currentTarget.style.color = "hsl(var(--celo-black))";
            }}
          >
            <span className="hidden sm:inline">{backText}</span>
            <span className="sm:hidden">←</span>
          </Link>
        )}
        
        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
        <Link
          to="/"
          style={{
            color: "hsl(var(--celo-black))",
            textDecoration: "none",
            fontSize: "clamp(1.6rem, 6vw, 3.2rem)",
            fontWeight: 300,
            fontStyle: "normal",
            letterSpacing: "-0.02em",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            lineHeight: 1
          }}
        >
          Realmind
        </Link>
        </motion.div>
      </div>

      {/* Right side - Token Balance and Connect Button */}
      <motion.div style={{ display: "flex", alignItems: "center", gap: "clamp(0.5rem, 2vw, 1rem)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {/* Token Balance Display */}
        {address && tokenBalance !== undefined && tokenBalance !== 0n && tokenSymbol && (
          <div style={{
            background: "hsl(var(--celo-white))",
            borderRadius: "0px",
            padding: "0.4rem 0.8rem",
            border: "3px solid hsl(var(--celo-black))"
          }}>
            <div style={{
              color: "hsl(var(--celo-black))",
              fontSize: "clamp(0.8rem, 3vw, 0.95rem)",
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <span>■</span>
              <span className="hidden sm:inline">{parseFloat(formatEther(tokenBalance)).toFixed(2)} {tokenSymbol}</span>
              <span className="sm:hidden">{parseFloat(formatEther(tokenBalance)).toFixed(2)}</span>
            </div>
          </div>
        )}
        
        {/* Farcaster Connect Button */}
        <motion.div whileHover={{ scale: 1.02 }}>
          {isConnected && address ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "hsl(var(--celo-white))",
              borderRadius: "0px",
              padding: "0.5rem 1rem",
              border: "3px solid hsl(var(--celo-black))",
              fontSize: "0.875rem"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem"
              }}>
                <div style={{
                  width: "10px",
                  height: "10px",
                  background: "hsl(var(--celo-green))"
                }}></div>
                <span style={{ fontFamily: "monospace", color: "#374151" }}>
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </div>
              {chain && (
                <span style={{ 
                  color: "hsl(var(--celo-brown))", 
                  fontSize: "0.75rem",
                  display: window.innerWidth > 640 ? 'inline' : 'none'
                }}>
                  {chain.name}
                </span>
              )}
              <button
                onClick={() => disconnect()}
                style={{
                  background: "hsl(var(--celo-black))",
                  border: "3px solid hsl(var(--celo-black))",
                  color: "hsl(var(--celo-white))",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.5rem"
                }}
                title="Disconnect"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={() => connectors[0] && connect({ connector: connectors[0] })}
              disabled={isPending || connectors.length === 0}
              style={{
                background: "hsl(var(--celo-black))",
                color: "hsl(var(--celo-yellow))",
                border: "3px solid hsl(var(--celo-black))",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 900,
                cursor: isPending || connectors.length === 0 ? "not-allowed" : "pointer",
                opacity: isPending || connectors.length === 0 ? 0.5 : 1,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (!isPending && connectors.length > 0) {
                  e.currentTarget.style.background = "hsl(var(--celo-yellow))";
                  e.currentTarget.style.color = "hsl(var(--celo-black))";
                }
              }}
              onMouseLeave={(e) => {
                if (!isPending && connectors.length > 0) {
                  e.currentTarget.style.background = "hsl(var(--celo-black))";
                  e.currentTarget.style.color = "hsl(var(--celo-yellow))";
                }
              }}
            >
              {isPending ? "Connecting..." : "Connect"}
            </button>
          )}
        </motion.div>
      </motion.div>
    </header>
  );
}

export default GlobalHeader; 