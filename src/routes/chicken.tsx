import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router"
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract, useChainId, useSwitchChain } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import BottomNavigation from '../components/BottomNavigation'
import { chickenGameABI } from '../libs/chickenGameABI'
import { eggTokenABI } from '../libs/eggTokenABI'
import { megaEggABI } from '../libs/megaEggABI'
import { retentionSystemABI } from '../libs/retentionSystemABI'
import { SUPPORTED_CHAIN } from '../libs/supportedChains'
import { getDivviDataSuffix, submitDivviReferral } from '../libs/divviReferral'

const CHICKEN_GAME_ADDRESS = '0x718dA7d4060Bc4eB1dBd7cCed04c9C1390c60500' as `0x${string}`;
const EGG_TOKEN_ADDRESS = '0x9FBA2481F9061b11d084d3acf276961D251cF5a5' as `0x${string}`;
const MEGA_EGG_ADDRESS = '0x885171d283aa8541B0EBE0497042d001D0ffA10f' as `0x${string}`;
const RETENTION_SYSTEM_ADDRESS = '0x3e0f389040A70c526022ecd41ff4d25934048Cd9' as `0x${string}`;

type TabType = 'care' | 'shop' | 'daily';

function ChickenPage() {
  const { address, isConnected, chain } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const navigate = useNavigate()
  const searchParams = useSearch({ from: '/chicken' }) as { referrer?: string }

  const [activeTab, setActiveTab] = useState<TabType>('care')
  const [buyEggsAmount, setBuyEggsAmount] = useState(1)
  const [mergeEggsAmount, setMergeEggsAmount] = useState(10)
  const [showReferralModal, setShowReferralModal] = useState(false)
  const [referrerAddress, setReferrerAddress] = useState('')

  // Handle referrer from URL
  useEffect(() => {
    if (searchParams.referrer && address) {
      setReferrerAddress(searchParams.referrer)
      setShowReferralModal(true)
    }
  }, [searchParams.referrer, address])

  // Contract reads - Chicken Game
  const { data: chickenData, refetch: refetchChicken } = useReadContract({
    address: CHICKEN_GAME_ADDRESS,
    abi: chickenGameABI,
    functionName: 'getChicken',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  const { data: canLayEgg } = useReadContract({
    address: CHICKEN_GAME_ADDRESS,
    abi: chickenGameABI,
    functionName: 'canLayEgg',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  const { data: isActionAvailable } = useReadContract({
    address: CHICKEN_GAME_ADDRESS,
    abi: chickenGameABI,
    functionName: 'isActionAvailable',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  const { data: eggPrice } = useReadContract({
    address: CHICKEN_GAME_ADDRESS,
    abi: chickenGameABI,
    functionName: 'eggPrice',
    query: { enabled: true },
  }) as { data: bigint | undefined };

  // Token balances
  const { data: eggBalance, refetch: refetchEggBalance } = useReadContract({
    address: EGG_TOKEN_ADDRESS,
    abi: eggTokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  const { data: megaEggBalance } = useReadContract({
    address: MEGA_EGG_ADDRESS,
    abi: megaEggABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  const { data: eggAllowance, refetch: refetchAllowance } = useReadContract({
    address: EGG_TOKEN_ADDRESS,
    abi: eggTokenABI,
    functionName: 'allowance',
    args: address ? [address, CHICKEN_GAME_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  // Retention System reads
  const { data: retentionStats, refetch: refetchRetention } = useReadContract({
    address: RETENTION_SYSTEM_ADDRESS,
    abi: retentionSystemABI,
    functionName: 'getUserStats',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  // Extract data
  const happiness = chickenData ? Number(chickenData[0]) : 0
  const claimableActions = chickenData ? Number(chickenData[1]) : 0
  const totalEggsLaid = chickenData ? Number(chickenData[3]) : 0
  const instantActionsRemaining = chickenData ? Number(chickenData[4]) : 10
  const initialized = chickenData ? chickenData[5] : false

  const eggBal = eggBalance ? Number(formatEther(eggBalance as bigint)) : 0
  const megaEggBal = megaEggBalance ? Number(formatEther(megaEggBalance as bigint)) : 0

  const streak = retentionStats ? Number((retentionStats as any)[1]) : 0
  const referralCount = retentionStats ? Number((retentionStats as any)[3]) : 0
  const canCheckIn = retentionStats ? (retentionStats as any)[4] as boolean : false

  // Contract writes
  const { writeContract: feedChicken, isPending: isFeedPending, data: feedHash } = useWriteContract()
  const { writeContract: petChicken, isPending: isPetPending, data: petHash } = useWriteContract()
  const { writeContract: playWithChicken, isPending: isPlayPending, data: playHash } = useWriteContract()
  const { writeContract: layEgg, isPending: isLayEggPending, data: layEggHash } = useWriteContract()
  const { writeContract: buyEggsWrite, isPending: isBuyPending, data: buyHash } = useWriteContract()
  const { writeContract: approveEgg, isPending: isApprovePending, data: approveHash } = useWriteContract()
  const { writeContract: mergeEggs, isPending: isMergePending, data: mergeHash } = useWriteContract()
  const { writeContract: checkIn, isPending: isCheckInPending, data: checkInHash } = useWriteContract()
  const { writeContract: checkInWithRef, isPending: isRefCheckInPending, data: refCheckInHash } = useWriteContract()

  // Wait for transactions
  const { isSuccess: isFeedSuccess } = useWaitForTransactionReceipt({ hash: feedHash })
  const { isSuccess: isPetSuccess } = useWaitForTransactionReceipt({ hash: petHash })
  const { isSuccess: isPlaySuccess } = useWaitForTransactionReceipt({ hash: playHash })
  const { isSuccess: isLayEggSuccess } = useWaitForTransactionReceipt({ hash: layEggHash })
  const { isSuccess: isBuySuccess } = useWaitForTransactionReceipt({ hash: buyHash })
  const { isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })
  const { isSuccess: isMergeSuccess } = useWaitForTransactionReceipt({ hash: mergeHash })
  const { isSuccess: isCheckInSuccess } = useWaitForTransactionReceipt({ hash: checkInHash })
  const { isSuccess: isRefCheckInSuccess } = useWaitForTransactionReceipt({ hash: refCheckInHash })

  const isAnyPending = isFeedPending || isPetPending || isPlayPending || isLayEggPending ||
    isBuyPending || isApprovePending || isMergePending || isCheckInPending || isRefCheckInPending

  // Success handlers
  useEffect(() => {
    if (isFeedSuccess && feedHash && chain) {
      toast.success('🍗 Fed! +10 happiness')
      refetchChicken()
      submitDivviReferral(feedHash, chain.id)
    }
  }, [isFeedSuccess])

  useEffect(() => {
    if (isPetSuccess && petHash && chain) {
      toast.success('❤️ Petted! +10 happiness')
      refetchChicken()
      submitDivviReferral(petHash, chain.id)
    }
  }, [isPetSuccess])

  useEffect(() => {
    if (isPlaySuccess && playHash && chain) {
      toast.success('🎾 Played! +10 happiness')
      refetchChicken()
      submitDivviReferral(playHash, chain.id)
    }
  }, [isPlaySuccess])

  useEffect(() => {
    if (isLayEggSuccess && layEggHash && chain) {
      toast.success('🥚 Egg laid! +1 EGG')
      refetchChicken()
      refetchEggBalance()
      submitDivviReferral(layEggHash, chain.id)
    }
  }, [isLayEggSuccess])

  useEffect(() => {
    if (isBuySuccess && buyHash && chain) {
      toast.success('✅ Eggs purchased!')
      refetchEggBalance()
      submitDivviReferral(buyHash, chain.id)
    }
  }, [isBuySuccess])

  useEffect(() => {
    if (isApproveSuccess) {
      toast.success('✅ Approval confirmed!')
      refetchAllowance()
    }
  }, [isApproveSuccess])

  useEffect(() => {
    if (isMergeSuccess && mergeHash && chain) {
      toast.success('✨ Eggs merged to MegaEgg!')
      refetchEggBalance()
      submitDivviReferral(mergeHash, chain.id)
    }
  }, [isMergeSuccess])

  useEffect(() => {
    if (isCheckInSuccess && checkInHash && chain) {
      toast.success('✅ Checked in! Eggs earned!')
      refetchRetention()
      refetchEggBalance()
      submitDivviReferral(checkInHash, chain.id)
    }
  }, [isCheckInSuccess])

  useEffect(() => {
    if (isRefCheckInSuccess && refCheckInHash && chain) {
      toast.success('🎉 Checked in with referral! Bonus eggs!')
      refetchRetention()
      refetchEggBalance()
      setShowReferralModal(false)
      submitDivviReferral(refCheckInHash, chain.id)
    }
  }, [isRefCheckInSuccess])

  // Action handlers
  const handleAction = (action: 'feed' | 'pet' | 'play') => {
    if (!address || chainId !== SUPPORTED_CHAIN.id) {
      toast.error('Please connect to correct network')
      return
    }
    const funcs = { feed: feedChicken, pet: petChicken, play: playWithChicken }
    const names = { feed: 'feedChicken', pet: 'petChicken', play: 'playWithChicken' }

    funcs[action]({
      address: CHICKEN_GAME_ADDRESS,
      abi: chickenGameABI,
      functionName: names[action] as any,
      chainId: SUPPORTED_CHAIN.id,
      dataSuffix: getDivviDataSuffix(address),
    })
  }

  const handleLayEgg = () => {
    if (!address || chainId !== SUPPORTED_CHAIN.id) return
    layEgg({
      address: CHICKEN_GAME_ADDRESS,
      abi: chickenGameABI,
      functionName: 'layEgg',
      chainId: SUPPORTED_CHAIN.id,
      dataSuffix: getDivviDataSuffix(address),
    })
  }

  const handleBuyEggs = () => {
    if (!address || chainId !== SUPPORTED_CHAIN.id || !eggPrice) return
    const price = eggPrice as bigint
    const totalCost = price * BigInt(buyEggsAmount)

    buyEggsWrite({
      address: CHICKEN_GAME_ADDRESS,
      abi: chickenGameABI,
      functionName: 'buyEggs',
      value: totalCost,
      chainId: SUPPORTED_CHAIN.id,
      dataSuffix: getDivviDataSuffix(address),
    })
  }

  const handleApprove = () => {
    if (!address) return
    const amount = parseEther(mergeEggsAmount.toString())

    approveEgg({
      address: EGG_TOKEN_ADDRESS,
      abi: eggTokenABI,
      functionName: 'approve',
      args: [CHICKEN_GAME_ADDRESS, amount],
      chainId: SUPPORTED_CHAIN.id,
    })
  }

  const handleMerge = () => {
    if (!address || chainId !== SUPPORTED_CHAIN.id) return
    const amount = parseEther(mergeEggsAmount.toString())

    mergeEggs({
      address: CHICKEN_GAME_ADDRESS,
      abi: chickenGameABI,
      functionName: 'mergeEggsForMegaEgg',
      args: [amount],
      value: parseEther('0.01'),
      chainId: SUPPORTED_CHAIN.id,
      dataSuffix: getDivviDataSuffix(address),
    })
  }

  const handleCheckIn = () => {
    if (!address || chainId !== SUPPORTED_CHAIN.id) return
    checkIn({
      address: RETENTION_SYSTEM_ADDRESS,
      abi: retentionSystemABI,
      functionName: 'checkIn',
      chainId: SUPPORTED_CHAIN.id,
    })
  }

  const handleRefCheckIn = () => {
    if (!address || chainId !== SUPPORTED_CHAIN.id || !referrerAddress) return
    checkInWithRef({
      address: RETENTION_SYSTEM_ADDRESS,
      abi: retentionSystemABI,
      functionName: 'checkInWithReferral',
      args: [referrerAddress as `0x${string}`],
      chainId: SUPPORTED_CHAIN.id,
    })
  }

  const shareReferralLink = () => {
    const link = `${window.location.origin}/chicken?referrer=${address}`
    navigator.clipboard.writeText(link)
    toast.success('Referral link copied!')
  }

  const isCorrectNetwork = chainId === SUPPORTED_CHAIN.id

  if (!isConnected) {
    return (
      <div style={{ minHeight: '100vh', paddingBottom: '70px', background: 'hsl(var(--background))' }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem", textAlign: "center" }}>
          <h2>Connect Wallet</h2>
          <p style={{ color: "#6b7280" }}>Connect your wallet to play Chicken Game</p>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  if (!isCorrectNetwork) {
    return (
      <div style={{ minHeight: '100vh', paddingBottom: '70px', background: 'hsl(var(--background))' }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem", textAlign: "center" }}>
          <div style={{ background: "#fef2f2", border: "2px solid #ef4444", borderRadius: "12px", padding: "2rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</div>
            <h2 style={{ color: "#991b1b", marginBottom: "1rem" }}>Wrong Network</h2>
            <p style={{ color: "#7f1d1d", marginBottom: "1.5rem" }}>
              Please switch to <strong>{SUPPORTED_CHAIN.name}</strong>
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
              }}
            >
              Switch to {SUPPORTED_CHAIN.name}
            </button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  const needsApproval = eggAllowance ? (eggAllowance as bigint) < parseEther(mergeEggsAmount.toString()) : true

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100vh', paddingBottom: '70px', background: 'hsl(var(--background))' }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "0.75rem", paddingTop: "80px" }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <h1 style={{ fontSize: '1.75rem', margin: 0 }}>🐔 Chicken</h1>
        </div>

        {/* Balances */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ background: 'hsl(var(--celo-tan-2))', padding: '0.75rem', border: '2px solid hsl(var(--celo-black))', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'hsl(var(--celo-brown))', textTransform: 'uppercase' }}>EGG</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{eggBal.toFixed(0)} 🥚</div>
          </div>
          <div style={{ background: 'hsl(var(--celo-tan-2))', padding: '0.75rem', border: '2px solid hsl(var(--celo-black))', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'hsl(var(--celo-brown))', textTransform: 'uppercase' }}>MEGA</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{megaEggBal.toFixed(0)} ✨</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {(['care', 'shop', 'daily'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: activeTab === tab ? 'hsl(var(--celo-yellow))' : 'hsl(var(--celo-white))',
                border: '2px solid hsl(var(--celo-black))',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              {tab === 'care' ? '🐔' : tab === 'shop' ? '🛒' : '📅'} {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ background: 'hsl(var(--celo-white))', padding: '1rem', border: '3px solid hsl(var(--celo-black))' }}>

          {/* Care Tab */}
          {activeTab === 'care' && (
            <div>
              <div style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '0.5rem' }}>🐔</div>

              {/* Happiness Bar */}
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span>Happiness</span>
                  <span>{happiness}/100</span>
                </div>
                <div style={{ height: '20px', background: 'hsl(var(--celo-tan-2))', border: '2px solid hsl(var(--celo-black))' }}>
                  <div style={{ width: `${happiness}%`, height: '100%', background: happiness >= 100 ? 'hsl(var(--celo-green))' : 'hsl(var(--celo-yellow))', transition: 'width 0.3s' }} />
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.75rem' }}>
                <div style={{ background: 'hsl(var(--celo-tan-2))', padding: '0.5rem', border: '2px solid hsl(var(--celo-black))', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'hsl(var(--celo-brown))', marginBottom: '0.25rem' }}>LAID</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{totalEggsLaid}</div>
                </div>
                <div style={{ background: 'hsl(var(--celo-tan-2))', padding: '0.5rem', border: '2px solid hsl(var(--celo-black))', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'hsl(var(--celo-brown))', marginBottom: '0.25rem' }}>⚡</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{instantActionsRemaining}</div>
                </div>
                <div style={{ background: 'hsl(var(--celo-tan-2))', padding: '0.5rem', border: '2px solid hsl(var(--celo-black))', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'hsl(var(--celo-brown))', marginBottom: '0.25rem' }}>⏰</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{claimableActions}</div>
                </div>
              </div>

              {/* Lay Egg */}
              {canLayEgg && (
                <button
                  onClick={handleLayEgg}
                  disabled={isAnyPending}
                  style={{
                    width: '100%',
                    background: 'hsl(var(--celo-green))',
                    color: 'white',
                    border: '3px solid hsl(var(--celo-black))',
                    padding: '0.75rem',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    marginBottom: '0.75rem',
                    cursor: isAnyPending ? 'not-allowed' : 'pointer',
                    opacity: isAnyPending ? 0.6 : 1
                  }}
                >
                  {isLayEggPending ? '⏳ Laying...' : '🥚 Lay Egg'}
                </button>
              )}

              {/* Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                {[
                  { emoji: '🍗', label: 'Feed', action: 'feed' as const },
                  { emoji: '❤️', label: 'Pet', action: 'pet' as const },
                  { emoji: '🎾', label: 'Play', action: 'play' as const }
                ].map(({ emoji, label, action }) => (
                  <button
                    key={action}
                    onClick={() => handleAction(action)}
                    disabled={!isActionAvailable || isAnyPending}
                    style={{
                      background: isActionAvailable && !isAnyPending ? 'hsl(var(--celo-white))' : 'hsl(var(--celo-tan-2))',
                      border: '2px solid hsl(var(--celo-black))',
                      padding: '0.75rem 0.5rem',
                      cursor: isActionAvailable && !isAnyPending ? 'pointer' : 'not-allowed',
                      opacity: isActionAvailable && !isAnyPending ? 1 : 0.6
                    }}
                  >
                    <div style={{ fontSize: '1.75rem' }}>{emoji}</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Shop Tab */}
          {activeTab === 'shop' && (
            <div>
              <h3 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '0.75rem' }}>🛒 Shop</h3>

              {/* Buy Eggs */}
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'hsl(var(--celo-tan-2))', border: '2px solid hsl(var(--celo-black))' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Buy Eggs with ETH</div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <input
                    type="number"
                    min="1"
                    value={buyEggsAmount}
                    onChange={(e) => setBuyEggsAmount(parseInt(e.target.value) || 1)}
                    style={{ flex: 1, padding: '0.5rem', border: '2px solid hsl(var(--celo-black))', fontSize: '0.85rem' }}
                  />
                  <button
                    onClick={handleBuyEggs}
                    disabled={isAnyPending}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'hsl(var(--celo-yellow))',
                      border: '2px solid hsl(var(--celo-black))',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      cursor: isAnyPending ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isBuyPending ? '⏳' : 'Buy'}
                  </button>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'hsl(var(--celo-brown))' }}>
                  Cost: {eggPrice ? formatEther((eggPrice as bigint) * BigInt(buyEggsAmount)) : '...'} ETH
                </div>
              </div>

              {/* Merge Eggs */}
              <div style={{ padding: '0.75rem', background: 'hsl(var(--celo-tan-2))', border: '2px solid hsl(var(--celo-black))' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Merge to MegaEgg</div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={mergeEggsAmount}
                    onChange={(e) => setMergeEggsAmount(parseInt(e.target.value) || 10)}
                    style={{ flex: 1, padding: '0.5rem', border: '2px solid hsl(var(--celo-black))', fontSize: '0.85rem' }}
                  />
                  {needsApproval ? (
                    <button
                      onClick={handleApprove}
                      disabled={isAnyPending}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'hsl(var(--celo-purple))',
                        color: 'white',
                        border: '2px solid hsl(var(--celo-black))',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        cursor: isAnyPending ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isApprovePending ? '⏳' : 'Approve'}
                    </button>
                  ) : (
                    <button
                      onClick={handleMerge}
                      disabled={isAnyPending}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'hsl(var(--celo-purple))',
                        color: 'white',
                        border: '2px solid hsl(var(--celo-black))',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        cursor: isAnyPending ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isMergePending ? '⏳' : 'Merge'}
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'hsl(var(--celo-brown))' }}>
                  Fee: 0.01 ETH + {mergeEggsAmount} EGG → {mergeEggsAmount / 10} MEGG
                </div>
              </div>
            </div>
          )}

          {/* Daily Tab */}
          {activeTab === 'daily' && (
            <div>
              <h3 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '0.75rem' }}>📅 Daily Check-in</h3>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ background: 'hsl(var(--celo-tan-2))', padding: '0.75rem', border: '2px solid hsl(var(--celo-black))', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--celo-brown))' }}>Streak</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>🔥 {streak}</div>
                </div>
                <div style={{ background: 'hsl(var(--celo-tan-2))', padding: '0.75rem', border: '2px solid hsl(var(--celo-black))', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--celo-brown))' }}>Referrals</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>👥 {referralCount}</div>
                </div>
              </div>

              {/* Check-in Button */}
              <button
                onClick={handleCheckIn}
                disabled={!canCheckIn || isAnyPending}
                style={{
                  width: '100%',
                  background: canCheckIn && !isAnyPending ? 'hsl(var(--celo-green))' : 'hsl(var(--celo-tan-2))',
                  color: canCheckIn && !isAnyPending ? 'white' : 'hsl(var(--celo-brown))',
                  border: '3px solid hsl(var(--celo-black))',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  marginBottom: '0.75rem',
                  cursor: canCheckIn && !isAnyPending ? 'pointer' : 'not-allowed'
                }}
              >
                {isCheckInPending ? '⏳ Checking in...' : canCheckIn ? '✅ Check In Now' : '⏰ Already Checked In'}
              </button>

              {/* Share Referral */}
              <button
                onClick={shareReferralLink}
                style={{
                  width: '100%',
                  background: 'hsl(var(--celo-yellow))',
                  border: '3px solid hsl(var(--celo-black))',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                📤 Share Referral Link
              </button>

              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'hsl(var(--celo-tan-2))', border: '2px solid hsl(var(--celo-black))', fontSize: '0.75rem' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Rewards:</div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.6 }}>
                  <li>1 EGG/day (1-2 days)</li>
                  <li>2 EGG/day (3-6 days)</li>
                  <li>3 EGG/day (7+ days)</li>
                  <li>5 EGG bonus for referrals!</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Referral Modal */}
      {showReferralModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'hsl(var(--celo-white))',
            border: '3px solid hsl(var(--celo-black))',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '100%'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>🎉 Referral Bonus!</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
              You've been referred! Check in now to get <strong>5 bonus EGG tokens</strong> for both you and your referrer!
            </p>
            <div style={{ fontSize: '0.75rem', marginBottom: '1rem', padding: '0.5rem', background: 'hsl(var(--celo-tan-2))', border: '2px solid hsl(var(--celo-black))', wordBreak: 'break-all' }}>
              Referrer: {referrerAddress}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowReferralModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'hsl(var(--celo-tan-2))',
                  border: '2px solid hsl(var(--celo-black))',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRefCheckIn}
                disabled={isAnyPending}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'hsl(var(--celo-green))',
                  color: 'white',
                  border: '2px solid hsl(var(--celo-black))',
                  fontWeight: 'bold',
                  cursor: isAnyPending ? 'not-allowed' : 'pointer'
                }}
              >
                {isRefCheckInPending ? '⏳ Confirming...' : '✅ Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </motion.div>
  )
}

export const Route = createFileRoute('/chicken')({
  component: ChickenPage,
  validateSearch: (search: Record<string, unknown>): { referrer?: string } => {
    return {
      referrer: typeof search.referrer === 'string' ? search.referrer : undefined,
    }
  },
})
