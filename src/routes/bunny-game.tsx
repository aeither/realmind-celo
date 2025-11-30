import { createFileRoute } from '@tanstack/react-router'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import GlobalHeader from '../components/GlobalHeader'
import BottomNavigation from '../components/BottomNavigation'
import { bunnyGameABI } from '../abis/bunnyGameABI'
import { retentionSystemABI } from '../abis/retentionSystemABI'
import { eggTokenABI } from '../abis/eggTokenABI'
import { getContractAddresses } from '../libs/constants'
import { formatEther } from 'viem'
import { useFarcaster } from '../contexts/FarcasterContext'

function BunnyGamePage() {
  const { address, chain } = useAccount()
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const [referrer, setReferrer] = useState('')
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const { composeCast } = useFarcaster()
  
  const contracts = chain ? getContractAddresses(chain.id) : null
  const bunnyGameAddress = contracts?.bunnyGameContractAddress as `0x${string}` | undefined
  const retentionAddress = contracts?.retentionSystemContractAddress as `0x${string}` | undefined
  const eggTokenAddress = contracts?.eggTokenContractAddress as `0x${string}` | undefined

  // BunnyGame reads - with refetchInterval for live updates
  const { data: bunnyData, refetch: refetchBunny } = useReadContract({
    address: bunnyGameAddress,
    abi: bunnyGameABI,
    functionName: 'getBunny',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address && !!bunnyGameAddress && bunnyGameAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 5000 
    }
  })

  const { data: isActionAvailable, refetch: refetchAction } = useReadContract({
    address: bunnyGameAddress,
    abi: bunnyGameABI,
    functionName: 'isActionAvailable',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address && !!bunnyGameAddress && bunnyGameAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 5000 
    }
  })

  const { data: canLayEgg, refetch: refetchCanLay } = useReadContract({
    address: bunnyGameAddress,
    abi: bunnyGameABI,
    functionName: 'canLayEgg',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address && !!bunnyGameAddress && bunnyGameAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 5000 
    }
  })

  const { data: timeUntilAction, refetch: refetchTimeUntilAction } = useReadContract({
    address: bunnyGameAddress,
    abi: bunnyGameABI,
    functionName: 'getTimeUntilNextAction',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address && !!bunnyGameAddress && bunnyGameAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 5000 
    }
  })

  // RetentionSystem reads - with refetchInterval
  const { data: userStats, refetch: refetchStats } = useReadContract({
    address: retentionAddress,
    abi: retentionSystemABI,
    functionName: 'getUserStats',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address && !!retentionAddress && retentionAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 5000 
    }
  })

  const { data: nextReward } = useReadContract({
    address: retentionAddress,
    abi: retentionSystemABI,
    functionName: 'getNextReward',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address && !!retentionAddress && retentionAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 5000 
    }
  })
  
  // Time until next check-in
  const { data: timeUntilCheckIn } = useReadContract({
    address: retentionAddress,
    abi: retentionSystemABI,
    functionName: 'timeUntilNextCheckIn',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address && !!retentionAddress && retentionAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 5000 
    }
  })

  // EggToken balance - with refetchInterval
  const { data: eggBalance, refetch: refetchBalance } = useReadContract({
    address: eggTokenAddress,
    abi: eggTokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address && !!eggTokenAddress && eggTokenAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 5000 
    }
  })

  // Write functions
  const { writeContract, isPending } = useWriteContract()

  // Transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const isAnyPending = isPending || isConfirming

  // Refetch on success with toast notifications
  useEffect(() => {
    if (isSuccess && pendingAction) {
      // Show success toast based on action
      switch(pendingAction) {
        case 'tap':
          toast.success('🐰 Tapped! +10 happiness')
          break
        case 'layEgg':
          toast.success('🥚 Egg laid! +1 EGG')
          break
        case 'checkIn':
          toast.success('✅ Checked in! Eggs earned!')
          break
        case 'checkInWithRef':
          toast.success('🎉 Checked in with referral! Bonus eggs!')
          break
      }
      
      // Immediate refetch for responsive UI
      refetchBunny()
      refetchAction()
      refetchCanLay()
      refetchStats()
      refetchBalance()
      refetchTimeUntilAction()
      setTxHash(undefined)
      setPendingAction(null)
    }
  }, [isSuccess, pendingAction])

  const handleTapBunny = async () => {
    if (!bunnyGameAddress) return
    try {
      setPendingAction('tap')
      writeContract({
        address: bunnyGameAddress,
        abi: bunnyGameABI,
        functionName: 'tapBunny',
      }, {
        onSuccess: (hash) => setTxHash(hash),
        onError: (error: any) => {
          toast.error(error?.shortMessage || 'Transaction failed')
          setPendingAction(null)
        }
      })
    } catch (error: any) {
      toast.error(error?.shortMessage || 'Transaction failed')
      setPendingAction(null)
    }
  }

  const handleLayEgg = async () => {
    if (!bunnyGameAddress) return
    try {
      setPendingAction('layEgg')
      writeContract({
        address: bunnyGameAddress,
        abi: bunnyGameABI,
        functionName: 'layEgg',
      }, {
        onSuccess: (hash) => setTxHash(hash),
        onError: (error: any) => {
          toast.error(error?.shortMessage || 'Transaction failed')
          setPendingAction(null)
        }
      })
    } catch (error: any) {
      toast.error(error?.shortMessage || 'Transaction failed')
      setPendingAction(null)
    }
  }

  const handleCheckIn = async () => {
    if (!retentionAddress) return
    try {
      setPendingAction('checkIn')
      writeContract({
        address: retentionAddress,
        abi: retentionSystemABI,
        functionName: 'checkIn',
      }, {
        onSuccess: (hash) => setTxHash(hash),
        onError: (error: any) => {
          toast.error(error?.shortMessage || 'Transaction failed')
          setPendingAction(null)
        }
      })
    } catch (error: any) {
      toast.error(error?.shortMessage || 'Transaction failed')
      setPendingAction(null)
    }
  }

  const handleCheckInWithReferral = async () => {
    if (!retentionAddress || !referrer) return
    try {
      setPendingAction('checkInWithRef')
      writeContract({
        address: retentionAddress,
        abi: retentionSystemABI,
        functionName: 'checkInWithReferral',
        args: [referrer as `0x${string}`],
      }, {
        onSuccess: (hash) => setTxHash(hash),
        onError: (error: any) => {
          toast.error(error?.shortMessage || 'Transaction failed')
          setPendingAction(null)
        }
      })
    } catch (error: any) {
      toast.error(error?.shortMessage || 'Transaction failed')
      setPendingAction(null)
    }
  }

  // Share referral link via Farcaster or clipboard
  const handleShareReferral = async () => {
    if (!address) return
    
    const referralLink = `${window.location.origin}/bunny-game?ref=${address}`
    const shareText = `🐰 Join me on Bunny Game! Tap your bunny, earn eggs, and get bonus rewards with my referral link! 🥚\n\n${referralLink}`
    
    try {
      // Try Farcaster first
      await composeCast(shareText)
      toast.success('📤 Share opened!')
    } catch {
      // Fallback to clipboard
      await navigator.clipboard.writeText(referralLink)
      toast.success('📋 Referral link copied!')
    }
  }

  const formatTime = (seconds: bigint) => {
    const s = Number(seconds)
    const hours = Math.floor(s / 3600)
    const mins = Math.floor((s % 3600) / 60)
    const secs = s % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m ${secs}s`
  }
  
  // Parse userStats for canCheckIn
  const canCheckIn = userStats ? Boolean(userStats[4]) : false
  const streak = userStats ? Number(userStats[1]) : 0
  const referralCount = userStats ? Number(userStats[3]) : 0
  const timeRemaining = timeUntilCheckIn ? Number(timeUntilCheckIn) : 0

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
                    disabled={isAnyPending || !isActionAvailable}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      fontSize: '1.2rem',
                      background: isActionAvailable && !isAnyPending ? '#f59e0b' : '#9ca3af',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: isActionAvailable && !isAnyPending ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold'
                    }}
                  >
                    {pendingAction === 'tap' ? (isConfirming ? '⏳ Confirming...' : '⏳ Tapping...') : '👆 Tap Bunny'}
                  </button>
                  <button
                    onClick={handleLayEgg}
                    disabled={isAnyPending || !canLayEgg}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      fontSize: '1.2rem',
                      background: canLayEgg && !isAnyPending ? '#22c55e' : '#9ca3af',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: canLayEgg && !isAnyPending ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold'
                    }}
                  >
                    {pendingAction === 'layEgg' ? (isConfirming ? '⏳ Confirming...' : '⏳ Laying...') : '🥚 Lay Egg'}
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
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>🔥 {streak}</div>
                    <div style={{ color: '#666', fontSize: '0.8rem' }}>Day Streak</div>
                  </div>
                  <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>👥 {referralCount}</div>
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
                  disabled={isAnyPending || !canCheckIn}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    fontSize: '1.1rem',
                    background: canCheckIn && !isAnyPending ? '#22c55e' : '#e5e7eb',
                    color: canCheckIn && !isAnyPending ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: canCheckIn && !isAnyPending ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold',
                    marginBottom: '0.75rem'
                  }}
                >
                  {pendingAction === 'checkIn' ? (isConfirming ? '⏳ Confirming...' : '⏳ Sending...') : 
                   canCheckIn ? '✅ Check In Now!' : 
                   `⏰ Next check-in: ${formatTime(BigInt(timeRemaining))}`}
                </button>
                
                {/* Share Referral Button */}
                <button
                  onClick={handleShareReferral}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    marginBottom: '1rem'
                  }}
                >
                  📤 Share Referral Link
                </button>
                
                {/* Streak Rewards Info */}
                <div style={{ 
                  background: '#fef3c7', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  border: '1px solid #f59e0b',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#92400e' }}>🎁 Streak Rewards</div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.6, fontSize: '0.85rem', color: '#78350f' }}>
                    <li style={{ color: streak >= 1 && streak <= 2 ? '#22c55e' : 'inherit' }}>
                      <strong>Day 1-2:</strong> 1 EGG/day {streak >= 1 && streak <= 2 && '← You are here'}
                    </li>
                    <li style={{ color: streak >= 3 && streak <= 6 ? '#22c55e' : 'inherit' }}>
                      <strong>Day 3-6:</strong> 2 EGG/day {streak >= 3 && streak <= 6 && '← You are here'}
                    </li>
                    <li style={{ color: streak >= 7 ? '#22c55e' : 'inherit' }}>
                      <strong>Day 7+:</strong> 3 EGG/day {streak >= 7 && '← You are here'}
                    </li>
                    <li><strong>Referral bonus:</strong> 5 EGG for both!</li>
                  </ul>
                </div>

                {/* Referral Section */}
                <div style={{ paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
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
                      disabled={isAnyPending || !referrer}
                      style={{
                        padding: '0.75rem 1rem',
                        background: referrer && !isAnyPending ? '#8b5cf6' : '#9ca3af',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: referrer && !isAnyPending ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {pendingAction === 'checkInWithRef' ? '⏳' : 'Use Referral'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>

      <BottomNavigation />
    </div>
  )
}

export const Route = createFileRoute('/bunny-game')({
  component: BunnyGamePage,
})

