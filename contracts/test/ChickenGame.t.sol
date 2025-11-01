// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {ChickenGame, EggToken, MegaEgg} from "../src/ChickenGame.sol";
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

contract ChickenGameV2Test is Test {
    ChickenGame public chickenGame;
    EggToken public eggToken;
    MegaEgg public megaEgg;
    MockUSDT public usdt;
    IERC20 public usdtAtHardcodedAddress;
    address public admin;
    address public player1 = address(0x123);
    address public player2 = address(0x456);

    // Allow test contract to receive ETH (as vault)
    receive() external payable {}

    function setUp() public {
        admin = address(this);

        // Deploy tokens
        eggToken = new EggToken();
        megaEgg = new MegaEgg();

        // Deploy ChickenGame
        chickenGame = new ChickenGame(address(eggToken), address(megaEgg));

        // Grant minter roles
        eggToken.grantRole(eggToken.MINTER_ROLE(), address(chickenGame));
        megaEgg.grantRole(megaEgg.MINTER_ROLE(), address(chickenGame));

        // Setup Mock USDT at hardcoded address
        usdt = new MockUSDT();
        vm.etch(chickenGame.USDT_ADDRESS(), address(usdt).code);
        address hardcodedUsdt = chickenGame.USDT_ADDRESS();

        bytes32 player1BalanceSlot = keccak256(abi.encode(player1, uint256(0)));
        bytes32 player2BalanceSlot = keccak256(abi.encode(player2, uint256(0)));

        vm.store(hardcodedUsdt, player1BalanceSlot, bytes32(uint256(100000 * 10**6)));
        vm.store(hardcodedUsdt, player2BalanceSlot, bytes32(uint256(50000 * 10**6)));

        uint256 totalSupply = 150000 * 10**6;
        vm.store(hardcodedUsdt, bytes32(uint256(2)), bytes32(totalSupply));

        usdtAtHardcodedAddress = IERC20(hardcodedUsdt);
    }

    // ========== INITIALIZATION TESTS ==========

    function testInitialChickenState() public view {
        (
            uint256 happiness,
            uint256 claimableActions,
            uint256 lastActionUpdate,
            uint256 totalEggsLaid,
            uint256 instantActionsRemaining,
            bool initialized
        ) = chickenGame.getChicken(player1);

        assertEq(happiness, 0);
        assertEq(claimableActions, 0);
        assertEq(lastActionUpdate, 0);
        assertEq(totalEggsLaid, 0);
        assertEq(instantActionsRemaining, 0);
        assertFalse(initialized);
    }

    function testChickenInitializesOnFirstAction() public {
        vm.prank(player1);
        chickenGame.feedChicken();

        (
            uint256 happiness,
            uint256 claimableActions,
            ,
            ,
            uint256 instantActionsRemaining,
            bool initialized
        ) = chickenGame.getChicken(player1);

        assertTrue(initialized);
        assertEq(happiness, 10);
        assertEq(instantActionsRemaining, 9); // Started with 10, used 1
        assertEq(claimableActions, 10); // Initialized with max claimable
    }

    // ========== ACTION ACCUMULATION TESTS ==========

    function testActionsAccumulateOverTime() public {
        // Initialize chicken
        vm.prank(player1);
        chickenGame.feedChicken();

        // Use all instant actions
        for (uint256 i = 0; i < 9; i++) {
            vm.prank(player1);
            chickenGame.feedChicken();
        }

        // Use all claimable actions
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(player1);
            chickenGame.feedChicken();
        }

        // Now should have no actions left
        vm.prank(player1);
        vm.expectRevert("ChickenGame: No actions available");
        chickenGame.feedChicken();

        // Warp 2 hours (should accumulate 1 action)
        vm.warp(block.timestamp + 2 hours);

        // Should be able to perform 1 action
        vm.prank(player1);
        chickenGame.feedChicken();

        // Should not be able to perform another
        vm.prank(player1);
        vm.expectRevert("ChickenGame: No actions available");
        chickenGame.feedChicken();
    }

    function testActionsAccumulateToMax10() public {
        // Initialize chicken
        vm.prank(player1);
        chickenGame.feedChicken();

        // Use all instant and claimable actions
        for (uint256 i = 0; i < 19; i++) {
            vm.prank(player1);
            chickenGame.feedChicken();
        }

        // Warp 30 hours (should accumulate 15 actions, but capped at 10)
        vm.warp(block.timestamp + 30 hours);

        (
            ,
            uint256 claimableActions,
            ,
            ,
            ,
        ) = chickenGame.getChicken(player1);

        assertEq(claimableActions, 10); // Capped at max
    }

    function testGetTimeUntilNextAction() public {
        // Initialize chicken
        vm.prank(player1);
        chickenGame.feedChicken();

        // Use all actions
        for (uint256 i = 0; i < 19; i++) {
            vm.prank(player1);
            chickenGame.feedChicken();
        }

        // Should show time until next accumulation (should be close to 2 hours)
        uint256 timeUntil = chickenGame.getTimeUntilNextAction(player1);
        assertGt(timeUntil, 0);
        assertLe(timeUntil, 2 hours);

        // Warp exactly 2 hours - now we have 1 action accumulated
        vm.warp(block.timestamp + 2 hours);

        // Function returns time until NEXT accumulation (not time until action is available)
        // Since we just accumulated 1 action, we need another 2 hours for the next one
        timeUntil = chickenGame.getTimeUntilNextAction(player1);
        assertGt(timeUntil, 1 hours); // Should be close to 2 hours again
        assertLe(timeUntil, 2 hours);

        // But action should be available now
        assertTrue(chickenGame.isActionAvailable(player1));
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

        assertEq(eggToken.balanceOf(player1), 1 ether);

        (uint256 happiness, , , uint256 totalEggsLaid, , ) = chickenGame.getChicken(player1);
        assertEq(happiness, 0);
        assertEq(totalEggsLaid, 1);
    }

    function testCannotLayEggWithLessThan100Happiness() public {
        vm.prank(player1);
        chickenGame.feedChicken();

        vm.prank(player1);
        vm.expectRevert("ChickenGame: Chicken happiness must be 100 to lay egg");
        chickenGame.layEgg();
    }

    // ========== BUY EGGS TESTS ==========

    function testBuyEggsWithETH() public {
        uint256 ethToSend = 0.01 ether; // Should get 10 eggs

        vm.deal(player1, 1 ether);
        vm.prank(player1);
        chickenGame.buyEggs{value: ethToSend}();

        assertEq(eggToken.balanceOf(player1), 10 ether);
    }

    function testBuyEggsRequiresExactMultiple() public {
        uint256 ethToSend = 0.0015 ether; // Not exact multiple of 0.001

        vm.deal(player1, 1 ether);
        vm.prank(player1);
        vm.expectRevert("ChickenGame: ETH amount must be exact multiple of egg price");
        chickenGame.buyEggs{value: ethToSend}();
    }

    function testBuyEggsEmitsEvent() public {
        uint256 ethToSend = 0.001 ether;

        vm.deal(player1, 1 ether);
        vm.prank(player1);
        vm.expectEmit(true, false, false, true);
        emit ChickenGame.EggsBought(player1, ethToSend, 1 ether);
        chickenGame.buyEggs{value: ethToSend}();
    }

    // ========== MERGE EGGS TESTS ==========

    function testMergeEggsForMegaEgg() public {
        // First, buy some eggs
        vm.deal(player1, 1 ether);
        vm.prank(player1);
        chickenGame.buyEggs{value: 0.01 ether}(); // Get 10 eggs

        // Approve and merge
        vm.startPrank(player1);
        eggToken.approve(address(chickenGame), 10 ether);
        chickenGame.mergeEggsForMegaEgg{value: 0.01 ether}(10 ether);
        vm.stopPrank();

        // Check MegaEgg balance
        assertEq(megaEgg.balanceOf(player1), 1 ether);

        // Check eggs were burned (balance should be 0)
        assertEq(eggToken.balanceOf(player1), 0);
    }

    function testMergeEggsBurnsTokensPermanently() public {
        uint256 initialTotalSupply = eggToken.totalSupply();

        // Buy eggs
        vm.deal(player1, 1 ether);
        vm.prank(player1);
        chickenGame.buyEggs{value: 0.01 ether}(); // Get 10 eggs

        uint256 afterBuyTotalSupply = eggToken.totalSupply();
        assertEq(afterBuyTotalSupply, initialTotalSupply + 10 ether);

        // Merge eggs (should burn them)
        vm.startPrank(player1);
        eggToken.approve(address(chickenGame), 10 ether);
        chickenGame.mergeEggsForMegaEgg{value: 0.01 ether}(10 ether);
        vm.stopPrank();

        // Total supply should decrease back to initial
        assertEq(eggToken.totalSupply(), initialTotalSupply);
    }

    function testMergeRequiresMinimumEggs() public {
        // Buy 5 eggs (less than minimum of 10)
        vm.deal(player1, 1 ether);
        vm.prank(player1);
        chickenGame.buyEggs{value: 0.005 ether}();

        vm.startPrank(player1);
        eggToken.approve(address(chickenGame), 5 ether);
        vm.expectRevert("ChickenGame: Not enough eggs to merge");
        chickenGame.mergeEggsForMegaEgg{value: 0.01 ether}(5 ether);
        vm.stopPrank();
    }

    function testMergeRequiresMergeFee() public {
        vm.deal(player1, 1 ether);
        vm.prank(player1);
        chickenGame.buyEggs{value: 0.01 ether}();

        vm.startPrank(player1);
        eggToken.approve(address(chickenGame), 10 ether);
        vm.expectRevert("ChickenGame: Incorrect merge fee");
        chickenGame.mergeEggsForMegaEgg{value: 0.005 ether}(10 ether); // Wrong fee
        vm.stopPrank();
    }

    function testMerge20EggsGives2MegaEggs() public {
        vm.deal(player1, 1 ether);
        vm.prank(player1);
        chickenGame.buyEggs{value: 0.02 ether}(); // Get 20 eggs

        vm.startPrank(player1);
        eggToken.approve(address(chickenGame), 20 ether);
        chickenGame.mergeEggsForMegaEgg{value: 0.01 ether}(20 ether);
        vm.stopPrank();

        assertEq(megaEgg.balanceOf(player1), 2 ether);
    }

    // ========== USDT STAKING TESTS ==========

    function testStakeUSDTGrantsInstantActions() public {
        uint256 stakeAmount = 5000 * 10**6;

        vm.startPrank(player1);
        usdtAtHardcodedAddress.approve(address(chickenGame), stakeAmount);
        chickenGame.stakeUSDT(stakeAmount);
        vm.stopPrank();

        (
            ,
            ,
            ,
            ,
            uint256 instantActionsRemaining,
            bool initialized
        ) = chickenGame.getChicken(player1);

        assertTrue(initialized);
        assertEq(instantActionsRemaining, 15); // 10 initial + 5 from staking
    }

    function testUnstakeUSDT() public {
        uint256 stakeAmount = 5000 * 10**6;

        vm.startPrank(player1);
        usdtAtHardcodedAddress.approve(address(chickenGame), stakeAmount);
        chickenGame.stakeUSDT(stakeAmount);

        uint256 balanceBefore = usdtAtHardcodedAddress.balanceOf(player1);
        chickenGame.unstakeUSDT(stakeAmount);
        vm.stopPrank();

        assertEq(chickenGame.getStakedBalance(player1), 0);
        assertEq(usdtAtHardcodedAddress.balanceOf(player1), balanceBefore + stakeAmount);
    }

    // ========== OWNERSHIP & ETH WITHDRAWAL TESTS ==========

    function testOwnerCanWithdrawETH() public {
        address vault = chickenGame.vaultAddress();
        uint256 vaultBalanceBefore = vault.balance;

        // Player buys eggs
        vm.deal(player1, 1 ether);
        vm.prank(player1);
        chickenGame.buyEggs{value: 0.1 ether}();

        // Player merges eggs
        vm.startPrank(player1);
        eggToken.approve(address(chickenGame), 100 ether);
        chickenGame.mergeEggsForMegaEgg{value: 0.01 ether}(100 ether);
        vm.stopPrank();

        // Note: ETH is now sent directly to vault, so contract balance should be 0
        assertEq(address(chickenGame).balance, 0);

        // Check vault received the funds (0.1 + 0.01 = 0.11)
        assertEq(vault.balance, vaultBalanceBefore + 0.11 ether);
    }

    function testNonOwnerCannotWithdrawETH() public {
        // Send some ETH directly to contract (not through buyEggs which goes to vault)
        vm.deal(address(chickenGame), 0.1 ether);

        vm.prank(player2);
        vm.expectRevert("ChickenGame: caller is not the owner");
        chickenGame.withdrawETH();
    }

    // ========== EGG TOKEN BURN TESTS ==========

    function testEggTokenBurn() public {
        // Mint some eggs
        eggToken.mint(player1, 10 ether);

        assertEq(eggToken.balanceOf(player1), 10 ether);
        uint256 totalSupplyBefore = eggToken.totalSupply();

        // Burn eggs
        vm.prank(player1);
        eggToken.burn(5 ether);

        assertEq(eggToken.balanceOf(player1), 5 ether);
        assertEq(eggToken.totalSupply(), totalSupplyBefore - 5 ether);
    }

    function testEggTokenBurnFrom() public {
        // Mint eggs
        eggToken.mint(player1, 10 ether);

        // Approve player2 to burn
        vm.prank(player1);
        eggToken.approve(player2, 5 ether);

        // Player2 burns from player1
        uint256 totalSupplyBefore = eggToken.totalSupply();
        vm.prank(player2);
        eggToken.burnFrom(player1, 5 ether);

        assertEq(eggToken.balanceOf(player1), 5 ether);
        assertEq(eggToken.totalSupply(), totalSupplyBefore - 5 ether);
    }

    // ========== VIEW FUNCTION TESTS ==========

    function testIsActionAvailable() public {
        // Should be available for new user
        assertTrue(chickenGame.isActionAvailable(player1));

        // Initialize and use all actions
        for (uint256 i = 0; i < 20; i++) {
            vm.prank(player1);
            chickenGame.feedChicken();
        }

        // Should not be available
        assertFalse(chickenGame.isActionAvailable(player1));

        // Warp 2 hours
        vm.warp(block.timestamp + 2 hours);

        // Should be available again
        assertTrue(chickenGame.isActionAvailable(player1));
    }

    function testCalculateMegaEggs() public view {
        assertEq(chickenGame.calculateMegaEggs(0), 0);
        assertEq(chickenGame.calculateMegaEggs(5 ether), 0); // Less than min
        assertEq(chickenGame.calculateMegaEggs(10 ether), 1 ether);
        assertEq(chickenGame.calculateMegaEggs(20 ether), 2 ether);
        assertEq(chickenGame.calculateMegaEggs(25 ether), 2.5 ether); // 25 / 10 = 2.5
        assertEq(chickenGame.calculateMegaEggs(30 ether), 3 ether);
    }

    // ========== INTEGRATION TEST ==========

    function testFullGameCycle() public {
        // Player uses free actions to lay an egg
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(player1);
            chickenGame.feedChicken();
        }

        vm.prank(player1);
        chickenGame.layEgg();
        assertEq(eggToken.balanceOf(player1), 1 ether);

        // Player buys 9 more eggs to have 10 total
        vm.deal(player1, 1 ether);
        vm.prank(player1);
        chickenGame.buyEggs{value: 0.009 ether}();
        assertEq(eggToken.balanceOf(player1), 10 ether);

        // Player merges to get MegaEgg
        vm.startPrank(player1);
        eggToken.approve(address(chickenGame), 10 ether);
        chickenGame.mergeEggsForMegaEgg{value: 0.01 ether}(10 ether);
        vm.stopPrank();

        assertEq(megaEgg.balanceOf(player1), 1 ether);
        assertEq(eggToken.balanceOf(player1), 0); // All burned
    }
}

// Import RetentionSystem
import {RetentionSystem} from "../src/ChickenGame.sol";

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

        // Next reward should be 2 eggs (streak will be 2)
        skip(20 hours);
        uint256 nextReward = retentionSystem.getNextReward(player1);
        assertEq(nextReward, 1 ether); // Still 1 because streak is only 1

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
