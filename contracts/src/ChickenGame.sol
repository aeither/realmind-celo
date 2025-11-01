// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EggToken
 * @dev ERC20 token that can be minted by authorized addresses
 * Admin can grant MINTER_ROLE to the ChickenGame contract or any other address
 */
contract EggToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("Egg Token", "EGG") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender); // deployer starts as the first minter
    }

    /**
     * @dev Mint new tokens to a specified address
     * @param to Address to receive the minted tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from caller's account
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    /**
     * @dev Burn tokens from a specific account (requires approval)
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burnFrom(address from, uint256 amount) public {
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
    }

    /**
     * @dev Admin can grant minter role to any address (including smart contracts)
     * Example: grantRole(MINTER_ROLE, chickenGameAddress);
     */
}

/**
 * @title MegaEgg
 * @dev ERC20 token earned by merging Eggs
 */
contract MegaEgg is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("Mega Egg", "MEGG") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    /**
     * @dev Mint new MegaEgg tokens to a specified address
     * @param to Address to receive the minted tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /**
     * @dev Burn MegaEgg tokens from caller
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}

/**
 * @title RetentionSystem
 * @notice Handles daily check-ins with streak bonuses and referral rewards
 * @dev Combines daily rewards and referral system in a single contract
 */
contract RetentionSystem {
    // ============ State Variables ============

    /// @notice Reference to the EggToken contract
    EggToken public eggToken;

    /// @notice Tracks the last check-in timestamp for each user
    mapping(address => uint256) public lastCheckIn;

    /// @notice Tracks the current streak count for each user (max 7 days)
    mapping(address => uint256) public currentStreak;

    /// @notice Tracks who referred each user (one-time only)
    mapping(address => address) public referredBy;

    /// @notice Tracks if a user has already been referred
    mapping(address => bool) public hasBeenReferred;

    /// @notice Tracks total referrals made by each user
    mapping(address => uint256) public referralCount;

    // ============ Constants ============

    /// @notice Check-in period (20 hours to avoid daily delay)
    uint256 public constant ONE_DAY = 20 hours;

    /// @notice Base eggs per check-in
    uint256 public constant BASE_EGGS = 1 ether;

    /// @notice Eggs for 3+ day streak
    uint256 public constant STREAK_3_EGGS = 2 ether;

    /// @notice Eggs for 7 day streak
    uint256 public constant STREAK_7_EGGS = 3 ether;

    /// @notice Referral bonus for both parties
    uint256 public constant REFERRAL_BONUS = 5 ether;

    /// @notice Streak threshold for 2 eggs
    uint256 public constant STREAK_THRESHOLD_2 = 3;

    /// @notice Maximum streak count
    uint256 public constant MAX_STREAK = 7;

    // ============ Events ============

    event CheckedIn(
        address indexed user,
        uint256 streak,
        uint256 eggsEarned,
        uint256 timestamp
    );

    event ReferralCompleted(
        address indexed referrer,
        address indexed referred,
        uint256 bonusEggs,
        uint256 timestamp
    );

    event StreakBroken(
        address indexed user,
        uint256 previousStreak,
        uint256 timestamp
    );

    // ============ Errors ============

    error AlreadyCheckedInToday();
    error CannotReferSelf();
    error AlreadyReferred();
    error ReferrerNotActive();

    // ============ Constructor ============

    constructor(address _eggTokenAddress) {
        eggToken = EggToken(_eggTokenAddress);
    }

    // ============ Main Functions ============

    /**
     * @notice Check in for the day and earn eggs based on streak
     * @dev Calculates streak based on timestamp difference
     */
    function checkIn() external {
        _processCheckIn(msg.sender);
    }

    /**
     * @notice First-time check-in with a referral
     * @param referrer Address of the user who referred you
     * @dev Can only be called once per user, rewards both parties
     */
    function checkInWithReferral(address referrer) external {
        if (referrer == msg.sender) revert CannotReferSelf();
        if (hasBeenReferred[msg.sender]) revert AlreadyReferred();
        if (lastCheckIn[referrer] == 0) revert ReferrerNotActive();

        // Mark user as referred
        hasBeenReferred[msg.sender] = true;
        referredBy[msg.sender] = referrer;

        // Process regular check-in
        _processCheckIn(msg.sender);

        // Award referral bonus to both parties
        eggToken.mint(msg.sender, REFERRAL_BONUS);
        eggToken.mint(referrer, REFERRAL_BONUS);
        referralCount[referrer]++;

        emit ReferralCompleted(
            referrer,
            msg.sender,
            REFERRAL_BONUS,
            block.timestamp
        );
    }

    /**
     * @notice Internal function to process daily check-in
     * @param user The user checking in
     */
    function _processCheckIn(address user) internal {
        uint256 timeSinceLastCheckIn = block.timestamp - lastCheckIn[user];

        // Check if user already checked in today
        if (lastCheckIn[user] > 0 && timeSinceLastCheckIn < ONE_DAY) {
            revert AlreadyCheckedInToday();
        }

        uint256 newStreak;

        // First time checking in
        if (lastCheckIn[user] == 0) {
            newStreak = 1;
        }
        // Check if streak continues (checked in within 48 hours)
        else if (timeSinceLastCheckIn <= 2 * ONE_DAY) {
            newStreak = currentStreak[user] + 1;
            if (newStreak > MAX_STREAK) {
                newStreak = MAX_STREAK;
            }
        }
        // Streak broken (more than 48 hours)
        else {
            uint256 oldStreak = currentStreak[user];
            emit StreakBroken(user, oldStreak, block.timestamp);
            newStreak = 1;
        }

        // Update state
        lastCheckIn[user] = block.timestamp;
        currentStreak[user] = newStreak;

        // Calculate eggs based on streak
        uint256 eggsEarned = _calculateEggs(newStreak);
        eggToken.mint(user, eggsEarned);

        emit CheckedIn(user, newStreak, eggsEarned, block.timestamp);
    }

    /**
     * @notice Calculate eggs to award based on current streak
     * @param streak The current streak count
     * @return Number of eggs to award
     */
    function _calculateEggs(uint256 streak) internal pure returns (uint256) {
        if (streak >= MAX_STREAK) {
            return STREAK_7_EGGS;
        } else if (streak >= STREAK_THRESHOLD_2) {
            return STREAK_3_EGGS;
        } else {
            return BASE_EGGS;
        }
    }

    // ============ View Functions ============

    /**
     * @notice Get user's complete stats
     * @param user The user address to query
     * @return lastCheck Last check-in timestamp
     * @return streak Current streak count
     * @return referrer Address of referrer (if any)
     * @return referrals Number of successful referrals
     * @return canCheckIn Whether user can check in now
     */
    function getUserStats(address user)
        external
        view
        returns (
            uint256 lastCheck,
            uint256 streak,
            address referrer,
            uint256 referrals,
            bool canCheckIn
        )
    {
        lastCheck = lastCheckIn[user];
        streak = currentStreak[user];
        referrer = referredBy[user];
        referrals = referralCount[user];

        // User can check in if never checked in or last check-in was >= 1 day ago
        canCheckIn = (lastCheck == 0) || (block.timestamp - lastCheck >= ONE_DAY);
    }

    /**
     * @notice Calculate next egg reward for a user
     * @param user The user address to query
     * @return Number of eggs user will earn on next check-in
     */
    function getNextReward(address user) external view returns (uint256) {
        uint256 timeSinceLastCheckIn = block.timestamp - lastCheckIn[user];
        uint256 nextStreak;

        if (lastCheckIn[user] == 0) {
            nextStreak = 1;
        } else if (timeSinceLastCheckIn <= 2 * ONE_DAY) {
            nextStreak = currentStreak[user] + 1;
            if (nextStreak > MAX_STREAK) {
                nextStreak = MAX_STREAK;
            }
        } else {
            nextStreak = 1;
        }

        return _calculateEggs(nextStreak);
    }

    /**
     * @notice Check if user's streak will break on next check-in
     * @param user The user address to query
     * @return True if streak will break
     */
    function willStreakBreak(address user) external view returns (bool) {
        if (lastCheckIn[user] == 0) return false;
        uint256 timeSinceLastCheckIn = block.timestamp - lastCheckIn[user];
        return timeSinceLastCheckIn > 2 * ONE_DAY;
    }

    /**
     * @notice Get time remaining until user can check in
     * @param user The user address to query
     * @return Seconds until next check-in is available (0 if available now)
     */
    function timeUntilNextCheckIn(address user) external view returns (uint256) {
        if (lastCheckIn[user] == 0) return 0;

        uint256 timeSinceLastCheckIn = block.timestamp - lastCheckIn[user];
        if (timeSinceLastCheckIn >= ONE_DAY) return 0;

        return ONE_DAY - timeSinceLastCheckIn;
    }
}

