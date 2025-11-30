// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {BunnyGame, EggToken, RetentionSystem} from "../src/BunnyGame.sol";

contract BunnyGameTest is Test {
    BunnyGame public bunnyGame;
    EggToken public eggToken;
    address public admin;
    address public player1 = address(0x123);
    address public player2 = address(0x456);

    receive() external payable {}

    function setUp() public {
        admin = address(this);

        // Deploy tokens
        eggToken = new EggToken();

        // Deploy BunnyGame
        bunnyGame = new BunnyGame(address(eggToken));

        // Grant minter roles
        eggToken.grantRole(eggToken.MINTER_ROLE(), address(bunnyGame));
    }

    // ========== INITIALIZATION TESTS ==========

    function testInitialBunnyState() public view {
        (
            uint256 happiness,
            uint256 claimableActions,
            uint256 lastActionUpdate,
            uint256 totalEggsLaid,
            uint256 instantActionsRemaining,
            bool initialized
        ) = bunnyGame.getBunny(player1);

        assertEq(happiness, 0);
        assertEq(claimableActions, 0);
        assertEq(lastActionUpdate, 0);
        assertEq(totalEggsLaid, 0);
        assertEq(instantActionsRemaining, 0);
        assertFalse(initialized);
    }

    function testBunnyInitializesOnFirstAction() public {
        vm.prank(player1);
        bunnyGame.tapBunny();

        (
            uint256 happiness,
            uint256 claimableActions,
            ,
            ,
            uint256 instantActionsRemaining,
            bool initialized
        ) = bunnyGame.getBunny(player1);

        assertTrue(initialized);
        assertEq(happiness, 10);
        assertEq(instantActionsRemaining, 9); // Started with 10, used 1
        assertEq(claimableActions, 10); // Initialized with max claimable
    }

    // ========== ACTION ACCUMULATION TESTS ==========

    function testActionsAccumulateOverTime() public {
        // Initialize bunny
        vm.prank(player1);
        bunnyGame.tapBunny();

        // Use all instant actions
        for (uint256 i = 0; i < 9; i++) {
            vm.prank(player1);
            bunnyGame.tapBunny();
        }

        // Use all claimable actions
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(player1);
            bunnyGame.tapBunny();
        }

        // Now should have no actions left
        vm.prank(player1);
        vm.expectRevert("BunnyGame: No actions available");
        bunnyGame.tapBunny();

        // Warp 2 hours (should accumulate 1 action)
        vm.warp(block.timestamp + 2 hours);

        // Should be able to perform 1 action
        vm.prank(player1);
        bunnyGame.tapBunny();

        // Should not be able to perform another
        vm.prank(player1);
        vm.expectRevert("BunnyGame: No actions available");
        bunnyGame.tapBunny();
    }

    function testActionsAccumulateToMax10() public {
        // Initialize bunny
        vm.prank(player1);
        bunnyGame.tapBunny();

        // Use all instant and claimable actions
        for (uint256 i = 0; i < 19; i++) {
            vm.prank(player1);
            bunnyGame.tapBunny();
        }

        // Warp 30 hours (should accumulate 15 actions, but capped at 10)
        vm.warp(block.timestamp + 30 hours);

        (
            ,
            uint256 claimableActions,
            ,
            ,
            ,
        ) = bunnyGame.getBunny(player1);

        assertEq(claimableActions, 10); // Capped at max
    }

    function testGetTimeUntilNextAction() public {
        // Initialize bunny
        vm.prank(player1);
        bunnyGame.tapBunny();

        // Use all actions
        for (uint256 i = 0; i < 19; i++) {
            vm.prank(player1);
            bunnyGame.tapBunny();
        }

        // Should show time until next accumulation
        uint256 timeUntil = bunnyGame.getTimeUntilNextAction(player1);
        assertGt(timeUntil, 0);
        assertLe(timeUntil, 2 hours);

        // Warp exactly 2 hours - now we have 1 action accumulated
        vm.warp(block.timestamp + 2 hours);

        // Action should be available now
        assertTrue(bunnyGame.isActionAvailable(player1));
    }

    // ========== EGG LAYING TESTS ==========

    function testLayEggWhenHappinessIs100() public {
        // Get bunny to 100 happiness
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(player1);
            bunnyGame.tapBunny();
        }

        // Lay egg
        vm.prank(player1);
        bunnyGame.layEgg();

        assertEq(eggToken.balanceOf(player1), 1 ether);

        (uint256 happiness, , , uint256 totalEggsLaid, , ) = bunnyGame.getBunny(player1);
        assertEq(happiness, 0);
        assertEq(totalEggsLaid, 1);
    }

    function testCannotLayEggWithLessThan100Happiness() public {
        vm.prank(player1);
        bunnyGame.tapBunny();

        vm.prank(player1);
        vm.expectRevert("BunnyGame: Bunny happiness must be 100 to lay egg");
        bunnyGame.layEgg();
    }

    // ========== DIFFERENT ACTION TYPES ==========

    function testAllActionTypesWork() public {
        vm.prank(player1);
        bunnyGame.tapBunny();
        (uint256 h1,,,,, ) = bunnyGame.getBunny(player1);
        assertEq(h1, 10);

        vm.prank(player1);
        bunnyGame.feedBunny();
        (uint256 h2,,,,, ) = bunnyGame.getBunny(player1);
        assertEq(h2, 20);

        vm.prank(player1);
        bunnyGame.petBunny();
        (uint256 h3,,,,, ) = bunnyGame.getBunny(player1);
        assertEq(h3, 30);
    }

    // ========== VIEW FUNCTION TESTS ==========

    function testIsActionAvailable() public {
        // Should be available for new user
        assertTrue(bunnyGame.isActionAvailable(player1));

        // Initialize and use all actions
        for (uint256 i = 0; i < 20; i++) {
            vm.prank(player1);
            bunnyGame.tapBunny();
        }

        // Should not be available
        assertFalse(bunnyGame.isActionAvailable(player1));

        // Warp 2 hours
        vm.warp(block.timestamp + 2 hours);

        // Should be available again
        assertTrue(bunnyGame.isActionAvailable(player1));
    }

    function testGetTotalActions() public {
        // New user should have 20 total (10 instant + 10 claimable)
        assertEq(bunnyGame.getTotalActions(player1), 20);

        // After initialization and one action
        vm.prank(player1);
        bunnyGame.tapBunny();
        
        assertEq(bunnyGame.getTotalActions(player1), 19);
    }

    function testCanLayEgg() public {
        assertFalse(bunnyGame.canLayEgg(player1));

        // Get bunny to 100 happiness
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(player1);
            bunnyGame.tapBunny();
        }

        assertTrue(bunnyGame.canLayEgg(player1));
    }

    // ========== OWNERSHIP TESTS ==========

    function testTransferOwnership() public {
        address newOwner = address(0x999);
        bunnyGame.transferOwnership(newOwner);
        assertEq(bunnyGame.owner(), newOwner);
    }

    function testOnlyOwnerCanTransferOwnership() public {
        vm.prank(player1);
        vm.expectRevert("BunnyGame: caller is not the owner");
        bunnyGame.transferOwnership(player1);
    }

    // ========== INTEGRATION TEST ==========

    function testFullGameCycle() public {
        // Player uses free actions to lay an egg
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(player1);
            bunnyGame.tapBunny();
        }

        vm.prank(player1);
        bunnyGame.layEgg();
        assertEq(eggToken.balanceOf(player1), 1 ether);

        // Lay another egg
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(player1);
            bunnyGame.tapBunny();
        }

        vm.prank(player1);
        bunnyGame.layEgg();
        assertEq(eggToken.balanceOf(player1), 2 ether);

        (, , , uint256 totalEggsLaid, , ) = bunnyGame.getBunny(player1);
        assertEq(totalEggsLaid, 2);
    }
}

