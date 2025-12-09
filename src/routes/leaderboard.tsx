import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState, useEffect } from 'react'
import GlobalHeader from '../components/GlobalHeader'
import BottomNavigation from '../components/BottomNavigation'
import { leaderboardService, type TokenHolder } from '../libs/leaderboardService'
import { getContractAddresses, getRewardsConfig } from '../libs/constants'
import { seasonRewardABI } from '../abis/seasonRewardABI'
import { formatEther } from 'viem'

// Format date nicely
const formatEndDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

function LeaderboardPage() {
  const { chain, address } = useAccount()
  const navigate = useNavigate()
  const [holders, setHolders] = useState<TokenHolder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalHolders, setTotalHolders] = useState(0)
  const [daysRemaining, setDaysRemaining] = useState(0)
  const [userRank, setUserRank] = useState<number | null>(null)
  const [showTooltip, setShowTooltip] = useState<string | null>(null)
  const [claimTxHash, setClaimTxHash] = useState<`0x${string}` | undefined>()

  // Get contract addresses and rewards config based on current chain
  const contractAddresses = chain ? getContractAddresses(chain.id) : null
  const rewardsConfig = getRewardsConfig(chain?.id || 0)
  const seasonRewardAddress = contractAddresses?.seasonRewardContractAddress as `0x${string}` | undefined
  const seasonEndDate = rewardsConfig.seasonEndDate ? new Date(rewardsConfig.seasonEndDate) : null
  const hasSeasonEnded = seasonEndDate ? new Date() >= seasonEndDate : false
  const seasonEndLabel = seasonEndDate ? formatEndDate(seasonEndDate) : null

  // Read claim status from SeasonReward contract
  const { data: claimStatus, refetch: refetchClaimStatus } = useReadContract({
    address: seasonRewardAddress,
    abi: seasonRewardABI,
    functionName: 'getClaimStatus',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address && !!seasonRewardAddress && seasonRewardAddress !== '0x0000000000000000000000000000000000000000'
    }
  })

  // Read if distribution is active
  const { data: isDistributionActive } = useReadContract({
    address: seasonRewardAddress,
    abi: seasonRewardABI,
    functionName: 'isDistributionActive',
    query: { 
      enabled: !!seasonRewardAddress && seasonRewardAddress !== '0x0000000000000000000000000000000000000000'
    }
  })

  // Write contract hook for claiming
  const { writeContract, isPending: isClaimPending } = useWriteContract()

  // Transaction confirmation
  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: claimTxHash,
  })

  // Refetch claim status on success
  useEffect(() => {
    if (isClaimSuccess) {
      refetchClaimStatus()
      setClaimTxHash(undefined)
    }
  }, [isClaimSuccess])

  // Parse claim status
  const rewardAmount = claimStatus ? claimStatus[0] : BigInt(0)
  const hasClaimed = claimStatus ? claimStatus[1] : false
  const canClaim = claimStatus ? claimStatus[2] : false
  const hasSeasonRewardContract = seasonRewardAddress && seasonRewardAddress !== '0x0000000000000000000000000000000000000000'
  const canPressClaim = !!address && !!seasonRewardAddress && canClaim
  const handleClaimReward = () => {
    if (!seasonRewardAddress || !canPressClaim) return
    writeContract({
      address: seasonRewardAddress,
      abi: seasonRewardABI,
      functionName: 'claimReward',
    }, {
      onSuccess: (hash) => setClaimTxHash(hash)
    })
  }
  const claimButtonLabel = (() => {
    if (isClaimPending || isClaimConfirming) return '⏳ Claiming...'
    if (!hasSeasonRewardContract) return 'Rewards not ready'
    if (!address) return 'Connect wallet to claim'
    if (hasClaimed) return 'Already claimed'
    if (rewardAmount === BigInt(0)) return 'Nothing to claim'
    if (isDistributionActive === false) return 'Claim period ended'
    return `Claim ${formatEther(rewardAmount)} ${rewardsConfig.currency}`
  })()
  const claimButtonDisabled = isClaimPending || isClaimConfirming || !canPressClaim

  const fetchLeaderboard = async () => {
    if (!chain || !contractAddresses) {
      console.log('[Leaderboard] Skipping fetch - chain or contract not ready')
      return
    }

    console.log('[Leaderboard] Starting fetch for chain:', chain.id)
    setLoading(true)
    setError(null)
    
    try {
      const result = await leaderboardService.getLeaderboard(
        contractAddresses.token1ContractAddress,
        chain.id,
        rewardsConfig.maxWinners
      )
      console.log('[Leaderboard] Result received:', {
        success: result.success,
        holdersCount: result.holders?.length,
        error: result.error
      })
      console.log('[Leaderboard] Sample holder data:', result.holders?.[0])
      
      if (result.success && result.holders) {
        setHolders(result.holders)
        setTotalHolders(result.totalHolders || 0)
        
        // Find user's rank if connected
        if (address) {
          const userIndex = result.holders.findIndex(holder => 
            holder.address.toLowerCase() === address.toLowerCase()
          )
          setUserRank(userIndex >= 0 ? userIndex + 1 : null)
          console.log('[Leaderboard] User rank:', userIndex >= 0 ? userIndex + 1 : 'Not found')
        }
      } else {
        console.error('[Leaderboard] Failed to load:', result.error)
        setError(result.error || 'Failed to load leaderboard')
      }
    } catch (err) {
      console.error('[Leaderboard] Exception:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Calculate days remaining based on chain's season end date
  useEffect(() => {
    if (rewardsConfig.seasonEndDate) {
      const seasonEndDate = new Date(rewardsConfig.seasonEndDate)
      const today = new Date()
      const timeDiff = seasonEndDate.getTime() - today.getTime()
      const days = Math.ceil(timeDiff / (1000 * 3600 * 24))
      setDaysRemaining(Math.max(0, days))
    } else {
      setDaysRemaining(0) // No season end date
    }
  }, [rewardsConfig])

  useEffect(() => {
    console.log('[Leaderboard] Effect triggered - chain:', chain?.id, 'contractAddresses:', !!contractAddresses)
    if (chain && contractAddresses) {
      // Add a small delay to ensure everything is ready
      const timer = setTimeout(() => {
        fetchLeaderboard()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [chain, contractAddresses])

  const chainName = chain?.name || 'Unknown'

  return (
    <div style={{
      minHeight: '100vh',
      paddingBottom: '70px',
      background: 'hsl(var(--background))'
    }}>
      <GlobalHeader />

      {/* Main Content */}
      <div style={{
        paddingTop: "85px",
        padding: "clamp(0.8rem, 3vw, 1.5rem)",
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        {/* Bold Header Section */}
        <div style={{ marginBottom: "1.5rem" }}>
          {/* Title */}
          <div style={{
            marginBottom: "1.2rem",
            textAlign: "center"
          }}>
            <div className="color-block-purple" style={{
              padding: '1rem 2rem',
              display: 'inline-block',
              border: '3px solid hsl(var(--celo-black))',
              position: 'relative',
              boxShadow: '3px 3px 0px hsl(var(--celo-black))'
            }}>
              <div style={{
                position: 'absolute',
                top: '-10px',
                left: '-10px',
                width: '40px',
                height: '8px',
                background: 'hsl(var(--celo-yellow))',
                border: '2px solid hsl(var(--celo-black))'
              }}></div>
              <h1 className="text-headline-thin" style={{
                color: 'hsl(var(--celo-white))',
                fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
                margin: '0',
                textTransform: 'uppercase'
              }}>
                🏆 Top <span style={{ fontStyle: 'italic', color: 'hsl(var(--celo-white))' }}>Performers</span>
              </h1>
            </div>
            {rewardsConfig.seasonEndDate && (
              <div className="color-block" style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: daysRemaining <= 7 ? 'hsl(var(--celo-yellow))' : 'hsl(var(--celo-tan-2))',
                padding: '0.5rem 1rem',
                border: '3px solid hsl(var(--celo-black))',
                fontSize: '0.9rem',
                fontWeight: 'var(--font-weight-body-black)',
                color: 'hsl(var(--celo-black))',
                textTransform: 'uppercase',
                marginTop: '1rem'
              }}>
                <span style={{ fontSize: '1.2rem' }}>{daysRemaining <= 7 ? '⚡' : '📅'}</span>
                <span>{daysRemaining} days left</span>
              </div>
            )}
            
            {/* How It Works Section */}
            <div style={{
              marginTop: '1.5rem',
              background: 'hsl(var(--celo-white))',
              border: '3px solid hsl(var(--celo-black))',
              padding: '1.25rem',
              textAlign: 'left',
              maxWidth: '600px',
              marginLeft: 'auto',
              marginRight: 'auto',
              boxShadow: '3px 3px 0px hsl(var(--celo-black))'
            }}>
              <h3 style={{
                margin: '0 0 1rem 0',
                fontSize: '1rem',
                textTransform: 'uppercase',
                fontWeight: 'var(--font-weight-body-black)',
                color: 'hsl(var(--celo-black))',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>📖</span> How It Works
              </h3>
              <div style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'hsl(var(--celo-brown))' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ 
                    background: 'hsl(var(--celo-green))', 
                    color: 'white', 
                    borderRadius: '50%', 
                    width: '24px', 
                    height: '24px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>1</span>
                  <span><strong>Play quizzes</strong> to earn XP tokens during the competition period</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ 
                    background: 'hsl(var(--celo-yellow))', 
                    color: 'hsl(var(--celo-black))', 
                    borderRadius: '50%', 
                    width: '24px', 
                    height: '24px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>2</span>
                  <span><strong>Climb the leaderboard</strong> — top {rewardsConfig.maxWinners} players share the {rewardsConfig.totalReward} {rewardsConfig.currency} prize pool</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ 
                    background: 'hsl(var(--celo-purple))', 
                    color: 'white', 
                    borderRadius: '50%', 
                    width: '24px', 
                    height: '24px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>3</span>
                  <span><strong>Claim rewards</strong> after {rewardsConfig.seasonEndDate ? formatEndDate(rewardsConfig.seasonEndDate) : 'the competition ends'} — proportional to your XP share</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem"
          }}>
            {/* Pool Card */}
            <div
              className="color-block"
              style={{
                textAlign: "center",
                padding: "1.2rem",
                background: 'hsl(var(--celo-white))',
                border: '3px solid hsl(var(--celo-black))',
                position: "relative",
                boxShadow: '3px 3px 0px hsl(var(--celo-black))'
              }}
              onMouseEnter={() => setShowTooltip('pool')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <div style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                width: '25px',
                height: '5px',
                background: 'hsl(var(--celo-yellow))',
                border: '2px solid hsl(var(--celo-black))'
              }}></div>
              <div className="text-body-black" style={{ 
                fontSize: "2.5rem",
                color: 'hsl(var(--celo-black))',
                lineHeight: "1",
                marginBottom: '0.5rem'
              }}>
                {rewardsConfig.totalReward >= 1000 
                  ? `${(rewardsConfig.totalReward / 1000).toFixed(0)}K` 
                  : rewardsConfig.totalReward}
              </div>
              <div className="text-body-heavy" style={{ 
                fontSize: "0.75rem",
                color: 'hsl(var(--celo-brown))',
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                {rewardsConfig.currency} Pool
              </div>
              {showTooltip === 'pool' && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#1f2937",
                  color: "white",
                  padding: "0.5rem",
                  borderRadius: "6px",
                  fontSize: "0.7rem",
                  whiteSpace: "nowrap",
                  zIndex: 10,
                  marginTop: "0.25rem"
                }}>
                  Total reward pool split among winners
                </div>
              )}
            </div>
            
            {/* Winners Card */}
            <div
              className="color-block"
              style={{
                textAlign: "center",
                padding: "1.2rem",
                background: 'hsl(var(--celo-white))',
                border: '3px solid hsl(var(--celo-black))',
                position: "relative",
                boxShadow: '3px 3px 0px hsl(var(--celo-black))'
              }}
              onMouseEnter={() => setShowTooltip('winners')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <div style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                width: '25px',
                height: '5px',
                background: 'hsl(var(--celo-green))',
                border: '2px solid hsl(var(--celo-black))'
              }}></div>
              <div className="text-body-black" style={{ 
                fontSize: "2.5rem",
                color: 'hsl(var(--celo-black))',
                lineHeight: "1",
                marginBottom: '0.5rem'
              }}>
                {rewardsConfig.maxWinners}
              </div>
              <div className="text-body-heavy" style={{ 
                fontSize: "0.75rem",
                color: 'hsl(var(--celo-brown))',
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                Winners
              </div>
              {showTooltip === 'winners' && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#1f2937",
                  color: "white",
                  padding: "0.5rem",
                  borderRadius: "6px",
                  fontSize: "0.7rem",
                  whiteSpace: "nowrap",
                  zIndex: 10,
                  marginTop: "0.25rem"
                }}>
                  Top players who will receive rewards
                </div>
              )}
            </div>
            
            {/* Network Card */}
            <div className="color-block" style={{
              textAlign: "center",
              padding: "1.2rem",
              background: 'hsl(var(--celo-white))',
              border: '3px solid hsl(var(--celo-black))',
              position: 'relative',
              boxShadow: '3px 3px 0px hsl(var(--celo-black))'
            }}>
              <div style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                width: '25px',
                height: '5px',
                background: 'hsl(var(--celo-purple))',
                border: '2px solid hsl(var(--celo-black))'
              }}></div>
              <div className="text-body-black" style={{
                fontSize: "1.5rem",
                color: 'hsl(var(--celo-black))',
                lineHeight: "1",
                marginBottom: '0.4rem',
                textTransform: 'uppercase'
              }}>
                {chainName}
              </div>
              <div className="text-body-heavy" style={{ 
                fontSize: "0.75rem",
                color: 'hsl(var(--celo-brown))',
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                Network
              </div>
            </div>
          </div>
        </div>
        {/* Content Area */}
        {loading ? (
          <div style={{ 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center", 
            padding: "3rem",
            background: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              border: "3px solid #e5e7eb",
              borderTop: "3px solid #58CC02",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
            <span style={{ marginLeft: "1rem", fontSize: "1rem" }}>Loading leaderboard...</span>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : error ? (
          <div style={{ 
            textAlign: "center", 
            padding: "3rem",
            background: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>😕</div>
            <p style={{ color: "#dc2626", fontSize: "1rem", marginBottom: "1rem" }}>{error}</p>
            <button
              onClick={fetchLeaderboard}
              style={{
                padding: "0.5rem 1rem",
                background: "#58CC02",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.9rem"
              }}
            >
              Try Again
            </button>
          </div>
        ) : holders.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "3rem",
            background: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
              {!address ? "🎮" : "📋"}
            </div>
            {!address ? (
              <>
                <h3 style={{ color: "#111827", fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
                  Join the Competition!
                </h3>
                <p style={{ color: "#6b7280", fontSize: "1rem", marginBottom: "2rem", lineHeight: "1.5" }}>
                  Connect your wallet and start playing quizzes to earn XP and climb the leaderboard. 
                  Be among the first players to secure your spot in the winner's circle!
                </p>
                <button
                  onClick={() => navigate({ to: '/' })}
                  style={{
                    background: "linear-gradient(135deg, #58CC02, #46a001)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    padding: "1rem 2rem",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(88, 204, 2, 0.3)",
                    transition: "all 0.2s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)"
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(88, 204, 2, 0.4)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(88, 204, 2, 0.3)"
                  }}
                >
                  🚀 Get Started
                </button>
              </>
            ) : (
              <>
                <p style={{ color: "#6b7280", fontSize: "1rem", marginBottom: "1rem" }}>
                  No players on the leaderboard yet
                </p>
                <p style={{ color: "#9ca3af", fontSize: "0.9rem", lineHeight: "1.5" }}>
                  Be the first to earn XP by playing quizzes!<br />
                  Your progress will appear here once you start playing.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Season Rewards Claim Section */}
            {hasSeasonRewardContract && address && (
              <div style={{
                background: hasClaimed 
                  ? "linear-gradient(135deg, #d1fae5, #a7f3d0)"
                  : canClaim 
                    ? "linear-gradient(135deg, #fef3c7, #fde68a)"
                    : "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
                border: canClaim ? "2px solid #f59e0b" : "2px solid #d1d5db",
                padding: "1.25rem",
                borderRadius: "16px",
                marginBottom: "1rem",
                textAlign: "center"
              }}>
                {seasonEndLabel && (
                  <div style={{ 
                    fontSize: "0.85rem", 
                    color: "#6b7280",
                    marginBottom: "0.35rem",
                    fontWeight: 600
                  }}>
                    {hasSeasonEnded ? "Season ended" : "Season ends"} on {seasonEndLabel}
                  </div>
                )}
                <div style={{ 
                  fontSize: "1.5rem", 
                  marginBottom: "0.5rem"
                }}>
                  {hasClaimed ? "✅" : canClaim ? "🎁" : rewardAmount > BigInt(0) ? "⏳" : "📊"}
                </div>
                <div style={{ 
                  fontSize: "1.1rem", 
                  fontWeight: "600",
                  color: "#1e293b",
                  marginBottom: "0.5rem"
                }}>
                  {hasClaimed 
                    ? "Reward Claimed!" 
                    : canClaim 
                      ? `${formatEther(rewardAmount)} ${rewardsConfig.currency} Available!`
                      : rewardAmount > BigInt(0)
                        ? `${formatEther(rewardAmount)} ${rewardsConfig.currency} Pending`
                        : "No Rewards Yet"
                  }
                </div>
                <button
                  onClick={handleClaimReward}
                  disabled={claimButtonDisabled}
                  style={{
                    background: claimButtonDisabled ? "#e5e7eb" : "linear-gradient(135deg, #22c55e, #16a34a)",
                    color: claimButtonDisabled ? "#9ca3af" : "white",
                    border: "none",
                    borderRadius: "12px",
                    padding: "1rem 2rem",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: claimButtonDisabled ? "not-allowed" : "pointer",
                    boxShadow: claimButtonDisabled ? "none" : "0 4px 12px rgba(34, 197, 94, 0.3)",
                    marginTop: "0.5rem"
                  }}
                >
                  {claimButtonLabel}
                </button>
                {!isDistributionActive && !hasClaimed && rewardAmount > BigInt(0) && (
                  <div style={{ 
                    fontSize: "0.85rem", 
                    color: "#dc2626",
                    marginTop: "0.5rem"
                  }}>
                    ⚠️ Claim period has ended
                  </div>
                )}
                {hasClaimed && (
                  <div style={{ 
                    fontSize: "0.85rem", 
                    color: "#16a34a",
                    marginTop: "0.25rem"
                  }}>
                    Your reward has been sent to your wallet
                  </div>
                )}
              </div>
            )}

            {/* User Position Banner */}
            {address && userRank && (
              <div style={{
                background: "linear-gradient(135deg, #f8fafc, #e2e8f0)",
                border: "2px solid #e2e8f0",
                color: "#334155",
                padding: "1.25rem",
                borderRadius: "16px",
                marginBottom: "1rem",
                textAlign: "center",
                position: "relative",
                overflow: "hidden"
              }}>
                {/* Subtle background pattern */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 20 20\"><circle cx=\"10\" cy=\"10\" r=\"1\" fill=\"%23e2e8f0\" opacity=\"0.3\"/></svg>') repeat",
                  pointerEvents: "none"
                }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ 
                    fontSize: "0.85rem", 
                    color: "#64748b",
                    marginBottom: "0.5rem",
                    fontWeight: "500",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}>
                    📊 Your Current Position
                  </div>
                  <div style={{ 
                    fontSize: "2rem", 
                    fontWeight: "800",
                    color: "#1e293b",
                    marginBottom: "0.25rem"
                  }}>
                    #{userRank}
                  </div>
                  <div style={{
                    fontSize: "0.9rem",
                    color: "#64748b",
                    marginBottom: userRank > rewardsConfig.maxWinners ? "0.75rem" : "0"
                  }}>
                    out of {holders.length} players
                  </div>
                  {userRank > rewardsConfig.maxWinners && (
                    <div style={{ 
                      fontSize: "0.8rem", 
                      color: "#f59e0b",
                      background: "rgba(245, 158, 11, 0.1)",
                      padding: "0.5rem 1rem",
                      borderRadius: "20px",
                      display: "inline-block",
                      fontWeight: "600"
                    }}>
                      🎯 Complete more quizzes to enter the winner zone!
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* CTA Button */}
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <button
                onClick={() => navigate({ to: '/' })}
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "1rem 2rem",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                  transition: "all 0.2s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(59, 130, 246, 0.4)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)"
                }}
              >
                🎮 Play Quiz to Earn XP
              </button>
            </div>
            
            {/* Leaderboard Table */}
            <div style={{ 
              background: 'hsl(var(--celo-white))',
              border: '3px solid hsl(var(--celo-black))',
              boxShadow: '6px 6px 0px hsl(var(--celo-black))'
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th style={{ textAlign: "left", padding: "0.5rem", fontWeight: "600", color: "#111827", fontSize: "0.85rem", width: "80px" }}>Rank</th>
                    <th style={{ textAlign: "left", padding: "0.5rem", fontWeight: "600", color: "#111827", fontSize: "0.85rem" }}>Address</th>
                    <th style={{ textAlign: "right", padding: "0.5rem", fontWeight: "600", color: "#111827", fontSize: "0.85rem", width: "100px" }}>XP</th>
                    <th style={{ textAlign: "center", padding: "0.5rem", fontWeight: "600", color: "#111827", fontSize: "0.85rem", width: "120px" }}>Reward</th>
                  </tr>
                </thead>
                <tbody>
                  {holders.map((holder, index) => {
                    const rank = index + 1
                    const getProportionalReward = (userXP: string) => {
                      const totalReward = rewardsConfig.totalReward
                      const maxWinners = rewardsConfig.maxWinners
                      
                      // Calculate total XP of eligible winners (top N or all if less than N)
                      const eligibleHolders = holders.slice(0, Math.min(holders.length, maxWinners))
                      const totalXP = eligibleHolders.reduce((sum, holder) => {
                        return sum + parseFloat(holder.balance)
                      }, 0)
                      
                      if (totalXP === 0) return 0
                      
                      // Calculate proportional reward: (user_xp / total_xp) * totalReward
                      const userXPValue = parseFloat(userXP)
                      const proportion = userXPValue / totalXP
                      return Math.floor(totalReward * proportion)
                    }
                    
                    return (
                      <tr key={holder.address} style={{ borderTop: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "0.5rem" }}>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            {rank <= 3 && (
                              <span style={{ marginRight: "0.25rem", fontSize: "0.9rem" }}>
                                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                              </span>
                            )}
                            <span style={{ 
                              fontWeight: "600",
                              color: rank <= 3 ? "#58CC02" : "#111827",
                              fontSize: "0.85rem"
                            }}>
                              #{rank}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "0.5rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            {/* Profile picture or avatar */}
                            {holder.farcasterPfpUrl && holder.farcasterPfpUrl.trim() !== '' ? (
                              <>
                                <img
                                  src={holder.farcasterPfpUrl}
                                  alt={holder.farcasterUsername || 'Profile'}
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    border: "2px solid #7c3aed",
                                    objectFit: "cover"
                                  }}
                                  onError={(e) => {
                                    console.error('[Leaderboard] Failed to load image for', holder.farcasterUsername, holder.farcasterPfpUrl);
                                    // Replace with fallback initials
                                    const target = e.currentTarget;
                                    const parent = target.parentElement;
                                    if (parent) {
                                      target.style.display = 'none';
                                      // Create fallback div
                                      const fallback = document.createElement('div');
                                      fallback.style.cssText = `
                                        width: 32px;
                                        height: 32px;
                                        border-radius: 50%;
                                        background: hsl(${holder.address.slice(-6).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 70%, 60%);
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-size: 0.7rem;
                                        font-weight: 600;
                                        color: white;
                                        border: 2px solid #e5e7eb;
                                      `;
                                      fallback.textContent = holder.address.slice(2, 4).toUpperCase();
                                      parent.insertBefore(fallback, target);
                                    }
                                  }}
                                />
                              </>
                            ) : (
                              <div style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                background: `hsl(${holder.address.slice(-6).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 70%, 60%)`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.7rem",
                                fontWeight: "600",
                                color: "white",
                                border: "2px solid #e5e7eb"
                              }}>
                                {holder.address.slice(2, 4).toUpperCase()}
                              </div>
                            )}
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                              {holder.farcasterUsername ? (
                                <>
                                  <span style={{
                                    background: address?.toLowerCase() === holder.address.toLowerCase() ? "#dbeafe" : "#f9fafb",
                                    padding: "0.2rem 0.4rem",
                                    borderRadius: "4px",
                                    fontSize: "0.75rem",
                                    fontWeight: "600",
                                    color: "#7c3aed",
                                    border: address?.toLowerCase() === holder.address.toLowerCase() ? "1px solid #3b82f6" : "1px solid #e5e7eb",
                                  }}>
                                    @{holder.farcasterUsername}
                                  </span>
                                  <code
                                    style={{
                                      background: "transparent",
                                      padding: "0 0.4rem",
                                      fontSize: "0.6rem",
                                      fontFamily: "monospace",
                                      color: "#9ca3af",
                                      cursor: "pointer"
                                    }}
                                    onClick={() => navigator.clipboard.writeText(holder.address)}
                                    title="Click to copy address"
                                  >
                                    {leaderboardService.truncateAddress(holder.address)}
                                  </code>
                                </>
                              ) : (
                                <code
                                  style={{
                                    background: address?.toLowerCase() === holder.address.toLowerCase() ? "#dbeafe" : "#f9fafb",
                                    padding: "0.2rem 0.4rem",
                                    borderRadius: "4px",
                                    fontSize: "0.7rem",
                                    fontFamily: "monospace",
                                    display: "block",
                                    maxWidth: "100%",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    border: address?.toLowerCase() === holder.address.toLowerCase() ? "1px solid #3b82f6" : "none",
                                    cursor: "pointer"
                                  }}
                                  onClick={() => navigator.clipboard.writeText(holder.address)}
                                  title="Click to copy address"
                                >
                                  {leaderboardService.truncateAddress(holder.address)}
                                </code>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "0.5rem", textAlign: "right" }}>
                          <span style={{ fontWeight: "600", color: "#111827", fontSize: "0.8rem" }}>
                            {leaderboardService.formatBalance(holder.balance)}
                          </span>
                        </td>
                        <td style={{ padding: "0.5rem", textAlign: "center" }}>
                          {rank <= rewardsConfig.maxWinners ? (
                            <span style={{
                              background: rank <= 3 ? "#58CC02" : "#f3f4f6",
                              color: rank <= 3 ? "white" : "#374151",
                              padding: "0.2rem 0.4rem",
                              borderRadius: "4px",
                              fontSize: "0.7rem",
                              fontWeight: "600",
                              display: "inline-block"
                            }}>
                              {rewardsConfig.symbol} {getProportionalReward(holder.balance)}
                            </span>
                          ) : (
                            <span style={{
                              background: "#fef3c7",
                              color: "#92400e",
                              padding: "0.2rem 0.4rem",
                              borderRadius: "4px",
                              fontSize: "0.7rem",
                              fontWeight: "600",
                              display: "inline-block"
                            }}>
                              Keep going! 🎯
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.8rem", color: "#6b7280" }}>
              <p>Rewards distributed proportionally by XP share among top {rewardsConfig.maxWinners} holders</p>
              <p>Data updates every 5 minutes • Powered by Blockscout indexing</p>
              <p style={{ fontSize: "0.7rem", marginTop: "0.5rem", color: "#9ca3af" }}>
                ⚠️ Blockscout indexing can be slow. For real-time data, check{" "}
                {chain?.blockExplorers?.default && contractAddresses && (
                  <a 
                    href={`${chain.blockExplorers.default.url}/token/${contractAddresses.token1ContractAddress}?tab=holders`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      color: "#3b82f6", 
                      textDecoration: "underline",
                      fontSize: "0.7rem"
                    }}
                  >
                    {chain.blockExplorers.default.name} ↗
                  </a>
                )}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export const Route = createFileRoute('/leaderboard')({
  component: LeaderboardPage,
})
