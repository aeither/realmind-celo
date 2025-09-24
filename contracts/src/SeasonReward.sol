// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SeasonReward {
    mapping(address => uint256) public rewards;
    bool public distributionEnded;
    address public owner;

    event SeasonFunded(uint256 total);
    event RewardSet(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 amount);
    event Withdrawn(address indexed owner, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Accept native coin for airdrop pool funding
    receive() external payable {
        emit SeasonFunded(msg.value);
    }

    // Set or update rewards for users (can call in multiple batches)
    function setSeasonRewards(address[] calldata users, uint256[] calldata amounts) external onlyOwner {
        require(!distributionEnded, "Distribution ended");
        require(users.length == amounts.length, "Length mismatch");
        for (uint256 i = 0; i < users.length; i++) {
            rewards[users[i]] = amounts[i];
            emit RewardSet(users[i], amounts[i]);
        }
    }

    // End claim phase for the season
    function endDistribution() external onlyOwner {
        distributionEnded = true;
    }

    // User claims their allocated reward
    function claimReward() external {
        require(!distributionEnded, "Claiming ended");
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No reward");
        rewards[msg.sender] = 0;
        (bool sent, ) = msg.sender.call{value: reward}("");
        require(sent, "Native transfer failed");
        emit Claimed(msg.sender, reward);
    }

    // Owner can withdraw leftover native coins at any time
    function withdraw() external onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "Nothing to withdraw");
        (bool sent, ) = owner.call{value: amount}("");
        require(sent, "Withdraw failed");
        emit Withdrawn(owner, amount);
    }
}