contract RetentionSystemTest is Test {
    RetentionSystem public retentionSystem;
    EggToken public eggToken;
    address public player1 = address(0x123);
    address public player2 = address(0x456);
    address public player3 = address(0x789);

    function setUp() public {
        // Deploy EggToken
        eggToken = new EggToken();

        // Deploy RetentionSystem
        retentionSystem = new RetentionSystem(address(eggToken));

        // Grant minter role to RetentionSystem
        eggToken.grantRole(eggToken.MINTER_ROLE(), address(retentionSystem));
    }

    // ========== CHECK-IN TESTS ==========

    function testFirstCheckIn() public {
        vm.prank(player1);
        retentionSystem.checkIn();

        (uint256 lastCheck, uint256 streak, , , bool canCheckIn) = retentionSystem.getUserStats(player1);

        assertEq(streak, 1);
        assertEq(lastCheck, block.timestamp);
        assertEq(canCheckIn, false); // Can't check in again immediately
        assertEq(eggToken.balanceOf(player1), 1 ether); // Base eggs
    }

    function testConsecutiveCheckIns() public {
        // Day 1
        vm.prank(player1);
        retentionSystem.checkIn();
        assertEq(eggToken.balanceOf(player1), 1 ether);

        // Day 2 (20 hours later)
        skip(20 hours);
        vm.prank(player1);
        retentionSystem.checkIn();

        (, uint256 streak, , , ) = retentionSystem.getUserStats(player1);
        assertEq(streak, 2);
        assertEq(eggToken.balanceOf(player1), 2 ether); // 1 + 1

        // Day 3 (20 hours later) - should get 2 eggs
        skip(20 hours);
        vm.prank(player1);
        retentionSystem.checkIn();

        (, streak, , , ) = retentionSystem.getUserStats(player1);
        assertEq(streak, 3);
        assertEq(eggToken.balanceOf(player1), 4 ether); // 1 + 1 + 2
    }

    function testMaxStreakReward() public {
        // Build up to 7-day streak
        for (uint256 i = 0; i < 7; i++) {
            vm.prank(player1);
            retentionSystem.checkIn();
            if (i < 6) skip(20 hours);
        }

        (, uint256 streak, , , ) = retentionSystem.getUserStats(player1);
        assertEq(streak, 7);
        // 1 + 1 + 2 + 2 + 2 + 2 + 3 = 13 eggs
        assertEq(eggToken.balanceOf(player1), 13 ether);

        // 8th day should still get 3 eggs (capped at 7)
        skip(20 hours);
        vm.prank(player1);
        retentionSystem.checkIn();

        (, streak, , , ) = retentionSystem.getUserStats(player1);
        assertEq(streak, 7); // Stays at 7
        assertEq(eggToken.balanceOf(player1), 16 ether); // 13 + 3
    }

    function testStreakBreak() public {
        // Build streak to 3
        for (uint256 i = 0; i < 3; i++) {
            vm.prank(player1);
            retentionSystem.checkIn();
            if (i < 2) skip(20 hours);
        }

        (, uint256 streak, , , ) = retentionSystem.getUserStats(player1);
        assertEq(streak, 3);

        // Skip more than 48 hours (2 * ONE_DAY)
        skip(50 hours);

        vm.prank(player1);
        retentionSystem.checkIn();

        (, streak, , , ) = retentionSystem.getUserStats(player1);
        assertEq(streak, 1); // Streak broken, reset to 1
    }

    function testCannotCheckInTwiceInOneDay() public {
        vm.prank(player1);
        retentionSystem.checkIn();

        // Try to check in again immediately
        vm.prank(player1);
        vm.expectRevert(abi.encodeWithSelector(RetentionSystem.AlreadyCheckedInToday.selector));
        retentionSystem.checkIn();

        // Try after 19 hours (still within 20 hour window)
        skip(19 hours);
        vm.prank(player1);
        vm.expectRevert(abi.encodeWithSelector(RetentionSystem.AlreadyCheckedInToday.selector));
        retentionSystem.checkIn();

        // Should work after 20 hours
        skip(1 hours);
        vm.prank(player1);
        retentionSystem.checkIn(); // Should succeed
    }

    // ========== REFERRAL TESTS ==========

    function testReferralCheckIn() public {
        // Player2 checks in first to become active
        vm.prank(player2);
        retentionSystem.checkIn();

        // Player1 checks in with Player2 as referrer
        vm.prank(player1);
        retentionSystem.checkInWithReferral(player2);

        // Player1 should have 1 base + 5 referral bonus
        assertEq(eggToken.balanceOf(player1), 6 ether);

        // Player2 should have 1 base + 5 referral bonus
        assertEq(eggToken.balanceOf(player2), 6 ether);

        // Check referral count
        (, , , uint256 referrals, ) = retentionSystem.getUserStats(player2);
        assertEq(referrals, 1);

        // Check referred by
        assertEq(retentionSystem.referredBy(player1), player2);
    }

    function testCannotReferSelf() public {
        // Player1 checks in first
        vm.prank(player1);
        retentionSystem.checkIn();

        // Try to refer self
        vm.prank(player1);
        vm.expectRevert(abi.encodeWithSelector(RetentionSystem.CannotReferSelf.selector));
        retentionSystem.checkInWithReferral(player1);
    }

    function testCannotBeReferredTwice() public {
        // Player2 checks in first
        vm.prank(player2);
        retentionSystem.checkIn();

        // Player1 checks in with referral
        vm.prank(player1);
        retentionSystem.checkInWithReferral(player2);

        // Skip a day
        skip(20 hours);

        // Try to check in with another referral (player3)
        vm.prank(player3);
        retentionSystem.checkIn(); // Make player3 active

        skip(20 hours);

        vm.prank(player1);
        vm.expectRevert(abi.encodeWithSelector(RetentionSystem.AlreadyReferred.selector));
        retentionSystem.checkInWithReferral(player3);
    }

    function testReferrerMustBeActive() public {
        // Try to use player2 as referrer without player2 having checked in
        vm.prank(player1);
        vm.expectRevert(abi.encodeWithSelector(RetentionSystem.ReferrerNotActive.selector));
        retentionSystem.checkInWithReferral(player2);
    }

    function testMultipleReferrals() public {
        // Player1 checks in first
        vm.prank(player1);
        retentionSystem.checkIn();

        // Player2 refers player1
        vm.prank(player2);
        retentionSystem.checkInWithReferral(player1);

        skip(20 hours);

        // Player3 refers player1
        vm.prank(player3);
        retentionSystem.checkInWithReferral(player1);

        // Player1 should have 1 base + 2*5 referral bonuses
        assertEq(eggToken.balanceOf(player1), 11 ether);

        // Check referral count
        (, , , uint256 referrals, ) = retentionSystem.getUserStats(player1);
        assertEq(referrals, 2);
    }

    // ========== VIEW FUNCTION TESTS ==========

    function testGetNextReward() public {
        // First check-in
        vm.prank(player1);
        retentionSystem.checkIn();

        // Next reward should be 1 egg (streak is only 1)
        skip(20 hours);
        uint256 nextReward = retentionSystem.getNextReward(player1);
        assertEq(nextReward, 1 ether);

        // After second check-in, next should be 2
        vm.prank(player1);
        retentionSystem.checkIn();
        skip(20 hours);
        nextReward = retentionSystem.getNextReward(player1);
        assertEq(nextReward, 2 ether); // Streak will be 3

        // Build to streak 6
        for (uint256 i = 0; i < 4; i++) {
            vm.prank(player1);
            retentionSystem.checkIn();
            skip(20 hours);
        }

        nextReward = retentionSystem.getNextReward(player1);
        assertEq(nextReward, 3 ether); // Streak will be 7
    }

    function testWillStreakBreak() public {
        vm.prank(player1);
        retentionSystem.checkIn();

        // Within 48 hours - should not break
        skip(40 hours);
        assertEq(retentionSystem.willStreakBreak(player1), false);

        // After 48 hours - should break
        skip(10 hours);
        assertEq(retentionSystem.willStreakBreak(player1), true);
    }

    function testTimeUntilNextCheckIn() public {
        vm.prank(player1);
        retentionSystem.checkIn();

        // Immediately after check-in, should be 20 hours
        uint256 timeUntil = retentionSystem.timeUntilNextCheckIn(player1);
        assertEq(timeUntil, 20 hours);

        // After 10 hours, should be 10 hours
        skip(10 hours);
        timeUntil = retentionSystem.timeUntilNextCheckIn(player1);
        assertEq(timeUntil, 10 hours);

        // After 20 hours, should be 0
        skip(10 hours);
        timeUntil = retentionSystem.timeUntilNextCheckIn(player1);
        assertEq(timeUntil, 0);
    }

    // ========== INTEGRATION TEST ==========

    function testFullRetentionFlow() public {
        // Player1 builds a 7-day streak
        for (uint256 i = 0; i < 7; i++) {
            vm.prank(player1);
            retentionSystem.checkIn();
            if (i < 6) skip(20 hours);
        }

        // Player2 refers player1 and checks in
        skip(20 hours);
        vm.prank(player2);
        retentionSystem.checkInWithReferral(player1);

        // Player3 also refers player1
        skip(20 hours);
        vm.prank(player3);
        retentionSystem.checkInWithReferral(player1);

        // Check final balances
        // Player1: 1+1+2+2+2+2+3 = 13 base + 10 referral bonuses = 23
        assertEq(eggToken.balanceOf(player1), 23 ether);

        // Player2: 1 base + 5 referral = 6
        assertEq(eggToken.balanceOf(player2), 6 ether);

        // Player3: 1 base + 5 referral = 6
        assertEq(eggToken.balanceOf(player3), 6 ether);

        // Check stats
        (, uint256 streak1, , uint256 referrals1, ) = retentionSystem.getUserStats(player1);
        assertEq(streak1, 7);
        assertEq(referrals1, 2);

        (, uint256 streak2, address referrer2, , ) = retentionSystem.getUserStats(player2);
        assertEq(streak2, 1);
        assertEq(referrer2, player1);

        (, uint256 streak3, address referrer3, , ) = retentionSystem.getUserStats(player3);
        assertEq(streak3, 1);
        assertEq(referrer3, player1);
    }
}

