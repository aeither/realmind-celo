import { createFileRoute } from "@tanstack/react-router"
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract, useChainId, useSwitchChain } from 'wagmi'
import BottomNavigation from '../components/BottomNavigation'
import { chickenGameABI } from '../libs/chickenGameABI'
import { SUPPORTED_CHAIN } from '../libs/supportedChains'
import { getDivviDataSuffix, submitDivviReferral } from '../libs/divviReferral'

// Temporary contract addresses - replace with actual deployed addresses
const CHICKEN_GAME_ADDRESS = '0x7147fC4382a87D772E8667A2f9322ce471A1912E' as `0x${string}`;
const EGG_TOKEN_ADDRESS = '0x252Cf4eF66DB38ac1C53f05ccF5dc0f90331151A' as `0x${string}`;

function ChickenPage() {
  const { address, isConnected, chain } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
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
  const { writeContract: feedChicken, isPending: isFeedPending, data: feedHash, error: feedError } = useWriteContract()
  const { writeContract: petChicken, isPending: isPetPending, data: petHash, error: petError } = useWriteContract()
  const { writeContract: playWithChicken, isPending: isPlayPending, data: playHash, error: playError } = useWriteContract()
  const { writeContract: layEgg, isPending: isLayEggPending, data: layEggHash, error: layEggError } = useWriteContract()

  // Wait for transactions
  const { isSuccess: isFeedSuccess, isLoading: isFeedConfirming } = useWaitForTransactionReceipt({ hash: feedHash })
  const { isSuccess: isPetSuccess, isLoading: isPetConfirming } = useWaitForTransactionReceipt({ hash: petHash })
  const { isSuccess: isPlaySuccess, isLoading: isPlayConfirming } = useWaitForTransactionReceipt({ hash: playHash })
  const { isSuccess: isLayEggSuccess, isLoading: isLayEggConfirming } = useWaitForTransactionReceipt({ hash: layEggHash })

  // Extract chicken data
  const happiness = chickenData ? Number(chickenData[0]) : 0
  const totalEggsLaid = chickenData ? Number(chickenData[4]) : 0
  const instantActionsRemaining = chickenData ? Number(chickenData[5]) : 10
  const initialized = chickenData ? chickenData[6] : false

  // Check if any transaction is pending (wallet confirmation OR blockchain confirmation)
  const isAnyTransactionPending = 
    isFeedPending || isFeedConfirming ||
    isPetPending || isPetConfirming ||
    isPlayPending || isPlayConfirming ||
    isLayEggPending || isLayEggConfirming

  // Effects for success messages
  useEffect(() => {
    if (isFeedSuccess && feedHash && chain) {
      toast.success('🍗 Fed your chicken! +10 happiness')
      // Refetch chicken data to update UI with new values
      setTimeout(() => {
        refetchChicken()
      }, 1000) // Small delay to ensure blockchain state is updated
      // Submit to Divvi for referral tracking
      submitDivviReferral(feedHash, chain.id)
    }
  }, [isFeedSuccess, feedHash, chain, refetchChicken])

  useEffect(() => {
    if (isPetSuccess && petHash && chain) {
      toast.success('❤️ Petted your chicken! +10 happiness')
      // Refetch chicken data to update UI with new values
      setTimeout(() => {
        refetchChicken()
      }, 1000) // Small delay to ensure blockchain state is updated
      // Submit to Divvi for referral tracking
      submitDivviReferral(petHash, chain.id)
    }
  }, [isPetSuccess, petHash, chain, refetchChicken])

  useEffect(() => {
    if (isPlaySuccess && playHash && chain) {
      toast.success('🎾 Played with your chicken! +10 happiness')
      // Refetch chicken data to update UI with new values
      setTimeout(() => {
        refetchChicken()
      }, 1000) // Small delay to ensure blockchain state is updated
      // Submit to Divvi for referral tracking
      submitDivviReferral(playHash, chain.id)
    }
  }, [isPlaySuccess, playHash, chain, refetchChicken])

  useEffect(() => {
    if (isLayEggSuccess && layEggHash && chain) {
      toast.success('🥚 Your chicken laid an egg! +1 EGG token')
      // Refetch chicken data to update UI with new values
      setTimeout(() => {
        refetchChicken()
      }, 1000) // Small delay to ensure blockchain state is updated
      // Submit to Divvi for referral tracking
      submitDivviReferral(layEggHash, chain.id)
    }
  }, [isLayEggSuccess, layEggHash, chain, refetchChicken])

  // Error handling effects
  useEffect(() => {
    if (feedError) {
      console.error('Feed error:', feedError)
      toast.error(`Feed failed: ${feedError.message || 'Unknown error'}`)
    }
  }, [feedError])

  useEffect(() => {
    if (petError) {
      console.error('Pet error:', petError)
      toast.error(`Pet failed: ${petError.message || 'Unknown error'}`)
    }
  }, [petError])

  useEffect(() => {
    if (playError) {
      console.error('Play error:', playError)
      toast.error(`Play failed: ${playError.message || 'Unknown error'}`)
    }
  }, [playError])

  useEffect(() => {
    if (layEggError) {
      console.error('Lay egg error:', layEggError)
      toast.error(`Lay egg failed: ${layEggError.message || 'Unknown error'}`)
    }
  }, [layEggError])

  // Action handlers
  const handleFeed = () => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }
    // Check if on correct network
    if (chainId !== SUPPORTED_CHAIN.id) {
      toast.error(`Please switch to ${SUPPORTED_CHAIN.name} network`)
      return
    }
    try {
      feedChicken({
        address: CHICKEN_GAME_ADDRESS,
        abi: chickenGameABI,
        functionName: 'feedChicken',
        chainId: SUPPORTED_CHAIN.id,
        dataSuffix: getDivviDataSuffix(address),
      })
    } catch (error) {
      console.error('Feed chicken error:', error)
      toast.error('Failed to initiate feed transaction')
    }
  }

  const handlePet = () => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }
    // Check if on correct network
    if (chainId !== SUPPORTED_CHAIN.id) {
      toast.error(`Please switch to ${SUPPORTED_CHAIN.name} network`)
      return
    }
    try {
      petChicken({
        address: CHICKEN_GAME_ADDRESS,
        abi: chickenGameABI,
        functionName: 'petChicken',
        chainId: SUPPORTED_CHAIN.id,
        dataSuffix: getDivviDataSuffix(address),
      })
    } catch (error) {
      console.error('Pet chicken error:', error)
      toast.error('Failed to initiate pet transaction')
    }
  }

  const handlePlay = () => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }
    // Check if on correct network
    if (chainId !== SUPPORTED_CHAIN.id) {
      toast.error(`Please switch to ${SUPPORTED_CHAIN.name} network`)
      return
    }
    try {
      playWithChicken({
        address: CHICKEN_GAME_ADDRESS,
        abi: chickenGameABI,
        functionName: 'playWithChicken',
        chainId: SUPPORTED_CHAIN.id,
        dataSuffix: getDivviDataSuffix(address),
      })
    } catch (error) {
      console.error('Play with chicken error:', error)
      toast.error('Failed to initiate play transaction')
    }
  }

  const handleLayEgg = () => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }
    // Check if on correct network
    if (chainId !== SUPPORTED_CHAIN.id) {
      toast.error(`Please switch to ${SUPPORTED_CHAIN.name} network`)
      return
    }
    try {
      layEgg({
        address: CHICKEN_GAME_ADDRESS,
        abi: chickenGameABI,
        functionName: 'layEgg',
        chainId: SUPPORTED_CHAIN.id,
        dataSuffix: getDivviDataSuffix(address),
      })
    } catch (error) {
      console.error('Lay egg error:', error)
      toast.error('Failed to initiate lay egg transaction')
    }
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

  // Check if user is on the wrong network
  const isWrongNetwork = chainId !== SUPPORTED_CHAIN.id
  const isCorrectNetwork = chainId === SUPPORTED_CHAIN.id

  if (isWrongNetwork) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100vh', paddingBottom: '80px', background: 'hsl(var(--background))' }}>
        <div style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "2rem",
          textAlign: "center"
        }}>
          <div style={{
            background: "#fef2f2",
            border: "2px solid #ef4444",
            borderRadius: "12px",
            padding: "2rem",
            marginBottom: "1rem"
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h2 style={{ color: "#991b1b", marginBottom: "1rem" }}>Wrong Network</h2>
            <p style={{ color: "#7f1d1d", marginBottom: "1rem" }}>
              Please switch to <strong>{SUPPORTED_CHAIN.name}</strong> to play Chicken Game.
            </p>
            <p style={{ color: "#7f1d1d", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              Current Chain ID: {chainId}<br />
              Expected Chain ID: {SUPPORTED_CHAIN.id}
            </p>
            <button 
              onClick={() => switchChain({ chainId: SUPPORTED_CHAIN.id })}
              style={{
                backgroundColor: "#58CC02",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#4CAF00"
                e.currentTarget.style.transform = "scale(1.02)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#58CC02"
                e.currentTarget.style.transform = "scale(1)"
              }}
            >
              Switch to {SUPPORTED_CHAIN.name}
            </button>
          </div>
          <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            Or manually switch to {SUPPORTED_CHAIN.name} in your wallet.
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
        {/* Network Warning Banner */}
        {!isCorrectNetwork && (
          <div style={{
            background: "#fef2f2",
            border: "2px solid #ef4444",
            borderRadius: "12px",
            padding: "1rem",
            marginBottom: "1.5rem",
            textAlign: "center"
          }}>
            <p style={{ color: "#991b1b", fontWeight: 600, marginBottom: "0.5rem" }}>
              ⚠️ Wrong Network Detected
            </p>
            <p style={{ color: "#7f1d1d", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
              Please switch to {SUPPORTED_CHAIN.name} to interact with your chicken.
            </p>
            <button 
              onClick={() => switchChain({ chainId: SUPPORTED_CHAIN.id })}
              style={{
                backgroundColor: "#ef4444",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#dc2626"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ef4444"
              }}
            >
              Switch to {SUPPORTED_CHAIN.name}
            </button>
          </div>
        )}

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
              disabled={isAnyTransactionPending || !isCorrectNetwork}
              style={{
                width: "100%",
                backgroundColor: isAnyTransactionPending || !isCorrectNetwork ? "#9ca3af" : "#22c55e",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "1rem",
                fontSize: "1.125rem",
                fontWeight: 700,
                cursor: isAnyTransactionPending || !isCorrectNetwork ? "not-allowed" : "pointer",
                marginBottom: "1rem",
                opacity: isAnyTransactionPending || !isCorrectNetwork ? 0.6 : 1
              }}
            >
              {!isCorrectNetwork ? "⚠️ Wrong Network" : isLayEggPending ? "Confirm in wallet..." : isLayEggConfirming ? "Confirming on blockchain..." : isAnyTransactionPending ? "⏳ Transaction Pending..." : "🥚 Lay Egg (Get 1 EGG Token!)"}
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
            disabled={!feedAvailable || isAnyTransactionPending || !isCorrectNetwork}
            style={{
              background: feedAvailable && !isAnyTransactionPending && isCorrectNetwork ? "#ffffff" : "#f3f4f6",
              border: `2px solid ${feedAvailable && !isAnyTransactionPending && isCorrectNetwork ? "#f59e0b" : "#e5e7eb"}`,
              borderRadius: "12px",
              padding: "1.5rem",
              cursor: feedAvailable && !isAnyTransactionPending && isCorrectNetwork ? "pointer" : "not-allowed",
              opacity: feedAvailable && !isAnyTransactionPending && isCorrectNetwork ? 1 : 0.6,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (feedAvailable && !isAnyTransactionPending && isCorrectNetwork) {
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
              {!isCorrectNetwork ? "Wrong network" : isFeedPending ? "Confirm in wallet..." : isFeedConfirming ? "Confirming..." : isAnyTransactionPending ? "Wait..." : feedAvailable ? "+10 happiness" : "On cooldown"}
            </div>
          </button>

          {/* Pet Action */}
          <button
            onClick={handlePet}
            disabled={!petAvailable || isAnyTransactionPending || !isCorrectNetwork}
            style={{
              background: petAvailable && !isAnyTransactionPending && isCorrectNetwork ? "#ffffff" : "#f3f4f6",
              border: `2px solid ${petAvailable && !isAnyTransactionPending && isCorrectNetwork ? "#ec4899" : "#e5e7eb"}`,
              borderRadius: "12px",
              padding: "1.5rem",
              cursor: petAvailable && !isAnyTransactionPending && isCorrectNetwork ? "pointer" : "not-allowed",
              opacity: petAvailable && !isAnyTransactionPending && isCorrectNetwork ? 1 : 0.6,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (petAvailable && !isAnyTransactionPending && isCorrectNetwork) {
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
              {!isCorrectNetwork ? "Wrong network" : isPetPending ? "Confirm in wallet..." : isPetConfirming ? "Confirming..." : isAnyTransactionPending ? "Wait..." : petAvailable ? "+10 happiness" : "On cooldown"}
            </div>
          </button>

          {/* Play Action */}
          <button
            onClick={handlePlay}
            disabled={!playAvailable || isAnyTransactionPending || !isCorrectNetwork}
            style={{
              background: playAvailable && !isAnyTransactionPending && isCorrectNetwork ? "#ffffff" : "#f3f4f6",
              border: `2px solid ${playAvailable && !isAnyTransactionPending && isCorrectNetwork ? "#8b5cf6" : "#e5e7eb"}`,
              borderRadius: "12px",
              padding: "1.5rem",
              cursor: playAvailable && !isAnyTransactionPending && isCorrectNetwork ? "pointer" : "not-allowed",
              opacity: playAvailable && !isAnyTransactionPending && isCorrectNetwork ? 1 : 0.6,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (playAvailable && !isAnyTransactionPending && isCorrectNetwork) {
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
              {!isCorrectNetwork ? "Wrong network" : isPlayPending ? "Confirm in wallet..." : isPlayConfirming ? "Confirming..." : isAnyTransactionPending ? "Wait..." : playAvailable ? "+10 happiness" : "On cooldown"}
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

