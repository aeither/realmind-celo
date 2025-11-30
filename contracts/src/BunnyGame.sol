// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EggToken
 * @dev ERC20 token that can be minted by authorized addresses
 */
contract EggToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("Egg Token", "EGG") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function burnFrom(address from, uint256 amount) external {
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
    }
}

/**
 * @title RetentionSystem
 * @notice Daily check-ins with streak bonuses and referral rewards
 */
contract RetentionSystem {
    EggToken public eggToken;

    mapping(address => uint256) public lastCheckIn;
    mapping(address => uint256) public currentStreak;
    mapping(address => address) public referredBy;
    mapping(address => bool) public hasBeenReferred;
    mapping(address => uint256) public referralCount;

    uint256 public constant ONE_DAY = 20 hours;
    uint256 public constant BASE_EGGS = 1 ether;
    uint256 public constant STREAK_3_EGGS = 2 ether;
    uint256 public constant STREAK_7_EGGS = 3 ether;
    uint256 public constant REFERRAL_BONUS = 5 ether;
    uint256 public constant STREAK_THRESHOLD_2 = 3;
    uint256 public constant MAX_STREAK = 7;

    event CheckedIn(address indexed user, uint256 streak, uint256 eggsEarned, uint256 timestamp);
    event ReferralCompleted(address indexed referrer, address indexed referred, uint256 bonusEggs, uint256 timestamp);
    event StreakBroken(address indexed user, uint256 previousStreak, uint256 timestamp);

    error AlreadyCheckedInToday();
    error CannotReferSelf();
    error AlreadyReferred();
    error ReferrerNotActive();

    constructor(address _eggTokenAddress) {
        eggToken = EggToken(_eggTokenAddress);
    }

    function checkIn() external {
        _processCheckIn(msg.sender);
    }

    function checkInWithReferral(address referrer) external {
        if (referrer == msg.sender) revert CannotReferSelf();
        if (hasBeenReferred[msg.sender]) revert AlreadyReferred();
        if (lastCheckIn[referrer] == 0) revert ReferrerNotActive();

        hasBeenReferred[msg.sender] = true;
        referredBy[msg.sender] = referrer;
        _processCheckIn(msg.sender);

        eggToken.mint(msg.sender, REFERRAL_BONUS);
        eggToken.mint(referrer, REFERRAL_BONUS);
        referralCount[referrer]++;

        emit ReferralCompleted(referrer, msg.sender, REFERRAL_BONUS, block.timestamp);
    }

    function _processCheckIn(address user) internal {
        uint256 timeSinceLastCheckIn = block.timestamp - lastCheckIn[user];

        if (lastCheckIn[user] > 0 && timeSinceLastCheckIn < ONE_DAY) {
            revert AlreadyCheckedInToday();
        }

        uint256 newStreak;

        if (lastCheckIn[user] == 0) {
            newStreak = 1;
        } else if (timeSinceLastCheckIn <= 2 * ONE_DAY) {
            newStreak = currentStreak[user] + 1;
            if (newStreak > MAX_STREAK) newStreak = MAX_STREAK;
        } else {
            emit StreakBroken(user, currentStreak[user], block.timestamp);
            newStreak = 1;
        }

        lastCheckIn[user] = block.timestamp;
        currentStreak[user] = newStreak;

        uint256 eggsEarned = _calculateEggs(newStreak);
        eggToken.mint(user, eggsEarned);

        emit CheckedIn(user, newStreak, eggsEarned, block.timestamp);
    }

    function _calculateEggs(uint256 streak) internal pure returns (uint256) {
        if (streak >= MAX_STREAK) return STREAK_7_EGGS;
        if (streak >= STREAK_THRESHOLD_2) return STREAK_3_EGGS;
        return BASE_EGGS;
    }

    function getUserStats(address user) external view returns (
        uint256 lastCheck,
        uint256 streak,
        address referrer,
        uint256 referrals,
        bool canCheckIn
    ) {
        lastCheck = lastCheckIn[user];
        streak = currentStreak[user];
        referrer = referredBy[user];
        referrals = referralCount[user];
        canCheckIn = (lastCheck == 0) || (block.timestamp - lastCheck >= ONE_DAY);
    }

    function getNextReward(address user) external view returns (uint256) {
        uint256 timeSinceLastCheckIn = block.timestamp - lastCheckIn[user];
        uint256 nextStreak;

        if (lastCheckIn[user] == 0) {
            nextStreak = 1;
        } else if (timeSinceLastCheckIn <= 2 * ONE_DAY) {
            nextStreak = currentStreak[user] + 1;
            if (nextStreak > MAX_STREAK) nextStreak = MAX_STREAK;
        } else {
            nextStreak = 1;
        }

        return _calculateEggs(nextStreak);
    }

    function willStreakBreak(address user) external view returns (bool) {
        if (lastCheckIn[user] == 0) return false;
        return (block.timestamp - lastCheckIn[user]) > 2 * ONE_DAY;
    }

    function timeUntilNextCheckIn(address user) external view returns (uint256) {
        if (lastCheckIn[user] == 0) return 0;
        uint256 timeSinceLastCheckIn = block.timestamp - lastCheckIn[user];
        if (timeSinceLastCheckIn >= ONE_DAY) return 0;
        return ONE_DAY - timeSinceLastCheckIn;
    }
}

