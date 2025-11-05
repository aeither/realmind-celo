import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import GlobalHeader from '../components/GlobalHeader'
import BottomNavigation from '../components/BottomNavigation'
import { leaderboardService, type TokenHolder } from '../libs/leaderboardService'
import { getContractAddresses, getRewardsConfig } from '../libs/constants'

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

  // Get contract addresses and rewards config based on current chain
  const contractAddresses = chain ? getContractAddresses(chain.id) : null
  const rewardsConfig = getRewardsConfig(chain?.id || 0)

  const fetchLeaderboard = async () => {
    if (!chain || !contractAddresses) return

    setLoading(true)
    setError(null)
    
    try {
      const result = await leaderboardService.getLeaderboard(
        contractAddresses.token1ContractAddress,
        chain.id,
        rewardsConfig.maxWinners
      )
      console.log('Leaderboard result:', result)
      if (result.success && result.holders) {
        setHolders(result.holders)
        setTotalHolders(result.totalHolders || 0)
        
        // Find user's rank if connected
        if (address) {
          const userIndex = result.holders.findIndex(holder => 
            holder.address.toLowerCase() === address.toLowerCase()
          )
          setUserRank(userIndex >= 0 ? userIndex + 1 : null)
        }
      } else {
        setError(result.error || 'Failed to load leaderboard')
      }
    } catch (err) {
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
    if (chain && contractAddresses) {
      fetchLeaderboard()
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
                    📊 Your Current Positionx
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
                            {/* Simple avatar */}
                            <div style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              background: `hsl(${holder.address.slice(-6).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 70%, 60%)`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.6rem",
                              fontWeight: "600",
                              color: "white"
                            }}>
                              {holder.farcasterUsername ? '🟣' : holder.address.slice(2, 4).toUpperCase()}
                            </div>
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
                            {leaderboardService.formatBalance(holder.balance)} XP
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
