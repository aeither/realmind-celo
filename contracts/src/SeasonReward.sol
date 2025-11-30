// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SeasonReward
 * @notice Season rewards distribution contract with claim functionality
 * @dev Admin sets rewards per user, users can claim until distribution ends
 */
contract SeasonReward {
    mapping(address => uint256) public rewards;
    mapping(address => bool) public hasClaimed;
    bool public distributionEnded;
    address public owner;

    event SeasonFunded(uint256 total);
    event RewardSet(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 amount);
    event Withdrawn(address indexed owner, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    function _onlyOwner() internal view {
        require(msg.sender == owner, "Not owner");
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Accept native coin for airdrop pool funding
    receive() external payable {
        emit SeasonFunded(msg.value);
    }

    /// @notice Set or update rewards for users (can call in multiple batches)
    /// @param users Array of user addresses
    /// @param amounts Array of reward amounts (in wei)
    function setSeasonRewards(address[] calldata users, uint256[] calldata amounts) external onlyOwner {
        require(!distributionEnded, "Distribution ended");
        require(users.length == amounts.length, "Length mismatch");
        for (uint256 i = 0; i < users.length; i++) {
            rewards[users[i]] = amounts[i];
            emit RewardSet(users[i], amounts[i]);
        }
    }

    /// @notice End claim phase for the season
    function endDistribution() external onlyOwner {
        distributionEnded = true;
    }

    /// @notice Reopen distribution (in case of error)
    function reopenDistribution() external onlyOwner {
        distributionEnded = false;
    }

    /// @notice User claims their allocated reward
    function claimReward() external {
        require(!distributionEnded, "Claiming ended");
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No reward");
        require(!hasClaimed[msg.sender], "Already claimed");
        
        hasClaimed[msg.sender] = true;
        rewards[msg.sender] = 0;
        
        (bool sent, ) = msg.sender.call{value: reward}("");
        require(sent, "Native transfer failed");
        emit Claimed(msg.sender, reward);
    }

    /// @notice Owner can withdraw leftover native coins at any time
    function withdraw() external onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "Nothing to withdraw");
        (bool sent, ) = owner.call{value: amount}("");
        require(sent, "Withdraw failed");
        emit Withdrawn(owner, amount);
    }

    /// @notice Transfer ownership to a new address
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    // ========== VIEW FUNCTIONS FOR FRONTEND ==========

    /// @notice Get user's claim status
    /// @param user Address to check
    /// @return rewardAmount Amount user can claim (0 if already claimed)
    /// @return claimed Whether user has already claimed
    /// @return canClaim Whether user can claim right now
    function getClaimStatus(address user) external view returns (
        uint256 rewardAmount,
        bool claimed,
        bool canClaim
    ) {
        rewardAmount = rewards[user];
        claimed = hasClaimed[user];
        canClaim = !distributionEnded && rewardAmount > 0 && !claimed;
    }

    /// @notice Get contract balance
    /// @return Current native token balance of the contract
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Check if distribution is active
    /// @return True if users can still claim
    function isDistributionActive() external view returns (bool) {
        return !distributionEnded;
    }

    /// @notice Batch get claim status for multiple users
    /// @param users Array of user addresses
    /// @return rewardAmounts Array of reward amounts
    /// @return claimedStatus Array of claimed status
    function batchGetClaimStatus(address[] calldata users) external view returns (
        uint256[] memory rewardAmounts,
        bool[] memory claimedStatus
    ) {
        rewardAmounts = new uint256[](users.length);
        claimedStatus = new bool[](users.length);
        
        for (uint256 i = 0; i < users.length; i++) {
            rewardAmounts[i] = rewards[users[i]];
            claimedStatus[i] = hasClaimed[users[i]];
        }
    }
}
