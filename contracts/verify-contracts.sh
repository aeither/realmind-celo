#!/bin/bash

# Smart Contract Verification Script
# Verifies all deployed contracts across Base, Celo, and EDU Chain networks
#
# Usage:
#   ./verify-contracts.sh <network>
#
#   Available networks: base, celo, edu, all
#
# Example:
#   ./verify-contracts.sh base      # Verify only Base contracts
#   ./verify-contracts.sh all       # Verify all contracts on all networks
#
# Environment variables required:
#   BASESCAN_API_KEY - API key for Basescan (Base network)
#   CELO_EXPLORER_API_KEY - API key for Celo Explorer (Celo network)
#   EDU_API_KEY - API key for EDU Chain explorer (optional)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Function to print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Function to verify Token1 contract
verify_token1() {
    local chain_id=$1
    local rpc_url=$2
    local api_key=$3
    local contract_address=$4
    local token_name=$5
    local token_symbol=$6
    local explorer_url=$7

    print_info "Verifying Token1 contract at $contract_address"

    # Encode constructor arguments
    local constructor_args=$(cast abi-encode "constructor(string,string)" "$token_name" "$token_symbol")

    if forge verify-contract \
        --chain-id "$chain_id" \
        --rpc-url "$rpc_url" \
        --etherscan-api-key "$api_key" \
        --constructor-args "$constructor_args" \
        --watch \
        "$contract_address" \
        src/QuizGame.sol:Token1; then
        print_success "Token1 verified successfully!"
        print_info "View on explorer: $explorer_url/address/$contract_address#code"
    else
        print_warning "Token1 verification failed or already verified"
    fi
}

# Function to verify QuizGame contract
verify_quizgame() {
    local chain_id=$1
    local rpc_url=$2
    local api_key=$3
    local contract_address=$4
    local token_address=$5
    local explorer_url=$6

    print_info "Verifying QuizGame contract at $contract_address"

    # Encode constructor arguments
    local constructor_args=$(cast abi-encode "constructor(address)" "$token_address")

    if forge verify-contract \
        --chain-id "$chain_id" \
        --rpc-url "$rpc_url" \
        --etherscan-api-key "$api_key" \
        --constructor-args "$constructor_args" \
        --watch \
        "$contract_address" \
        src/QuizGame.sol:QuizGame; then
        print_success "QuizGame verified successfully!"
        print_info "View on explorer: $explorer_url/address/$contract_address#code"
    else
        print_warning "QuizGame verification failed or already verified"
    fi
}

# Function to verify SeasonReward contract
verify_season_reward() {
    local chain_id=$1
    local rpc_url=$2
    local api_key=$3
    local contract_address=$4
    local explorer_url=$5

    print_info "Verifying SeasonReward contract at $contract_address"

    if forge verify-contract \
        --chain-id "$chain_id" \
        --rpc-url "$rpc_url" \
        --etherscan-api-key "$api_key" \
        --watch \
        "$contract_address" \
        src/SeasonReward.sol:SeasonReward; then
        print_success "SeasonReward verified successfully!"
        print_info "View on explorer: $explorer_url/address/$contract_address#code"
    else
        print_warning "SeasonReward verification failed or already verified"
    fi
}

# Function to verify all Base contracts
verify_base() {
    print_header "Verifying Base Mainnet Contracts"

    if [ -z "$BASESCAN_API_KEY" ]; then
        print_error "BASESCAN_API_KEY not set in .env file"
        return 1
    fi

    # Base Mainnet configuration
    local CHAIN_ID=8453
    local RPC_URL="https://mainnet.base.org"
    local EXPLORER="https://basescan.org"

    # Contract addresses on Base
    local TOKEN1_ADDRESS="0xF3c3D545f3dD2A654dF2F54BcF98421CE2e3f121"
    local QUIZGAME_ADDRESS="0x25D79A35F6323D0d3EE617549Cc507ED6B9639Cb"
    local SEASONREWARD_ADDRESS="0x47358AF939cdB5B2b79a1AEE7d9E02760b2b73b2"

    # Token configuration (update these if different)
    local TOKEN_NAME="XP Points"
    local TOKEN_SYMBOL="XP3"

    verify_token1 "$CHAIN_ID" "$RPC_URL" "$BASESCAN_API_KEY" "$TOKEN1_ADDRESS" "$TOKEN_NAME" "$TOKEN_SYMBOL" "$EXPLORER"
    verify_quizgame "$CHAIN_ID" "$RPC_URL" "$BASESCAN_API_KEY" "$QUIZGAME_ADDRESS" "$TOKEN1_ADDRESS" "$EXPLORER"
    verify_season_reward "$CHAIN_ID" "$RPC_URL" "$BASESCAN_API_KEY" "$SEASONREWARD_ADDRESS" "$EXPLORER"

    print_success "Base verification process completed!"
}

