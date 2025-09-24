// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Token1 is ERC20, Ownable {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) Ownable(msg.sender) {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Soulbound behavior: disable transfers and approvals
    function transfer(address, uint256) public pure override returns (bool) {
        revert("Soulbound: non-transferable");
    }

    function approve(address, uint256) public pure override returns (bool) {
        revert("Soulbound: approvals disabled");
    }

    function transferFrom(address, address, uint256) public pure override returns (bool) {
        revert("Soulbound: non-transferable");
    }
}

contract QuizGame is Ownable, ReentrancyGuard {
    Token1 public token;
    address public vaultAddress;
    uint256 public tokenMultiplier = 1000; // Default 1000x ETH paid
    uint256 public defaultEntryPrice = 0.00005 ether; // Default entry price in ETH

    // Mapping: user address => active quiz session (only one allowed at a time)
    mapping(address => QuizSession) public userSessions;

    struct QuizSession {
        bool active;
        uint128 amountPaid; 
        uint128 timestamp; 
        uint256 correctAnswers; // Track correct answers for bonus calculation
        string quizId;
    }

    event QuizStarted(
        address indexed user,
        string quizId,
        uint128 amountPaid,
        uint256 initialTokensMinted
    );

    event QuizCompleted(
        address indexed user,
        string quizId,
        bool success,
        uint256 tokensMinted,
        uint256 submittedCorrectAnswers,
        uint256 expectedCorrectAnswers
    );

    event VaultAddressUpdated(address indexed oldVault, address indexed newVault);

    event TokenAddressUpdated(address indexed oldToken, address indexed newToken);

    event TokenMultiplierUpdated(uint256 oldMultiplier, uint256 newMultiplier);

    event DefaultEntryPriceUpdated(uint256 oldPrice, uint256 newPrice);

    constructor(address tokenAddress) Ownable(msg.sender) {
        require(tokenAddress != address(0), "Token address cannot be zero");
        token = Token1(tokenAddress);
        vaultAddress = msg.sender; // Initialize vault to deployer
    }

    function setToken(address tokenAddress) external onlyOwner {
        require(tokenAddress != address(0), "Token address cannot be zero");
        // Optional: Could add code to verify this is a Token1 by checking a function or interface
        address oldToken = address(token);
        token = Token1(tokenAddress);
        emit TokenAddressUpdated(oldToken, tokenAddress);
    }

    function setVaultAddress(address newVaultAddress) external onlyOwner {
        require(newVaultAddress != address(0), "Vault address cannot be zero");
        address oldVault = vaultAddress;
        vaultAddress = newVaultAddress;
        emit VaultAddressUpdated(oldVault, newVaultAddress);
    }

    function setTokenMultiplier(uint256 newMultiplier) external onlyOwner {
        require(newMultiplier > 0, "Multiplier must be greater than zero");
        uint256 oldMultiplier = tokenMultiplier;
        tokenMultiplier = newMultiplier;
        emit TokenMultiplierUpdated(oldMultiplier, newMultiplier);
    }

    function setDefaultEntryPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Entry price must be greater than zero");
        uint256 oldPrice = defaultEntryPrice;
        defaultEntryPrice = newPrice;
        emit DefaultEntryPriceUpdated(oldPrice, newPrice);
    }

    // On startQuiz, automatically complete any active quiz session with no bonus (fail)
    // Adds expiration: quiz session is auto-finished when new start begins, so no indefinite lock.
    function startQuiz(string memory quizId, uint256 expectedCorrectAnswers) external payable {
        require(msg.value > 0, "Must send ETH");
        require(bytes(quizId).length > 0, "Quiz ID cannot be empty");
        require(expectedCorrectAnswers > 0, "Expected correct answers must be greater than zero");
        
        QuizSession storage session = userSessions[msg.sender];

        // Automatically complete previous quiz session if active: fail with no bonus, mint no additional tokens
        if (session.active) {
            session.active = false;
            // Emit event for previous session fail completion
            uint256 initialTokensPrev = uint256(session.amountPaid) * tokenMultiplier;
            emit QuizCompleted(
                msg.sender, 
                session.quizId, 
                false, 
                initialTokensPrev, 
                0, 
                session.correctAnswers
            );
        }

        // start new session
        session.active = true;
        // Cast down to uint128 safe because msg.value fits in 128 bits (~3.4e38 wei)
        session.amountPaid = uint128(msg.value);
        session.timestamp = uint128(block.timestamp);
        session.quizId = quizId;
        session.correctAnswers = expectedCorrectAnswers;

        // Send ETH directly to vault address
        (bool sent, ) = vaultAddress.call{value: msg.value}("");
        require(sent, "Failed to send ETH to vault");

        uint256 initialTokens = msg.value * tokenMultiplier;
        token.mint(msg.sender, initialTokens);

        emit QuizStarted(msg.sender, quizId, uint128(msg.value), initialTokens);
    }

    function completeQuiz(uint256 submittedCorrectAnswers) external {
        QuizSession storage session = userSessions[msg.sender];
        require(session.active, "No active quiz session");

        session.active = false;

        uint256 initialTokens = uint256(session.amountPaid) * tokenMultiplier;
        bool success = submittedCorrectAnswers == session.correctAnswers;
        uint256 bonusTokens = success ? (initialTokens * 20) / 100 : 0;
        
        // Always mint to ensure consistent gas usage for estimation
        // Mint 1 wei minimum to maintain consistent gas path, plus bonus if successful
        token.mint(msg.sender, 1 + bonusTokens);
        
        emit QuizCompleted(
            msg.sender,
            session.quizId,
            success,
            initialTokens + bonusTokens,
            submittedCorrectAnswers,
            session.correctAnswers
        );
    }

    // View function to get user's current quiz session
    function getQuizSession(address user) external view returns (QuizSession memory) {
        return userSessions[user];
    }


    // Check if user has an active quiz
    function hasActiveQuiz(address user) external view returns (bool) {
        return userSessions[user].active;
    }

    // Owner-only token minting
    function mintToken(address to, uint256 amount) external onlyOwner {
        token.mint(to, amount);
    }

    // Owner-only function to transfer Token1 ownership to a new address
    // This allows deploying a new QuizGame contract and transferring Token1 ownership to it
    function transferTokenOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        token.transferOwnership(newOwner);
    }

    // Withdraw ETH collected with reentrancy guard
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        (bool sent, ) = vaultAddress.call{value: balance}("");
        require(sent, "Withdrawal failed");
    }

    // Allow receiving ETH with empty receive fallback
    receive() external payable {}
}
