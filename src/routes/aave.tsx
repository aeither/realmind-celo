import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import {
  useAaveChains,
  useAaveMarkets,
  useUserSupplies,
  useUserBorrows,
  useSupply,
  useBorrow,
  useRepay,
  useWithdraw,
  bigDecimal,
  evmAddress,
  chainId,
  errAsync,
} from '@aave/react'
import { useSendTransaction } from '@aave/react/viem'
import GlobalHeader from '../components/GlobalHeader'
import BottomNavigation from '../components/BottomNavigation'

type Tab = 'markets' | 'positions'
type ActionType = 'supply' | 'borrow' | 'repay' | 'withdraw' | null

interface ActionModalState {
  type: ActionType
  reserve?: any
  position?: any
}

function AavePage() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>('markets')
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null)

  // Action modal state
  const [actionModal, setActionModal] = useState<ActionModalState>({ type: null })
  const [actionAmount, setActionAmount] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionSuccess, setActionSuccess] = useState(false)

  // Fetch available Aave chains
  const { data: chains, loading: loadingChains, error: chainsError } = useAaveChains({})

  // Set default chain when chains load
  useEffect(() => {
    if (chains && chains.length > 0 && !selectedChainId) {
      // Find chainId value from first chain
      const firstChain = chains[0]
      const chainIdValue = typeof firstChain.chainId === 'object'
        ? parseInt((firstChain.chainId as any).value || '1')
        : firstChain.chainId
      setSelectedChainId(chainIdValue as number)
    }
  }, [chains, selectedChainId])

  // Build market inputs for queries
  const getChainIdValue = (chain: any): number => {
    if (typeof chain.chainId === 'object') {
      return parseInt((chain.chainId as any).value || '1')
    }
    return chain.chainId as number
  }

  const selectedChain = chains?.find(c => getChainIdValue(c) === selectedChainId)

  // Fetch markets for selected chain
  const { data: markets, loading: loadingMarkets } = useAaveMarkets({
    chainIds: selectedChainId ? [chainId(selectedChainId)] : [],
    user: address ? evmAddress(address) : undefined,
  })

  // Build market inputs for user positions
  const marketInputs = markets?.map((m: any) => ({
    address: evmAddress(m.address),
    chainId: chainId(selectedChainId || 1),
  })) || []

  // Fetch user positions - only when connected and we have markets
  const shouldFetchPositions = isConnected && address && marketInputs.length > 0

  const { data: userSupplies, loading: loadingSupplies } = useUserSupplies(
    shouldFetchPositions
      ? {
          markets: marketInputs,
          user: evmAddress(address!),
        }
      : { markets: [], user: evmAddress('0x0000000000000000000000000000000000000000') }
  )

  const { data: userBorrows, loading: loadingBorrows } = useUserBorrows(
    shouldFetchPositions
      ? {
          markets: marketInputs,
          user: evmAddress(address!),
        }
      : { markets: [], user: evmAddress('0x0000000000000000000000000000000000000000') }
  )

  // Transaction hooks
  const [supply, supplying] = useSupply()
  const [borrow, borrowing] = useBorrow()
  const [repay, repaying] = useRepay()
  const [withdraw, withdrawing] = useWithdraw()
  const [sendTransaction, sending] = useSendTransaction(walletClient)

  const handleSupply = async () => {
    if (!actionModal.reserve || !actionAmount || !address || !walletClient) return

    setActionLoading(true)
    setActionError('')

    try {
      const reserve = actionModal.reserve
      const marketChainId = getChainIdValue(reserve.market.chain)

      const result = await supply({
        market: evmAddress(reserve.market.address),
        amount: {
          erc20: {
            currency: evmAddress(reserve.underlyingToken.address),
            value: bigDecimal(parseFloat(actionAmount)),
          },
        },
        sender: evmAddress(address),
        chainId: chainId(marketChainId),
      }).andThen((plan: any) => {
        switch (plan.__typename) {
          case 'TransactionRequest':
            return sendTransaction(plan)
          case 'ApprovalRequired':
            return sendTransaction(plan.approval).andThen(() =>
              sendTransaction(plan.originalTransaction)
            )
          case 'InsufficientBalanceError':
            return errAsync(
              new Error(`Insufficient balance: ${plan.required.value} required.`)
            )
          default:
            return errAsync(new Error('Unknown plan type'))
        }
      })

      if (result.isErr()) {
        setActionError(result.error.message || 'Transaction failed')
      } else {
        setActionSuccess(true)
        setTimeout(() => {
          setActionModal({ type: null })
          setActionAmount('')
          setActionSuccess(false)
        }, 2000)
      }
    } catch (err: any) {
      setActionError(err.message || 'Supply failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleBorrow = async () => {
    if (!actionModal.reserve || !actionAmount || !address || !walletClient) return

    setActionLoading(true)
    setActionError('')

    try {
      const reserve = actionModal.reserve
      const marketChainId = getChainIdValue(reserve.market.chain)

      const result = await borrow({
        market: evmAddress(reserve.market.address),
        amount: {
          erc20: {
            currency: evmAddress(reserve.underlyingToken.address),
            value: bigDecimal(parseFloat(actionAmount)),
          },
        },
        sender: evmAddress(address),
        chainId: chainId(marketChainId),
      }).andThen((plan: any) => {
        switch (plan.__typename) {
          case 'TransactionRequest':
            return sendTransaction(plan)
          case 'ApprovalRequired':
            return sendTransaction(plan.approval).andThen(() =>
              sendTransaction(plan.originalTransaction)
            )
          case 'InsufficientBalanceError':
            return errAsync(
              new Error(`Insufficient balance: ${plan.required.value} required.`)
            )
          default:
            return errAsync(new Error('Unknown plan type'))
        }
      })

      if (result.isErr()) {
        setActionError(result.error.message || 'Transaction failed')
      } else {
        setActionSuccess(true)
        setTimeout(() => {
          setActionModal({ type: null })
          setActionAmount('')
          setActionSuccess(false)
        }, 2000)
      }
    } catch (err: any) {
      setActionError(err.message || 'Borrow failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRepay = async () => {
    if (!actionModal.reserve || !actionAmount || !address || !walletClient) return

    setActionLoading(true)
    setActionError('')

    try {
      const reserve = actionModal.reserve
      const marketChainId = getChainIdValue(reserve.market.chain)

      const result = await repay({
        market: evmAddress(reserve.market.address),
        amount: {
          erc20: {
            currency: evmAddress(reserve.underlyingToken.address),
            value: {
              exact: bigDecimal(parseFloat(actionAmount)),
            },
          },
        },
        sender: evmAddress(address),
        chainId: chainId(marketChainId),
      }).andThen((plan: any) => {
        switch (plan.__typename) {
          case 'TransactionRequest':
            return sendTransaction(plan)
          case 'ApprovalRequired':
            return sendTransaction(plan.approval).andThen(() =>
              sendTransaction(plan.originalTransaction)
            )
          case 'InsufficientBalanceError':
            return errAsync(
              new Error(`Insufficient balance: ${plan.required.value} required.`)
            )
          default:
            return errAsync(new Error('Unknown plan type'))
        }
      })

      if (result.isErr()) {
        setActionError(result.error.message || 'Transaction failed')
      } else {
        setActionSuccess(true)
        setTimeout(() => {
          setActionModal({ type: null })
          setActionAmount('')
          setActionSuccess(false)
        }, 2000)
      }
    } catch (err: any) {
      setActionError(err.message || 'Repay failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!actionModal.reserve || !actionAmount || !address || !walletClient) return

    setActionLoading(true)
    setActionError('')

    try {
      const reserve = actionModal.reserve
      const marketChainId = getChainIdValue(reserve.market.chain)

      const result = await withdraw({
        market: evmAddress(reserve.market.address),
        amount: {
          erc20: {
            currency: evmAddress(reserve.underlyingToken.address),
            value: {
              exact: bigDecimal(parseFloat(actionAmount)),
            },
          },
        },
        sender: evmAddress(address),
        chainId: chainId(marketChainId),
      }).andThen((plan: any) => {
        switch (plan.__typename) {
          case 'TransactionRequest':
            return sendTransaction(plan)
          case 'ApprovalRequired':
            return sendTransaction(plan.approval).andThen(() =>
              sendTransaction(plan.originalTransaction)
            )
          case 'InsufficientBalanceError':
            return errAsync(
              new Error(`Insufficient balance: ${plan.required.value} required.`)
            )
          default:
            return errAsync(new Error('Unknown plan type'))
        }
      })

      if (result.isErr()) {
        setActionError(result.error.message || 'Transaction failed')
      } else {
        setActionSuccess(true)
        setTimeout(() => {
          setActionModal({ type: null })
          setActionAmount('')
          setActionSuccess(false)
        }, 2000)
      }
    } catch (err: any) {
      setActionError(err.message || 'Withdraw failed')
    } finally {
      setActionLoading(false)
    }
  }

  const executeAction = () => {
    switch (actionModal.type) {
      case 'supply':
        handleSupply()
        break
      case 'borrow':
        handleBorrow()
        break
      case 'repay':
        handleRepay()
        break
      case 'withdraw':
        handleWithdraw()
        break
    }
  }

  const formatPercent = (value: any) => {
    if (!value) return '0.00%'
    const num = typeof value === 'object' ? parseFloat(value.value || value.formatted || '0') : parseFloat(value)
    return `${(num * 100).toFixed(2)}%`
  }

  const formatAmount = (value: any) => {
    if (!value) return '0.00'
    const num = typeof value === 'object' ? parseFloat(value.value || '0') : parseFloat(value)
    if (num < 0.01) return '< 0.01'
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
  }

  const formatUSD = (value: any) => {
    if (!value) return '$0.00'
    const num = typeof value === 'object' ? parseFloat(value.value || '0') : parseFloat(value)
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div style={{
      minHeight: "100vh",
      paddingBottom: "90px",
      background: "hsl(var(--background))"
    }}>
      <GlobalHeader />

      <div style={{
        paddingTop: "100px",
        padding: "clamp(1rem, 3vw, 2rem)",
        maxWidth: "800px",
        margin: "0 auto"
      }}>
        {/* Title */}
        <h1 className="text-heading-2" style={{
          marginBottom: "1.5rem",
          textAlign: "center"
        }}>
          Aave Markets
        </h1>

        {/* Connection Warning */}
        {!isConnected && (
          <div style={{
            background: "hsl(var(--celo-yellow))",
            border: "2px solid hsl(var(--celo-black))",
            padding: "1rem",
            marginBottom: "1.5rem",
            textAlign: "center"
          }}>
            <p className="text-body-black" style={{
              margin: "0",
              fontSize: "0.9rem",
              textTransform: "uppercase"
            }}>
              Connect your wallet to interact with Aave
            </p>
          </div>
        )}

        {/* Chain Selector */}
        {chains && chains.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <label className="text-body-black" style={{
              display: "block",
              marginBottom: "0.5rem",
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              Select Chain
            </label>
            <select
              value={selectedChainId || ''}
              onChange={(e) => setSelectedChainId(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "0.8rem",
                border: "2px solid hsl(var(--celo-black))",
                background: "hsl(var(--celo-white))",
                fontSize: "0.9rem",
                fontFamily: "var(--font-body)",
                fontWeight: "var(--font-weight-body-heavy)",
                cursor: "pointer"
              }}
            >
              {chains.map((chain) => {
                const chainIdValue = getChainIdValue(chain)
                return (
                  <option key={chainIdValue} value={chainIdValue}>
                    {chain.name}
                  </option>
                )
              })}
            </select>
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem"
        }}>
          {(['markets', 'positions'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "0.8rem",
                border: "2px solid hsl(var(--celo-black))",
                background: activeTab === tab ? "hsl(var(--celo-yellow))" : "hsl(var(--celo-white))",
                fontSize: "0.9rem",
                fontFamily: "var(--font-body)",
                fontWeight: "var(--font-weight-body-black)",
                textTransform: "uppercase",
                cursor: "pointer",
                boxShadow: activeTab === tab ? "3px 3px 0px hsl(var(--celo-black))" : "none"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Loading States */}
        {(loadingChains || loadingMarkets) && (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <div style={{
              width: "40px",
              height: "40px",
              border: "4px solid hsl(var(--celo-black))",
              borderTopColor: "hsl(var(--celo-yellow))",
              borderRadius: "50%",
              margin: "0 auto 1rem",
              animation: "spin 1s linear infinite"
            }} />
            <p className="text-body-heavy">Loading Aave data...</p>
          </div>
        )}

        {/* Error State */}
        {chainsError && (
          <div style={{
            background: "hsl(0 80% 95%)",
            border: "2px solid hsl(0 70% 50%)",
            padding: "1rem",
            marginBottom: "1rem"
          }}>
            <p className="text-body-heavy" style={{ color: "hsl(0 70% 40%)", margin: 0 }}>
              Failed to load Aave data. Please try again later.
            </p>
          </div>
        )}

        {/* Markets Tab */}
        {activeTab === 'markets' && !loadingChains && !loadingMarkets && markets && (
          <div>
            {markets.length === 0 ? (
              <div style={{
                background: "hsl(var(--celo-tan-2))",
                border: "2px solid hsl(var(--celo-black))",
                padding: "2rem",
                textAlign: "center"
              }}>
                <p className="text-body-heavy">No markets available on this chain</p>
              </div>
            ) : (
              markets.map((market: any) => (
                <div key={`${getChainIdValue(market.chain)}-${market.address}`} style={{
                  background: "hsl(var(--celo-white))",
                  border: "3px solid hsl(var(--celo-black))",
                  boxShadow: "5px 5px 0px hsl(var(--celo-black))",
                  padding: "1.5rem",
                  marginBottom: "1.5rem"
                }}>
                  <h2 className="text-body-black" style={{
                    marginBottom: "1rem",
                    fontSize: "1.1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}>
                    {market.icon && <img src={market.icon} alt="" style={{ width: 24, height: 24, borderRadius: "50%" }} />}
                    {market.name}
                  </h2>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "1rem",
                    marginBottom: "1rem"
                  }}>
                    <div>
                      <p className="text-body" style={{ margin: 0, fontSize: "0.75rem", textTransform: "uppercase" }}>Total Market Size</p>
                      <p className="text-body-black" style={{ margin: 0, fontSize: "1rem" }}>{formatUSD(market.totalMarketSize)}</p>
                    </div>
                    <div>
                      <p className="text-body" style={{ margin: 0, fontSize: "0.75rem", textTransform: "uppercase" }}>Available Liquidity</p>
                      <p className="text-body-black" style={{ margin: 0, fontSize: "1rem" }}>{formatUSD(market.totalAvailableLiquidity)}</p>
                    </div>
                  </div>

                  {/* Supply Reserves */}
                  <div style={{ marginBottom: "1rem" }}>
                    <h3 className="text-body-heavy" style={{ fontSize: "0.9rem", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                      Supply Assets
                    </h3>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                        <thead>
                          <tr style={{ borderBottom: "2px solid hsl(var(--celo-black))" }}>
                            <th style={{ textAlign: "left", padding: "0.5rem" }}>Asset</th>
                            <th style={{ textAlign: "right", padding: "0.5rem" }}>Supply APY</th>
                            <th style={{ textAlign: "right", padding: "0.5rem" }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {market.supplyReserves?.slice(0, 5).map((reserve: any) => (
                            <tr key={reserve.underlyingToken.address} style={{ borderBottom: "1px solid hsl(var(--celo-tan-2))" }}>
                              <td style={{ padding: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                {reserve.underlyingToken.symbol}
                              </td>
                              <td style={{ textAlign: "right", padding: "0.5rem", color: "hsl(120 50% 40%)" }}>
                                {formatPercent(reserve.supplyInfo?.apy)}
                              </td>
                              <td style={{ textAlign: "right", padding: "0.5rem" }}>
                                <button
                                  onClick={() => {
                                    setActionModal({ type: 'supply', reserve })
                                    setActionAmount('')
                                    setActionError('')
                                  }}
                                  disabled={!isConnected || reserve.isFrozen || reserve.isPaused}
                                  style={{
                                    padding: "0.3rem 0.6rem",
                                    fontSize: "0.7rem",
                                    border: "2px solid hsl(var(--celo-black))",
                                    background: isConnected && !reserve.isFrozen && !reserve.isPaused ? "hsl(var(--celo-green))" : "hsl(var(--celo-tan-2))",
                                    cursor: isConnected && !reserve.isFrozen && !reserve.isPaused ? "pointer" : "not-allowed",
                                    fontWeight: "bold",
                                    textTransform: "uppercase"
                                  }}
                                >
                                  Supply
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Borrow Reserves */}
                  <div>
                    <h3 className="text-body-heavy" style={{ fontSize: "0.9rem", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                      Borrow Assets
                    </h3>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                        <thead>
                          <tr style={{ borderBottom: "2px solid hsl(var(--celo-black))" }}>
                            <th style={{ textAlign: "left", padding: "0.5rem" }}>Asset</th>
                            <th style={{ textAlign: "right", padding: "0.5rem" }}>Borrow APY</th>
                            <th style={{ textAlign: "right", padding: "0.5rem" }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {market.borrowReserves?.slice(0, 5).map((reserve: any) => (
                            <tr key={reserve.underlyingToken.address} style={{ borderBottom: "1px solid hsl(var(--celo-tan-2))" }}>
                              <td style={{ padding: "0.5rem" }}>
                                {reserve.underlyingToken.symbol}
                              </td>
                              <td style={{ textAlign: "right", padding: "0.5rem", color: "hsl(0 50% 50%)" }}>
                                {formatPercent(reserve.borrowInfo?.apy)}
                              </td>
                              <td style={{ textAlign: "right", padding: "0.5rem" }}>
                                <button
                                  onClick={() => {
                                    setActionModal({ type: 'borrow', reserve })
                                    setActionAmount('')
                                    setActionError('')
                                  }}
                                  disabled={!isConnected || reserve.isFrozen || reserve.isPaused}
                                  style={{
                                    padding: "0.3rem 0.6rem",
                                    fontSize: "0.7rem",
                                    border: "2px solid hsl(var(--celo-black))",
                                    background: isConnected && !reserve.isFrozen && !reserve.isPaused ? "hsl(var(--celo-yellow))" : "hsl(var(--celo-tan-2))",
                                    cursor: isConnected && !reserve.isFrozen && !reserve.isPaused ? "pointer" : "not-allowed",
                                    fontWeight: "bold",
                                    textTransform: "uppercase"
                                  }}
                                >
                                  Borrow
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Positions Tab */}
        {activeTab === 'positions' && (
          <div>
            {!isConnected ? (
              <div style={{
                background: "hsl(var(--celo-tan-2))",
                border: "2px solid hsl(var(--celo-black))",
                padding: "2rem",
                textAlign: "center"
              }}>
                <p className="text-body-heavy">Connect your wallet to view positions</p>
              </div>
            ) : (loadingSupplies || loadingBorrows) ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  border: "4px solid hsl(var(--celo-black))",
                  borderTopColor: "hsl(var(--celo-yellow))",
                  borderRadius: "50%",
                  margin: "0 auto 1rem",
                  animation: "spin 1s linear infinite"
                }} />
                <p className="text-body-heavy">Loading positions...</p>
              </div>
            ) : (
              <>
                {/* Supply Positions */}
                <div style={{
                  background: "hsl(var(--celo-white))",
                  border: "3px solid hsl(var(--celo-black))",
                  boxShadow: "5px 5px 0px hsl(var(--celo-black))",
                  padding: "1.5rem",
                  marginBottom: "1.5rem"
                }}>
                  <h2 className="text-body-black" style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                    Your Supplies
                  </h2>
                  {!userSupplies || userSupplies.length === 0 ? (
                    <p className="text-body" style={{ color: "hsl(var(--celo-brown))" }}>No supply positions</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                        <thead>
                          <tr style={{ borderBottom: "2px solid hsl(var(--celo-black))" }}>
                            <th style={{ textAlign: "left", padding: "0.5rem" }}>Asset</th>
                            <th style={{ textAlign: "right", padding: "0.5rem" }}>Balance</th>
                            <th style={{ textAlign: "right", padding: "0.5rem" }}>Collateral</th>
                            <th style={{ textAlign: "right", padding: "0.5rem" }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userSupplies.map((position: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: "1px solid hsl(var(--celo-tan-2))" }}>
                              <td style={{ padding: "0.5rem" }}>{position.currency?.symbol}</td>
                              <td style={{ textAlign: "right", padding: "0.5rem" }}>
                                {formatAmount(position.balance?.amount)}
                              </td>
                              <td style={{ textAlign: "right", padding: "0.5rem" }}>
                                {position.isCollateral ? 'Yes' : 'No'}
                              </td>
                              <td style={{ textAlign: "right", padding: "0.5rem" }}>
                                <button
                                  onClick={() => {
                                    // Find the reserve for this position
                                    const market = markets?.find((m: any) => m.address === position.market?.address)
                                    const reserve = market?.supplyReserves?.find((r: any) =>
                                      r.underlyingToken.address === position.currency?.address
                                    )
                                    if (reserve) {
                                      setActionModal({ type: 'withdraw', reserve, position })
                                      setActionAmount('')
                                      setActionError('')
                                    }
                                  }}
                                  style={{
                                    padding: "0.3rem 0.6rem",
                                    fontSize: "0.7rem",
                                    border: "2px solid hsl(var(--celo-black))",
                                    background: "hsl(var(--celo-purple))",
                                    color: "white",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    textTransform: "uppercase"
                                  }}
                                >
                                  Withdraw
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Borrow Positions */}
                <div style={{
                  background: "hsl(var(--celo-white))",
                  border: "3px solid hsl(var(--celo-black))",
                  boxShadow: "5px 5px 0px hsl(var(--celo-black))",
                  padding: "1.5rem"
                }}>
                  <h2 className="text-body-black" style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                    Your Borrows
                  </h2>
                  {!userBorrows || userBorrows.length === 0 ? (
                    <p className="text-body" style={{ color: "hsl(var(--celo-brown))" }}>No borrow positions</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                        <thead>
                          <tr style={{ borderBottom: "2px solid hsl(var(--celo-black))" }}>
                            <th style={{ textAlign: "left", padding: "0.5rem" }}>Asset</th>
                            <th style={{ textAlign: "right", padding: "0.5rem" }}>Debt</th>
                            <th style={{ textAlign: "right", padding: "0.5rem" }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userBorrows.map((position: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: "1px solid hsl(var(--celo-tan-2))" }}>
                              <td style={{ padding: "0.5rem" }}>{position.currency?.symbol}</td>
                              <td style={{ textAlign: "right", padding: "0.5rem" }}>
                                {formatAmount(position.debt?.amount)}
                              </td>
                              <td style={{ textAlign: "right", padding: "0.5rem" }}>
                                <button
                                  onClick={() => {
                                    // Find the reserve for this position
                                    const market = markets?.find((m: any) => m.address === position.market?.address)
                                    const reserve = market?.borrowReserves?.find((r: any) =>
                                      r.underlyingToken.address === position.currency?.address
                                    )
                                    if (reserve) {
                                      setActionModal({ type: 'repay', reserve, position })
                                      setActionAmount('')
                                      setActionError('')
                                    }
                                  }}
                                  style={{
                                    padding: "0.3rem 0.6rem",
                                    fontSize: "0.7rem",
                                    border: "2px solid hsl(var(--celo-black))",
                                    background: "hsl(var(--celo-green))",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    textTransform: "uppercase"
                                  }}
                                >
                                  Repay
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal.type && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1001,
          padding: "1rem"
        }}>
          <div style={{
            background: "hsl(var(--celo-white))",
            border: "3px solid hsl(var(--celo-black))",
            boxShadow: "8px 8px 0px hsl(var(--celo-black))",
            padding: "1.5rem",
            maxWidth: "400px",
            width: "100%"
          }}>
            <h2 className="text-body-black" style={{ marginBottom: "1rem", textTransform: "capitalize" }}>
              {actionModal.type} {actionModal.reserve?.underlyingToken?.symbol}
            </h2>

            {actionSuccess ? (
              <div style={{
                background: "hsl(120 50% 90%)",
                border: "2px solid hsl(120 50% 40%)",
                padding: "1rem",
                textAlign: "center"
              }}>
                <p className="text-body-heavy" style={{ color: "hsl(120 50% 30%)", margin: 0 }}>
                  Transaction Successful!
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "1rem" }}>
                  <label className="text-body" style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.8rem",
                    textTransform: "uppercase"
                  }}>
                    Amount
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    value={actionAmount}
                    onChange={(e) => {
                      const filtered = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
                      setActionAmount(filtered)
                    }}
                    placeholder="0.0"
                    style={{
                      width: "100%",
                      padding: "0.8rem",
                      border: "2px solid hsl(var(--celo-black))",
                      fontSize: "1.2rem",
                      fontFamily: "var(--font-body)"
                    }}
                  />
                </div>

                {actionError && (
                  <div style={{
                    background: "hsl(0 80% 95%)",
                    border: "2px solid hsl(0 70% 50%)",
                    padding: "0.75rem",
                    marginBottom: "1rem"
                  }}>
                    <p style={{ color: "hsl(0 70% 40%)", margin: 0, fontSize: "0.85rem" }}>
                      {actionError}
                    </p>
                  </div>
                )}

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => setActionModal({ type: null })}
                    style={{
                      flex: 1,
                      padding: "0.8rem",
                      border: "2px solid hsl(var(--celo-black))",
                      background: "hsl(var(--celo-tan-2))",
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeAction}
                    disabled={actionLoading || !actionAmount || parseFloat(actionAmount) <= 0}
                    style={{
                      flex: 1,
                      padding: "0.8rem",
                      border: "2px solid hsl(var(--celo-black))",
                      background: actionLoading || !actionAmount || parseFloat(actionAmount) <= 0
                        ? "hsl(var(--celo-tan-2))"
                        : "hsl(var(--celo-green))",
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      cursor: actionLoading || !actionAmount || parseFloat(actionAmount) <= 0 ? "not-allowed" : "pointer"
                    }}
                  >
                    {actionLoading ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <BottomNavigation />

      {/* Keyframes for spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export const Route = createFileRoute('/aave')({
  component: AavePage,
})
