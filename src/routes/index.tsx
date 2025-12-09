import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther } from 'viem'
import BottomNavigation from '../components/BottomNavigation'
import GlobalHeader from '../components/GlobalHeader'
import { retentionSystemABI } from '../abis/retentionSystemABI'
import { useFarcaster } from '../contexts/FarcasterContext'
import { getContractAddresses } from '../libs/constants'

function HomePage() {
  const { address, chain } = useAccount()
  const navigate = useNavigate()
  const { composeCast } = useFarcaster()

  const [referrer, setReferrer] = useState('')
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  const contracts = chain ? getContractAddresses(chain.id) : null
  const retentionAddress = contracts?.retentionSystemContractAddress as `0x${string}` | undefined

  const { data: userStats, refetch: refetchStats } = useReadContract({
    address: retentionAddress,
    abi: retentionSystemABI,
    functionName: 'getUserStats',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!retentionAddress && retentionAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 5000,
    },
  })

  const { data: nextReward } = useReadContract({
    address: retentionAddress,
    abi: retentionSystemABI,
    functionName: 'getNextReward',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!retentionAddress && retentionAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 5000,
    },
  })

  const { data: timeUntilCheckIn } = useReadContract({
    address: retentionAddress,
    abi: retentionSystemABI,
    functionName: 'timeUntilNextCheckIn',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!retentionAddress && retentionAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 5000,
    },
  })

  const { writeContract, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const isAnyPending = isPending || isConfirming

  useEffect(() => {
    if (isSuccess && pendingAction) {
      toast.success('✅ Check-in confirmed!')
      refetchStats()
      setPendingAction(null)
      setTxHash(undefined)
    }
  }, [isSuccess, pendingAction, refetchStats])

  const formatTime = (seconds: bigint) => {
    const s = Number(seconds)
    const hours = Math.floor(s / 3600)
    const mins = Math.floor((s % 3600) / 60)
    const secs = s % 60
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m ${secs}s`
  }

  const handleCheckIn = () => {
    if (!retentionAddress) return
    setPendingAction('checkIn')
    writeContract(
      {
        address: retentionAddress,
        abi: retentionSystemABI,
        functionName: 'checkIn',
      },
      {
        onSuccess: (hash) => setTxHash(hash),
        onError: (error: any) => {
          toast.error(error?.shortMessage || 'Failed to check in')
          setPendingAction(null)
        },
      }
    )
  }

  const handleCheckInWithReferral = () => {
    if (!retentionAddress || !referrer) return
    setPendingAction('checkInWithReferral')
    writeContract(
      {
        address: retentionAddress,
        abi: retentionSystemABI,
        functionName: 'checkInWithReferral',
        args: [referrer as `0x${string}`],
      },
      {
        onSuccess: (hash) => setTxHash(hash),
        onError: (error: any) => {
          toast.error(error?.shortMessage || 'Failed to use referral')
          setPendingAction(null)
        },
      }
    )
  }

  const handleShareReferral = async () => {
    if (!address) {
      toast.error('Connect your wallet to share a referral')
      return
    }

    const baseUrl = 'https://farcaster.xyz/miniapps/fSkzq8nGNJ4C/realmind'
    const referralLink = `${baseUrl}/bunny-game?ref=${address}`
    const shareText = `Join me on Realmind quizzes and claim rewards! ${referralLink}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Realmind Quests',
          text: shareText,
          url: referralLink,
        })
        toast.success('Referral shared!')
      } else {
        await composeCast(shareText)
        toast.success('Share opened in Farcaster')
      }
    } catch (err) {
      await navigator.clipboard.writeText(referralLink)
      toast.success('Referral copied to clipboard')
    }
  }

  const canCheckIn = userStats ? Boolean(userStats[4]) : false
  const streak = userStats ? Number(userStats[1]) : 0
  const referralCount = userStats ? Number(userStats[3]) : 0
  const timeRemaining = timeUntilCheckIn ? Number(timeUntilCheckIn) : 0

  return (
    <div
      style={{
        minHeight: '100vh',
        paddingBottom: '80px',
        background: 'linear-gradient(135deg, #fef3c7 0%, #f5f3ff 35%, #ecfeff 100%)',
      }}
    >
      <GlobalHeader />

      <div
        style={{
          paddingTop: '90px',
          padding: 'clamp(0.9rem, 3vw, 1.5rem)',
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        {/* Hero */}
        <div
          style={{
            background: 'linear-gradient(120deg, #fbbf24, #f97316)',
            border: '3px solid hsl(var(--celo-black))',
            borderRadius: '18px',
            padding: '1.5rem',
            boxShadow: '6px 6px 0px hsl(var(--celo-black))',
            color: 'hsl(var(--celo-black))',
            marginBottom: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"160\" height=\"160\" viewBox=\"0 0 100 100\"><text x=\"0\" y=\"90\" font-size=\"90\" opacity=\"0.08\">🤖</text></svg>') repeat",
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p
              style={{
                textTransform: 'uppercase',
                fontWeight: 800,
                letterSpacing: '0.1em',
                margin: 0,
                fontSize: '0.8rem',
              }}
            >
              Realmind Quest Hub
            </p>
            <h1
              style={{
                margin: '0.4rem 0',
                fontSize: 'clamp(2.2rem, 6vw, 3rem)',
                lineHeight: 1.05,
              }}
            >
              Learn, Check In, <span style={{ fontStyle: 'italic' }}>Earn</span> on CELO
            </h1>
            <p
              style={{
                maxWidth: '620px',
                margin: '0.25rem 0 1rem 0',
                color: '#111827',
                fontWeight: 600,
              }}
            >
              Daily check-ins, referrals, and quizzes to climb the leaderboard and claim your rewards.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button
                onClick={() => navigate({ to: '/quiz' })}
                style={{
                  background: '#111827',
                  color: 'white',
                  border: '2px solid hsl(var(--celo-black))',
                  borderRadius: '12px',
                  padding: '0.9rem 1.4rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '4px 4px 0px hsl(var(--celo-black))',
                }}
              >
                🚀 Start a Quiz
              </button>
              <button
                onClick={() => navigate({ to: '/leaderboard' })}
                style={{
                  background: 'white',
                  color: '#111827',
                  border: '2px solid hsl(var(--celo-black))',
                  borderRadius: '12px',
                  padding: '0.9rem 1.4rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '4px 4px 0px hsl(var(--celo-black))',
                }}
              >
                🏆 View Leaderboard
              </button>
            </div>
          </div>
        </div>

        {/* Connection hint */}
        {!address && (
          <div
            style={{
              background: 'white',
              border: '2px dashed #9ca3af',
              padding: '0.9rem 1rem',
              borderRadius: '12px',
              marginBottom: '1rem',
              color: '#374151',
              fontWeight: 600,
            }}
          >
            Connect your wallet in the header to check in daily, track referrals, and see your rewards.
          </div>
        )}

        {/* Check-in & referral cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              background: 'white',
              border: '3px solid hsl(var(--celo-black))',
              borderRadius: '14px',
              padding: '1.1rem',
              boxShadow: '4px 4px 0px hsl(var(--celo-black))',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>📅 Daily Check-in</h3>
              <span
                style={{
                  background: canCheckIn ? '#dcfce7' : '#f3f4f6',
                  color: canCheckIn ? '#166534' : '#6b7280',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                {canCheckIn ? 'Ready' : address ? 'Cooldown' : 'Connect'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.8rem' }}>
              <div
                style={{
                  flex: 1,
                  background: '#f9fafb',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  textAlign: 'center',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{streak}</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Day Streak</div>
              </div>
              <div
                style={{
                  flex: 1,
                  background: '#f9fafb',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  textAlign: 'center',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                  {nextReward ? formatEther(nextReward) : '—'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Next Reward</div>
              </div>
            </div>

            <button
              onClick={handleCheckIn}
              disabled={!address || isAnyPending || !canCheckIn}
              style={{
                width: '100%',
                padding: '0.9rem',
                borderRadius: '10px',
                border: '2px solid hsl(var(--celo-black))',
                background: !address
                  ? '#e5e7eb'
                  : canCheckIn && !isAnyPending
                    ? '#22c55e'
                    : '#f3f4f6',
                color: !address
                  ? '#6b7280'
                  : canCheckIn && !isAnyPending
                    ? 'white'
                    : '#6b7280',
                fontWeight: 800,
                cursor: !address || !canCheckIn ? 'not-allowed' : 'pointer',
                marginBottom: '0.4rem',
              }}
            >
              {pendingAction === 'checkIn'
                ? isConfirming
                  ? '⏳ Confirming...'
                  : '⏳ Sending...'
                : canCheckIn
                  ? '✅ Check In Now'
                  : timeRemaining > 0
                    ? `⏰ ${formatTime(BigInt(timeRemaining))}`
                    : 'Connect to check in'}
            </button>
          </div>

          <div
            style={{
              background: 'white',
              border: '3px solid hsl(var(--celo-black))',
              borderRadius: '14px',
              padding: '1.1rem',
              boxShadow: '4px 4px 0px hsl(var(--celo-black))',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>👥 Referrals</h3>
              <span
                style={{
                  background: '#eef2ff',
                  color: '#4338ca',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                {referralCount} joined
              </span>
            </div>

            <p style={{ color: '#4b5563', margin: '0 0 0.75rem 0', fontWeight: 600 }}>
              Share your link to earn bonus eggs and keep your streak alive.
            </p>

            <button
              onClick={handleShareReferral}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '10px',
                border: '2px solid hsl(var(--celo-black))',
                background: '#f59e0b',
                color: 'white',
                fontWeight: 800,
                cursor: 'pointer',
                marginBottom: '0.6rem',
              }}
            >
              📤 Share Referral
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={referrer}
                onChange={(e) => setReferrer(e.target.value)}
                placeholder="Friend referral (0x...)"
                style={{
                  flex: 1,
                  padding: '0.7rem',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  fontSize: '0.9rem',
                }}
              />
              <button
                onClick={handleCheckInWithReferral}
                disabled={!address || !referrer || isAnyPending}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '2px solid hsl(var(--celo-black))',
                  background: referrer && address && !isAnyPending ? '#8b5cf6' : '#e5e7eb',
                  color: referrer && address && !isAnyPending ? 'white' : '#6b7280',
                  fontWeight: 800,
                  cursor: referrer && address && !isAnyPending ? 'pointer' : 'not-allowed',
                }}
              >
                {pendingAction === 'checkInWithReferral' ? '⏳' : 'Use Referral'}
              </button>
            </div>
          </div>
        </div>

        {/* Quick action tiles */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '0.9rem',
          }}
        >
          {[
            {
              title: 'Daily Quiz',
              description: 'Answer quick questions and earn XP instantly.',
              cta: 'Play now',
              action: () => navigate({ to: '/quiz' }),
              accent: '#e0f2fe',
              icon: '🧠',
            },
            {
              title: 'Leaderboard',
              description: 'Track your rank and see if you can claim rewards.',
              cta: 'Check rank',
              action: () => navigate({ to: '/leaderboard' }),
              accent: '#fef3c7',
              icon: '🏆',
            },
            {
              title: 'Bunny Game',
              description: 'Keep your bunny happy and collect eggs.',
              cta: 'Open game',
              action: () => navigate({ to: '/bunny-game' }),
              accent: '#ecfeff',
              icon: '🐰',
            },
          ].map((card) => (
            <div
              key={card.title}
              style={{
                background: card.accent,
                border: '3px solid hsl(var(--celo-black))',
                borderRadius: '12px',
                padding: '1rem',
                boxShadow: '4px 4px 0px hsl(var(--celo-black))',
              }}
            >
              <div style={{ fontSize: '1.5rem' }}>{card.icon}</div>
              <h3 style={{ margin: '0.4rem 0 0.2rem 0' }}>{card.title}</h3>
              <p style={{ margin: 0, color: '#4b5563', fontWeight: 600 }}>{card.description}</p>
              <button
                onClick={card.action}
                style={{
                  marginTop: '0.8rem',
                  border: '2px solid hsl(var(--celo-black))',
                  background: 'white',
                  borderRadius: '10px',
                  padding: '0.7rem 1rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                {card.cta} →
              </button>
            </div>
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: HomePage,
})
