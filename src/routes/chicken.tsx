import { createFileRoute } from "@tanstack/react-router"
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import BottomNavigation from '../components/BottomNavigation'
import { chickenGameABI } from '../libs/chickenGameABI'

// Temporary contract addresses - replace with actual deployed addresses
const CHICKEN_GAME_ADDRESS = '0x7147fC4382a87D772E8667A2f9322ce471A1912E' as `0x${string}`;
const EGG_TOKEN_ADDRESS = '0x252Cf4eF66DB38ac1C53f05ccF5dc0f90331151A' as `0x${string}`;

function ChickenPage() {
  const { address, isConnected } = useAccount()
  const [selectedAction, setSelectedAction] = useState<'feed' | 'pet' | 'play' | null>(null)

  // Contract reads
  const { data: chickenData, refetch: refetchChicken } = useReadContract({
    address: CHICKEN_GAME_ADDRESS,
    abi: chickenGameABI,
    functionName: 'getChicken',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  const { data: canLayEgg } = useReadContract({
    address: CHICKEN_GAME_ADDRESS,
    abi: chickenGameABI,
    functionName: 'canLayEgg',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  const { data: feedAvailable } = useReadContract({
    address: CHICKEN_GAME_ADDRESS,
    abi: chickenGameABI,
    functionName: 'isActionAvailable',
    args: address ? [address, 0n] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  const { data: petAvailable } = useReadContract({
    address: CHICKEN_GAME_ADDRESS,
    abi: chickenGameABI,
    functionName: 'isActionAvailable',
    args: address ? [address, 1n] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  const { data: playAvailable } = useReadContract({
    address: CHICKEN_GAME_ADDRESS,
    abi: chickenGameABI,
    functionName: 'isActionAvailable',
    args: address ? [address, 2n] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  // Contract writes
  const { writeContract: feedChicken, isPending: isFeedPending, data: feedHash } = useWriteContract()
  const { writeContract: petChicken, isPending: isPetPending, data: petHash } = useWriteContract()
  const { writeContract: playWithChicken, isPending: isPlayPending, data: playHash } = useWriteContract()
  const { writeContract: layEgg, isPending: isLayEggPending, data: layEggHash } = useWriteContract()

  // Wait for transactions
  const { isSuccess: isFeedSuccess } = useWaitForTransactionReceipt({ hash: feedHash })
  const { isSuccess: isPetSuccess } = useWaitForTransactionReceipt({ hash: petHash })
  const { isSuccess: isPlaySuccess } = useWaitForTransactionReceipt({ hash: playHash })
  const { isSuccess: isLayEggSuccess } = useWaitForTransactionReceipt({ hash: layEggHash })

  // Extract chicken data
  const happiness = chickenData ? Number(chickenData[0]) : 0
  const totalEggsLaid = chickenData ? Number(chickenData[4]) : 0
  const instantActionsRemaining = chickenData ? Number(chickenData[5]) : 10
  const initialized = chickenData ? chickenData[6] : false

  // Effects for success messages
  useEffect(() => {
    if (isFeedSuccess) {
      toast.success('🍗 Fed your chicken! +10 happiness')
      refetchChicken()
    }
  }, [isFeedSuccess, refetchChicken])

  useEffect(() => {
    if (isPetSuccess) {
      toast.success('❤️ Petted your chicken! +10 happiness')
      refetchChicken()
    }
  }, [isPetSuccess, refetchChicken])

  useEffect(() => {
    if (isPlaySuccess) {
      toast.success('🎾 Played with your chicken! +10 happiness')
      refetchChicken()
    }
  }, [isPlaySuccess, refetchChicken])

  useEffect(() => {
    if (isLayEggSuccess) {
      toast.success('🥚 Your chicken laid an egg! +1 EGG token')
      refetchChicken()
    }
  }, [isLayEggSuccess, refetchChicken])

  // Action handlers
  const handleFeed = () => {
    if (!address) return
    feedChicken({
      address: CHICKEN_GAME_ADDRESS,
      abi: chickenGameABI,
      functionName: 'feedChicken',
    })
  }

  const handlePet = () => {
    if (!address) return
    petChicken({
      address: CHICKEN_GAME_ADDRESS,
      abi: chickenGameABI,
      functionName: 'petChicken',
    })
  }

  const handlePlay = () => {
    if (!address) return
    playWithChicken({
      address: CHICKEN_GAME_ADDRESS,
      abi: chickenGameABI,
      functionName: 'playWithChicken',
    })
  }

  const handleLayEgg = () => {
    if (!address) return
    layEgg({
      address: CHICKEN_GAME_ADDRESS,
      abi: chickenGameABI,
      functionName: 'layEgg',
    })
  }

  if (!isConnected) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100vh', paddingBottom: '80px', background: 'hsl(var(--background))' }}>
        <div style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "2rem",
          textAlign: "center"
        }}>
          <h2 style={{ color: "#111827", marginBottom: "1rem" }}>Connect Your Wallet</h2>
          <p style={{ color: "#6b7280" }}>
            Please connect your wallet to play Chicken Game.
          </p>
        </div>
        <BottomNavigation />
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100vh', paddingBottom: '80px', background: 'hsl(var(--background))' }}>
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "2rem"
      }}>
        <h1 style={{
          color: "#111827",
          marginBottom: "2rem",
          textAlign: "center",
          fontSize: "2rem",
          fontWeight: 800
        }}>
          🐔 Chicken Care Game
        </h1>

        {/* Chicken Stats Card */}
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "2rem",
          marginBottom: "2rem",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
        }}>
          {/* Chicken Display */}
          <div style={{
            textAlign: "center",
            fontSize: "6rem",
            marginBottom: "1rem"
          }}>
            🐔
          </div>

          {/* Happiness Bar */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.5rem"
            }}>
              <span style={{ fontWeight: 600, color: "#374151" }}>Happiness</span>
              <span style={{ fontWeight: 600, color: "#374151" }}>{happiness}/100</span>
            </div>
            <div style={{
              width: "100%",
              height: "24px",
              background: "#f3f4f6",
              borderRadius: "12px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${happiness}%`,
                height: "100%",
                background: happiness >= 100 ? "#22c55e" : "#3b82f6",
                transition: "width 0.3s ease",
                borderRadius: "12px"
              }} />
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginBottom: "1.5rem"
          }}>
            <div style={{
              background: "#f9fafb",
              padding: "1rem",
              borderRadius: "8px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Total Eggs Laid</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
                {totalEggsLaid} 🥚
              </div>
            </div>
            <div style={{
              background: "#f9fafb",
              padding: "1rem",
              borderRadius: "8px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Instant Actions</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
                {instantActionsRemaining} ⚡
              </div>
            </div>
          </div>

          {/* New User Notice */}
          {!initialized && (
            <div style={{
              background: "#dbeafe",
              border: "1px solid #3b82f6",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1.5rem",
              textAlign: "center"
            }}>
              <p style={{ color: "#1e40af", margin: 0, fontSize: "0.875rem" }}>
                🎉 Welcome! You have 10 free instant actions to get started!
              </p>
            </div>
          )}

          {/* Lay Egg Button */}
          {canLayEgg && (
            <button
              onClick={handleLayEgg}
              disabled={isLayEggPending}
              style={{
                width: "100%",
                backgroundColor: isLayEggPending ? "#9ca3af" : "#22c55e",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "1rem",
                fontSize: "1.125rem",
                fontWeight: 700,
                cursor: isLayEggPending ? "not-allowed" : "pointer",
                marginBottom: "1rem"
              }}
            >
              {isLayEggPending ? "Laying Egg..." : "🥚 Lay Egg (Get 1 EGG Token!)"}
            </button>
          )}
        </div>

        {/* Actions Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem"
        }}>
          {/* Feed Action */}
          <button
            onClick={handleFeed}
            disabled={!feedAvailable || isFeedPending}
            style={{
              background: feedAvailable && !isFeedPending ? "#ffffff" : "#f3f4f6",
              border: `2px solid ${feedAvailable && !isFeedPending ? "#f59e0b" : "#e5e7eb"}`,
              borderRadius: "12px",
              padding: "1.5rem",
              cursor: feedAvailable && !isFeedPending ? "pointer" : "not-allowed",
              opacity: feedAvailable && !isFeedPending ? 1 : 0.6,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (feedAvailable && !isFeedPending) {
                e.currentTarget.style.transform = "scale(1.02)"
                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)"
              e.currentTarget.style.boxShadow = "none"
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🍗</div>
            <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
              Feed
            </div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              {isFeedPending ? "Feeding..." : feedAvailable ? "+10 happiness" : "On cooldown"}
            </div>
          </button>

          {/* Pet Action */}
          <button
            onClick={handlePet}
            disabled={!petAvailable || isPetPending}
            style={{
              background: petAvailable && !isPetPending ? "#ffffff" : "#f3f4f6",
              border: `2px solid ${petAvailable && !isPetPending ? "#ec4899" : "#e5e7eb"}`,
              borderRadius: "12px",
              padding: "1.5rem",
              cursor: petAvailable && !isPetPending ? "pointer" : "not-allowed",
              opacity: petAvailable && !isPetPending ? 1 : 0.6,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (petAvailable && !isPetPending) {
                e.currentTarget.style.transform = "scale(1.02)"
                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)"
              e.currentTarget.style.boxShadow = "none"
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>❤️</div>
            <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
              Pet
            </div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              {isPetPending ? "Petting..." : petAvailable ? "+10 happiness" : "On cooldown"}
            </div>
          </button>

          {/* Play Action */}
          <button
            onClick={handlePlay}
            disabled={!playAvailable || isPlayPending}
            style={{
              background: playAvailable && !isPlayPending ? "#ffffff" : "#f3f4f6",
              border: `2px solid ${playAvailable && !isPlayPending ? "#8b5cf6" : "#e5e7eb"}`,
              borderRadius: "12px",
              padding: "1.5rem",
              cursor: playAvailable && !isPlayPending ? "pointer" : "not-allowed",
              opacity: playAvailable && !isPlayPending ? 1 : 0.6,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (playAvailable && !isPlayPending) {
                e.currentTarget.style.transform = "scale(1.02)"
                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)"
              e.currentTarget.style.boxShadow = "none"
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🎾</div>
            <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
              Play
            </div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              {isPlayPending ? "Playing..." : playAvailable ? "+10 happiness" : "On cooldown"}
            </div>
          </button>
        </div>

        {/* Instructions */}
        <div style={{
          background: "#f9fafb",
          borderRadius: "12px",
          padding: "1.5rem",
          marginTop: "2rem"
        }}>
          <h3 style={{ color: "#111827", marginBottom: "1rem", fontWeight: 700 }}>How to Play</h3>
          <ul style={{ color: "#6b7280", lineHeight: 1.8, paddingLeft: "1.5rem" }}>
            <li>Perform actions (Feed, Pet, Play) to increase your chicken's happiness</li>
            <li>Each action adds +10 happiness points</li>
            <li>New users get 10 free instant actions to get started!</li>
            <li>After using instant actions, each action has a 24-hour cooldown</li>
            <li>When happiness reaches 100, you can lay an egg to mint 1 EGG token</li>
            <li>Laying an egg resets happiness to 0</li>
          </ul>
        </div>
      </div>
      <BottomNavigation />
    </motion.div>
  )
}

export const Route = createFileRoute('/chicken')({
  component: ChickenPage,
})