/**
 * @title BunnyGame
 * @dev Simplified tap game: accumulate actions -> tap to increase happiness -> lay egg when 100
 */
contract BunnyGame is ReentrancyGuard {
    EggToken public eggToken;
    address public owner;

    // Action accumulation: 1 action every 2 hours, max 10
    uint256 public constant ACTION_ACCUMULATION_TIME = 2 hours;
    uint256 public constant MAX_CLAIMABLE_ACTIONS = 10;
    uint256 public constant HAPPINESS_PER_ACTION = 10;
    uint256 public constant MAX_HAPPINESS = 100;
    uint256 public constant EGG_REWARD = 1 ether;
    uint256 public constant FREE_INSTANT_ACTIONS = 10;

    struct Bunny {
        uint256 happiness;
        uint256 claimableActions;
        uint256 lastActionUpdate;
        uint256 totalEggsLaid;
        uint256 instantActionsRemaining;
        bool initialized;
    }

    mapping(address => Bunny) public bunnies;

    event ActionPerformed(address indexed user, string actionType, uint256 newHappiness);
    event EggLaid(address indexed user, uint256 amount, uint256 totalEggs);
    event BunnyHappinessReset(address indexed user);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address _eggTokenAddress) {
        eggToken = EggToken(_eggTokenAddress);
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    function _onlyOwner() internal view {
        require(msg.sender == owner, "BunnyGame: caller is not the owner");
    }

    function _initializeBunny(address user) internal {
        Bunny storage bunny = bunnies[user];
        if (!bunny.initialized) {
            bunny.initialized = true;
            bunny.instantActionsRemaining = FREE_INSTANT_ACTIONS;
            bunny.claimableActions = MAX_CLAIMABLE_ACTIONS;
            bunny.lastActionUpdate = block.timestamp;
        }
    }

    function _updateClaimableActions(address user) internal {
        Bunny storage bunny = bunnies[user];
        if (bunny.lastActionUpdate == 0) return;

        uint256 timePassed = block.timestamp - bunny.lastActionUpdate;
        uint256 accumulatedActions = timePassed / ACTION_ACCUMULATION_TIME;

        if (accumulatedActions > 0) {
            bunny.claimableActions += accumulatedActions;
            if (bunny.claimableActions > MAX_CLAIMABLE_ACTIONS) {
                bunny.claimableActions = MAX_CLAIMABLE_ACTIONS;
            }
            bunny.lastActionUpdate += accumulatedActions * ACTION_ACCUMULATION_TIME;
        }
    }

    function _useAction(address user) internal {
        Bunny storage bunny = bunnies[user];

        if (bunny.instantActionsRemaining > 0) {
            bunny.instantActionsRemaining--;
        } else {
            _updateClaimableActions(user);
            require(bunny.claimableActions > 0, "BunnyGame: No actions available");
            bunny.claimableActions--;
        }
    }

    /// @notice Tap/pet/feed the bunny (all same effect)
    function tapBunny() external nonReentrant {
        _initializeBunny(msg.sender);
        _useAction(msg.sender);
        _increaseHappiness(msg.sender, "Tap");
    }

    function feedBunny() external nonReentrant {
        _initializeBunny(msg.sender);
        _useAction(msg.sender);
        _increaseHappiness(msg.sender, "Feed");
    }

    function petBunny() external nonReentrant {
        _initializeBunny(msg.sender);
        _useAction(msg.sender);
        _increaseHappiness(msg.sender, "Pet");
    }

    function _increaseHappiness(address user, string memory actionType) internal {
        Bunny storage bunny = bunnies[user];
        
        if (bunny.happiness + HAPPINESS_PER_ACTION >= MAX_HAPPINESS) {
            bunny.happiness = MAX_HAPPINESS;
        } else {
            bunny.happiness += HAPPINESS_PER_ACTION;
        }
        
        emit ActionPerformed(user, actionType, bunny.happiness);
    }

    /// @notice Lay an egg when bunny happiness reaches 100
    function layEgg() external nonReentrant {
        Bunny storage bunny = bunnies[msg.sender];
        require(bunny.happiness >= MAX_HAPPINESS, "BunnyGame: Bunny happiness must be 100 to lay egg");

        bunny.happiness = 0;
        bunny.totalEggsLaid += 1;

        eggToken.mint(msg.sender, EGG_REWARD);

        emit EggLaid(msg.sender, EGG_REWARD, bunny.totalEggsLaid);
        emit BunnyHappinessReset(msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "BunnyGame: New owner is the zero address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    // ========== VIEW FUNCTIONS ==========

    function getBunny(address user) external view returns (
        uint256 happiness,
        uint256 claimableActions,
        uint256 lastActionUpdate,
        uint256 totalEggsLaid,
        uint256 instantActionsRemaining,
        bool initialized
    ) {
        Bunny memory bunny = bunnies[user];

        uint256 currentClaimable = bunny.claimableActions;
        if (bunny.lastActionUpdate > 0) {
            uint256 timePassed = block.timestamp - bunny.lastActionUpdate;
            uint256 accumulated = timePassed / ACTION_ACCUMULATION_TIME;
            currentClaimable += accumulated;
            if (currentClaimable > MAX_CLAIMABLE_ACTIONS) {
                currentClaimable = MAX_CLAIMABLE_ACTIONS;
            }
        }

        return (
            bunny.happiness,
            currentClaimable,
            bunny.lastActionUpdate,
            bunny.totalEggsLaid,
            bunny.instantActionsRemaining,
            bunny.initialized
        );
    }

    function isActionAvailable(address user) external view returns (bool) {
        Bunny memory bunny = bunnies[user];

        if (!bunny.initialized) return true;
        if (bunny.instantActionsRemaining > 0) return true;

        uint256 currentClaimable = bunny.claimableActions;
        if (bunny.lastActionUpdate > 0) {
            uint256 timePassed = block.timestamp - bunny.lastActionUpdate;
            uint256 accumulated = timePassed / ACTION_ACCUMULATION_TIME;
            currentClaimable += accumulated;
        }

        return currentClaimable > 0;
    }

    function getTimeUntilNextAction(address user) external view returns (uint256) {
        Bunny memory bunny = bunnies[user];

        if (!bunny.initialized || bunny.instantActionsRemaining > 0) return 0;

        uint256 currentClaimable = bunny.claimableActions;
        if (bunny.lastActionUpdate > 0) {
            uint256 timePassed = block.timestamp - bunny.lastActionUpdate;
            uint256 accumulated = timePassed / ACTION_ACCUMULATION_TIME;
            currentClaimable += accumulated;
        }

        if (currentClaimable >= MAX_CLAIMABLE_ACTIONS) return 0;

        uint256 timeSinceLastAccumulation = (block.timestamp - bunny.lastActionUpdate) % ACTION_ACCUMULATION_TIME;
        return ACTION_ACCUMULATION_TIME - timeSinceLastAccumulation;
    }

    function canLayEgg(address user) external view returns (bool) {
        return bunnies[user].happiness >= MAX_HAPPINESS;
    }

    function getTotalActions(address user) external view returns (uint256) {
        Bunny memory bunny = bunnies[user];
        if (!bunny.initialized) return FREE_INSTANT_ACTIONS + MAX_CLAIMABLE_ACTIONS;
        
        uint256 currentClaimable = bunny.claimableActions;
        if (bunny.lastActionUpdate > 0) {
            uint256 timePassed = block.timestamp - bunny.lastActionUpdate;
            uint256 accumulated = timePassed / ACTION_ACCUMULATION_TIME;
            currentClaimable += accumulated;
            if (currentClaimable > MAX_CLAIMABLE_ACTIONS) {
                currentClaimable = MAX_CLAIMABLE_ACTIONS;
            }
        }
        
        return bunny.instantActionsRemaining + currentClaimable;
    }
}

