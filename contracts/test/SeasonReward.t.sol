// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {SeasonReward} from "../src/SeasonReward.sol";

contract SeasonRewardTest is Test {
    SeasonReward public seasonReward;
    address public owner;
    address public user1 = address(0x123);
    address public user2 = address(0x456);
    address public user3 = address(0x789);

    // Allow test contract to receive ETH
    receive() external payable {}

    function setUp() public {
        owner = address(this);
        seasonReward = new SeasonReward();
    }

    function testOwnerIsSetCorrectly() public view {
        assertEq(seasonReward.owner(), owner);
    }

    function testInitialState() public view {
        assertFalse(seasonReward.distributionEnded());
        assertEq(seasonReward.rewards(user1), 0);
        assertEq(address(seasonReward).balance, 0);
    }

    function testReceiveFunding() public {
        uint256 fundAmount = 10 ether;
        
        vm.expectEmit(true, false, false, true);
        emit SeasonReward.SeasonFunded(fundAmount);
        
        payable(address(seasonReward)).transfer(fundAmount);
        
        assertEq(address(seasonReward).balance, fundAmount);
    }

    function testSetSeasonRewards() public {
        address[] memory users = new address[](2);
        uint256[] memory amounts = new uint256[](2);
        
        users[0] = user1;
        users[1] = user2;
        amounts[0] = 1 ether;
        amounts[1] = 2 ether;

        vm.expectEmit(true, false, false, true);
        emit SeasonReward.RewardSet(user1, 1 ether);
        vm.expectEmit(true, false, false, true);
        emit SeasonReward.RewardSet(user2, 2 ether);

        seasonReward.setSeasonRewards(users, amounts);

        assertEq(seasonReward.rewards(user1), 1 ether);
        assertEq(seasonReward.rewards(user2), 2 ether);
    }

    function testSetSeasonRewardsLengthMismatch() public {
        address[] memory users = new address[](2);
        uint256[] memory amounts = new uint256[](1);
        
        users[0] = user1;
        users[1] = user2;
        amounts[0] = 1 ether;

        vm.expectRevert("Length mismatch");
        seasonReward.setSeasonRewards(users, amounts);
    }

    function testSetSeasonRewardsOnlyOwner() public {
        address[] memory users = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        
        users[0] = user1;
        amounts[0] = 1 ether;

        vm.prank(user1);
        vm.expectRevert("Not owner");
        seasonReward.setSeasonRewards(users, amounts);
    }

    function testSetSeasonRewardsAfterDistributionEnded() public {
        seasonReward.endDistribution();
        
        address[] memory users = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        
        users[0] = user1;
        amounts[0] = 1 ether;

        vm.expectRevert("Distribution ended");
        seasonReward.setSeasonRewards(users, amounts);
    }

    function testEndDistribution() public {
        assertFalse(seasonReward.distributionEnded());
        
        seasonReward.endDistribution();
        
        assertTrue(seasonReward.distributionEnded());
    }

    function testEndDistributionOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert("Not owner");
        seasonReward.endDistribution();
    }

    function testReopenDistribution() public {
        seasonReward.endDistribution();
        assertTrue(seasonReward.distributionEnded());
        
        seasonReward.reopenDistribution();
        assertFalse(seasonReward.distributionEnded());
    }

    function testClaimReward() public {
        // Fund the contract
        vm.deal(address(seasonReward), 10 ether);
        
        // Set reward for user1
        address[] memory users = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        users[0] = user1;
        amounts[0] = 1 ether;
        seasonReward.setSeasonRewards(users, amounts);

        uint256 initialBalance = user1.balance;

        vm.expectEmit(true, false, false, true);
        emit SeasonReward.Claimed(user1, 1 ether);

        vm.prank(user1);
        seasonReward.claimReward();

        assertEq(user1.balance, initialBalance + 1 ether);
        assertEq(seasonReward.rewards(user1), 0);
        assertTrue(seasonReward.hasClaimed(user1));
    }

    function testCannotClaimTwice() public {
        // Fund the contract
        vm.deal(address(seasonReward), 10 ether);
        
        // Set reward for user1
        address[] memory users = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        users[0] = user1;
        amounts[0] = 1 ether;
        seasonReward.setSeasonRewards(users, amounts);

        // First claim
        vm.prank(user1);
        seasonReward.claimReward();

        // Try second claim
        vm.prank(user1);
        vm.expectRevert("No reward");
        seasonReward.claimReward();
    }

    function testClaimRewardNoReward() public {
        vm.prank(user1);
        vm.expectRevert("No reward");
        seasonReward.claimReward();
    }

    function testClaimRewardAfterDistributionEnded() public {
        // Set reward for user1
        address[] memory users = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        users[0] = user1;
        amounts[0] = 1 ether;
        seasonReward.setSeasonRewards(users, amounts);

        // End distribution
        seasonReward.endDistribution();

        vm.prank(user1);
        vm.expectRevert("Claiming ended");
        seasonReward.claimReward();
    }

    function testClaimRewardInsufficientBalance() public {
        // Set reward but don't fund the contract
        address[] memory users = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        users[0] = user1;
        amounts[0] = 1 ether;
        seasonReward.setSeasonRewards(users, amounts);

        vm.prank(user1);
        vm.expectRevert("Native transfer failed");
        seasonReward.claimReward();
    }

    function testWithdraw() public {
        uint256 amount = 5 ether;
        vm.deal(address(seasonReward), amount);
        
        uint256 initialOwnerBalance = owner.balance;

        vm.expectEmit(true, false, false, true);
        emit SeasonReward.Withdrawn(owner, amount);

        seasonReward.withdraw();

        assertEq(owner.balance, initialOwnerBalance + amount);
        assertEq(address(seasonReward).balance, 0);
    }

    function testWithdrawNothingToWithdraw() public {
        vm.expectRevert("Nothing to withdraw");
        seasonReward.withdraw();
    }

    function testWithdrawOnlyOwner() public {
        vm.deal(address(seasonReward), 1 ether);
        
        vm.prank(user1);
        vm.expectRevert("Not owner");
        seasonReward.withdraw();
    }

    function testTransferOwnership() public {
        address newOwner = address(0x999);
        seasonReward.transferOwnership(newOwner);
        assertEq(seasonReward.owner(), newOwner);
    }

    function testTransferOwnershipOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert("Not owner");
        seasonReward.transferOwnership(user1);
    }

    // ========== VIEW FUNCTION TESTS ==========

    function testGetClaimStatus() public {
        // Set reward for user1
        address[] memory users = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        users[0] = user1;
        amounts[0] = 1 ether;
        seasonReward.setSeasonRewards(users, amounts);

        // Before claim
        (uint256 rewardAmount, bool claimed, bool canClaim) = seasonReward.getClaimStatus(user1);
        assertEq(rewardAmount, 1 ether);
        assertFalse(claimed);
        assertTrue(canClaim);

        // Fund and claim
        vm.deal(address(seasonReward), 10 ether);
        vm.prank(user1);
        seasonReward.claimReward();

        // After claim
        (rewardAmount, claimed, canClaim) = seasonReward.getClaimStatus(user1);
        assertEq(rewardAmount, 0);
        assertTrue(claimed);
        assertFalse(canClaim);
    }

    function testGetClaimStatusWhenDistributionEnded() public {
        // Set reward for user1
        address[] memory users = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        users[0] = user1;
        amounts[0] = 1 ether;
        seasonReward.setSeasonRewards(users, amounts);

        // End distribution
        seasonReward.endDistribution();

        (uint256 rewardAmount, bool claimed, bool canClaim) = seasonReward.getClaimStatus(user1);
        assertEq(rewardAmount, 1 ether);
        assertFalse(claimed);
        assertFalse(canClaim); // Can't claim because distribution ended
    }

    function testGetContractBalance() public {
        assertEq(seasonReward.getContractBalance(), 0);
        
        vm.deal(address(seasonReward), 5 ether);
        assertEq(seasonReward.getContractBalance(), 5 ether);
    }

    function testIsDistributionActive() public {
        assertTrue(seasonReward.isDistributionActive());
        
        seasonReward.endDistribution();
        assertFalse(seasonReward.isDistributionActive());
        
        seasonReward.reopenDistribution();
        assertTrue(seasonReward.isDistributionActive());
    }

    function testBatchGetClaimStatus() public {
        // Set rewards
        address[] memory users = new address[](3);
        uint256[] memory amounts = new uint256[](3);
        users[0] = user1;
        users[1] = user2;
        users[2] = user3;
        amounts[0] = 1 ether;
        amounts[1] = 2 ether;
        amounts[2] = 3 ether;
        seasonReward.setSeasonRewards(users, amounts);

        // Fund and have user1 claim
        vm.deal(address(seasonReward), 10 ether);
        vm.prank(user1);
        seasonReward.claimReward();

        // Batch check
        (uint256[] memory rewardAmounts, bool[] memory claimedStatus) = seasonReward.batchGetClaimStatus(users);
        
        assertEq(rewardAmounts[0], 0); // user1 claimed
        assertEq(rewardAmounts[1], 2 ether);
        assertEq(rewardAmounts[2], 3 ether);
        
        assertTrue(claimedStatus[0]); // user1 claimed
        assertFalse(claimedStatus[1]);
        assertFalse(claimedStatus[2]);
    }

    // ========== INTEGRATION TESTS ==========

    function testCompleteSeasonFlow() public {
        // Fund the contract
        uint256 totalFunding = 10 ether;
        vm.deal(address(seasonReward), totalFunding);

        // Set rewards for multiple users
        address[] memory users = new address[](3);
        uint256[] memory amounts = new uint256[](3);
        users[0] = user1;
        users[1] = user2;
        users[2] = user3;
        amounts[0] = 2 ether;
        amounts[1] = 3 ether;
        amounts[2] = 1 ether;

        seasonReward.setSeasonRewards(users, amounts);

        // Verify rewards are set
        assertEq(seasonReward.rewards(user1), 2 ether);
        assertEq(seasonReward.rewards(user2), 3 ether);
        assertEq(seasonReward.rewards(user3), 1 ether);

        // Users claim their rewards
        uint256 user1InitialBalance = user1.balance;
        uint256 user2InitialBalance = user2.balance;
        uint256 user3InitialBalance = user3.balance;

        vm.prank(user1);
        seasonReward.claimReward();
        
        vm.prank(user2);
        seasonReward.claimReward();
        
        vm.prank(user3);
        seasonReward.claimReward();

        // Verify balances
        assertEq(user1.balance, user1InitialBalance + 2 ether);
        assertEq(user2.balance, user2InitialBalance + 3 ether);
        assertEq(user3.balance, user3InitialBalance + 1 ether);

        // Verify claimed status
        assertTrue(seasonReward.hasClaimed(user1));
        assertTrue(seasonReward.hasClaimed(user2));
        assertTrue(seasonReward.hasClaimed(user3));

        // Owner withdraws remaining funds
        uint256 remainingFunds = totalFunding - 6 ether; // 4 ether left
        assertEq(address(seasonReward).balance, remainingFunds);
        
        uint256 ownerInitialBalance = owner.balance;
        seasonReward.withdraw();
        
        assertEq(owner.balance, ownerInitialBalance + remainingFunds);
        assertEq(address(seasonReward).balance, 0);
    }

    function testUpdateRewards() public {
        // Set initial rewards
        address[] memory users = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        users[0] = user1;
        amounts[0] = 1 ether;
        seasonReward.setSeasonRewards(users, amounts);

        assertEq(seasonReward.rewards(user1), 1 ether);

        // Update rewards
        amounts[0] = 2 ether;
        seasonReward.setSeasonRewards(users, amounts);

        assertEq(seasonReward.rewards(user1), 2 ether);
    }

    function testMultipleBatchRewards() public {
        // First batch
        address[] memory users1 = new address[](2);
        uint256[] memory amounts1 = new uint256[](2);
        users1[0] = user1;
        users1[1] = user2;
        amounts1[0] = 1 ether;
        amounts1[1] = 2 ether;
        seasonReward.setSeasonRewards(users1, amounts1);

        // Second batch
        address[] memory users2 = new address[](1);
        uint256[] memory amounts2 = new uint256[](1);
        users2[0] = user3;
        amounts2[0] = 3 ether;
        seasonReward.setSeasonRewards(users2, amounts2);

        // Verify all rewards
        assertEq(seasonReward.rewards(user1), 1 ether);
        assertEq(seasonReward.rewards(user2), 2 ether);
        assertEq(seasonReward.rewards(user3), 3 ether);
    }

    function testReopenDistributionAllowsClaims() public {
        // Set reward
        address[] memory users = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        users[0] = user1;
        amounts[0] = 1 ether;
        seasonReward.setSeasonRewards(users, amounts);
        vm.deal(address(seasonReward), 10 ether);

        // End distribution
        seasonReward.endDistribution();

        // User can't claim
        vm.prank(user1);
        vm.expectRevert("Claiming ended");
        seasonReward.claimReward();

        // Reopen distribution
        seasonReward.reopenDistribution();

        // User can claim now
        vm.prank(user1);
        seasonReward.claimReward();

        assertTrue(seasonReward.hasClaimed(user1));
    }
}
