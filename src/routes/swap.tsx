import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, useCallback } from 'react'
import { useAccount, useWalletClient, useSwitchChain, useBalance } from 'wagmi'
import { createConfig as createLiFiConfig, getChains, getTokens, getQuote, executeRoute, convertQuoteToRoute, EVM, type Token, type ExtendedChain, type QuoteRequest, type RouteExtended } from '@lifi/sdk'
import { parseUnits, formatUnits, erc20Abi } from 'viem'
import { useReadContract } from 'wagmi'
import GlobalHeader from '../components/GlobalHeader'
import BottomNavigation from '../components/BottomNavigation'
import { FARCASTER_SUPPORTED_CHAINS } from '../libs/constants'

// Initialize LI.FI SDK
let lifiInitialized = false

function SwapPage() {
  const { address, isConnected, chain } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { switchChain } = useSwitchChain()

  // State for chains and tokens
  const [chains, setChains] = useState<ExtendedChain[]>([])
  const [tokens, setTokens] = useState<Record<number, Token[]>>({})
  const [loadingChains, setLoadingChains] = useState(true)
  const [loadingTokens, setLoadingTokens] = useState(false)

  // Swap form state
  const [fromChainId, setFromChainId] = useState<number | null>(null)
  const [toChainId, setToChainId] = useState<number | null>(null)
  const [fromToken, setFromToken] = useState<Token | null>(null)
  const [toToken, setToToken] = useState<Token | null>(null)
  const [amount, setAmount] = useState<string>('')

  // Quote and execution state
  const [quote, setQuote] = useState<any>(null)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [executionStatus, setExecutionStatus] = useState<string>('')
  const [txHash, setTxHash] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [userCancelled, setUserCancelled] = useState(false)

  // Token search
  const [fromTokenSearch, setFromTokenSearch] = useState('')
  const [toTokenSearch, setToTokenSearch] = useState('')
  const [showFromTokenDropdown, setShowFromTokenDropdown] = useState(false)
  const [showToTokenDropdown, setShowToTokenDropdown] = useState(false)
  
  // Token balance state
  const [fromTokenBalance, setFromTokenBalance] = useState<string>('0')
  const [loadingBalance, setLoadingBalance] = useState(false)
  
  // Chain switching state
  const [needsChainSwitch, setNeedsChainSwitch] = useState(false)

  // Initialize LI.FI SDK and load chains
  useEffect(() => {
    const initLiFi = async () => {
      if (lifiInitialized) return
      
      try {
        createLiFiConfig({
          integrator: 'realmind-celo',
        })
        lifiInitialized = true

        // Load available chains (filter to Farcaster-supported only)
        const allChains = await getChains()
        const availableChains = allChains.filter(c => FARCASTER_SUPPORTED_CHAINS.includes(c.id))
        setChains(availableChains)
        
        // Set default chains based on current wallet chain or defaults
        const celoChain = availableChains.find(c => c.id === 42220)
        const baseChain = availableChains.find(c => c.id === 8453)
        
        if (chain?.id) {
          const currentChain = availableChains.find(c => c.id === chain.id)
          if (currentChain) {
            setFromChainId(currentChain.id)
          }
        } else if (celoChain) {
          setFromChainId(celoChain.id)
        }
        
        if (baseChain) {
          setToChainId(baseChain.id)
        } else if (celoChain) {
          setToChainId(celoChain.id)
        }
      } catch (err) {
        console.error('Failed to initialize LI.FI:', err)
        setError('Failed to initialize swap service')
      } finally {
        setLoadingChains(false)
      }
    }

    initLiFi()
  }, [chain?.id])

  // Update SDK with wallet client when available
  useEffect(() => {
    if (walletClient && lifiInitialized) {
      createLiFiConfig({
        integrator: 'realmind-celo',
        providers: [
          EVM({
            getWalletClient: () => Promise.resolve(walletClient as any),
            switchChain: async (chainId: number) => {
              switchChain({ chainId: chainId as any })
              return walletClient as any
            }
          })
        ]
      })
    }
  }, [walletClient, switchChain])

  // Check if chain switch is needed
  useEffect(() => {
    if (chain && fromChainId && chain.id !== fromChainId) {
      setNeedsChainSwitch(true)
    } else {
      setNeedsChainSwitch(false)
    }
  }, [chain, fromChainId])

  // Fetch native token balance (only when on correct chain)
  const { data: nativeBalance } = useBalance({
    address: address,
    chainId: fromChainId as any,
    query: {
      enabled: !!address && !!fromChainId && fromToken?.address === '0x0000000000000000000000000000000000000000' && chain?.id === fromChainId,
      refetchInterval: 10000,
    }
  })

  // Fetch ERC20 token balance (only when on correct chain)
  const { data: erc20Balance } = useReadContract({
    address: fromToken?.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: fromChainId as any,
    query: {
      enabled: !!address && !!fromToken && fromToken.address !== '0x0000000000000000000000000000000000000000' && !!fromChainId && chain?.id === fromChainId,
      refetchInterval: 10000,
    }
  })

  // Update balance when token changes
  useEffect(() => {
    if (!fromToken || !address) {
      setFromTokenBalance('0')
      return
    }

    if (fromToken.address === '0x0000000000000000000000000000000000000000') {
      // Native token
      if (nativeBalance) {
        setFromTokenBalance(formatUnits(nativeBalance.value, nativeBalance.decimals))
      }
    } else {
      // ERC20 token
      if (erc20Balance !== undefined) {
        setFromTokenBalance(formatUnits(erc20Balance as bigint, fromToken.decimals))
      }
    }
  }, [fromToken, address, nativeBalance, erc20Balance])

  // Load tokens when chain changes
  useEffect(() => {
    const loadTokens = async () => {
      if (!fromChainId && !toChainId) return

      setLoadingTokens(true)
      try {
        const chainIds = [fromChainId, toChainId].filter(Boolean) as number[]
        const tokensResponse = await getTokens({ chains: chainIds })
        setTokens(tokensResponse.tokens)
        
        // Auto-select native token for from chain
        if (fromChainId && tokensResponse.tokens[fromChainId]) {
          const nativeToken = tokensResponse.tokens[fromChainId].find(
            t => t.address === '0x0000000000000000000000000000000000000000'
          )
          if (nativeToken && !fromToken) {
            setFromToken(nativeToken)
          }
        }
        
        // Auto-select USDC or native token for to chain
        if (toChainId && tokensResponse.tokens[toChainId]) {
          const usdcToken = tokensResponse.tokens[toChainId].find(
            t => t.symbol.toUpperCase() === 'USDC'
          )
          const nativeToken = tokensResponse.tokens[toChainId].find(
            t => t.address === '0x0000000000000000000000000000000000000000'
          )
          if (!toToken) {
            setToToken(usdcToken || nativeToken || null)
          }
        }
      } catch (err) {
        console.error('Failed to load tokens:', err)
      } finally {
        setLoadingTokens(false)
      }
    }

    loadTokens()
  }, [fromChainId, toChainId])

  // Get quote when inputs change
  const fetchQuote = useCallback(async () => {
    if (!fromChainId || !toChainId || !fromToken || !toToken || !amount || !address) {
      setQuote(null)
      return
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setQuote(null)
      return
    }

    setLoadingQuote(true)
    setError('')
    setUserCancelled(false)

    try {
      const fromAmountWei = parseUnits(amount, fromToken.decimals).toString()

      const quoteRequest: QuoteRequest = {
        fromChain: fromChainId,
        toChain: toChainId,
        fromToken: fromToken.address,
        toToken: toToken.address,
        fromAmount: fromAmountWei,
        fromAddress: address,
        slippage: 0.03, // 3% slippage
      }

      const quoteResult = await getQuote(quoteRequest)
      setQuote(quoteResult)
    } catch (err: any) {
      console.error('Failed to get quote:', err)
      // Clean up error message
      const errorMsg = err.message || 'Failed to get quote'
      const cleanError = errorMsg.split('Details:')[0].replace(/\[.*?\]\s*/g, '').trim()
      setError(cleanError || 'Unable to get quote. Please check your inputs and try again.')
      setQuote(null)
    } finally {
      setLoadingQuote(false)
    }
  }, [fromChainId, toChainId, fromToken, toToken, amount, address])

  // Debounced quote fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuote()
    }, 500)
    return () => clearTimeout(timer)
  }, [fetchQuote])

  // Helper function to detect user rejection errors
  const isUserRejection = (error: any): boolean => {
    const errorMessage = error?.message?.toLowerCase() || error?.toString()?.toLowerCase() || ''
    return (
      errorMessage.includes('user rejected') ||
      errorMessage.includes('user denied') ||
      errorMessage.includes('user cancelled') ||
      errorMessage.includes('user canceled') ||
      errorMessage.includes('rejected by user') ||
      errorMessage.includes('transaction was rejected') ||
      errorMessage.includes('user disapproved')
    )
  }

  // Execute swap
  const handleSwap = async () => {
    if (!quote || !walletClient) return

    setExecuting(true)
    setExecutionStatus('Preparing transaction...')
    setError('')
    setUserCancelled(false)
    setTxHash('')

    try {
      const route = convertQuoteToRoute(quote)

      await executeRoute(route, {
        updateRouteHook: (updatedRoute: RouteExtended) => {
          // Update status based on execution progress
          const step = updatedRoute.steps[0]
          if (step?.execution) {
            const process = step.execution.process[step.execution.process.length - 1]
            if (process) {
              setExecutionStatus(process.message || 'Processing...')
              if (process.txHash) {
                setTxHash(process.txHash)
              }
            }
          }
        },
        acceptExchangeRateUpdateHook: async () => {
          // Auto-accept exchange rate updates
          return true
        }
      })

      setExecutionStatus('Swap completed!')

      // Reset form after successful swap
      setTimeout(() => {
        setAmount('')
        setQuote(null)
        setExecuting(false)
        setExecutionStatus('')
      }, 3000)
    } catch (err: any) {
      console.error('Swap failed:', err)

      // Check if error is user rejection
      if (isUserRejection(err)) {
        setUserCancelled(true)
      } else {
        // Show actual error for non-rejection errors
        const errorMsg = err.message || 'Swap failed'
        // Clean up technical details from error message
        const cleanError = errorMsg.split('Details:')[0].replace(/\[.*?\]\s*/g, '').trim()
        setError(cleanError || 'Swap failed. Please try again.')
      }

      setExecuting(false)
      setExecutionStatus('')
    }
  }

  // Swap chains
  const handleSwapChains = () => {
    const tempChain = fromChainId
    const tempToken = fromToken
    setFromChainId(toChainId)
    setToChainId(tempChain)
    setFromToken(toToken)
    setToToken(tempToken)
  }

  // Handle chain switch for swap
  const handleChainSwitch = async () => {
    if (!fromChainId || fromChainId === chain?.id) return

    setError('')
    setUserCancelled(false)

    try {
      await switchChain({ chainId: fromChainId as any })
      setNeedsChainSwitch(false)
    } catch (err: any) {
      console.error('Failed to switch chain:', err)

      // Check if user rejected the chain switch
      if (isUserRejection(err)) {
        setUserCancelled(true)
      } else {
        setError('Failed to switch network. Please try switching manually in your wallet.')
      }
    }
  }

  // Set amount by percentage
  const setAmountByPercentage = (percentage: number) => {
    if (!fromTokenBalance || parseFloat(fromTokenBalance) <= 0) return
    
    const balance = parseFloat(fromTokenBalance)
    let newAmount: number
    
    if (percentage === 100) {
      // For MAX, leave a small amount for gas on native tokens
      if (fromToken?.address === '0x0000000000000000000000000000000000000000') {
        newAmount = Math.max(0, balance - 0.01) // Reserve 0.01 for gas
      } else {
        newAmount = balance
      }
    } else {
      newAmount = balance * (percentage / 100)
    }
    
    // Format with appropriate decimals
    const decimals = fromToken?.decimals || 18
    const formatted = newAmount.toFixed(Math.min(decimals, 8))
    setAmount(formatted.replace(/\.?0+$/, '')) // Remove trailing zeros
  }

  // Filter tokens based on search
  const getFilteredTokens = (chainId: number | null, search: string) => {
    if (!chainId || !tokens[chainId]) return []
    
    const chainTokens = tokens[chainId]
    if (!search) return chainTokens.slice(0, 50) // Limit to 50 for performance
    
    const searchLower = search.toLowerCase()
    return chainTokens.filter(
      t => t.symbol.toLowerCase().includes(searchLower) || 
           t.name.toLowerCase().includes(searchLower)
    ).slice(0, 50)
  }

  // Format token amount for display
  const formatTokenAmount = (amount: string, decimals: number) => {
    try {
      const formatted = formatUnits(BigInt(amount), decimals)
      const num = parseFloat(formatted)
      if (num < 0.0001) return '< 0.0001'
      return num.toFixed(4)
    } catch {
      return '0'
    }
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
        maxWidth: "600px",
        margin: "0 auto"
      }}>
        {/* Swap Card */}
        <div style={{
          background: "hsl(var(--celo-white))",
          border: "3px solid hsl(var(--celo-black))",
          boxShadow: "5px 5px 0px hsl(var(--celo-black))",
          padding: "1.5rem"
        }}>
          {/* Connection Status */}
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
                Connect your wallet to swap tokens
              </p>
            </div>
          )}

          {loadingChains ? (
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
              <p className="text-body-heavy">Loading chains...</p>
            </div>
          ) : (
            <>
              {/* Chain Switch Warning */}
              {needsChainSwitch && fromChainId && (
                <div style={{
                  background: "hsl(var(--celo-yellow))",
                  border: "2px solid hsl(var(--celo-black))",
                  padding: "0.75rem",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem"
                }}>
                  <span className="text-body-heavy" style={{ fontSize: "0.8rem" }}>
                    ⚠️ Switch to {chains.find(c => c.id === fromChainId)?.name || 'selected chain'} to swap
                  </span>
                  <button
                    onClick={handleChainSwitch}
                    style={{
                      background: "hsl(var(--celo-black))",
                      color: "hsl(var(--celo-yellow))",
                      border: "none",
                      padding: "0.4rem 0.8rem",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      cursor: "pointer",
                      textTransform: "uppercase"
                    }}
                  >
                    Switch
                  </button>
                </div>
              )}

              {/* From Section */}
              <div style={{ marginBottom: "1rem" }}>
                <label className="text-body-black" style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}>
                  From
                </label>
                
                {/* Chain Selector */}
                <select
                  value={fromChainId || ''}
                  onChange={(e) => {
                    setFromChainId(Number(e.target.value))
                    setFromToken(null)
                    setFromTokenBalance('0')
                  }}
                  style={{
                    width: "100%",
                    padding: "0.8rem",
                    border: "2px solid hsl(var(--celo-black))",
                    background: "hsl(var(--celo-tan-2))",
                    fontSize: "0.9rem",
                    fontFamily: "var(--font-body)",
                    fontWeight: "var(--font-weight-body-heavy)",
                    marginBottom: "0.5rem",
                    cursor: "pointer"
                  }}
                >
                  <option value="">Select Chain</option>
                  {chains.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {/* Token Selector + Amount */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <div style={{ position: "relative", flex: "1" }}>
                    <button
                      onClick={() => setShowFromTokenDropdown(!showFromTokenDropdown)}
                      disabled={!fromChainId || loadingTokens}
                      style={{
                        width: "100%",
                        padding: "0.8rem",
                        border: "2px solid hsl(var(--celo-black))",
                        background: "hsl(var(--celo-white))",
                        fontSize: "0.9rem",
                        fontFamily: "var(--font-body)",
                        fontWeight: "var(--font-weight-body-heavy)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        textAlign: "left"
                      }}
                    >
                      {fromToken ? (
                        <>
                          {fromToken.logoURI && (
                            <img src={fromToken.logoURI} alt="" style={{ width: "20px", height: "20px", borderRadius: "50%" }} />
                          )}
                          {fromToken.symbol}
                        </>
                      ) : (
                        loadingTokens ? 'Loading...' : 'Select Token'
                      )}
                      <span style={{ marginLeft: "auto" }}>▼</span>
                    </button>

                    {showFromTokenDropdown && fromChainId && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "hsl(var(--celo-white))",
                        border: "2px solid hsl(var(--celo-black))",
                        borderTop: "none",
                        maxHeight: "300px",
                        overflowY: "auto",
                        zIndex: 100
                      }}>
                        <input
                          type="text"
                          placeholder="Search tokens..."
                          value={fromTokenSearch}
                          onChange={(e) => setFromTokenSearch(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.8rem",
                            border: "none",
                            borderBottom: "2px solid hsl(var(--celo-black))",
                            fontSize: "0.9rem"
                          }}
                        />
                        {getFilteredTokens(fromChainId, fromTokenSearch).map(token => (
                          <button
                            key={token.address}
                            onClick={() => {
                              setFromToken(token)
                              setShowFromTokenDropdown(false)
                              setFromTokenSearch('')
                            }}
                            style={{
                              width: "100%",
                              padding: "0.8rem",
                              border: "none",
                              borderBottom: "1px solid hsl(var(--celo-tan-2))",
                              background: "transparent",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              textAlign: "left"
                            }}
                          >
                            {token.logoURI && (
                              <img src={token.logoURI} alt="" style={{ width: "24px", height: "24px", borderRadius: "50%" }} />
                            )}
                            <div>
                              <div style={{ fontWeight: "bold" }}>{token.symbol}</div>
                              <div style={{ fontSize: "0.75rem", color: "hsl(var(--celo-brown))" }}>{token.name}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => {
                      // Filter to numbers/decimals only for crypto amounts
                      const filtered = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                      setAmount(filtered);
                    }}
                    disabled={!isConnected}
                    style={{
                      flex: "1",
                      padding: "0.8rem",
                      border: "2px solid hsl(var(--celo-black))",
                      background: "hsl(var(--celo-white))",
                      fontSize: "1.2rem",
                      fontFamily: "var(--font-body)",
                      fontWeight: "var(--font-weight-body-heavy)",
                      textAlign: "right"
                    }}
                  />
                </div>

                {/* Balance Display & Percentage Buttons */}
                {fromToken && isConnected && (
                  <div style={{ 
                    marginTop: "0.5rem", 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.5rem"
                  }}>
                    <div style={{ 
                      fontSize: "0.75rem", 
                      color: "hsl(var(--celo-brown))",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem"
                    }}>
                      <span>Balance:</span>
                      <span style={{ fontWeight: "bold", color: "hsl(var(--celo-black))" }}>
                        {parseFloat(fromTokenBalance).toFixed(4)} {fromToken.symbol}
                      </span>
                    </div>
                    
                    {/* Percentage Buttons */}
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                      {[25, 50, 75, 100].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => setAmountByPercentage(pct)}
                          disabled={parseFloat(fromTokenBalance) <= 0}
                          style={{
                            padding: "0.25rem 0.5rem",
                            fontSize: "0.7rem",
                            fontWeight: "bold",
                            border: "2px solid hsl(var(--celo-black))",
                            background: "hsl(var(--celo-tan-2))",
                            cursor: parseFloat(fromTokenBalance) > 0 ? "pointer" : "not-allowed",
                            opacity: parseFloat(fromTokenBalance) > 0 ? 1 : 0.5,
                            transition: "var(--transition-fast)"
                          }}
                          onMouseEnter={(e) => {
                            if (parseFloat(fromTokenBalance) > 0) {
                              e.currentTarget.style.background = "hsl(var(--celo-yellow))"
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "hsl(var(--celo-tan-2))"
                          }}
                        >
                          {pct === 100 ? 'MAX' : `${pct}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Swap Direction Button */}
              <div style={{
                display: "flex",
                justifyContent: "center",
                margin: "1rem 0"
              }}>
                <button
                  onClick={handleSwapChains}
                  style={{
                    width: "50px",
                    height: "50px",
                    border: "3px solid hsl(var(--celo-black))",
                    background: "hsl(var(--celo-yellow))",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    transition: "var(--transition-fast)",
                    boxShadow: "3px 3px 0px hsl(var(--celo-black))"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)"
                    e.currentTarget.style.boxShadow = "5px 5px 0px hsl(var(--celo-black))"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = "3px 3px 0px hsl(var(--celo-black))"
                  }}
                >
                  ⇅
                </button>
              </div>

              {/* To Section */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label className="text-body-black" style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}>
                  To
                </label>
                
                {/* Chain Selector */}
                <select
                  value={toChainId || ''}
                  onChange={(e) => {
                    setToChainId(Number(e.target.value))
                    setToToken(null)
                  }}
                  style={{
                    width: "100%",
                    padding: "0.8rem",
                    border: "2px solid hsl(var(--celo-black))",
                    background: "hsl(var(--celo-tan-2))",
                    fontSize: "0.9rem",
                    fontFamily: "var(--font-body)",
                    fontWeight: "var(--font-weight-body-heavy)",
                    marginBottom: "0.5rem",
                    cursor: "pointer"
                  }}
                >
                  <option value="">Select Chain</option>
                  {chains.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {/* Token Selector + Estimated Amount */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <div style={{ position: "relative", flex: "1" }}>
                    <button
                      onClick={() => setShowToTokenDropdown(!showToTokenDropdown)}
                      disabled={!toChainId || loadingTokens}
                      style={{
                        width: "100%",
                        padding: "0.8rem",
                        border: "2px solid hsl(var(--celo-black))",
                        background: "hsl(var(--celo-white))",
                        fontSize: "0.9rem",
                        fontFamily: "var(--font-body)",
                        fontWeight: "var(--font-weight-body-heavy)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        textAlign: "left"
                      }}
                    >
                      {toToken ? (
                        <>
                          {toToken.logoURI && (
                            <img src={toToken.logoURI} alt="" style={{ width: "20px", height: "20px", borderRadius: "50%" }} />
                          )}
                          {toToken.symbol}
                        </>
                      ) : (
                        loadingTokens ? 'Loading...' : 'Select Token'
                      )}
                      <span style={{ marginLeft: "auto" }}>▼</span>
                    </button>

                    {showToTokenDropdown && toChainId && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "hsl(var(--celo-white))",
                        border: "2px solid hsl(var(--celo-black))",
                        borderTop: "none",
                        maxHeight: "300px",
                        overflowY: "auto",
                        zIndex: 100
                      }}>
                        <input
                          type="text"
                          placeholder="Search tokens..."
                          value={toTokenSearch}
                          onChange={(e) => setToTokenSearch(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.8rem",
                            border: "none",
                            borderBottom: "2px solid hsl(var(--celo-black))",
                            fontSize: "0.9rem"
                          }}
                        />
                        {getFilteredTokens(toChainId, toTokenSearch).map(token => (
                          <button
                            key={token.address}
                            onClick={() => {
                              setToToken(token)
                              setShowToTokenDropdown(false)
                              setToTokenSearch('')
                            }}
                            style={{
                              width: "100%",
                              padding: "0.8rem",
                              border: "none",
                              borderBottom: "1px solid hsl(var(--celo-tan-2))",
                              background: "transparent",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              textAlign: "left"
                            }}
                          >
                            {token.logoURI && (
                              <img src={token.logoURI} alt="" style={{ width: "24px", height: "24px", borderRadius: "50%" }} />
                            )}
                            <div>
                              <div style={{ fontWeight: "bold" }}>{token.symbol}</div>
                              <div style={{ fontSize: "0.75rem", color: "hsl(var(--celo-brown))" }}>{token.name}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{
                    flex: "1",
                    padding: "0.8rem",
                    border: "2px solid hsl(var(--celo-black))",
                    background: "hsl(var(--celo-tan-2))",
                    fontSize: "1.2rem",
                    fontFamily: "var(--font-body)",
                    fontWeight: "var(--font-weight-body-heavy)",
                    textAlign: "right",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end"
                  }}>
                    {loadingQuote ? (
                      <span style={{ fontSize: "0.9rem", color: "hsl(var(--celo-brown))" }}>Loading...</span>
                    ) : quote && toToken ? (
                      formatTokenAmount(quote.estimate.toAmount, toToken.decimals)
                    ) : (
                      '0.0'
                    )}
                  </div>
                </div>
              </div>

              {/* Quote Details */}
              {quote && (
                <div style={{
                  background: "hsl(var(--celo-tan-2))",
                  border: "2px solid hsl(var(--celo-black))",
                  padding: "1rem",
                  marginBottom: "1.5rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span className="text-body-heavy" style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>
                      Route
                    </span>
                    <span className="text-body-black" style={{ fontSize: "0.8rem" }}>
                      {quote.toolDetails?.name || quote.tool}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span className="text-body-heavy" style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>
                      Est. Gas
                    </span>
                    <span className="text-body-black" style={{ fontSize: "0.8rem" }}>
                      ${quote.estimate?.gasCosts?.[0]?.amountUSD || 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="text-body-heavy" style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>
                      Est. Time
                    </span>
                    <span className="text-body-black" style={{ fontSize: "0.8rem" }}>
                      ~{Math.ceil((quote.estimate?.executionDuration || 60) / 60)} min
                    </span>
                  </div>
                </div>
              )}

              {/* User Cancelled Message */}
              {userCancelled && (
                <div style={{
                  background: "hsl(var(--celo-tan-2))",
                  border: "2px solid hsl(var(--celo-black))",
                  padding: "1rem",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "start",
                  justifyContent: "space-between",
                  gap: "0.5rem"
                }}>
                  <div>
                    <p className="text-body-heavy" style={{ margin: "0 0 0.25rem 0", fontSize: "0.9rem" }}>
                      Transaction Cancelled
                    </p>
                    <p className="text-body" style={{ margin: "0", fontSize: "0.8rem", color: "hsl(var(--celo-brown))" }}>
                      You rejected the transaction. No worries, you can try again when ready.
                    </p>
                  </div>
                  <button
                    onClick={() => setUserCancelled(false)}
                    style={{
                      background: "transparent",
                      border: "none",
                      fontSize: "1.2rem",
                      cursor: "pointer",
                      padding: "0",
                      lineHeight: "1",
                      color: "hsl(var(--celo-black))"
                    }}
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div style={{
                  background: "hsl(0 80% 95%)",
                  border: "2px solid hsl(0 70% 50%)",
                  padding: "1rem",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "start",
                  justifyContent: "space-between",
                  gap: "0.5rem"
                }}>
                  <div>
                    <p className="text-body-heavy" style={{ margin: "0 0 0.25rem 0", fontSize: "0.9rem", color: "hsl(0 70% 40%)" }}>
                      Transaction Failed
                    </p>
                    <p style={{ margin: "0", fontSize: "0.8rem", color: "hsl(0 70% 40%)" }}>
                      {error}
                    </p>
                  </div>
                  <button
                    onClick={() => setError('')}
                    style={{
                      background: "transparent",
                      border: "none",
                      fontSize: "1.2rem",
                      cursor: "pointer",
                      padding: "0",
                      lineHeight: "1",
                      color: "hsl(0 70% 40%)"
                    }}
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Execution Status */}
              {executing && (
                <div style={{
                  background: "hsl(var(--celo-yellow))",
                  border: "2px solid hsl(var(--celo-black))",
                  padding: "1rem",
                  marginBottom: "1rem"
                }}>
                  <p className="text-body-black" style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", textTransform: "uppercase" }}>
                    {executionStatus}
                  </p>
                  {txHash && (
                    <a
                      href={`https://layerzeroscan.com/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "0.8rem",
                        color: "hsl(var(--celo-purple))",
                        textDecoration: "underline"
                      }}
                    >
                      View on Explorer →
                    </a>
                  )}
                </div>
              )}

              {/* Swap Button */}
              <button
                onClick={needsChainSwitch ? handleChainSwitch : handleSwap}
                disabled={!isConnected || (!quote && !needsChainSwitch) || executing || loadingQuote}
                style={{
                  width: "100%",
                  padding: "1rem",
                  border: "3px solid hsl(var(--celo-black))",
                  background: (!isConnected || ((!quote || needsChainSwitch) && !needsChainSwitch) || executing || loadingQuote) 
                    ? needsChainSwitch ? "hsl(var(--celo-yellow))" : "hsl(var(--celo-tan-2))" 
                    : "hsl(var(--celo-green))",
                  color: (!isConnected || (!quote && !needsChainSwitch) || executing || loadingQuote) 
                    ? "hsl(var(--celo-black))" 
                    : "hsl(var(--celo-black))",
                  fontSize: "1.1rem",
                  fontFamily: "var(--font-body)",
                  fontWeight: "var(--font-weight-body-black)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  cursor: (!isConnected || (!quote && !needsChainSwitch) || executing || loadingQuote) ? "not-allowed" : "pointer",
                  boxShadow: "4px 4px 0px hsl(var(--celo-black))",
                  transition: "var(--transition-fast)"
                }}
                onMouseEnter={(e) => {
                  if ((isConnected && quote && !executing && !loadingQuote) || needsChainSwitch) {
                    e.currentTarget.style.transform = "translateY(-2px)"
                    e.currentTarget.style.boxShadow = "6px 6px 0px hsl(var(--celo-black))"
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "4px 4px 0px hsl(var(--celo-black))"
                }}
              >
                {!isConnected ? 'Connect Wallet' : 
                 needsChainSwitch ? `Switch to ${chains.find(c => c.id === fromChainId)?.name || 'Chain'}` :
                 executing ? 'Swapping...' : 
                 loadingQuote ? 'Getting Quote...' :
                 !quote ? 'Enter Amount' : 
                 'Swap'}
              </button>
            </>
          )}
        </div>

      </div>

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

export const Route = createFileRoute('/swap')({
  component: SwapPage,
})