# Function to verify all Celo contracts
verify_celo() {
    print_header "Verifying Celo Mainnet Contracts"

    if [ -z "$CELO_EXPLORER_API_KEY" ]; then
        print_error "CELO_EXPLORER_API_KEY not set in .env file"
        return 1
    fi

    # Celo Mainnet configuration
    local CHAIN_ID=42220
    local RPC_URL="https://forno.celo.org"
    local EXPLORER="https://explorer.celo.org"

    # Contract addresses on Celo
    local TOKEN1_ADDRESS="0xe05489dea86d85c32609410a1bF9C35a0f8fc2e7"
    local QUIZGAME_ADDRESS="0x367c011DC980E695EdE1e314af0a82C7E2b01e3B"

    # Token configuration (update these if different)
    local TOKEN_NAME="XP Points"
    local TOKEN_SYMBOL="XP3"

    verify_token1 "$CHAIN_ID" "$RPC_URL" "$CELO_EXPLORER_API_KEY" "$TOKEN1_ADDRESS" "$TOKEN_NAME" "$TOKEN_SYMBOL" "$EXPLORER"
    verify_quizgame "$CHAIN_ID" "$RPC_URL" "$CELO_EXPLORER_API_KEY" "$QUIZGAME_ADDRESS" "$TOKEN1_ADDRESS" "$EXPLORER"

    print_success "Celo verification process completed!"
}

# Function to verify all EDU Chain contracts
verify_edu() {
    print_header "Verifying EDU Chain Contracts"

    # EDU Chain configuration
    local CHAIN_ID=41923
    local RPC_URL="https://rpc.edu-chain.raas.gelato.cloud"
    local EXPLORER="https://educhain.blockscout.com"

    # Contract addresses on EDU Chain
    local TOKEN1_ADDRESS="0x57AED70DA2c288E4a79D2ca797ED9B276db47793"
    local QUIZGAME_ADDRESS="0x5A65590851b40939830cB5Ced3dEe8A0051cEDb7"

    # Token configuration (update these if different)
    local TOKEN_NAME="XP Points"
    local TOKEN_SYMBOL="XP3"

    print_info "Note: EDU Chain uses Blockscout which may not require API key"
    print_info "If verification fails, contracts can be verified manually at:"
    print_info "$EXPLORER/address/$TOKEN1_ADDRESS"
    print_info "$EXPLORER/address/$QUIZGAME_ADDRESS"

    # EDU Chain might use a different API key or no API key
    # Using dummy key if EDU_API_KEY not set since Blockscout sometimes doesn't require it
    local API_KEY="${EDU_API_KEY:-dummy}"

    verify_token1 "$CHAIN_ID" "$RPC_URL" "$API_KEY" "$TOKEN1_ADDRESS" "$TOKEN_NAME" "$TOKEN_SYMBOL" "$EXPLORER" || true
    verify_quizgame "$CHAIN_ID" "$RPC_URL" "$API_KEY" "$QUIZGAME_ADDRESS" "$TOKEN1_ADDRESS" "$EXPLORER" || true

    print_success "EDU Chain verification process completed!"
}

# Main script logic
main() {
    print_header "Smart Contract Verification Tool"

    # Check if forge is installed
    if ! command -v forge &> /dev/null; then
        print_error "Foundry forge not found. Please install Foundry: https://book.getfoundry.sh/getting-started/installation"
        exit 1
    fi

    # Check if cast is installed
    if ! command -v cast &> /dev/null; then
        print_error "Foundry cast not found. Please install Foundry: https://book.getfoundry.sh/getting-started/installation"
        exit 1
    fi

    # Parse command line arguments
    local network="${1:-all}"

    case "$network" in
        base)
            verify_base
            ;;
        celo)
            verify_celo
            ;;
        edu)
            verify_edu
            ;;
        all)
            verify_base
            echo ""
            verify_celo
            echo ""
            verify_edu
            ;;
        *)
            print_error "Invalid network: $network"
            echo ""
            echo "Usage: $0 <network>"
            echo ""
            echo "Available networks:"
            echo "  base  - Verify contracts on Base Mainnet"
            echo "  celo  - Verify contracts on Celo Mainnet"
            echo "  edu   - Verify contracts on EDU Chain"
            echo "  all   - Verify contracts on all networks (default)"
            echo ""
            exit 1
            ;;
    esac

    print_header "Verification Complete"
    echo "All verification requests have been submitted."
    echo "Note: Verification may take a few minutes to appear on block explorers."
    echo ""
    echo "View your contracts:"
    echo "  Base:      https://basescan.org"
    echo "  Celo:      https://explorer.celo.org"
    echo "  EDU Chain: https://educhain.blockscout.com"
}

# Run main function
main "$@"
