import { createFileRoute } from "@tanstack/react-router"
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract, useChainId, useSwitchChain } from 'wagmi'
import BottomNavigation from '../components/BottomNavigation'
import { chickenGameABI } from '../libs/chickenGameABI'
import { SUPPORTED_CHAIN } from '../libs/supportedChains'
import { getDivviDataSuffix, submitDivviReferral } from '../libs/divviReferral'

const CHICKEN_GAME_ADDRESS = '0x718dA7d4060Bc4eB1dBd7cCed04c9C1390c60500' as `0x${string}`;
const EGG_TOKEN_ADDRESS = '0x9FBA2481F9061b11d084d3acf276961D251cF5a5' as `0x${string}`;
const MEGA_EGG_ADDRESS = '0x885171d283aa8541B0EBE0497042d001D0ffA10f' as `0x${string}`;
const RETENTION_SYSTEM_ADDRESS = '0x3e0f389040A70c526022ecd41ff4d25934048Cd9' as `0x${string}`;

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

  const { data: isActionAvailable } = useReadContract({
    address: CHICKEN_GAME_ADDRESS,
    abi: chickenGameABI,
    functionName: 'isActionAvailable',
    args: address ? [address] : undefined,
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
  const claimableActions = chickenData ? Number(chickenData[1]) : 0
  const totalEggsLaid = chickenData ? Number(chickenData[3]) : 0
  const instantActionsRemaining = chickenData ? Number(chickenData[4]) : 10
  const initialized = chickenData ? chickenData[5] : false

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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100vh', paddingBottom: '70px', background: 'hsl(var(--background))' }}>
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100vh', paddingBottom: '70px', background: 'hsl(var(--background))' }}>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100vh', paddingBottom: '70px', background: 'hsl(var(--background))' }}>
      <div style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "clamp(1rem, 4vw, 2rem)",
        paddingTop: "110px"
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

        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="color-block-yellow" style={{
            padding: '1.5rem 3rem',
            display: 'inline-block',
            border: '3px solid hsl(var(--celo-black))',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              width: '35px',
              height: '8px',
              background: 'hsl(var(--celo-purple))',
              border: '2px solid hsl(var(--celo-black))'
            }}></div>
            <h1 className="text-headline-thin" style={{
              color: 'hsl(var(--celo-black))',
              margin: '0',
              fontSize: 'clamp(2rem, 6vw, 3.5rem)',
              textTransform: 'uppercase'
            }}>
              🐔 Chicken <span style={{ fontStyle: 'italic' }}>Care</span>
            </h1>
          </div>
        </div>

        {/* Chicken Stats Card */}
        <div className="color-block" style={{
          background: 'hsl(var(--celo-white))',
          padding: 'clamp(2rem, 5vw, 3rem)',
          marginBottom: '2rem',
          border: '3px solid hsl(var(--celo-black))',
          boxShadow: '6px 6px 0px hsl(var(--celo-black))'
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
          <div style={{ marginBottom: "2rem" }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.75rem"
            }}>
              <span className="text-body-black" style={{ 
                color: 'hsl(var(--celo-black))',
                textTransform: 'uppercase',
                fontSize: '1rem'
              }}>Happiness</span>
              <span className="text-body-black" style={{ 
                color: 'hsl(var(--celo-black))',
                fontSize: '1.2rem'
              }}>{happiness}/100</span>
            </div>
            <div style={{
              width: "100%",
              height: "30px",
              background: 'hsl(var(--celo-tan-2))',
              border: '3px solid hsl(var(--celo-black))',
              position: 'relative'
            }}>
              <div style={{
                width: `${happiness}%`,
                height: "100%",
                background: happiness >= 100 ? 'hsl(var(--celo-green))' : 'hsl(var(--celo-yellow))',
                transition: "width 0.3s ease",
                borderRight: happiness < 100 ? '3px solid hsl(var(--celo-black))' : 'none'
              }} />
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem"
          }}>
            <div className="color-block" style={{
              background: 'hsl(var(--celo-tan-2))',
              padding: '1.5rem',
              border: '3px solid hsl(var(--celo-black))',
              textAlign: "center",
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '20px',
                height: '5px',
                background: 'hsl(var(--celo-yellow))',
                border: '2px solid hsl(var(--celo-black))'
              }}></div>
              <div className="text-body-heavy" style={{
                fontSize: '0.75rem',
                color: 'hsl(var(--celo-brown))',
                textTransform: 'uppercase',
                marginBottom: '0.5rem'
              }}>Total Eggs</div>
              <div className="text-body-black" style={{
                fontSize: '2rem',
                color: 'hsl(var(--celo-black))'
              }}>
                {totalEggsLaid} 🥚
              </div>
            </div>
            <div className="color-block" style={{
              background: 'hsl(var(--celo-tan-2))',
              padding: '1.5rem',
              border: '3px solid hsl(var(--celo-black))',
              textAlign: "center",
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '20px',
                height: '5px',
                background: 'hsl(var(--celo-purple))',
                border: '2px solid hsl(var(--celo-black))'
              }}></div>
              <div className="text-body-heavy" style={{
                fontSize: '0.75rem',
                color: 'hsl(var(--celo-brown))',
                textTransform: 'uppercase',
                marginBottom: '0.5rem'
              }}>Instant</div>
              <div className="text-body-black" style={{
                fontSize: '2rem',
                color: 'hsl(var(--celo-black))'
              }}>
                {instantActionsRemaining} ⚡
              </div>
            </div>
            <div className="color-block" style={{
              background: 'hsl(var(--celo-tan-2))',
              padding: '1.5rem',
              border: '3px solid hsl(var(--celo-black))',
              textAlign: "center",
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '20px',
                height: '5px',
                background: 'hsl(var(--celo-green))',
                border: '2px solid hsl(var(--celo-black))'
              }}></div>
              <div className="text-body-heavy" style={{
                fontSize: '0.75rem',
                color: 'hsl(var(--celo-brown))',
                textTransform: 'uppercase',
                marginBottom: '0.5rem'
              }}>Claimable</div>
              <div className="text-body-black" style={{
                fontSize: '2rem',
                color: 'hsl(var(--celo-black))'
              }}>
                {claimableActions} ⏰
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
              className="btn-primary-industrial"
              style={{
                width: "100%",
                background: isAnyTransactionPending || !isCorrectNetwork ? 'hsl(var(--celo-brown))' : 'hsl(var(--celo-green))',
                color: 'hsl(var(--celo-white))',
                border: '3px solid hsl(var(--celo-black))',
                padding: '1.2rem',
                fontSize: '1.1rem',
                fontWeight: 'var(--font-weight-body-black)',
                textTransform: 'uppercase',
                cursor: isAnyTransactionPending || !isCorrectNetwork ? 'not-allowed' : 'pointer',
                marginBottom: '1rem',
                opacity: isAnyTransactionPending || !isCorrectNetwork ? 0.6 : 1,
                transition: 'var(--transition-fast)'
              }}
            >
              {!isCorrectNetwork ? '⚠️ Wrong Network' : isLayEggPending ? 'Confirm in wallet...' : isLayEggConfirming ? 'Confirming...' : isAnyTransactionPending ? '⏳ Pending...' : '🥚 Lay Egg (Get 1 EGG)'}
            </button>
          )}
        </div>

        {/* Actions Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.5rem",
          marginBottom: '2rem'
        }}>
          {/* Feed Action */}
          <button
            onClick={handleFeed}
            disabled={!isActionAvailable || isAnyTransactionPending || !isCorrectNetwork}
            className="color-block"
            style={{
              background: isActionAvailable && !isAnyTransactionPending && isCorrectNetwork ? 'hsl(var(--celo-white))' : 'hsl(var(--celo-tan-2))',
              border: '3px solid hsl(var(--celo-black))',
              padding: '2rem',
              cursor: isActionAvailable && !isAnyTransactionPending && isCorrectNetwork ? 'pointer' : 'not-allowed',
              opacity: isActionAvailable && !isAnyTransactionPending && isCorrectNetwork ? 1 : 0.6,
              transition: 'var(--transition-fast)',
              boxShadow: '4px 4px 0px hsl(var(--celo-black))'
            }}
            onMouseEnter={(e) => {
              if (isActionAvailable && !isAnyTransactionPending && isCorrectNetwork) {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '8px 8px 0px hsl(var(--celo-black))'
                e.currentTarget.style.background = 'hsl(var(--celo-yellow))'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '4px 4px 0px hsl(var(--celo-black))'
              if (isActionAvailable && !isAnyTransactionPending && isCorrectNetwork) {
                e.currentTarget.style.background = 'hsl(var(--celo-white))'
              }
            }}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🍗</div>
            <div className="text-body-black" style={{
              fontSize: '1.3rem',
              color: 'hsl(var(--celo-black))',
              marginBottom: '0.5rem',
              textTransform: 'uppercase'
            }}>
              Feed
            </div>
            <div className="text-body-heavy" style={{
              fontSize: '0.8rem',
              color: 'hsl(var(--celo-brown))',
              textTransform: 'uppercase'
            }}>
              {!isCorrectNetwork ? 'Wrong network' : isFeedPending ? 'Confirm...' : isFeedConfirming ? 'Processing...' : isAnyTransactionPending ? 'Wait...' : isActionAvailable ? '+10 happiness' : 'No actions available'}
            </div>
          </button>

          {/* Pet Action */}
          <button
            onClick={handlePet}
            disabled={!isActionAvailable || isAnyTransactionPending || !isCorrectNetwork}
            className="color-block"
            style={{
              background: isActionAvailable && !isAnyTransactionPending && isCorrectNetwork ? 'hsl(var(--celo-white))' : 'hsl(var(--celo-tan-2))',
              border: '3px solid hsl(var(--celo-black))',
              padding: '2rem',
              cursor: isActionAvailable && !isAnyTransactionPending && isCorrectNetwork ? 'pointer' : 'not-allowed',
              opacity: isActionAvailable && !isAnyTransactionPending && isCorrectNetwork ? 1 : 0.6,
              transition: 'var(--transition-fast)',
              boxShadow: '4px 4px 0px hsl(var(--celo-black))'
            }}
            onMouseEnter={(e) => {
              if (isActionAvailable && !isAnyTransactionPending && isCorrectNetwork) {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '8px 8px 0px hsl(var(--celo-black))'
                e.currentTarget.style.background = 'hsl(var(--celo-pink))'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '4px 4px 0px hsl(var(--celo-black))'
              if (isActionAvailable && !isAnyTransactionPending && isCorrectNetwork) {
                e.currentTarget.style.background = 'hsl(var(--celo-white))'
              }
            }}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>❤️</div>
            <div className="text-body-black" style={{
              fontSize: '1.3rem',
              color: 'hsl(var(--celo-black))',
              marginBottom: '0.5rem',
              textTransform: 'uppercase'
            }}>
              Pet
            </div>
            <div className="text-body-heavy" style={{
              fontSize: '0.8rem',
              color: 'hsl(var(--celo-brown))',
              textTransform: 'uppercase'
            }}>
              {!isCorrectNetwork ? 'Wrong network' : isPetPending ? 'Confirm...' : isPetConfirming ? 'Processing...' : isAnyTransactionPending ? 'Wait...' : isActionAvailable ? '+10 happiness' : 'No actions available'}
            </div>
          </button>

          {/* Play Action */}
          <button
            onClick={handlePlay}
            disabled={!isActionAvailable || isAnyTransactionPending || !isCorrectNetwork}
            className="color-block"
            style={{
              background: isActionAvailable && !isAnyTransactionPending && isCorrectNetwork ? 'hsl(var(--celo-white))' : 'hsl(var(--celo-tan-2))',
              border: '3px solid hsl(var(--celo-black))',
              padding: '2rem',
              cursor: isActionAvailable && !isAnyTransactionPending && isCorrectNetwork ? 'pointer' : 'not-allowed',
              opacity: isActionAvailable && !isAnyTransactionPending && isCorrectNetwork ? 1 : 0.6,
              transition: 'var(--transition-fast)',
              boxShadow: '4px 4px 0px hsl(var(--celo-black))'
            }}
            onMouseEnter={(e) => {
              if (isActionAvailable && !isAnyTransactionPending && isCorrectNetwork) {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '8px 8px 0px hsl(var(--celo-black))'
                e.currentTarget.style.background = 'hsl(var(--celo-purple))'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '4px 4px 0px hsl(var(--celo-black))'
              if (isActionAvailable && !isAnyTransactionPending && isCorrectNetwork) {
                e.currentTarget.style.background = 'hsl(var(--celo-white))'
              }
            }}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎾</div>
            <div className="text-body-black" style={{
              fontSize: '1.3rem',
              color: 'hsl(var(--celo-black))',
              marginBottom: '0.5rem',
              textTransform: 'uppercase'
            }}>
              Play
            </div>
            <div className="text-body-heavy" style={{
              fontSize: '0.8rem',
              color: 'hsl(var(--celo-brown))',
              textTransform: 'uppercase'
            }}>
              {!isCorrectNetwork ? 'Wrong network' : isPlayPending ? 'Confirm...' : isPlayConfirming ? 'Processing...' : isAnyTransactionPending ? 'Wait...' : isActionAvailable ? '+10 happiness' : 'No actions available'}
            </div>
          </button>
        </div>

        {/* Instructions */}
        <div className="color-block" style={{
          background: 'hsl(var(--celo-tan-2))',
          border: '3px solid hsl(var(--celo-black))',
          padding: 'clamp(1.5rem, 4vw, 2rem)'
        }}>
          <h3 className="text-body-black" style={{
            color: 'hsl(var(--celo-black))',
            marginBottom: '1rem',
            fontSize: '1.3rem',
            textTransform: 'uppercase'
          }}>How to Play</h3>
          <ul className="text-body-heavy" style={{
            color: 'hsl(var(--celo-brown))',
            lineHeight: 1.8,
            paddingLeft: '1.5rem',
            fontSize: '0.9rem'
          }}>
            <li>Perform actions (Feed, Pet, Play) to increase your chicken's happiness</li>
            <li>Each action adds +10 happiness points</li>
            <li>New users start with 10 free instant actions and 10 claimable actions!</li>
            <li>Actions accumulate over time: 1 action every 2 hours (max 10 stored)</li>
            <li>When happiness reaches 100, you can lay an egg to mint 1 EGG token</li>
            <li>Laying an egg resets happiness to 0</li>
            <li>Stake USDT to earn more instant actions (1 action per 1000 USDT)</li>
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

