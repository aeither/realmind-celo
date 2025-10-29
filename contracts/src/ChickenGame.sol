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
    IERC20 public usdtToken;
    address public owner;

    // USDT token address on Celo
    address public constant USDT_ADDRESS = 0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e;

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

    // USDT staking: 1 free action per 1000 USDT (USDT has 6 decimals)
    uint256 public constant USDT_PER_ACTION = 1000 * 10**6; // 1000 USDT

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
    mapping(address => uint256) public stakedBalance;

    event ActionPerformed(address indexed user, string actionType, uint256 newHappiness);
    event EggLaid(address indexed user, uint256 amount, uint256 totalEggs);
    event ChickenHappinessReset(address indexed user);
    event Staked(address indexed user, uint256 amount, uint256 freeActionsGranted);
    event Unstaked(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed admin, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address _eggTokenAddress) {
        eggToken = EggToken(_eggTokenAddress);
        usdtToken = IERC20(USDT_ADDRESS);
        owner = msg.sender;
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
}

