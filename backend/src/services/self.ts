import { SelfBackendVerifier, DefaultConfigStore, ATTESTATION_ID } from '@selfxyz/core';
import { ethers } from 'ethers';

export interface SelfVerificationRequest {
  proof: any;
  pubSignals: any[];
  attestationId: number;
  userId: string;
  scope: string;
  userDefinedData?: string;
}

export interface SelfVerificationResponse {
  success: boolean;
  verified: boolean;
  error?: string;
  data?: {
    userId: string;
    verified: boolean;
    timestamp: string;
    disclosures?: {
      minimumAge?: number;
      nationality?: string;
      gender?: string;
      dateOfBirth?: string;
      name?: string;
      issuingState?: string;
    };
  };
}

export class SelfService {
  private appName: string;
  private scope: string;
  private endpoint: string;
  private verifier: SelfBackendVerifier | null = null;

  constructor() {
    this.appName = process.env.SELF_APP_NAME || 'Realmind Celo';
    this.scope = process.env.SELF_SCOPE || 'realmind-celo';
    // Use Celo mainnet RPC for Self Protocol verification
    // For staging, Self Protocol uses their own testnet
    // For production, use Celo mainnet: https://forno.celo.org
    this.endpoint = process.env.SELF_RPC_ENDPOINT || 'https://forno.celo.org';

    console.log('[SelfService] Initialized with:', {
      appName: this.appName,
      scope: this.scope,
      endpoint: this.endpoint
    });
  }

  /**
   * Initialize the Self Protocol verifier
   */
  private async initializeVerifier(): Promise<void> {
    if (this.verifier) return;

    try {
      // Create config store with verification requirements
      const configStore = new DefaultConfigStore({
        minimumAge: 18,
        excludedCountries: [], // Can be configured via env
        ofac: true, // OFAC check enabled
      });

      // Initialize the backend verifier
      this.verifier = new SelfBackendVerifier(
        this.scope,
        this.endpoint,
        false, // mockPassport - set to false for production
        new Map([[ATTESTATION_ID.PASSPORT, true], [ATTESTATION_ID.BIOMETRIC_ID_CARD, true]]), // Allowed IDs
        configStore,
        'hex' // userIdentifierType - 'hex' for EVM addresses
      );

      console.log('[SelfService] Self Protocol verifier initialized');
    } catch (error) {
      console.error('[SelfService] Failed to initialize verifier:', error);
      throw error;
    }
  }

  /**
   * Verify a Self Protocol proof
   * @param request The verification request containing proof and user data
   * @returns Verification response with success status and user data
   */
  async verifyUserProof(request: SelfVerificationRequest): Promise<SelfVerificationResponse> {
    try {
      console.log('[SelfService] Starting verification for userId:', request.userId);

      // Validate input
      if (!request.proof) {
        return {
          success: false,
          verified: false,
          error: 'Proof is required'
        };
      }

      if (!request.pubSignals) {
        return {
          success: false,
          verified: false,
          error: 'Public signals are required'
        };
      }

      if (!request.attestationId) {
        return {
          success: false,
          verified: false,
          error: 'Attestation ID is required'
        };
      }

      if (!request.userId) {
        return {
          success: false,
          verified: false,
          error: 'User ID is required'
        };
      }

      if (!request.scope || request.scope !== this.scope) {
        return {
          success: false,
          verified: false,
          error: 'Invalid scope'
        };
      }

      // Initialize verifier if not already done
      await this.initializeVerifier();

      if (!this.verifier) {
        return {
          success: false,
          verified: false,
          error: 'Verifier not initialized'
        };
      }

      // Verify the proof using Self Protocol
      console.log('[SelfService] Verifying proof with Self Protocol');

      const verificationResult = await this.verifier.verify(
        request.attestationId as 1 | 2 | 3,
        request.proof,
        request.pubSignals,
        request.userDefinedData || ''
      );

      console.log('[SelfService] Verification result:', verificationResult);

      // Check if verification passed all requirements
      const isValid = verificationResult.isValidDetails.isValid;

      if (!isValid) {
        return {
          success: true,
          verified: false,
          error: 'Verification failed - proof invalid or requirements not met'
        };
      }

      // Extract the actual user identifier from the verification result
      const actualUserId = verificationResult.userData.userIdentifier || request.userId;

      console.log('[SelfService] Extracted user identifier from proof:', actualUserId);

      // Extract disclosed data
      const disclosures = {
        minimumAge: parseInt(verificationResult.discloseOutput.minimumAge),
        nationality: verificationResult.discloseOutput.nationality,
        gender: verificationResult.discloseOutput.gender,
        dateOfBirth: verificationResult.discloseOutput.dateOfBirth,
        name: verificationResult.discloseOutput.name,
        issuingState: verificationResult.discloseOutput.issuingState,
      };

      console.log('[SelfService] Verification successful for userId:', actualUserId);

      return {
        success: true,
        verified: true,
        data: {
          userId: actualUserId,
          verified: true,
          timestamp: new Date().toISOString(),
          disclosures,
        }
      };

    } catch (error) {
      console.error('[SelfService] Verification error:', error);

      return {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown verification error'
      };
    }
  }

  /**
   * Health check for Self Protocol service
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Basic configuration check
      return !!(this.appName && this.scope && this.endpoint);
    } catch (error) {
      console.error('[SelfService] Health check failed:', error);
      return false;
    }
  }
}
