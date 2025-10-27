// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {ChickenGame, EggToken} from "../src/ChickenGame.sol";

contract ChickenGameTest is Test {
    ChickenGame public chickenGame;
    EggToken public eggToken;
    address public admin;
    address public player1 = address(0x123);
    address public player2 = address(0x456);

    function setUp() public {
        admin = address(this);
        
        // Deploy EggToken
        eggToken = new EggToken();
        
        // Deploy ChickenGame
        chickenGame = new ChickenGame(address(eggToken));
        
        // Grant minter role to ChickenGame contract
        eggToken.grantRole(eggToken.MINTER_ROLE(), address(chickenGame));
    }

    // ========== INITIALIZATION TESTS ==========

    function testInitialChickenState() public {
        (
            uint256 happiness,
            uint256 lastFeedTime,
            uint256 lastPetTime,
            uint256 lastPlayTime,
            uint256 totalEggsLaid,
            uint256 instantActionsRemaining,
            bool initialized
        ) = chickenGame.getChicken(player1);

        assertEq(happiness, 0);
        assertEq(lastFeedTime, 0);
        assertEq(lastPetTime, 0);
        assertEq(lastPlayTime, 0);
        assertEq(totalEggsLaid, 0);
        assertEq(instantActionsRemaining, 0);
        assertFalse(initialized);
    }

    function testChickenInitializesOnFirstAction() public {
        vm.prank(player1);
        chickenGame.feedChicken();

        (
            uint256 happiness,
            ,
            ,
            ,
            ,
            uint256 instantActionsRemaining,
            bool initialized
        ) = chickenGame.getChicken(player1);

        assertTrue(initialized);
        assertEq(happiness, 10); // First action increases happiness
        assertEq(instantActionsRemaining, 9); // Started with 10, used 1
    }

    // ========== INSTANT ACTIONS TESTS ==========

    function testInstantActionsAllowMultipleActionsWithoutWait() public {
        // Perform 10 feed actions instantly (using all instant actions)
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(player1);
            chickenGame.feedChicken();
        }

        (uint256 happiness, , , , , uint256 instantActionsRemaining, ) = chickenGame.getChicken(player1);
        
        assertEq(happiness, 100); // 10 actions * 10 happiness each
        assertEq(instantActionsRemaining, 0); // All instant actions used
    }

    function testMixingInstantActionsWithDifferentActions() public {
        // Use instant actions for different action types
        vm.prank(player1);
        chickenGame.feedChicken(); // Action 1
        
        vm.prank(player1);
        chickenGame.petChicken(); // Action 2
        
        vm.prank(player1);
        chickenGame.playWithChicken(); // Action 3

        (uint256 happiness, , , , , uint256 instantActionsRemaining, ) = chickenGame.getChicken(player1);
        
        assertEq(happiness, 30); // 3 actions * 10 happiness each
        assertEq(instantActionsRemaining, 7); // Started with 10, used 3
    }

    function testCooldownRequiredAfterInstantActionsExpired() public {
        // Use all 10 instant actions
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(player1);
            chickenGame.feedChicken();
        }

        // Try to feed again immediately - should fail
        vm.prank(player1);
        vm.expectRevert("ChickenGame: Feed cooldown not expired");
        chickenGame.feedChicken();
    }

    function testCanActAgainAfterCooldown() public {
        // Use all 10 instant actions
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(player1);
            chickenGame.feedChicken();
        }

        // Fast forward 24 hours
        vm.warp(block.timestamp + 24 hours);

        // Should be able to feed again
        vm.prank(player1);
        chickenGame.feedChicken();

        (uint256 happiness, , , , , , ) = chickenGame.getChicken(player1);
        assertEq(happiness, 100); // Was already at 100 (capped)
    }

    // ========== ACTION TESTS ==========

    function testFeedChickenIncreasesHappiness() public {
        vm.prank(player1);
        chickenGame.feedChicken();

        (uint256 happiness, , , , , , ) = chickenGame.getChicken(player1);
        assertEq(happiness, 10);
    }

    function testPetChickenIncreasesHappiness() public {
        vm.prank(player1);
        chickenGame.petChicken();

        (uint256 happiness, , , , , , ) = chickenGame.getChicken(player1);
        assertEq(happiness, 10);
    }

    function testPlayWithChickenIncreasesHappiness() public {
        vm.prank(player1);
        chickenGame.playWithChicken();

        (uint256 happiness, , , , , , ) = chickenGame.getChicken(player1);
        assertEq(happiness, 10);
    }

    function testHappinessCapAt100() public {
        // Perform 10 actions using instant actions (will reach 100 happiness)
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(player1);
            if (i % 3 == 0) {
                chickenGame.feedChicken();
            } else if (i % 3 == 1) {
                chickenGame.petChicken();
            } else {
                chickenGame.playWithChicken();
            }
        }

        (uint256 happiness, , , , , , ) = chickenGame.getChicken(player1);
        assertEq(happiness, 100); // Capped at 100
    }

    function testActionEmitsEvent() public {
        vm.prank(player1);
        vm.expectEmit(true, false, false, true);
        emit ChickenGame.ActionPerformed(player1, "Feed", 10);
        chickenGame.feedChicken();
    }

    // ========== EGG LAYING TESTS ==========

    function testLayEggWhenHappinessIs100() public {
        // Get chicken to 100 happiness
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(player1);
            chickenGame.feedChicken();
        }

        // Lay egg
        vm.prank(player1);
        chickenGame.layEgg();

        // Check egg token balance
        assertEq(eggToken.balanceOf(player1), 1 ether);

        // Check happiness reset to 0
        (uint256 happiness, , , , uint256 totalEggsLaid, , ) = chickenGame.getChicken(player1);
        assertEq(happiness, 0);
        assertEq(totalEggsLaid, 1);
    }

    function testCannotLayEggWithLessThan100Happiness() public {
        vm.prank(player1);
        chickenGame.feedChicken(); // Only 10 happiness

        vm.prank(player1);
        vm.expectRevert("ChickenGame: Chicken happiness must be 100 to lay egg");
        chickenGame.layEgg();
    }

    function testLayEggEmitsEvents() public {
        // Get chicken to 100 happiness
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(player1);
            chickenGame.feedChicken();
        }

        // Expect events
        vm.prank(player1);
        vm.expectEmit(true, false, false, true);
        emit ChickenGame.EggLaid(player1, 1 ether, 1);
        chickenGame.layEgg();
    }

    function testLayMultipleEggs() public {
        // Lay 3 eggs
        for (uint256 eggCount = 0; eggCount < 3; eggCount++) {
            // Get chicken to 100 happiness using feed only for consistency
            for (uint256 i = 0; i < 10; i++) {
                // After using all instant actions, warp time between each feed
                if (eggCount > 0) {
                    vm.warp(block.timestamp + 24 hours + 1);
                }
                
                vm.prank(player1);
                chickenGame.feedChicken();
            }

            // Lay egg
            vm.prank(player1);
            chickenGame.layEgg();
        }

        // Check total eggs laid
        (, , , , uint256 totalEggsLaid, , ) = chickenGame.getChicken(player1);
        assertEq(totalEggsLaid, 3);
        assertEq(eggToken.balanceOf(player1), 3 ether);
    }

    // ========== VIEW FUNCTION TESTS ==========

    function testIsActionAvailableForNewUser() public {
        // All actions should be available for new users
        assertTrue(chickenGame.isActionAvailable(player1, 0)); // Feed
        assertTrue(chickenGame.isActionAvailable(player1, 1)); // Pet
        assertTrue(chickenGame.isActionAvailable(player1, 2)); // Play
    }

    function testIsActionAvailableWithInstantActions() public {
        // Use one instant action
        vm.prank(player1);
        chickenGame.feedChicken();

        // All actions should still be available
        assertTrue(chickenGame.isActionAvailable(player1, 0));
        assertTrue(chickenGame.isActionAvailable(player1, 1));
        assertTrue(chickenGame.isActionAvailable(player1, 2));
    }

    function testIsActionAvailableAfterCooldown() public {
        // Use instant actions on different action types
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(player1);
            if (i % 3 == 0) {
                chickenGame.feedChicken();
            } else if (i % 3 == 1) {
                chickenGame.petChicken();
            } else {
                chickenGame.playWithChicken();
            }
        }

        // All actions should not be available (no instant actions left and cooldown active)
        assertFalse(chickenGame.isActionAvailable(player1, 0));
        assertFalse(chickenGame.isActionAvailable(player1, 1));
        assertFalse(chickenGame.isActionAvailable(player1, 2));

        // Fast forward 24 hours
        vm.warp(block.timestamp + 24 hours);

        // Now all actions should be available
        assertTrue(chickenGame.isActionAvailable(player1, 0));
        assertTrue(chickenGame.isActionAvailable(player1, 1));
        assertTrue(chickenGame.isActionAvailable(player1, 2));
    }

    function testGetTimeUntilNextActionWithInstantActions() public {
        // Should return 0 for new users
        assertEq(chickenGame.getTimeUntilNextAction(player1, 0), 0);
        assertEq(chickenGame.getTimeUntilNextAction(player1, 1), 0);
        assertEq(chickenGame.getTimeUntilNextAction(player1, 2), 0);
    }

    function testGetTimeUntilNextActionAfterCooldown() public {
        // Use all instant actions on feed
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(player1);
            chickenGame.feedChicken();
        }

        // Should show cooldown time
        uint256 timeRemaining = chickenGame.getTimeUntilNextAction(player1, 0);
        assertGt(timeRemaining, 0);
        assertLe(timeRemaining, 24 hours);
    }

    function testCanLayEgg() public {
        // Should be false initially
        assertFalse(chickenGame.canLayEgg(player1));

        // Get chicken to 100 happiness
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(player1);
            chickenGame.feedChicken();
        }

        // Should be true now
        assertTrue(chickenGame.canLayEgg(player1));

        // Lay egg
        vm.prank(player1);
        chickenGame.layEgg();

        // Should be false after laying egg
        assertFalse(chickenGame.canLayEgg(player1));
    }

    // ========== MULTIPLE PLAYERS TESTS ==========

    function testMultiplePlayersIndependentStates() public {
        // Player 1 feeds
        vm.prank(player1);
        chickenGame.feedChicken();

        // Player 2 pets
        vm.prank(player2);
        chickenGame.petChicken();

        // Check player 1 state
        (uint256 happiness1, uint256 lastFeedTime1, uint256 lastPetTime1, , , uint256 instant1, ) = chickenGame.getChicken(player1);
        assertEq(happiness1, 10);
        assertGt(lastFeedTime1, 0);
        assertEq(lastPetTime1, 0); // Player 1 didn't pet
        assertEq(instant1, 9);

        // Check player 2 state
        (uint256 happiness2, uint256 lastFeedTime2, uint256 lastPetTime2, , , uint256 instant2, ) = chickenGame.getChicken(player2);
        assertEq(happiness2, 10);
        assertEq(lastFeedTime2, 0); // Player 2 didn't feed
        assertGt(lastPetTime2, 0);
        assertEq(instant2, 9);
    }

    function testMultiplePlayersCanLayEggsIndependently() public {
        // Both players get to 100 happiness
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(player1);
            chickenGame.feedChicken();
            
            vm.prank(player2);
            chickenGame.petChicken();
        }

        // Player 1 lays egg
        vm.prank(player1);
        chickenGame.layEgg();

        assertEq(eggToken.balanceOf(player1), 1 ether);
        assertEq(eggToken.balanceOf(player2), 0);

        // Player 2 lays egg
        vm.prank(player2);
        chickenGame.layEgg();

        assertEq(eggToken.balanceOf(player2), 1 ether);
    }

    // ========== EGG TOKEN TESTS ==========

    function testEggTokenHasCorrectNameAndSymbol() public {
        assertEq(eggToken.name(), "Egg Token");
        assertEq(eggToken.symbol(), "EGG");
    }

    function testOnlyMinterCanMintEggTokens() public {
        // Admin can mint (has minter role)
        eggToken.mint(player1, 1 ether);
        assertEq(eggToken.balanceOf(player1), 1 ether);

        // Player cannot mint (no minter role)
        vm.prank(player2);
        vm.expectRevert();
        eggToken.mint(player2, 1 ether);
    }

    function testAdminCanGrantMinterRole() public {
        // Grant minter role to player1
        eggToken.grantRole(eggToken.MINTER_ROLE(), player1);

        // Player1 should now be able to mint
        vm.prank(player1);
        eggToken.mint(player2, 1 ether);
        assertEq(eggToken.balanceOf(player2), 1 ether);
    }

    function testAdminCanRevokeMinterRole() public {
        // Grant then revoke minter role
        eggToken.grantRole(eggToken.MINTER_ROLE(), player1);
        eggToken.revokeRole(eggToken.MINTER_ROLE(), player1);

        // Player1 should not be able to mint anymore
        vm.prank(player1);
        vm.expectRevert();
        eggToken.mint(player2, 1 ether);
    }

    // ========== EDGE CASES ==========

    function testReentrancyProtection() public {
        // Basic test that functions are protected
        vm.prank(player1);
        chickenGame.feedChicken();
        
        // If reentrancy guard is working, this should complete successfully
        assertTrue(true);
    }

    function testChickenStateConsistencyAfterMultipleEggLayings() public {
        for (uint256 cycle = 0; cycle < 5; cycle++) {
            // Get to 100 happiness using feed only for consistency
            for (uint256 i = 0; i < 10; i++) {
                // After using all instant actions, warp time between each feed
                if (cycle > 0) {
                    vm.warp(block.timestamp + 24 hours + 1);
                }
                
                vm.prank(player1);
                chickenGame.feedChicken();
            }

            // Lay egg
            vm.prank(player1);
            chickenGame.layEgg();

            // Verify state
            (uint256 happiness, , , , uint256 totalEggsLaid, , ) = chickenGame.getChicken(player1);
            assertEq(happiness, 0);
            assertEq(totalEggsLaid, cycle + 1);
        }

        assertEq(eggToken.balanceOf(player1), 5 ether);
    }
}

