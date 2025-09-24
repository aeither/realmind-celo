import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  useAccount, 
  useConnect, 
  useDisconnect, 
  useReadContract, 
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useBalance
} from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { quizGameABI } from '../libs/quizGameABI'
import { getContractAddresses } from '../libs/constants'
import { CURRENCY_CONFIG, SUPPORTED_CHAIN_IDS } from '../libs/supportedChains'

function ContractDebugPage() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  
  const [selectedAmount, setSelectedAmount] = useState<number>(0.001);
  const [userAnswer, setUserAnswer] = useState<number>(42);
  const [expectedCorrectAnswers, setExpectedCorrectAnswers] = useState<number>(3);
  const [submittedAnswer, setSubmittedAnswer] = useState<number>(42);
  const [newOwnerAddress, setNewOwnerAddress] = useState<string>('');
  const [newVaultAddress, setNewVaultAddress] = useState<string>('');
  const [newTokenOwnerAddress, setNewTokenOwnerAddress] = useState<string>('');
  const [newTokenMultiplier, setNewTokenMultiplier] = useState<string>('');
  const [newDefaultEntryPrice, setNewDefaultEntryPrice] = useState<string>('');
  const [mintTokenAmount, setMintTokenAmount] = useState<string>('100');
  const [mintTokenAddress, setMintTokenAddress] = useState<string>('');

  // Get contract addresses based on current chain
  const contractAddresses = chain ? getContractAddresses(chain.id) : null;
  
  // Get currency config for current chain
  const currencyConfig = chain ? (CURRENCY_CONFIG[chain.id as keyof typeof CURRENCY_CONFIG] || CURRENCY_CONFIG.default) : CURRENCY_CONFIG.default;

  // Get user balance
  const { data: balance } = useBalance({
    address,
    chainId: chain?.id,
  });

  // Read contract data
  const { data: owner, refetch: refetchOwner } = useReadContract({
    abi: quizGameABI,
    address: contractAddresses?.quizGameContractAddress as `0x${string}`,
    functionName: 'owner',
    chainId: chain?.id,
    query: {
      enabled: !!contractAddresses,
    },
  });

  const { data: tokenAddress, refetch: refetchToken } = useReadContract({
    abi: quizGameABI,
    address: contractAddresses?.quizGameContractAddress as `0x${string}`,
    functionName: 'token',
    chainId: chain?.id,
    query: {
      enabled: !!contractAddresses,
    },
  });

  const { data: vaultAddress, refetch: refetchVault } = useReadContract({
    abi: quizGameABI,
    address: contractAddresses?.quizGameContractAddress as `0x${string}`,
    functionName: 'vaultAddress',
    chainId: chain?.id,
    query: {
      enabled: !!contractAddresses,
    },
  });

  const { data: token1Owner, refetch: refetchToken1Owner } = useReadContract({
    abi: quizGameABI,
    address: contractAddresses?.token1ContractAddress as `0x${string}`,
    functionName: 'owner',
    chainId: chain?.id,
    query: {
      enabled: !!contractAddresses,
    },
  });

  const { data: tokenMultiplier, refetch: refetchTokenMultiplier } = useReadContract({
    abi: quizGameABI,
    address: contractAddresses?.quizGameContractAddress as `0x${string}`,
    functionName: 'tokenMultiplier',
    chainId: chain?.id,
    query: {
      enabled: !!contractAddresses,
    },
  });

  const { data: defaultEntryPrice, refetch: refetchDefaultEntryPrice } = useReadContract({
    abi: quizGameABI,
    address: contractAddresses?.quizGameContractAddress as `0x${string}`,
    functionName: 'defaultEntryPrice',
    chainId: chain?.id,
    query: {
      enabled: !!contractAddresses,
    },
  });

  const { data: userSession, refetch: refetchSession } = useReadContract({
    abi: quizGameABI,
    address: contractAddresses?.quizGameContractAddress as `0x${string}`,
    functionName: 'getQuizSession',
    args: address ? [address] : undefined,
    chainId: chain?.id,
    query: {
      enabled: !!contractAddresses && !!address,
    },
  });

  // Write contract hooks
  const { 
    data: startQuizHash, 
    isPending: isStartPending,
    writeContract: startQuiz,
    error: startError,
    reset: resetStart
  } = useWriteContract();

  const { 
    data: completeQuizHash, 
    isPending: isCompletePending,
    writeContract: completeQuiz,
    error: completeError,
    reset: resetComplete
  } = useWriteContract();

  const { 
    data: withdrawHash, 
    isPending: isWithdrawPending,
    writeContract: withdraw,
    error: withdrawError,
    reset: resetWithdraw
  } = useWriteContract();

  const { 
    data: mintTokenHash, 
    isPending: isMintTokenPending,
    writeContract: mintToken,
    error: mintTokenError,
    reset: resetMintToken
  } = useWriteContract();

  const { 
    data: transferOwnershipHash, 
    isPending: isTransferOwnershipPending,
    writeContract: transferOwnership,
    error: transferOwnershipError,
    reset: resetTransferOwnership
  } = useWriteContract();

  const { 
    data: renounceOwnershipHash, 
    isPending: isRenounceOwnershipPending,
    writeContract: renounceOwnership,
    error: renounceOwnershipError,
    reset: resetRenounceOwnership
  } = useWriteContract();

  const { 
    data: setVaultAddressHash, 
    isPending: isSetVaultAddressPending,
    writeContract: setVaultAddress,
    error: setVaultAddressError,
    reset: resetSetVaultAddress
  } = useWriteContract();

  const { 
    data: transferTokenOwnershipHash, 
    isPending: isTransferTokenOwnershipPending,
    writeContract: transferTokenOwnership,
    error: transferTokenOwnershipError,
    reset: resetTransferTokenOwnership
  } = useWriteContract();

  const { 
    data: setTokenMultiplierHash, 
    isPending: isSetTokenMultiplierPending,
    writeContract: setTokenMultiplier,
    error: setTokenMultiplierError,
    reset: resetSetTokenMultiplier
  } = useWriteContract();

  const { 
    data: setDefaultEntryPriceHash, 
    isPending: isSetDefaultEntryPricePending,
    writeContract: setDefaultEntryPrice,
    error: setDefaultEntryPriceError,
    reset: resetSetDefaultEntryPrice
  } = useWriteContract();

  // Wait for transaction confirmations
  const { isLoading: isStartConfirming, isSuccess: isStartConfirmed } = 
    useWaitForTransactionReceipt({ hash: startQuizHash });

  const { isLoading: isCompleteConfirming, isSuccess: isCompleteConfirmed } = 
    useWaitForTransactionReceipt({ hash: completeQuizHash });

  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawConfirmed } = 
    useWaitForTransactionReceipt({ hash: withdrawHash });

  const { isLoading: isMintTokenConfirming, isSuccess: isMintTokenConfirmed } = 
    useWaitForTransactionReceipt({ hash: mintTokenHash });

  const { isLoading: isTransferOwnershipConfirming, isSuccess: isTransferOwnershipConfirmed } = 
    useWaitForTransactionReceipt({ hash: transferOwnershipHash });

  const { isLoading: isRenounceOwnershipConfirming, isSuccess: isRenounceOwnershipConfirmed } = 
    useWaitForTransactionReceipt({ hash: renounceOwnershipHash });

  const { isLoading: isSetVaultAddressConfirming, isSuccess: isSetVaultAddressConfirmed } = 
    useWaitForTransactionReceipt({ hash: setVaultAddressHash });

  const { isLoading: isTransferTokenOwnershipConfirming, isSuccess: isTransferTokenOwnershipConfirmed } = 
    useWaitForTransactionReceipt({ hash: transferTokenOwnershipHash });

  const { isLoading: isSetTokenMultiplierConfirming, isSuccess: isSetTokenMultiplierConfirmed } = 
    useWaitForTransactionReceipt({ hash: setTokenMultiplierHash });

  const { isLoading: isSetDefaultEntryPriceConfirming, isSuccess: isSetDefaultEntryPriceConfirmed } = 
    useWaitForTransactionReceipt({ hash: setDefaultEntryPriceHash });

  // Check if current chain is supported  
  const supportedChainId = SUPPORTED_CHAIN_IDS[0];
  const isCorrectChain = chain ? chain.id === supportedChainId : false;

  const handleStartQuiz = () => {
    if (!isConnected || !contractAddresses) return;
    
    resetStart();
    startQuiz({
      abi: quizGameABI,
      address: contractAddresses.quizGameContractAddress as `0x${string}`,
      functionName: 'startQuiz',
      args: ["demo-quiz", BigInt(expectedCorrectAnswers)],
      value: parseEther(selectedAmount.toString()),
      chainId: chain?.id,
    });
  };

  const handleCompleteQuiz = () => {
    if (!isConnected || !contractAddresses) return;
    
    resetComplete();
    completeQuiz({
      abi: quizGameABI,
      address: contractAddresses.quizGameContractAddress as `0x${string}`,
      functionName: 'completeQuiz',
      args: [BigInt(submittedAnswer)],
      chainId: chain?.id,
    });
  };

  const handleWithdraw = () => {
    if (!isConnected || !contractAddresses) return;
    
    resetWithdraw();
    withdraw({
      abi: quizGameABI,
      address: contractAddresses.quizGameContractAddress as `0x${string}`,
      functionName: 'withdraw',
      chainId: chain?.id,
    });
  };

  const handleMintToken = () => {
    if (!isConnected || !mintTokenAddress || !mintTokenAmount || !contractAddresses) return;
    
    const amount = parseEther(mintTokenAmount);
    if (amount <= 0) return;
    
    resetMintToken();
    mintToken({
      abi: quizGameABI,
      address: contractAddresses.quizGameContractAddress as `0x${string}`,
      functionName: 'mintToken',
      args: [mintTokenAddress as `0x${string}`, amount],
      chainId: chain?.id,
    });
  };

  const handleRefetchAll = () => {
    refetchOwner();
    refetchToken();
    refetchVault();
    refetchToken1Owner();
    refetchTokenMultiplier();
    refetchDefaultEntryPrice();
    refetchSession();
  };

  const handleTransferOwnership = () => {
    if (!isConnected || !newOwnerAddress || !contractAddresses) return;
    
    resetTransferOwnership();
    transferOwnership({
      abi: quizGameABI,
      address: contractAddresses.quizGameContractAddress as `0x${string}`,
      functionName: 'transferOwnership',
      args: [newOwnerAddress as `0x${string}`],
      chainId: chain?.id,
    });
  };

  const handleRenounceOwnership = () => {
    if (!isConnected || !contractAddresses) return;
    
    resetRenounceOwnership();
    renounceOwnership({
      abi: quizGameABI,
      address: contractAddresses.quizGameContractAddress as `0x${string}`,
      functionName: 'renounceOwnership',
      chainId: chain?.id,
    });
  };

  const handleSetVaultAddress = () => {
    if (!isConnected || !newVaultAddress || !contractAddresses) return;
    
    resetSetVaultAddress();
    setVaultAddress({
      abi: quizGameABI,
      address: contractAddresses.quizGameContractAddress as `0x${string}`,
      functionName: 'setVaultAddress',
      args: [newVaultAddress as `0x${string}`],
      chainId: chain?.id,
    });
  };

  const handleTransferTokenOwnership = () => {
    if (!isConnected || !newTokenOwnerAddress || !contractAddresses) return;
    
    resetTransferTokenOwnership();
    transferTokenOwnership({
      abi: quizGameABI,
      address: contractAddresses.quizGameContractAddress as `0x${string}`,
      functionName: 'transferTokenOwnership',
      args: [newTokenOwnerAddress as `0x${string}`],
      chainId: chain?.id,
    });
  };

  const handleSetTokenMultiplier = () => {
    if (!isConnected || !newTokenMultiplier || !contractAddresses) return;
    
    const multiplierValue = BigInt(newTokenMultiplier);
    if (multiplierValue <= 0) return;
    
    resetSetTokenMultiplier();
    setTokenMultiplier({
      abi: quizGameABI,
      address: contractAddresses.quizGameContractAddress as `0x${string}`,
      functionName: 'setTokenMultiplier',
      args: [multiplierValue],
      chainId: chain?.id,
    });
  };

  const handleSetDefaultEntryPrice = () => {
    if (!isConnected || !newDefaultEntryPrice || !contractAddresses) return;
    
    const priceValue = parseEther(newDefaultEntryPrice);
    if (priceValue <= 0) return;
    
    resetSetDefaultEntryPrice();
    setDefaultEntryPrice({
      abi: quizGameABI,
      address: contractAddresses.quizGameContractAddress as `0x${string}`,
      functionName: 'setDefaultEntryPrice',
      args: [priceValue],
      chainId: chain?.id,
    });
  };

  // Calculate token rewards
  const calculateTokenRewards = () => {
    const currentMultiplier = tokenMultiplier ? Number(tokenMultiplier) : 1000;
    const initialTokens = selectedAmount * currentMultiplier;
    const bonusTokens = initialTokens * 0.2; // 20% fixed bonus
    const totalWithBonus = initialTokens + bonusTokens;
    
    return {
      initialTokens,
      bonusTokens,
      totalWithBonus,
      currentMultiplier
    };
  };

  const rewards = calculateTokenRewards();

  if (!isConnected) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "hsl(var(--background))",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "3rem",
          textAlign: "center",
          maxWidth: "600px",
          width: "100%",
          boxShadow: "var(--shadow-card)",
          border: "1px solid hsl(var(--border))"
        }}>
          <h2 style={{ fontSize: "1.75rem", marginBottom: "2rem", color: "#111827", fontWeight: 800 }}>
            Connect Wallet to Debug Contract
          </h2>
          
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => connect({ connector })}
                style={{
                  backgroundColor: "#58CC02",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "1rem 2rem",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#46a001";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#58CC02";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Connect {connector.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // if (!isCorrectChain) {
  //   return (
  //     <div style={{
  //       minHeight: "100vh",
  //       background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  //       padding: "2rem",
  //       display: "flex",
  //       flexDirection: "column",
  //       alignItems: "center",
  //       justifyContent: "center"
  //     }}>
  //       <Header 
  //         title="🔧 Contract Debug"
  //         subtitle="Debug and test smart contract functions"
  //         showBackButton={true}
  //         backTo="/"
  //         backText="← Back to Home"
  //       />
        
  //       <div style={{
  //         background: "rgba(255, 255, 255, 0.95)",
  //         borderRadius: "16px",
  //         padding: "3rem",
  //         textAlign: "center",
  //         maxWidth: "600px",
  //         width: "100%",
  //         boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
  //       }}>
  //         <h2 style={{ fontSize: "2rem", marginBottom: "2rem", color: "#ef4444" }}>
  //           ⚠️ Wrong Network
  //         </h2>
  //         <p style={{ fontSize: "1.2rem", marginBottom: "2rem", color: "#6b7280" }}>
  //           Please switch to one of the supported networks to debug the contract.
  //         </p>
  //         <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "2rem" }}>
  //           <button
  //                             onClick={() => switchChain({ chainId: coreTestnet.id })}
  //             style={{
  //               backgroundColor: "#667eea",
  //               color: "white",
  //               border: "none",
  //               borderRadius: "12px",
  //               padding: "1rem 2rem",
  //               fontSize: "1rem",
  //               fontWeight: "600",
  //               cursor: "pointer",
  //               boxShadow: "0 4px 6px rgba(102, 126, 234, 0.3)"
  //             }}
  //           >
  //                             Switch to Core Testnet
  //           </button>
  //           <button
  //                             // Only Core Testnet is supported now
  //             style={{
  //               backgroundColor: "#22c55e",
  //               color: "white",
  //               border: "none",
  //               borderRadius: "12px",
  //               padding: "1rem 2rem",
  //               fontSize: "1rem",
  //               fontWeight: "600",
  //               cursor: "pointer",
  //               boxShadow: "0 4px 6px rgba(34, 197, 94, 0.3)"
  //             }}
  //           >
  //                             // Only Core Testnet is supported
  //           </button>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <motion.div style={{
      minHeight: "100vh",
      background: "hsl(var(--background))",
      padding: "2rem"
    }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
        gap: "2rem"
      }}>
        {/* Contract Info */}
        <motion.div style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "2rem",
          boxShadow: "var(--shadow-card)",
          border: "1px solid hsl(var(--border))"
        }} initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "#1f2937" }}>
            📋 Contract Information
          </h3>
          
          <div style={{ marginBottom: "1rem" }}>
            <strong>Current Chain:</strong>
            <p style={{ 
              fontFamily: "monospace", 
              fontSize: "0.9rem", 
              color: "#374151",
              backgroundColor: "#f9fafb",
              padding: "0.5rem",
              borderRadius: "6px"
            }}>
              {chain?.name} (ID: {chain?.id})
            </p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong>🎮 QuizGame Contract (Main Contract):</strong>
            <p style={{ 
              fontFamily: "monospace", 
              fontSize: "0.9rem", 
              color: "#374151",
              backgroundColor: "#dbeafe",
              padding: "0.5rem",
              borderRadius: "6px",
              wordBreak: "break-all",
              border: "1px solid #3b82f6"
            }}>
              {contractAddresses?.quizGameContractAddress || 'Connect wallet to view'}
            </p>
            <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: "0.25rem 0 0 0" }}>
              Handles quiz logic, ETH payments, and token minting
            </p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong>🪙 Token1 Contract (Soulbound Token):</strong>
            <p style={{ 
              fontFamily: "monospace", 
              fontSize: "0.9rem", 
              color: "#374151",
              backgroundColor: "#dcfce7",
              padding: "0.5rem",
              borderRadius: "6px",
              wordBreak: "break-all",
              border: "1px solid #10b981"
            }}>
              {contractAddresses?.token1ContractAddress || 'Connect wallet to view'}
            </p>
            <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: "0.25rem 0 0 0" }}>
              Soulbound ERC20 token, only minted by QuizGame owner
            </p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong>Connected Wallet:</strong>
            <p style={{ 
              fontFamily: "monospace", 
              fontSize: "0.9rem", 
              color: "#374151",
              backgroundColor: "#f9fafb",
              padding: "0.5rem",
              borderRadius: "6px"
            }}>
              {address}
            </p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong>Wallet Balance:</strong>
            <p style={{ 
              fontFamily: "monospace", 
              fontSize: "0.9rem", 
              color: "#374151",
              backgroundColor: "#f9fafb",
              padding: "0.5rem",
              borderRadius: "6px"
            }}>
              {balance ? formatEther(balance.value) : "Loading..."} {currencyConfig.symbol}
            </p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong>🎮 QuizGame Owner:</strong>
            <p style={{ 
              fontFamily: "monospace", 
              fontSize: "0.9rem", 
              color: "#374151",
              backgroundColor: "#dbeafe",
              padding: "0.5rem",
              borderRadius: "6px",
              border: "1px solid #3b82f6"
            }}>
              {owner ? String(owner) : "Loading..."}
            </p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong>🪙 Token1 Owner:</strong>
            <p style={{ 
              fontFamily: "monospace", 
              fontSize: "0.9rem", 
              color: "#374151",
              backgroundColor: "#dcfce7",
              padding: "0.5rem",
              borderRadius: "6px",
              border: "1px solid #10b981"
            }}>
              {token1Owner ? String(token1Owner) : "Loading..."}
            </p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong>Token Address:</strong>
            <p style={{ 
              fontFamily: "monospace", 
              fontSize: "0.9rem", 
              color: "#374151",
              backgroundColor: "#f9fafb",
              padding: "0.5rem",
              borderRadius: "6px"
            }}>
              {tokenAddress ? String(tokenAddress) : "Loading..."}
            </p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong>Vault Address:</strong>
            <p style={{ 
              fontFamily: "monospace", 
              fontSize: "0.9rem", 
              color: "#374151",
              backgroundColor: "#f9fafb",
              padding: "0.5rem",
              borderRadius: "6px"
            }}>
              {vaultAddress ? String(vaultAddress) : "Loading..."}
            </p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong>🪙 Token Multiplier:</strong>
            <p style={{ 
              fontFamily: "monospace", 
              fontSize: "0.9rem", 
              color: "#374151",
              backgroundColor: "#fef3c7",
              padding: "0.5rem",
              borderRadius: "6px",
              border: "1px solid #f59e0b"
            }}>
              {tokenMultiplier ? `${Number(tokenMultiplier)}x` : "Loading..."}
            </p>
            <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: "0.25rem 0 0 0" }}>
              ETH amount × multiplier = initial tokens minted
            </p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong>💰 Default Entry Price:</strong>
            <p style={{ 
              fontFamily: "monospace", 
              fontSize: "0.9rem", 
              color: "#374151",
              backgroundColor: "#f0f9ff",
              padding: "0.5rem",
              borderRadius: "6px",
              border: "1px solid #0ea5e9"
            }}>
              {defaultEntryPrice ? `${formatEther(defaultEntryPrice)} ${currencyConfig.symbol}` : "Loading..."}
            </p>
            <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: "0.25rem 0 0 0" }}>
              Default price users pay to start a quiz
            </p>
          </div>

          <button
            onClick={handleRefetchAll}
            style={{
              backgroundColor: "#58CC02",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "0.5rem 1rem",
              fontSize: "0.9rem",
              cursor: "pointer",
              marginTop: "1rem",
              fontWeight: 700
            }}
          >
            🔄 Refresh Data
          </button>
        </motion.div>

        {/* Token Rewards Calculator */}
        <motion.div style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "2rem",
          boxShadow: "var(--shadow-card)",
          border: "1px solid hsl(var(--border))"
        }} initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "#1f2937" }}>
            🪙 Token Rewards Calculator
          </h3>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
              Entry Amount ({currencyConfig.symbol}):
            </label>
            <input
              type="number"
              step="0.001"
              value={selectedAmount}
              onChange={(e) => setSelectedAmount(parseFloat(e.target.value) || 0)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "2px solid hsl(var(--border))",
                fontSize: "1rem"
              }}
            />
          </div>

          <div style={{ 
            background: "#f0fdf4", 
            border: "2px solid #22c55e", 
            borderRadius: "12px", 
            padding: "1rem",
            marginBottom: "1rem"
          }}>
            <h4 style={{ margin: "0 0 0.5rem 0", color: "#0c4a6e", fontSize: "1.1rem" }}>
              💰 Reward Breakdown
            </h4>
            <div style={{ fontSize: "0.9rem", color: "#0c4a6e" }}>
              <p style={{ margin: "0.25rem 0" }}>
                <strong>Initial Tokens:</strong> {rewards.initialTokens.toFixed(2)} TK1 ({rewards.currentMultiplier}x entry)
              </p>
              <p style={{ margin: "0.25rem 0" }}>
                <strong>Bonus (if correct):</strong> {rewards.bonusTokens.toFixed(2)} TK1 (20% fixed)
              </p>
              <p style={{ margin: "0.25rem 0" }}>
                <strong>Total (if correct):</strong> {rewards.totalWithBonus.toFixed(2)} TK1
              </p>
            </div>
          </div>

          <div style={{ 
            background: "#ecfeff", 
            border: "2px solid #06b6d4", 
            borderRadius: "12px", 
            padding: "1rem"
          }}>
            <h4 style={{ margin: "0 0 0.5rem 0", color: "#155e75", fontSize: "1.1rem" }}>
              🎯 How It Works
            </h4>
            <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.9rem", color: "#155e75" }}>
              <li>Pay {currencyConfig.symbol} to start quiz</li>
              <li>Get {rewards.currentMultiplier}x tokens immediately</li>
              <li>Answer correctly for 20% bonus</li>
              <li>Keep initial tokens even if wrong!</li>
              <li>Starting new quiz auto-completes previous one</li>
            </ul>
          </div>
        </motion.div>

        {/* QuizGame Contract Functions */}
        <motion.div style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "2rem",
          boxShadow: "var(--shadow-card)",
          border: "2px solid #3b82f6"
        }} initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
          <div style={{
            background: "#3b82f6",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            textAlign: "center",
            fontWeight: "700"
          }}>
            🎮 QuizGame Contract Functions
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
              Amount ({currencyConfig.symbol}):
            </label>
            <input
              type="number"
              step="0.001"
              value={selectedAmount}
              onChange={(e) => setSelectedAmount(parseFloat(e.target.value) || 0)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "2px solid hsl(var(--border))",
                fontSize: "1rem"
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
              User Answer:
            </label>
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(parseInt(e.target.value) || 0)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "2px solid hsl(var(--border))",
                fontSize: "1rem"
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
              Expected Correct Answers:
            </label>
            <input
              type="number"
              value={expectedCorrectAnswers}
              onChange={(e) => setExpectedCorrectAnswers(parseInt(e.target.value) || 0)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "2px solid hsl(var(--border))",
                fontSize: "1rem"
              }}
            />
          </div>

          <button
            onClick={handleStartQuiz}
            disabled={isStartPending || isStartConfirming}
            style={{
              backgroundColor: isStartPending || isStartConfirming ? "#a3e635" : "#58CC02",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              fontSize: "1rem",
              cursor: isStartPending || isStartConfirming ? "not-allowed" : "pointer",
              width: "100%",
              marginBottom: "1rem",
              fontWeight: 700
            }}
          >
            {isStartPending ? "Confirming..." : isStartConfirming ? "Starting Quiz..." : "🚀 Start Quiz"}
          </button>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
              Submitted Answer:
            </label>
            <input
              type="number"
              value={submittedAnswer}
              onChange={(e) => setSubmittedAnswer(parseInt(e.target.value) || 0)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "2px solid hsl(var(--border))",
                fontSize: "1rem"
              }}
            />
          </div>

          <button
            onClick={handleCompleteQuiz}
            disabled={isCompletePending || isCompleteConfirming}
            style={{
              backgroundColor: isCompletePending || isCompleteConfirming ? "#a3e635" : "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              fontSize: "1rem",
              cursor: isCompletePending || isCompleteConfirming ? "not-allowed" : "pointer",
              width: "100%",
              marginBottom: "1rem",
              fontWeight: 700
            }}
          >
            {isCompletePending ? "Confirming..." : isCompleteConfirming ? "Completing Quiz..." : "✅ Complete Quiz"}
          </button>
        </motion.div>

        {/* QuizGame Admin Functions */}
        <motion.div style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "16px",
          padding: "2rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          border: "2px solid #f59e0b"
        }} initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <div style={{
            background: "#f59e0b",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            textAlign: "center",
            fontWeight: "700"
          }}>
            👑 QuizGame Admin Functions
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
              🪙 Mint Token1 Tokens
            </label>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <input
                type="text"
                placeholder="Destination address (0x...)"
                value={mintTokenAddress}
                onChange={(e) => setMintTokenAddress(e.target.value)}
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "2px solid hsl(var(--border))",
                  fontSize: "1rem"
                }}
              />
              <button
                onClick={() => setMintTokenAddress(address || '')}
                disabled={!address}
                style={{
                  backgroundColor: address ? "#3b82f6" : "#9ca3af",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.75rem 1rem",
                  fontSize: "0.9rem",
                  cursor: address ? "pointer" : "not-allowed",
                  fontWeight: 600,
                  whiteSpace: "nowrap"
                }}
              >
                Use My Address
              </button>
            </div>
            <input
              type="number"
              step="0.001"
              placeholder="Amount to mint (e.g., 100)"
              value={mintTokenAmount}
              onChange={(e) => setMintTokenAmount(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "2px solid hsl(var(--border))",
                fontSize: "1rem",
                marginBottom: "0.5rem"
              }}
            />
            <button
              onClick={handleMintToken}
              disabled={isMintTokenPending || isMintTokenConfirming || !mintTokenAddress || !mintTokenAmount}
              style={{
                backgroundColor: isMintTokenPending || isMintTokenConfirming || !mintTokenAddress || !mintTokenAmount ? "#9ca3af" : "#f59e0b",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                fontSize: "1rem",
                cursor: isMintTokenPending || isMintTokenConfirming || !mintTokenAddress || !mintTokenAmount ? "not-allowed" : "pointer",
                width: "100%",
                fontWeight: 700
              }}
            >
              {isMintTokenPending ? "Confirming..." : isMintTokenConfirming ? "Minting Tokens..." : "🪙 Mint Token1 Tokens"}
            </button>
            <div style={{ 
              background: "#fef3c7", 
              border: "2px solid #f59e0b", 
              borderRadius: "8px", 
              padding: "0.75rem",
              marginTop: "0.5rem"
            }}>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#92400e" }}>
                <strong>ℹ️ Note:</strong> Only the QuizGame contract owner can mint Token1 tokens. This function mints tokens directly to the specified address.
              </p>
            </div>
          </div>

          <button
            onClick={handleWithdraw}
            disabled={isWithdrawPending || isWithdrawConfirming}
            style={{
              backgroundColor: isWithdrawPending || isWithdrawConfirming ? "#9ca3af" : "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              fontSize: "1rem",
              cursor: isWithdrawPending || isWithdrawConfirming ? "not-allowed" : "pointer",
              width: "100%",
              marginBottom: "1rem"
            }}
          >
            {isWithdrawPending ? "Confirming..." : isWithdrawConfirming ? "Withdrawing..." : "💸 Withdraw Funds"}
          </button>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
              🔐 Ownership Transfer
            </label>
            <input
              type="text"
              placeholder="New owner address (0x...)"
              value={newOwnerAddress}
              onChange={(e) => setNewOwnerAddress(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "2px solid hsl(var(--border))",
                fontSize: "1rem",
                marginBottom: "0.5rem"
              }}
            />
            
            <button
              onClick={handleTransferOwnership}
              disabled={isTransferOwnershipPending || isTransferOwnershipConfirming || !newOwnerAddress}
              style={{
                backgroundColor: isTransferOwnershipPending || isTransferOwnershipConfirming || !newOwnerAddress ? "#9ca3af" : "#8b5cf6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                fontSize: "1rem",
                cursor: isTransferOwnershipPending || isTransferOwnershipConfirming || !newOwnerAddress ? "not-allowed" : "pointer",
                width: "100%",
                marginBottom: "0.5rem",
                fontWeight: 700
              }}
            >
              {isTransferOwnershipPending ? "Confirming..." : isTransferOwnershipConfirming ? "Transferring..." : "👑 Transfer Ownership"}
            </button>
            
            <button
              onClick={handleRenounceOwnership}
              disabled={isRenounceOwnershipPending || isRenounceOwnershipConfirming}
              style={{
                backgroundColor: isRenounceOwnershipPending || isRenounceOwnershipConfirming ? "#9ca3af" : "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                fontSize: "1rem",
                cursor: isRenounceOwnershipPending || isRenounceOwnershipConfirming ? "not-allowed" : "pointer",
                width: "100%",
                fontWeight: 700
              }}
            >
              {isRenounceOwnershipPending ? "Confirming..." : isRenounceOwnershipConfirming ? "Renouncing..." : "🚫 Renounce Ownership"}
            </button>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
              🏦 Vault Address Management
            </label>
            <input
              type="text"
              placeholder="New vault address (0x...)"
              value={newVaultAddress}
              onChange={(e) => setNewVaultAddress(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "2px solid hsl(var(--border))",
                fontSize: "1rem",
                marginBottom: "0.5rem"
              }}
            />
            
            <button
              onClick={handleSetVaultAddress}
              disabled={isSetVaultAddressPending || isSetVaultAddressConfirming || !newVaultAddress}
              style={{
                backgroundColor: isSetVaultAddressPending || isSetVaultAddressConfirming || !newVaultAddress ? "#9ca3af" : "#059669",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                fontSize: "1rem",
                cursor: isSetVaultAddressPending || isSetVaultAddressConfirming || !newVaultAddress ? "not-allowed" : "pointer",
                width: "100%",
                fontWeight: 700
              }}
            >
              {isSetVaultAddressPending ? "Confirming..." : isSetVaultAddressConfirming ? "Setting Vault..." : "🏦 Set Vault Address"}
            </button>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
              🪙 Token1 Ownership Transfer
            </label>
            <input
              type="text"
              placeholder="New Token1 owner address (0x...)"
              value={newTokenOwnerAddress}
              onChange={(e) => setNewTokenOwnerAddress(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "2px solid hsl(var(--border))",
                fontSize: "1rem",
                marginBottom: "0.5rem"
              }}
            />
            
            <button
              onClick={handleTransferTokenOwnership}
              disabled={isTransferTokenOwnershipPending || isTransferTokenOwnershipConfirming || !newTokenOwnerAddress}
              style={{
                backgroundColor: isTransferTokenOwnershipPending || isTransferTokenOwnershipConfirming || !newTokenOwnerAddress ? "#9ca3af" : "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                fontSize: "1rem",
                cursor: isTransferTokenOwnershipPending || isTransferTokenOwnershipConfirming || !newTokenOwnerAddress ? "not-allowed" : "pointer",
                width: "100%",
                fontWeight: 700
              }}
            >
              {isTransferTokenOwnershipPending ? "Confirming..." : isTransferTokenOwnershipConfirming ? "Transferring Token1..." : "🪙 Transfer Token1 Ownership"}
            </button>
            
            <div style={{ 
              background: "#fef3c7", 
              border: "2px solid #f59e0b", 
              borderRadius: "8px", 
              padding: "0.75rem",
              marginTop: "0.5rem"
            }}>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#92400e" }}>
                <strong>⚠️ Use Case:</strong> Transfer Token1 ownership to a new QuizGame contract when deploying an updated version.
              </p>
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
              🔢 Token Multiplier Management
            </label>
            <input
              type="number"
              placeholder="New token multiplier (e.g., 1000)"
              value={newTokenMultiplier}
              onChange={(e) => setNewTokenMultiplier(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "2px solid hsl(var(--border))",
                fontSize: "1rem",
                marginBottom: "0.5rem"
              }}
            />
            
            <button
              onClick={handleSetTokenMultiplier}
              disabled={isSetTokenMultiplierPending || isSetTokenMultiplierConfirming || !newTokenMultiplier}
              style={{
                backgroundColor: isSetTokenMultiplierPending || isSetTokenMultiplierConfirming || !newTokenMultiplier ? "#9ca3af" : "#8b5cf6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                fontSize: "1rem",
                cursor: isSetTokenMultiplierPending || isSetTokenMultiplierConfirming || !newTokenMultiplier ? "not-allowed" : "pointer",
                width: "100%",
                fontWeight: 700
              }}
            >
              {isSetTokenMultiplierPending ? "Confirming..." : isSetTokenMultiplierConfirming ? "Setting Multiplier..." : "🔢 Set Token Multiplier"}
            </button>
            
            <div style={{ 
              background: "#f0f9ff", 
              border: "2px solid #0ea5e9", 
              borderRadius: "8px", 
              padding: "0.75rem",
              marginTop: "0.5rem"
            }}>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#0c4a6e" }}>
                <strong>ℹ️ Current Multiplier:</strong> {tokenMultiplier ? `${Number(tokenMultiplier)}x` : "Loading..."} - ETH amount × multiplier = initial tokens minted
              </p>
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
              💰 Default Entry Price Management
            </label>
            <input
              type="number"
              step="0.00001"
              placeholder="New default entry price (e.g., 0.00005)"
              value={newDefaultEntryPrice}
              onChange={(e) => setNewDefaultEntryPrice(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "2px solid hsl(var(--border))",
                fontSize: "1rem",
                marginBottom: "0.5rem"
              }}
            />
            
            <button
              onClick={handleSetDefaultEntryPrice}
              disabled={isSetDefaultEntryPricePending || isSetDefaultEntryPriceConfirming || !newDefaultEntryPrice}
              style={{
                backgroundColor: isSetDefaultEntryPricePending || isSetDefaultEntryPriceConfirming || !newDefaultEntryPrice ? "#9ca3af" : "#0ea5e9",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                fontSize: "1rem",
                cursor: isSetDefaultEntryPricePending || isSetDefaultEntryPriceConfirming || !newDefaultEntryPrice ? "not-allowed" : "pointer",
                width: "100%",
                fontWeight: 700
              }}
            >
              {isSetDefaultEntryPricePending ? "Confirming..." : isSetDefaultEntryPriceConfirming ? "Setting Entry Price..." : "💰 Set Default Entry Price"}
            </button>
            
            <div style={{ 
              background: "#f0f9ff", 
              border: "2px solid #0ea5e9", 
              borderRadius: "8px", 
              padding: "0.75rem",
              marginTop: "0.5rem"
            }}>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#0c4a6e" }}>
                <strong>ℹ️ Current Entry Price:</strong> {defaultEntryPrice ? `${formatEther(defaultEntryPrice)} ${currencyConfig.symbol}` : "Loading..."} - Default price users pay to start quizzes
              </p>
            </div>
          </div>
        </motion.div>

        {/* Token1 Contract Functions */}
        <motion.div style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "2rem",
          boxShadow: "var(--shadow-card)",
          border: "2px solid #10b981"
        }} initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
          <div style={{
            background: "#10b981",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            textAlign: "center",
            fontWeight: "700"
          }}>
            🪙 Token1 Contract Functions
          </div>

          <div style={{ 
            background: "#f0fdf4", 
            border: "2px solid #10b981", 
            borderRadius: "12px", 
            padding: "1rem",
            marginBottom: "1rem"
          }}>
            <h4 style={{ margin: "0 0 0.5rem 0", color: "#065f46", fontSize: "1.1rem" }}>
              ℹ️ Token1 Contract Info
            </h4>
            <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.9rem", color: "#065f46" }}>
              <li>Soulbound token (non-transferable)</li>
              <li>Only QuizGame contract can mint tokens</li>
              <li>No direct user interactions available</li>
              <li>All token operations go through QuizGame</li>
            </ul>
          </div>

          <div style={{ 
            background: "#fef3c7", 
            border: "2px solid #f59e0b", 
            borderRadius: "12px", 
            padding: "1rem"
          }}>
            <h4 style={{ margin: "0 0 0.5rem 0", color: "#92400e", fontSize: "1.1rem" }}>
              ⚠️ Note
            </h4>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#92400e" }}>
              Token1 is a soulbound token that can only be minted by the QuizGame contract owner. 
              Users cannot directly interact with Token1 - all token operations happen through QuizGame functions.
            </p>
          </div>
        </motion.div>

        {/* User Session */}
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "2rem",
          boxShadow: "var(--shadow-card)",
          border: "1px solid hsl(var(--border))"
        }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "#1f2937" }}>
            👤 User Session
          </h3>

          {userSession ? (
            <div>
              <div style={{ marginBottom: "1rem" }}>
                <strong>Active:</strong> {(userSession as any).active ? "✅ Yes" : "❌ No"}
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <strong>Quiz ID:</strong> {(userSession as any).quizId || "N/A"}
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <strong>User Answer:</strong> {(userSession as any).userAnswer?.toString() || "N/A"}
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <strong>Expected Correct Answers:</strong> {(userSession as any).correctAnswers?.toString() || "N/A"}
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <strong>Amount Paid:</strong> {(userSession as any).amountPaid ? formatEther((userSession as any).amountPaid) : "0"} {currencyConfig.symbol}
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <strong>Initial Tokens:</strong> {(userSession as any).amountPaid ? formatEther((userSession as any).amountPaid * BigInt(1000)) : "0"} TK1
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <strong>Timestamp:</strong> {(userSession as any).timestamp ? new Date(Number((userSession as any).timestamp) * 1000).toLocaleString() : "N/A"}
              </div>
            </div>
          ) : (
            <p style={{ color: "#6b7280" }}>No active session found</p>
          )}
        </div>
      </div>

      {/* Transaction Status */}
      {(isStartPending || isStartConfirming || isCompletePending || isCompleteConfirming || 
        isWithdrawPending || isWithdrawConfirming || isMintTokenPending || isMintTokenConfirming ||
        isTransferOwnershipPending || isTransferOwnershipConfirming || isRenounceOwnershipPending || isRenounceOwnershipConfirming ||
        isSetVaultAddressPending || isSetVaultAddressConfirming || isTransferTokenOwnershipPending || isTransferTokenOwnershipConfirming ||
        isSetTokenMultiplierPending || isSetTokenMultiplierConfirming || isSetDefaultEntryPricePending || isSetDefaultEntryPriceConfirming) && (
        <div style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          background: "#ecfeff",
          border: "1px solid #06b6d4",
          borderRadius: "12px",
          padding: "1rem",
          maxWidth: "400px",
          boxShadow: "0 8px 16px rgba(0,0,0,0.1)"
        }}>
          <p style={{ margin: "0 0 0.5rem 0", color: "#92400e", fontWeight: "600" }}>
            🔄 Transaction in Progress
          </p>
          <p style={{ margin: 0, color: "#92400e", fontSize: "0.9rem" }}>
            {isStartPending || isStartConfirming ? "QuizGame: Starting quiz..." :
             isCompletePending || isCompleteConfirming ? "QuizGame: Completing quiz..." :
             isWithdrawPending || isWithdrawConfirming ? "QuizGame: Withdrawing funds..." :
             isMintTokenPending || isMintTokenConfirming ? "QuizGame: Minting tokens to Token1..." :
             isTransferOwnershipPending || isTransferOwnershipConfirming ? "QuizGame: Transferring ownership..." :
             isRenounceOwnershipPending || isRenounceOwnershipConfirming ? "QuizGame: Renouncing ownership..." :
             isSetVaultAddressPending || isSetVaultAddressConfirming ? "QuizGame: Setting vault address..." :
             isTransferTokenOwnershipPending || isTransferTokenOwnershipConfirming ? "QuizGame: Transferring Token1 ownership..." :
             isSetTokenMultiplierPending || isSetTokenMultiplierConfirming ? "QuizGame: Setting token multiplier..." :
             isSetDefaultEntryPricePending || isSetDefaultEntryPriceConfirming ? "QuizGame: Setting default entry price..." : ""}
          </p>
        </div>
      )}

      {/* Error Messages */}
      {(startError || completeError || withdrawError || mintTokenError || transferOwnershipError || renounceOwnershipError || setVaultAddressError || transferTokenOwnershipError || setTokenMultiplierError || setDefaultEntryPriceError) && (
        <div style={{
          position: "fixed",
          bottom: "2rem",
          left: "2rem",
          background: "#fef2f2",
          border: "1px solid #ef4444",
          borderRadius: "12px",
          padding: "1rem",
          maxWidth: "400px",
          boxShadow: "0 8px 16px rgba(0,0,0,0.1)"
        }}>
          <p style={{ margin: "0 0 0.5rem 0", color: "#991b1b", fontWeight: "600" }}>
            ❌ Transaction Error
          </p>
          <p style={{ margin: 0, color: "#991b1b", fontSize: "0.9rem" }}>
            {startError?.message || completeError?.message || withdrawError?.message || mintTokenError?.message || 
             transferOwnershipError?.message || renounceOwnershipError?.message || setVaultAddressError?.message || transferTokenOwnershipError?.message || setTokenMultiplierError?.message || setDefaultEntryPriceError?.message}
          </p>
        </div>
      )}

      {/* Success Messages */}
      {(isStartConfirmed || isCompleteConfirmed || isWithdrawConfirmed || isMintTokenConfirmed || 
        isTransferOwnershipConfirmed || isRenounceOwnershipConfirmed || isSetVaultAddressConfirmed || isTransferTokenOwnershipConfirmed || isSetTokenMultiplierConfirmed || isSetDefaultEntryPriceConfirmed) && (
        <div style={{
          position: "fixed",
          bottom: "2rem",
          left: "2rem",
          background: "#ecfdf5",
          border: "1px solid #10b981",
          borderRadius: "12px",
          padding: "1rem",
          maxWidth: "400px",
          boxShadow: "0 8px 16px rgba(0,0,0,0.1)"
        }}>
          <p style={{ margin: "0 0 0.5rem 0", color: "#065f46", fontWeight: "600" }}>
            ✅ Transaction Successful
          </p>
          <p style={{ margin: 0, color: "#065f46", fontSize: "0.9rem" }}>
            {isStartConfirmed ? "QuizGame: Quiz started successfully! Tokens minted!" :
             isCompleteConfirmed ? "QuizGame: Quiz completed successfully! Bonus tokens minted!" :
             isWithdrawConfirmed ? "QuizGame: Funds withdrawn successfully!" :
             isMintTokenConfirmed ? "QuizGame: Tokens minted to Token1 successfully!" :
             isTransferOwnershipConfirmed ? "QuizGame: Ownership transferred successfully!" :
             isRenounceOwnershipConfirmed ? "QuizGame: Ownership renounced successfully!" :
             isSetVaultAddressConfirmed ? "QuizGame: Vault address updated successfully!" :
             isTransferTokenOwnershipConfirmed ? "QuizGame: Token1 ownership transferred successfully!" :
             isSetTokenMultiplierConfirmed ? "QuizGame: Token multiplier updated successfully!" :
             isSetDefaultEntryPriceConfirmed ? "QuizGame: Default entry price updated successfully!" : ""}
          </p>
        </div>
      )}
    </motion.div>
  );
}

export const Route = createFileRoute('/contract')({
  component: ContractDebugPage,
}) 