/**
 * @title ChickenGame
 * @dev Gamified chicken care system where users perform actions to increase happiness
 * When happiness reaches 100, users can lay an egg (mint EggToken)
 */
contract ChickenGame is ReentrancyGuard {
    EggToken public eggToken;
    MegaEgg public megaEgg;
    IERC20 public usdtToken;
    address public owner;
    address public vaultAddress;

    // USDT token address on Celo
    address public constant USDT_ADDRESS = 0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e;

    // Action accumulation rate (Farmville-style): 1 action every 2 hours
    uint256 public constant ACTION_ACCUMULATION_TIME = 2 hours;

    // Maximum claimable actions that can be stored
    uint256 public constant MAX_CLAIMABLE_ACTIONS = 10;

    // Happiness points per action
    uint256 public constant HAPPINESS_PER_ACTION = 10;

    // Maximum happiness level
    uint256 public constant MAX_HAPPINESS = 100;

    // Egg reward amount (1 EGG token with 18 decimals)
    uint256 public constant EGG_REWARD = 1 ether;

    // Number of free instant actions for new users (onboarding)
    uint256 public constant FREE_INSTANT_ACTIONS = 10;

    // USDT staking: 1 free action per 1000 USDT (USDT has 6 decimals)
    uint256 public constant USDT_PER_ACTION = 1000 * 10**6; // 1000 USDT

    // Buying eggs: price per egg in ETH (0.001 ETH = 1 egg) - can be updated by owner
    uint256 public eggPrice = 0.001 ether;

    // Merging eggs: minimum eggs needed to merge
    uint256 public constant MIN_EGGS_TO_MERGE = 10 ether; // 10 eggs

    // Merging eggs: ETH fee to merge
    uint256 public constant MERGE_FEE = 0.01 ether;

    // MegaEgg reward per merge (1 MegaEgg per successful merge)
    uint256 public constant MEGAEGG_REWARD = 1 ether;

    struct Chicken {
        uint256 happiness;
        uint256 claimableActions; // Actions accumulated over time (max 10)
        uint256 lastActionUpdate; // Last time actions were updated
        uint256 totalEggsLaid;
        uint256 instantActionsRemaining; // Free actions from onboarding/staking
        bool initialized; // Track if chicken has been initialized
    }

    mapping(address => Chicken) public chickens;
    mapping(address => uint256) public stakedBalance;

    event ActionPerformed(address indexed user, string actionType, uint256 newHappiness);
    event EggLaid(address indexed user, uint256 amount, uint256 totalEggs);
    event ChickenHappinessReset(address indexed user);
    event Staked(address indexed user, uint256 amount, uint256 freeActionsGranted);
    event Unstaked(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed admin, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event EggsBought(address indexed user, uint256 ethSpent, uint256 eggsReceived);
    event EggsMerged(address indexed user, uint256 eggsBurned, uint256 megaEggsReceived);
    event VaultAddressUpdated(address indexed oldVault, address indexed newVault);
    event EggPriceUpdated(uint256 oldPrice, uint256 newPrice);

    constructor(address _eggTokenAddress, address _megaEggAddress) {
        eggToken = EggToken(_eggTokenAddress);
        megaEgg = MegaEgg(_megaEggAddress);
        usdtToken = IERC20(USDT_ADDRESS);
        owner = msg.sender;
        vaultAddress = msg.sender; // Initialize vault to deployer
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function _checkOwner() internal view {
        require(msg.sender == owner, "ChickenGame: caller is not the owner");
    }

    /**
     * @dev Initialize chicken for new users (called automatically on first action)
     */
    function _initializeChicken(address user) internal {
        Chicken storage chicken = chickens[user];
        if (!chicken.initialized) {
            chicken.initialized = true;
            chicken.instantActionsRemaining = FREE_INSTANT_ACTIONS;
            chicken.claimableActions = MAX_CLAIMABLE_ACTIONS; // Start with full actions
            chicken.lastActionUpdate = block.timestamp;
        }
    }

    /**
     * @dev Calculate and update accumulated claimable actions
     * @param user Address of the chicken owner
     */
    function _updateClaimableActions(address user) internal {
        Chicken storage chicken = chickens[user];

        if (chicken.lastActionUpdate == 0) {
            return; // Not initialized yet
        }

        uint256 timePassed = block.timestamp - chicken.lastActionUpdate;
        uint256 accumulatedActions = timePassed / ACTION_ACCUMULATION_TIME;

        if (accumulatedActions > 0) {
            chicken.claimableActions += accumulatedActions;

            // Cap at maximum
            if (chicken.claimableActions > MAX_CLAIMABLE_ACTIONS) {
                chicken.claimableActions = MAX_CLAIMABLE_ACTIONS;
            }

            // Update timestamp (only count fully accumulated actions)
            chicken.lastActionUpdate += accumulatedActions * ACTION_ACCUMULATION_TIME;
        }
    }

    /**
     * @dev Use one action (either instant or claimable)
     * @param user Address of the chicken owner
     */
    function _useAction(address user) internal {
        Chicken storage chicken = chickens[user];

        // First, try to use instant actions
        if (chicken.instantActionsRemaining > 0) {
            chicken.instantActionsRemaining--;
        } else {
            // Update accumulated actions before checking
            _updateClaimableActions(user);

            require(
                chicken.claimableActions > 0,
                "ChickenGame: No actions available"
            );

            chicken.claimableActions--;
        }
    }

    /**
     * @dev Feed the chicken to increase happiness by 10 points
     * Uses claimable actions (accumulated at 1 per 2 hours, max 10)
     */
    function feedChicken() external nonReentrant {
        _initializeChicken(msg.sender);
        _useAction(msg.sender);
        _increaseHappiness(msg.sender, "Feed");
    }

    /**
     * @dev Pet the chicken to increase happiness by 10 points
     * Uses claimable actions (accumulated at 1 per 2 hours, max 10)
     */
    function petChicken() external nonReentrant {
        _initializeChicken(msg.sender);
        _useAction(msg.sender);
        _increaseHappiness(msg.sender, "Pet");
    }

    /**
     * @dev Play with the chicken to increase happiness by 10 points
     * Uses claimable actions (accumulated at 1 per 2 hours, max 10)
     */
    function playWithChicken() external nonReentrant {
        _initializeChicken(msg.sender);
        _useAction(msg.sender);
        _increaseHappiness(msg.sender, "Play");
    }

    /**
     * @dev Internal function to increase chicken happiness
     * @param user Address of the chicken owner
     * @param actionType Type of action performed
     */
    function _increaseHappiness(address user, string memory actionType) internal {
        Chicken storage chicken = chickens[user];
        
        if (chicken.happiness + HAPPINESS_PER_ACTION >= MAX_HAPPINESS) {
            chicken.happiness = MAX_HAPPINESS;
        } else {
            chicken.happiness += HAPPINESS_PER_ACTION;
        }
        
        emit ActionPerformed(user, actionType, chicken.happiness);
    }

    /**
     * @dev Lay an egg when chicken happiness reaches 100
     * Mints 1 EGG token to the user and resets happiness to 0
     */
    function layEgg() external nonReentrant {
        Chicken storage chicken = chickens[msg.sender];
        require(
            chicken.happiness >= MAX_HAPPINESS,
            "ChickenGame: Chicken happiness must be 100 to lay egg"
        );

        // Reset happiness to 0
        chicken.happiness = 0;
        chicken.totalEggsLaid += 1;

        // Mint egg token to user
        eggToken.mint(msg.sender, EGG_REWARD);

        emit EggLaid(msg.sender, EGG_REWARD, chicken.totalEggsLaid);
        emit ChickenHappinessReset(msg.sender);
    }

    /**
     * @dev Buy eggs with ETH
     * Users can purchase eggs directly with ETH at a fixed price
     * Does NOT count towards F2P leaderboard
     */
    function buyEggs() external payable nonReentrant {
        require(msg.value > 0, "ChickenGame: Must send ETH to buy eggs");
        require(msg.value % eggPrice == 0, "ChickenGame: ETH amount must be exact multiple of egg price");

        // Send ETH directly to vault
        (bool sent, ) = vaultAddress.call{value: msg.value}("");
        require(sent, "ChickenGame: Failed to send ETH to vault");

        // Calculate number of eggs to mint
        uint256 eggsToMint = msg.value / eggPrice;

        // Mint eggs to buyer
        eggToken.mint(msg.sender, eggsToMint * 1 ether);

        emit EggsBought(msg.sender, msg.value, eggsToMint * 1 ether);
    }

    /**
     * @dev Merge eggs to create MegaEggs
     * Burns eggs and mints MegaEggs
     * @param eggsToMerge Amount of eggs to merge (must be >= MIN_EGGS_TO_MERGE)
     */
    function mergeEggsForMegaEgg(uint256 eggsToMerge) external payable nonReentrant {
        require(eggsToMerge >= MIN_EGGS_TO_MERGE, "ChickenGame: Not enough eggs to merge");
        require(msg.value == MERGE_FEE, "ChickenGame: Incorrect merge fee");

        // Send merge fee directly to vault
        (bool sent, ) = vaultAddress.call{value: msg.value}("");
        require(sent, "ChickenGame: Failed to send ETH to vault");

        // Burn eggs from user (permanently destroy them)
        eggToken.burnFrom(msg.sender, eggsToMerge);

        // Calculate MegaEggs to mint (1 MegaEgg per MIN_EGGS_TO_MERGE)
        uint256 megaEggsToMint = (eggsToMerge * MEGAEGG_REWARD) / MIN_EGGS_TO_MERGE;

        // Mint MegaEggs to user
        megaEgg.mint(msg.sender, megaEggsToMint);

        emit EggsMerged(msg.sender, eggsToMerge, megaEggsToMint);
    }

    /**
     * @dev Stake USDT to earn free instant actions
     * Users get 1 free action for every 1000 USDT staked
     * @param amount Amount of USDT to stake (in USDT's smallest unit, 6 decimals)
     */
    function stakeUSDT(uint256 amount) external nonReentrant {
        require(amount > 0, "ChickenGame: Amount must be greater than 0");

        // Initialize chicken if needed
        _initializeChicken(msg.sender);

        // Transfer USDT from user to contract
        require(
            usdtToken.transferFrom(msg.sender, address(this), amount),
            "ChickenGame: USDT transfer failed"
        );

        // Calculate free actions (1 action per 1000 USDT)
        uint256 freeActions = amount / USDT_PER_ACTION;

        // Update staked balance
        stakedBalance[msg.sender] += amount;

        // Grant free actions
        if (freeActions > 0) {
            chickens[msg.sender].instantActionsRemaining += freeActions;
        }

        emit Staked(msg.sender, amount, freeActions);
    }

    /**
     * @dev Unstake USDT
     * @param amount Amount of USDT to unstake
     */
    function unstakeUSDT(uint256 amount) external nonReentrant {
        require(amount > 0, "ChickenGame: Amount must be greater than 0");
        require(
            stakedBalance[msg.sender] >= amount,
            "ChickenGame: Insufficient staked balance"
        );

        // Update staked balance
        stakedBalance[msg.sender] -= amount;

        // Transfer USDT back to user
        require(
            usdtToken.transfer(msg.sender, amount),
            "ChickenGame: USDT transfer failed"
        );

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @dev Emergency withdraw all USDT from the contract (only owner)
     * This function should only be used in case of emergency
     * @param recipient Address to receive the USDT
     */
    function emergencyWithdrawUSDT(address recipient) external onlyOwner nonReentrant {
        require(recipient != address(0), "ChickenGame: Invalid recipient address");

        uint256 balance = usdtToken.balanceOf(address(this));
        require(balance > 0, "ChickenGame: No USDT to withdraw");

        // Transfer all USDT to recipient
        require(
            usdtToken.transfer(recipient, balance),
            "ChickenGame: USDT transfer failed"
        );

        emit EmergencyWithdraw(recipient, balance);
    }

    /**
     * @dev Transfer ownership of the contract to a new owner
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ChickenGame: New owner is the zero address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @dev Update vault address (only owner)
     * @param newVaultAddress Address of the new vault
     */
    function setVaultAddress(address newVaultAddress) external onlyOwner {
        require(newVaultAddress != address(0), "ChickenGame: Vault address cannot be zero");
        address oldVault = vaultAddress;
        vaultAddress = newVaultAddress;
        emit VaultAddressUpdated(oldVault, newVaultAddress);
    }

    /**
     * @dev Update egg price (only owner)
     * @param newEggPrice New price per egg in ETH
     */
    function setEggPrice(uint256 newEggPrice) external onlyOwner {
        require(newEggPrice > 0, "ChickenGame: Egg price must be greater than zero");
        uint256 oldPrice = eggPrice;
        eggPrice = newEggPrice;
        emit EggPriceUpdated(oldPrice, newEggPrice);
    }

    /**
     * @dev Get chicken data for a specific user
     * @param user Address of the chicken owner
     * @return happiness Current happiness level
     * @return claimableActions Current claimable actions (updated)
     * @return lastActionUpdate Timestamp of last action update
     * @return totalEggsLaid Total number of eggs laid
     * @return instantActionsRemaining Number of instant actions remaining
     * @return initialized Whether the chicken has been initialized
     */
    function getChicken(address user) external view returns (
        uint256 happiness,
        uint256 claimableActions,
        uint256 lastActionUpdate,
        uint256 totalEggsLaid,
        uint256 instantActionsRemaining,
        bool initialized
    ) {
        Chicken memory chicken = chickens[user];

        // Calculate current claimable actions
        uint256 currentClaimable = chicken.claimableActions;
        if (chicken.lastActionUpdate > 0) {
            uint256 timePassed = block.timestamp - chicken.lastActionUpdate;
            uint256 accumulated = timePassed / ACTION_ACCUMULATION_TIME;
            currentClaimable += accumulated;
            if (currentClaimable > MAX_CLAIMABLE_ACTIONS) {
                currentClaimable = MAX_CLAIMABLE_ACTIONS;
            }
        }

        return (
            chicken.happiness,
            currentClaimable,
            chicken.lastActionUpdate,
            chicken.totalEggsLaid,
            chicken.instantActionsRemaining,
            chicken.initialized
        );
    }

    /**
     * @dev Check if an action is available
     * @param user Address of the chicken owner
     * @return bool True if action is available (has instant actions or claimable actions)
     */
    function isActionAvailable(address user) external view returns (bool) {
        Chicken memory chicken = chickens[user];

        // Not initialized yet - will be available after initialization
        if (!chicken.initialized) {
            return true;
        }

        // Has instant actions
        if (chicken.instantActionsRemaining > 0) {
            return true;
        }

        // Check accumulated claimable actions
        uint256 currentClaimable = chicken.claimableActions;
        if (chicken.lastActionUpdate > 0) {
            uint256 timePassed = block.timestamp - chicken.lastActionUpdate;
            uint256 accumulated = timePassed / ACTION_ACCUMULATION_TIME;
            currentClaimable += accumulated;
        }

        return currentClaimable > 0;
    }

    /**
     * @dev Get time remaining until next action accumulates
     * @param user Address of the chicken owner
     * @return uint256 Seconds until next action accumulates (0 if at max or has instant actions)
     */
    function getTimeUntilNextAction(address user) external view returns (uint256) {
        Chicken memory chicken = chickens[user];

        // Not initialized or has instant actions - immediately available
        if (!chicken.initialized || chicken.instantActionsRemaining > 0) {
            return 0;
        }

        // Calculate current claimable actions
        uint256 currentClaimable = chicken.claimableActions;
        if (chicken.lastActionUpdate > 0) {
            uint256 timePassed = block.timestamp - chicken.lastActionUpdate;
            uint256 accumulated = timePassed / ACTION_ACCUMULATION_TIME;
            currentClaimable += accumulated;
        }

        // If at max, no more will accumulate
        if (currentClaimable >= MAX_CLAIMABLE_ACTIONS) {
            return 0;
        }

        // Time until next accumulation
        uint256 timeSinceLastAccumulation = (block.timestamp - chicken.lastActionUpdate) % ACTION_ACCUMULATION_TIME;
        return ACTION_ACCUMULATION_TIME - timeSinceLastAccumulation;
    }

    /**
     * @dev Check if chicken can lay an egg
     * @param user Address of the chicken owner
     * @return bool True if chicken has 100 happiness and can lay egg
     */
    function canLayEgg(address user) external view returns (bool) {
        return chickens[user].happiness >= MAX_HAPPINESS;
    }

    /**
     * @dev Get staked USDT balance for a user
     * @param user Address of the user
     * @return uint256 Amount of USDT staked
     */
    function getStakedBalance(address user) external view returns (uint256) {
        return stakedBalance[user];
    }

    /**
     * @dev Calculate how many free actions would be granted for a given USDT amount
     * @param amount Amount of USDT (in USDT's smallest unit, 6 decimals)
     * @return uint256 Number of free actions that would be granted
     */
    function calculateFreeActions(uint256 amount) external pure returns (uint256) {
        return amount / USDT_PER_ACTION;
    }

    /**
     * @dev Calculate how many MegaEggs would be minted for a given amount of eggs
     * @param eggsAmount Amount of eggs to merge
     * @return uint256 Number of MegaEggs that would be minted
     */
    function calculateMegaEggs(uint256 eggsAmount) external pure returns (uint256) {
        if (eggsAmount < MIN_EGGS_TO_MERGE) {
            return 0;
        }
        return (eggsAmount * MEGAEGG_REWARD) / MIN_EGGS_TO_MERGE;
    }

    /**
     * @dev Withdraw ETH collected from any remaining balance (only owner)
     * Sends to vault address
     */
    function withdrawETH() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "ChickenGame: No ETH to withdraw");

        (bool success, ) = vaultAddress.call{value: balance}("");
        require(success, "ChickenGame: ETH transfer failed");
    }

    /**
     * @dev Get contract ETH balance
     * @return uint256 ETH balance in wei
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}

