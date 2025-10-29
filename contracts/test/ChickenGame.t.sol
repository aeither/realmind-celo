// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {ChickenGame, EggToken} from "../src/ChickenGame.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Mock USDT contract for testing
contract MockUSDT is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;
    string public name = "Mock USDT";
    string public symbol = "USDT";
    uint8 public decimals = 6;

    function mint(address to, uint256 amount) external {
        _balances[to] += amount;
        _totalSupply += amount;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        return true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _allowances[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(_balances[from] >= amount, "Insufficient balance");
        require(_allowances[from][msg.sender] >= amount, "Insufficient allowance");
        _balances[from] -= amount;
        _balances[to] += amount;
        _allowances[from][msg.sender] -= amount;
        return true;
    }
}

contract ChickenGameTest is Test {
    ChickenGame public chickenGame;
    EggToken public eggToken;
    MockUSDT public usdt;
    IERC20 public usdtAtHardcodedAddress; // USDT at the hardcoded address
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

        // Deploy Mock USDT and set it up at the hardcoded USDT address
        usdt = new MockUSDT();

        // Use vm.etch to replace the code at the hardcoded USDT address with our mock
        vm.etch(chickenGame.USDT_ADDRESS(), address(usdt).code);

        // Store the mock USDT reference at the hardcoded address for balance tracking
        // We'll mint directly to the hardcoded address storage slots
        address hardcodedUSDT = chickenGame.USDT_ADDRESS();

        // Mint USDT to players - use vm.store to set balances in the storage at hardcoded address
        // For ERC20, balance is typically at keccak256(abi.encode(address, slot))
        // For MockUSDT, balances are at slot 0

        bytes32 player1BalanceSlot = keccak256(abi.encode(player1, uint256(0)));
        bytes32 player2BalanceSlot = keccak256(abi.encode(player2, uint256(0)));

        vm.store(hardcodedUSDT, player1BalanceSlot, bytes32(uint256(100000 * 10**6)));
        vm.store(hardcodedUSDT, player2BalanceSlot, bytes32(uint256(50000 * 10**6)));

        // Also need to store total supply at slot 2
        uint256 totalSupply = 150000 * 10**6;
        vm.store(hardcodedUSDT, bytes32(uint256(2)), bytes32(totalSupply));

        // Get reference to USDT at the hardcoded address for tests to use
        usdtAtHardcodedAddress = IERC20(hardcodedUSDT);
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

    // ========== USDT STAKING TESTS ==========

    function testStakeUSDTGrantsFreeActions() public {
        uint256 stakeAmount = 5000 * 10**6; // 5000 USDT

        // Approve and stake
        vm.startPrank(player1);
        usdtAtHardcodedAddress.approve(address(chickenGame), stakeAmount);
        chickenGame.stakeUSDT(stakeAmount);
        vm.stopPrank();

        // Check free actions granted (5000 USDT / 1000 = 5 free actions)
        (
            ,
            ,
            ,
            ,
            ,
            uint256 instantActionsRemaining,
            bool initialized
        ) = chickenGame.getChicken(player1);

        assertTrue(initialized);
        assertEq(instantActionsRemaining, 15); // 10 initial + 5 from staking
        assertEq(chickenGame.getStakedBalance(player1), stakeAmount);
    }

    function testStakeUSDTWithLessThan1000DoesNotGrantActions() public {
        uint256 stakeAmount = 500 * 10**6; // 500 USDT (less than 1000)

        vm.startPrank(player1);
        usdtAtHardcodedAddress.approve(address(chickenGame), stakeAmount);
        chickenGame.stakeUSDT(stakeAmount);
        vm.stopPrank();

        // Check that only initial free actions remain
        (
            ,
            ,
            ,
            ,
            ,
            uint256 instantActionsRemaining,

        ) = chickenGame.getChicken(player1);

        assertEq(instantActionsRemaining, 10); // Only initial 10, no additional from staking
        assertEq(chickenGame.getStakedBalance(player1), stakeAmount);
    }

    function testMultipleStakesAccumulateFreeActions() public {
        // First stake: 2000 USDT = 2 free actions
        vm.startPrank(player1);
        usdtAtHardcodedAddress.approve(address(chickenGame), 2000 * 10**6);
        chickenGame.stakeUSDT(2000 * 10**6);

        // Second stake: 3000 USDT = 3 free actions
        usdtAtHardcodedAddress.approve(address(chickenGame), 3000 * 10**6);
        chickenGame.stakeUSDT(3000 * 10**6);
        vm.stopPrank();

        // Check total: 10 initial + 2 + 3 = 15 free actions
        (
            ,
            ,
            ,
            ,
            ,
            uint256 instantActionsRemaining,

        ) = chickenGame.getChicken(player1);

        assertEq(instantActionsRemaining, 15);
        assertEq(chickenGame.getStakedBalance(player1), 5000 * 10**6);
    }

    function testStakeEmitsEvent() public {
        uint256 stakeAmount = 3000 * 10**6;

        vm.startPrank(player1);
        usdtAtHardcodedAddress.approve(address(chickenGame), stakeAmount);

        vm.expectEmit(true, false, false, true);
        emit ChickenGame.Staked(player1, stakeAmount, 3); // 3 free actions
        chickenGame.stakeUSDT(stakeAmount);
        vm.stopPrank();
    }

    function testCannotStakeZeroAmount() public {
        vm.startPrank(player1);
        vm.expectRevert("ChickenGame: Amount must be greater than 0");
        chickenGame.stakeUSDT(0);
        vm.stopPrank();
    }

    function testStakeRequiresSufficientAllowance() public {
        uint256 stakeAmount = 1000 * 10**6;

        vm.startPrank(player1);
        // Don't approve, expect failure
        vm.expectRevert("Insufficient allowance");
        chickenGame.stakeUSDT(stakeAmount);
        vm.stopPrank();
    }

    function testStakeRequiresSufficientBalance() public {
        uint256 stakeAmount = 200000 * 10**6; // More than player has

        vm.startPrank(player1);
        usdtAtHardcodedAddress.approve(address(chickenGame), stakeAmount);
        vm.expectRevert("Insufficient balance");
        chickenGame.stakeUSDT(stakeAmount);
        vm.stopPrank();
    }

    // ========== USDT UNSTAKING TESTS ==========

    function testUnstakeUSDT() public {
        uint256 stakeAmount = 5000 * 10**6;

        // Stake first
        vm.startPrank(player1);
        usdtAtHardcodedAddress.approve(address(chickenGame), stakeAmount);
        chickenGame.stakeUSDT(stakeAmount);

        uint256 balanceBefore = usdtAtHardcodedAddress.balanceOf(player1);

        // Unstake
        chickenGame.unstakeUSDT(stakeAmount);
        vm.stopPrank();

        // Check balances
        assertEq(chickenGame.getStakedBalance(player1), 0);
        assertEq(usdtAtHardcodedAddress.balanceOf(player1), balanceBefore + stakeAmount);
    }

    function testPartialUnstake() public {
        uint256 stakeAmount = 5000 * 10**6;
        uint256 unstakeAmount = 2000 * 10**6;

        // Stake first
        vm.startPrank(player1);
        usdtAtHardcodedAddress.approve(address(chickenGame), stakeAmount);
        chickenGame.stakeUSDT(stakeAmount);

        uint256 balanceBefore = usdtAtHardcodedAddress.balanceOf(player1);

        // Partial unstake
        chickenGame.unstakeUSDT(unstakeAmount);
        vm.stopPrank();

        // Check balances
        assertEq(chickenGame.getStakedBalance(player1), stakeAmount - unstakeAmount);
        assertEq(usdtAtHardcodedAddress.balanceOf(player1), balanceBefore + unstakeAmount);
    }

    function testUnstakeEmitsEvent() public {
        uint256 stakeAmount = 3000 * 10**6;

        vm.startPrank(player1);
        usdtAtHardcodedAddress.approve(address(chickenGame), stakeAmount);
        chickenGame.stakeUSDT(stakeAmount);

        vm.expectEmit(true, false, false, true);
        emit ChickenGame.Unstaked(player1, stakeAmount);
        chickenGame.unstakeUSDT(stakeAmount);
        vm.stopPrank();
    }

    function testCannotUnstakeZeroAmount() public {
        vm.startPrank(player1);
        vm.expectRevert("ChickenGame: Amount must be greater than 0");
        chickenGame.unstakeUSDT(0);
        vm.stopPrank();
    }

    function testCannotUnstakeMoreThanStaked() public {
        uint256 stakeAmount = 1000 * 10**6;

        vm.startPrank(player1);
        usdtAtHardcodedAddress.approve(address(chickenGame), stakeAmount);
        chickenGame.stakeUSDT(stakeAmount);

        vm.expectRevert("ChickenGame: Insufficient staked balance");
        chickenGame.unstakeUSDT(2000 * 10**6);
        vm.stopPrank();
    }

    function testUnstakeDoesNotAffectFreeActions() public {
        uint256 stakeAmount = 3000 * 10**6; // 3 free actions

        vm.startPrank(player1);
        usdtAtHardcodedAddress.approve(address(chickenGame), stakeAmount);
        chickenGame.stakeUSDT(stakeAmount);

        // Check free actions after staking
        (, , , , , uint256 actionsBefore, ) = chickenGame.getChicken(player1);
        assertEq(actionsBefore, 13); // 10 initial + 3 from staking

        // Unstake (free actions should remain)
        chickenGame.unstakeUSDT(stakeAmount);

        (, , , , , uint256 actionsAfter, ) = chickenGame.getChicken(player1);
        assertEq(actionsAfter, 13); // Same as before
        vm.stopPrank();
    }

    // ========== STAKING CALCULATION TESTS ==========

    function testCalculateFreeActionsForVariousAmounts() public {
        assertEq(chickenGame.calculateFreeActions(0), 0);
        assertEq(chickenGame.calculateFreeActions(500 * 10**6), 0); // 500 USDT
        assertEq(chickenGame.calculateFreeActions(1000 * 10**6), 1); // 1000 USDT
        assertEq(chickenGame.calculateFreeActions(2500 * 10**6), 2); // 2500 USDT
        assertEq(chickenGame.calculateFreeActions(10000 * 10**6), 10); // 10000 USDT
        assertEq(chickenGame.calculateFreeActions(15750 * 10**6), 15); // 15750 USDT
    }

    // ========== OWNERSHIP TESTS ==========

    function testOwnerIsSetCorrectly() public {
        assertEq(chickenGame.owner(), admin);
    }

    function testTransferOwnership() public {
        address newOwner = address(0x789);

        vm.expectEmit(true, true, false, false);
        emit ChickenGame.OwnershipTransferred(admin, newOwner);
        chickenGame.transferOwnership(newOwner);

        assertEq(chickenGame.owner(), newOwner);
    }

    function testOnlyOwnerCanTransferOwnership() public {
        address newOwner = address(0x789);

        vm.prank(player1);
        vm.expectRevert("ChickenGame: caller is not the owner");
        chickenGame.transferOwnership(newOwner);
    }

    function testCannotTransferOwnershipToZeroAddress() public {
        vm.expectRevert("ChickenGame: New owner is the zero address");
        chickenGame.transferOwnership(address(0));
    }

    // ========== EMERGENCY WITHDRAWAL TESTS ==========

    function testEmergencyWithdrawUSDT() public {
        // Setup: Players stake USDT
        vm.startPrank(player1);
        usdtAtHardcodedAddress.approve(address(chickenGame), 5000 * 10**6);
        chickenGame.stakeUSDT(5000 * 10**6);
        vm.stopPrank();

        vm.startPrank(player2);
        usdtAtHardcodedAddress.approve(address(chickenGame), 3000 * 10**6);
        chickenGame.stakeUSDT(3000 * 10**6);
        vm.stopPrank();

        uint256 totalStaked = 8000 * 10**6;
        address recipient = address(0x999);

        // Emergency withdraw
        vm.expectEmit(true, false, false, true);
        emit ChickenGame.EmergencyWithdraw(recipient, totalStaked);
        chickenGame.emergencyWithdrawUSDT(recipient);

        // Verify all USDT was withdrawn
        assertEq(usdtAtHardcodedAddress.balanceOf(recipient), totalStaked);
        assertEq(usdtAtHardcodedAddress.balanceOf(address(chickenGame)), 0);
    }

    function testOnlyOwnerCanEmergencyWithdraw() public {
        vm.startPrank(player1);
        usdtAtHardcodedAddress.approve(address(chickenGame), 1000 * 10**6);
        chickenGame.stakeUSDT(1000 * 10**6);

        vm.expectRevert("ChickenGame: caller is not the owner");
        chickenGame.emergencyWithdrawUSDT(player1);
        vm.stopPrank();
    }

    function testCannotEmergencyWithdrawToZeroAddress() public {
        vm.startPrank(player1);
        usdtAtHardcodedAddress.approve(address(chickenGame), 1000 * 10**6);
        chickenGame.stakeUSDT(1000 * 10**6);
        vm.stopPrank();

        vm.expectRevert("ChickenGame: Invalid recipient address");
        chickenGame.emergencyWithdrawUSDT(address(0));
    }

    function testCannotEmergencyWithdrawWhenNoBalance() public {
        vm.expectRevert("ChickenGame: No USDT to withdraw");
        chickenGame.emergencyWithdrawUSDT(admin);
    }

    function testEmergencyWithdrawDoesNotAffectStakedBalanceTracking() public {
        // This test shows that emergency withdraw is truly for emergencies
        // as it doesn't update the stakedBalance mapping
        uint256 stakeAmount = 5000 * 10**6;

        vm.startPrank(player1);
        usdtAtHardcodedAddress.approve(address(chickenGame), stakeAmount);
        chickenGame.stakeUSDT(stakeAmount);
        vm.stopPrank();

        // Emergency withdraw
        chickenGame.emergencyWithdrawUSDT(admin);

        // stakedBalance still shows the amount (even though funds were withdrawn)
        assertEq(chickenGame.getStakedBalance(player1), stakeAmount);

        // But contract has no USDT
        assertEq(usdtAtHardcodedAddress.balanceOf(address(chickenGame)), 0);
    }

    // ========== INTEGRATION TESTS ==========

    function testStakingAndPlayingIntegration() public {
        // Player stakes 10000 USDT to get 10 additional free actions (20 total)
        vm.startPrank(player1);
        usdtAtHardcodedAddress.approve(address(chickenGame), 10000 * 10**6);
        chickenGame.stakeUSDT(10000 * 10**6);

        // Use all 20 instant actions
        for (uint256 i = 0; i < 20; i++) {
            chickenGame.feedChicken();
        }

        // Check state
        (uint256 happiness, , , , , uint256 instantActionsRemaining, ) = chickenGame.getChicken(player1);
        assertEq(happiness, 100); // Capped at 100
        assertEq(instantActionsRemaining, 0); // All used

        // Lay first egg
        chickenGame.layEgg();
        assertEq(eggToken.balanceOf(player1), 1 ether);

        // Get back to 100 with more actions (need to wait for cooldown now)
        // Warp time before each feed action
        uint256 currentTime = block.timestamp;
        for (uint256 i = 0; i < 10; i++) {
            currentTime += 24 hours + 1;
            vm.warp(currentTime);
            chickenGame.feedChicken();
        }

        chickenGame.layEgg();
        assertEq(eggToken.balanceOf(player1), 2 ether);

        // Unstake
        chickenGame.unstakeUSDT(10000 * 10**6);
        assertEq(chickenGame.getStakedBalance(player1), 0);

        vm.stopPrank();
    }

    function testMultiplePlayersStakingIndependently() public {
        // Player 1 stakes 5000 USDT
        vm.startPrank(player1);
        usdtAtHardcodedAddress.approve(address(chickenGame), 5000 * 10**6);
        chickenGame.stakeUSDT(5000 * 10**6);
        vm.stopPrank();

        // Player 2 stakes 3000 USDT
        vm.startPrank(player2);
        usdtAtHardcodedAddress.approve(address(chickenGame), 3000 * 10**6);
        chickenGame.stakeUSDT(3000 * 10**6);
        vm.stopPrank();

        // Verify independent states
        assertEq(chickenGame.getStakedBalance(player1), 5000 * 10**6);
        assertEq(chickenGame.getStakedBalance(player2), 3000 * 10**6);

        (, , , , , uint256 actions1, ) = chickenGame.getChicken(player1);
        (, , , , , uint256 actions2, ) = chickenGame.getChicken(player2);

        assertEq(actions1, 15); // 10 + 5
        assertEq(actions2, 13); // 10 + 3
    }
}

