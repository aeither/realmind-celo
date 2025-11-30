import { createFileRoute } from '@tanstack/react-router'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState, useEffect } from 'react'
import GlobalHeader from '../components/GlobalHeader'
import BottomNavigation from '../components/BottomNavigation'
import { bunnyGameABI } from '../abis/bunnyGameABI'
import { retentionSystemABI } from '../abis/retentionSystemABI'
import { eggTokenABI } from '../abis/eggTokenABI'
import { getContractAddresses } from '../libs/constants'
import { formatEther } from 'viem'

function BunnyGamePage() {
  const { address, chain } = useAccount()
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const [referrer, setReferrer] = useState('')
  
  const contracts = chain ? getContractAddresses(chain.id) : null
  const bunnyGameAddress = contracts?.bunnyGameContractAddress as `0x${string}` | undefined
  const retentionAddress = contracts?.retentionSystemContractAddress as `0x${string}` | undefined
  const eggTokenAddress = contracts?.eggTokenContractAddress as `0x${string}` | undefined

  // BunnyGame reads
  const { data: bunnyData, refetch: refetchBunny } = useReadContract({
    address: bunnyGameAddress,
    abi: bunnyGameABI,
    functionName: 'getBunny',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!bunnyGameAddress && bunnyGameAddress !== '0x0000000000000000000000000000000000000000' }
  })

  const { data: isActionAvailable, refetch: refetchAction } = useReadContract({
    address: bunnyGameAddress,
    abi: bunnyGameABI,
    functionName: 'isActionAvailable',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!bunnyGameAddress && bunnyGameAddress !== '0x0000000000000000000000000000000000000000' }
  })

  const { data: canLayEgg, refetch: refetchCanLay } = useReadContract({
    address: bunnyGameAddress,
    abi: bunnyGameABI,
    functionName: 'canLayEgg',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!bunnyGameAddress && bunnyGameAddress !== '0x0000000000000000000000000000000000000000' }
  })

  const { data: timeUntilAction } = useReadContract({
    address: bunnyGameAddress,
    abi: bunnyGameABI,
    functionName: 'getTimeUntilNextAction',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!bunnyGameAddress && bunnyGameAddress !== '0x0000000000000000000000000000000000000000' }
  })

  // RetentionSystem reads
  const { data: userStats, refetch: refetchStats } = useReadContract({
    address: retentionAddress,
    abi: retentionSystemABI,
    functionName: 'getUserStats',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!retentionAddress && retentionAddress !== '0x0000000000000000000000000000000000000000' }
  })

  const { data: nextReward } = useReadContract({
    address: retentionAddress,
    abi: retentionSystemABI,
    functionName: 'getNextReward',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!retentionAddress && retentionAddress !== '0x0000000000000000000000000000000000000000' }
  })

  // EggToken balance
  const { data: eggBalance, refetch: refetchBalance } = useReadContract({
    address: eggTokenAddress,
    abi: eggTokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!eggTokenAddress && eggTokenAddress !== '0x0000000000000000000000000000000000000000' }
  })

  // Write functions
  const { writeContract, isPending } = useWriteContract()

  // Transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Refetch on success
  useEffect(() => {
    if (isSuccess) {
      refetchBunny()
      refetchAction()
      refetchCanLay()
      refetchStats()
      refetchBalance()
      setTxHash(undefined)
    }
  }, [isSuccess])

  const handleTapBunny = () => {
    if (!bunnyGameAddress) return
    writeContract({
      address: bunnyGameAddress,
      abi: bunnyGameABI,
      functionName: 'tapBunny',
    }, {
      onSuccess: (hash) => setTxHash(hash)
    })
  }

  const handleLayEgg = () => {
    if (!bunnyGameAddress) return
    writeContract({
      address: bunnyGameAddress,
      abi: bunnyGameABI,
      functionName: 'layEgg',
    }, {
      onSuccess: (hash) => setTxHash(hash)
    })
  }

  const handleCheckIn = () => {
    if (!retentionAddress) return
    writeContract({
      address: retentionAddress,
      abi: retentionSystemABI,
      functionName: 'checkIn',
    }, {
      onSuccess: (hash) => setTxHash(hash)
    })
  }

  const handleCheckInWithReferral = () => {
    if (!retentionAddress || !referrer) return
    writeContract({
      address: retentionAddress,
      abi: retentionSystemABI,
      functionName: 'checkInWithReferral',
      args: [referrer as `0x${string}`],
    }, {
      onSuccess: (hash) => setTxHash(hash)
    })
  }

  const formatTime = (seconds: bigint) => {
    const s = Number(seconds)
    const hours = Math.floor(s / 3600)
    const mins = Math.floor((s % 3600) / 60)
    return `${hours}h ${mins}m`
  }

  const isContractDeployed = bunnyGameAddress && bunnyGameAddress !== '0x0000000000000000000000000000000000000000'

  return (
    <div style={{
      minHeight: '100vh',
      paddingBottom: '70px',
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
    }}>
      <GlobalHeader />

      <div style={{
        paddingTop: "85px",
        padding: "clamp(0.8rem, 3vw, 1.5rem)",
        maxWidth: "800px",
        margin: "0 auto"
      }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>🐰 Bunny Game</h1>
          <p style={{ color: '#666', margin: '0.5rem 0' }}>
            Tap your bunny, earn eggs!
          </p>
        </div>

        {!address ? (
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontSize: '1.2rem', margin: 0 }}>
              Connect your wallet to play!
            </p>
          </div>
        ) : !isContractDeployed ? (
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontSize: '1.2rem', color: '#f59e0b', margin: 0 }}>
              ⚠️ BunnyGame not deployed on {chain?.name || 'this chain'}
            </p>
            <p style={{ color: '#666', marginTop: '1rem' }}>
              Please switch to a supported network or deploy the contracts.
            </p>
          </div>
        ) : (
          <>
            {/* Egg Balance */}
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '16px',
              marginBottom: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem' }}>🥚</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {eggBalance ? formatEther(eggBalance) : '0'} EGG
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Your Egg Balance</div>
            </div>

            {/* Bunny Stats */}
            {bunnyData && (
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '16px',
                marginBottom: '1rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>🐰 Your Bunny</h2>
                
                {/* Happiness Bar */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Happiness</span>
                    <span style={{ fontWeight: 'bold' }}>{Number(bunnyData[0])}/100</span>
                  </div>
                  <div style={{
                    background: '#e5e7eb',
                    borderRadius: '999px',
                    height: '12px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: Number(bunnyData[0]) >= 100 ? '#22c55e' : '#f59e0b',
                      height: '100%',
                      width: `${Number(bunnyData[0])}%`,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{Number(bunnyData[4])}</div>
                    <div style={{ color: '#666', fontSize: '0.8rem' }}>Instant Actions</div>
                  </div>
                  <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{Number(bunnyData[1])}</div>
                    <div style={{ color: '#666', fontSize: '0.8rem' }}>Claimable Actions</div>
                  </div>
                  <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{Number(bunnyData[3])}</div>
                    <div style={{ color: '#666', fontSize: '0.8rem' }}>Total Eggs Laid</div>
                  </div>
                  <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                      {timeUntilAction && Number(timeUntilAction) > 0 ? formatTime(timeUntilAction) : '✅'}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.8rem' }}>Next Action</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={handleTapBunny}
                    disabled={isPending || isConfirming || !isActionAvailable}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      fontSize: '1.2rem',
                      background: isActionAvailable ? '#f59e0b' : '#9ca3af',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: isActionAvailable ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold'
                    }}
                  >
                    {isPending || isConfirming ? '⏳' : '👆 Tap Bunny'}
                  </button>
                  <button
                    onClick={handleLayEgg}
                    disabled={isPending || isConfirming || !canLayEgg}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      fontSize: '1.2rem',
                      background: canLayEgg ? '#22c55e' : '#9ca3af',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: canLayEgg ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold'
                    }}
                  >
                    {isPending || isConfirming ? '⏳' : '🥚 Lay Egg'}
                  </button>
                </div>
              </div>
            )}

            {/* Daily Check-in */}
            {userStats && (
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '16px',
                marginBottom: '1rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>📅 Daily Check-in</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>🔥 {Number(userStats[1])}</div>
                    <div style={{ color: '#666', fontSize: '0.8rem' }}>Day Streak</div>
                  </div>
                  <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{Number(userStats[3])}</div>
                    <div style={{ color: '#666', fontSize: '0.8rem' }}>Referrals</div>
                  </div>
                  <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                      {nextReward ? formatEther(nextReward) : '1'} 🥚
                    </div>
                    <div style={{ color: '#666', fontSize: '0.8rem' }}>Next Reward</div>
                  </div>
                </div>

                <button
                  onClick={handleCheckIn}
                  disabled={isPending || isConfirming || !userStats[4]}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    fontSize: '1.1rem',
                    background: userStats[4] ? '#3b82f6' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: userStats[4] ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold'
                  }}
                >
                  {isPending || isConfirming ? '⏳ Processing...' : userStats[4] ? '✅ Check In Now!' : '⏰ Already Checked In'}
                </button>

                {/* Referral Section */}
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                    First time? Use a referral code for bonus eggs!
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Referrer address (0x...)"
                      value={referrer}
                      onChange={(e) => setReferrer(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.9rem'
                      }}
                    />
                    <button
                      onClick={handleCheckInWithReferral}
                      disabled={isPending || isConfirming || !referrer}
                      style={{
                        padding: '0.75rem 1rem',
                        background: referrer ? '#8b5cf6' : '#9ca3af',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: referrer ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Use Referral
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Contract Info (Admin/Debug) */}
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>⚙️ Contract Info</h2>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>
                <p style={{ margin: '0.5rem 0', wordBreak: 'break-all' }}>
                  <strong>Network:</strong> {chain?.name} ({chain?.id})
                </p>
                <p style={{ margin: '0.5rem 0', wordBreak: 'break-all' }}>
                  <strong>BunnyGame:</strong> {bunnyGameAddress}
                </p>
                <p style={{ margin: '0.5rem 0', wordBreak: 'break-all' }}>
                  <strong>RetentionSystem:</strong> {retentionAddress}
                </p>
                <p style={{ margin: '0.5rem 0', wordBreak: 'break-all' }}>
                  <strong>EggToken:</strong> {eggTokenAddress}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Transaction Status */}
        {txHash && (
          <div style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: isSuccess ? '#22c55e' : '#3b82f6',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '999px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 100
          }}>
            {isConfirming ? '⏳ Confirming...' : isSuccess ? '✅ Success!' : '📤 Sent!'}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}

export const Route = createFileRoute('/bunny-game')({
  component: BunnyGamePage,
})

