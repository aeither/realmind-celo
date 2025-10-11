/**
 * Divvi Referral SDK Integration
 * Provides referral tracking for blockchain transactions
 */

import { getReferralTag, submitReferral } from '@divvi/referral-sdk'
import { toast } from 'sonner'

// Your Divvi consumer address
export const DIVVI_CONSUMER_ADDRESS = '0x8e7eBE53b6ad215E395f3f17d43C3b75062DfDa1'

/**
 * Get the referral tag to append to transaction data
 * @param userAddress - The address of the user making the transaction
 * @returns The referral tag hex string (without 0x prefix)
 */
export function getDivviReferralTag(userAddress: string): string {
  try {
    const tag = getReferralTag({
      user: userAddress as `0x${string}`,
      consumer: DIVVI_CONSUMER_ADDRESS,
    })
    return tag
  } catch (error) {
    console.error('Failed to generate Divvi referral tag:', error)
    // Return empty string to not break transactions if referral fails
    return ''
  }
}

/**
 * Submit a transaction to Divvi for referral tracking
 * @param txHash - The transaction hash
 * @param chainId - The chain ID where the transaction was made
 */
export async function submitDivviReferral(
  txHash: string,
  chainId: number
): Promise<void> {
  try {
    await submitReferral({
      txHash: txHash as `0x${string}`,
      chainId,
    })
    console.log('✅ Divvi referral submitted successfully:', txHash)
  } catch (error) {
    // Don't show error toast to user, just log it
    // Referral tracking should not impact user experience
    console.error('Failed to submit Divvi referral:', error)
  }
}

/**
 * Helper to get referral data suffix for viem writeContract calls
 * @param userAddress - The address of the user making the transaction
 * @returns The data suffix with 0x prefix
 */
export function getDivviDataSuffix(userAddress: string): `0x${string}` {
  const tag = getDivviReferralTag(userAddress)
  return tag ? `0x${tag}` : '0x'
}

