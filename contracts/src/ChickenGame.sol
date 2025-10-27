// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

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
     * @dev Admin can grant minter role to any address (including smart contracts)
     * Example: grantRole(MINTER_ROLE, chickenGameAddress);
     */
}

/**
 * @title ChickenGame
 * @dev Gamified chicken care system where users perform actions to increase happiness
 * When happiness reaches 100, users can lay an egg (mint EggToken)
 */
contract ChickenGame is ReentrancyGuard {
    EggToken public eggToken;
    
    // Cooldown period between actions (24 hours)
    uint256 public constant ACTION_COOLDOWN = 24 hours;
    
    // Happiness points per action
    uint256 public constant HAPPINESS_PER_ACTION = 10;
    
    // Maximum happiness level
    uint256 public constant MAX_HAPPINESS = 100;
    
    // Egg reward amount (1 EGG token with 18 decimals)
    uint256 public constant EGG_REWARD = 1 ether;
    
    // Number of free instant actions for new users (onboarding)
    uint256 public constant FREE_INSTANT_ACTIONS = 10;

    struct Chicken {
        uint256 happiness;
        uint256 lastFeedTime;
        uint256 lastPetTime;
        uint256 lastPlayTime;
        uint256 totalEggsLaid;
        uint256 instantActionsRemaining; // Free actions without cooldown
        bool initialized; // Track if chicken has been initialized
    }

    mapping(address => Chicken) public chickens;

    event ActionPerformed(address indexed user, string actionType, uint256 newHappiness);
    event EggLaid(address indexed user, uint256 amount, uint256 totalEggs);
    event ChickenHappinessReset(address indexed user);

    constructor(address _eggTokenAddress) {
        eggToken = EggToken(_eggTokenAddress);
    }

    /**
     * @dev Initialize chicken for new users (called automatically on first action)
     */
    function _initializeChicken(address user) internal {
        Chicken storage chicken = chickens[user];
        if (!chicken.initialized) {
            chicken.initialized = true;
            chicken.instantActionsRemaining = FREE_INSTANT_ACTIONS;
        }
    }

    /**
     * @dev Feed the chicken to increase happiness by 10 points
     * Can only be performed once per 24 hours (or uses instant action if available)
     */
    function feedChicken() external nonReentrant {
        _initializeChicken(msg.sender);
        Chicken storage chicken = chickens[msg.sender];
        
        // Check if user has instant actions or if cooldown has expired
        if (chicken.instantActionsRemaining > 0) {
            chicken.instantActionsRemaining--;
        } else {
            require(
                block.timestamp >= chicken.lastFeedTime + ACTION_COOLDOWN,
                "ChickenGame: Feed cooldown not expired"
            );
        }
        
        chicken.lastFeedTime = block.timestamp;
        _increaseHappiness(msg.sender, "Feed");
    }

    /**
     * @dev Pet the chicken to increase happiness by 10 points
     * Can only be performed once per 24 hours (or uses instant action if available)
     */
    function petChicken() external nonReentrant {
        _initializeChicken(msg.sender);
        Chicken storage chicken = chickens[msg.sender];
        
        // Check if user has instant actions or if cooldown has expired
        if (chicken.instantActionsRemaining > 0) {
            chicken.instantActionsRemaining--;
        } else {
            require(
                block.timestamp >= chicken.lastPetTime + ACTION_COOLDOWN,
                "ChickenGame: Pet cooldown not expired"
            );
        }
        
        chicken.lastPetTime = block.timestamp;
        _increaseHappiness(msg.sender, "Pet");
    }

    /**
     * @dev Play with the chicken to increase happiness by 10 points
     * Can only be performed once per 24 hours (or uses instant action if available)
     */
    function playWithChicken() external nonReentrant {
        _initializeChicken(msg.sender);
        Chicken storage chicken = chickens[msg.sender];
        
        // Check if user has instant actions or if cooldown has expired
        if (chicken.instantActionsRemaining > 0) {
            chicken.instantActionsRemaining--;
        } else {
            require(
                block.timestamp >= chicken.lastPlayTime + ACTION_COOLDOWN,
                "ChickenGame: Play cooldown not expired"
            );
        }
        
        chicken.lastPlayTime = block.timestamp;
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
     * @dev Get chicken data for a specific user
     * @param user Address of the chicken owner
     * @return happiness Current happiness level
     * @return lastFeedTime Timestamp of last feed
     * @return lastPetTime Timestamp of last pet
     * @return lastPlayTime Timestamp of last play
     * @return totalEggsLaid Total number of eggs laid
     * @return instantActionsRemaining Number of instant actions remaining
     * @return initialized Whether the chicken has been initialized
     */
    function getChicken(address user) external view returns (
        uint256 happiness,
        uint256 lastFeedTime,
        uint256 lastPetTime,
        uint256 lastPlayTime,
        uint256 totalEggsLaid,
        uint256 instantActionsRemaining,
        bool initialized
    ) {
        Chicken memory chicken = chickens[user];
        return (
            chicken.happiness,
            chicken.lastFeedTime,
            chicken.lastPetTime,
            chicken.lastPlayTime,
            chicken.totalEggsLaid,
            chicken.instantActionsRemaining,
            chicken.initialized
        );
    }

    /**
     * @dev Check if an action is available (cooldown expired or instant actions available)
     * @param user Address of the chicken owner
     * @param actionType Type of action: 0=Feed, 1=Pet, 2=Play
     * @return bool True if action is available
     */
    function isActionAvailable(address user, uint256 actionType) external view returns (bool) {
        Chicken memory chicken = chickens[user];
        
        // If user has instant actions remaining (or not initialized yet), action is always available
        if (!chicken.initialized || chicken.instantActionsRemaining > 0) {
            return true;
        }
        
        // Otherwise check cooldown
        if (actionType == 0) {
            return block.timestamp >= chicken.lastFeedTime + ACTION_COOLDOWN;
        } else if (actionType == 1) {
            return block.timestamp >= chicken.lastPetTime + ACTION_COOLDOWN;
        } else if (actionType == 2) {
            return block.timestamp >= chicken.lastPlayTime + ACTION_COOLDOWN;
        }
        
        return false;
    }

    /**
     * @dev Get time remaining until next action is available
     * @param user Address of the chicken owner
     * @param actionType Type of action: 0=Feed, 1=Pet, 2=Play
     * @return uint256 Seconds remaining until action is available (0 if available now or has instant actions)
     */
    function getTimeUntilNextAction(address user, uint256 actionType) external view returns (uint256) {
        Chicken memory chicken = chickens[user];
        
        // If user has instant actions or is not initialized, action is immediately available
        if (!chicken.initialized || chicken.instantActionsRemaining > 0) {
            return 0;
        }
        
        uint256 lastActionTime;
        
        if (actionType == 0) {
            lastActionTime = chicken.lastFeedTime;
        } else if (actionType == 1) {
            lastActionTime = chicken.lastPetTime;
        } else if (actionType == 2) {
            lastActionTime = chicken.lastPlayTime;
        } else {
            return 0;
        }
        
        uint256 nextActionTime = lastActionTime + ACTION_COOLDOWN;
        
        if (block.timestamp >= nextActionTime) {
            return 0;
        }
        
        return nextActionTime - block.timestamp;
    }

    /**
     * @dev Check if chicken can lay an egg
     * @param user Address of the chicken owner
     * @return bool True if chicken has 100 happiness and can lay egg
     */
    function canLayEgg(address user) external view returns (bool) {
        return chickens[user].happiness >= MAX_HAPPINESS;
    }
}

