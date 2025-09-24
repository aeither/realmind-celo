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
        background: "rgba(255, 255, 255, 0.25)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid hsl(var(--border))",
        padding: "0.75rem clamp(0.5rem, 3vw, 2rem)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 10px rgba(16, 24, 40, 0.06)"
      }}
    >
      {/* Left side - Realmind text and Back button */}
      <div style={{ display: "flex", alignItems: "center", gap: "clamp(0.5rem, 4vw, 2rem)" }}>
        {showBackButton && (
          <Link
            to={backTo}
            style={{
              color: "hsl(var(--primary))",
              textDecoration: "none",
              fontSize: "clamp(0.9rem, 3vw, 1rem)",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "color 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#3aaa00";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "hsl(var(--primary))";
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
            color: "hsl(var(--primary))",
            textDecoration: "none",
            fontSize: "clamp(1rem, 4vw, 1.5rem)",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
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
            background: "hsl(var(--quiz-selected))",
            borderRadius: "8px",
            padding: "clamp(0.25rem, 1vw, 0.5rem) clamp(0.5rem, 2vw, 1rem)",
            border: "1px solid hsl(var(--primary))"
          }}>
            <div style={{
              color: "hsl(var(--primary))",
              fontSize: "clamp(0.8rem, 3vw, 0.9rem)",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <span>🟢</span>
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
              background: "#f9fafb",
              borderRadius: "12px",
              padding: "0.5rem 1rem",
              border: "1px solid #e5e7eb",
              fontSize: "0.875rem"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem"
              }}>
                <div style={{
                  width: "8px",
                  height: "8px",
                  background: "#10b981",
                  borderRadius: "50%"
                }}></div>
                <span style={{ fontFamily: "monospace", color: "#374151" }}>
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </div>
              {chain && (
                <span style={{ 
                  color: "#6b7280", 
                  fontSize: "0.75rem",
                  display: window.innerWidth > 640 ? 'inline' : 'none'
                }}>
                  {chain.name}
                </span>
              )}
              <button
                onClick={() => disconnect()}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  padding: "0.25rem",
                  borderRadius: "4px"
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
                background: "#8b5cf6",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                fontWeight: "500",
                cursor: isPending || connectors.length === 0 ? "not-allowed" : "pointer",
                opacity: isPending || connectors.length === 0 ? 0.5 : 1,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (!isPending && connectors.length > 0) {
                  e.currentTarget.style.background = "#7c3aed";
                }
              }}
              onMouseLeave={(e) => {
                if (!isPending && connectors.length > 0) {
                  e.currentTarget.style.background = "#8b5cf6";
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