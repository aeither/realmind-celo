// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {QuizGame, Token1} from "../src/QuizGame.sol";

contract QuizGameTest is Test {
    QuizGame public quizGame;
    Token1 public token;
    address public player = address(0x123);
    address public player2 = address(0x456);
    address public owner;

    function setUp() public {
        owner = address(this);
        // Deploy Token1 with custom name/symbol
        token = new Token1("XP Points", "XP3");
        
        // Deploy QuizGame
        quizGame = new QuizGame(address(token));
        
        // Transfer token ownership to quizGame
        token.transferOwnership(address(quizGame));
    }

    function testCompleteQuizFlow_CorrectAnswer() public {
        vm.deal(player, 1 ether);
        
        // Start quiz with custom amount and quiz ID
        uint256 playAmount = 0.0015 ether;
        string memory quizId = "web3-basics";
        uint256 expectedCorrectAnswers = 3;
        vm.prank(player);
        quizGame.startQuiz{value: playAmount}(quizId, expectedCorrectAnswers);
        
        // Player gets initial tokens (100x the amount paid)
        uint256 expectedInitialTokens = playAmount * 100;
        assertEq(token.balanceOf(player), expectedInitialTokens);
        
        // Verify session
        QuizGame.QuizSession memory session = quizGame.getQuizSession(player);
        assertTrue(session.active);
        assertEq(session.amountPaid, playAmount);
        assertEq(session.quizId, quizId);
        assertEq(session.correctAnswers, expectedCorrectAnswers);
        assertTrue(quizGame.hasActiveQuiz(player));
        
        // Complete quiz correctly (submit same number as expected)
        vm.prank(player);
        quizGame.completeQuiz(expectedCorrectAnswers);
        
        // Session should be inactive
        session = quizGame.getQuizSession(player);
        assertFalse(session.active);
        assertFalse(quizGame.hasActiveQuiz(player));
        
        // Player should get bonus tokens (20% fixed bonus)
        uint256 finalTokens = token.balanceOf(player);
        uint256 expectedFinalTokens = expectedInitialTokens + (expectedInitialTokens * 20 / 100); // 120% of initial
        assertEq(finalTokens, expectedFinalTokens);
    }

    function testCompleteQuizFlow_IncorrectAnswer() public {
        vm.deal(player, 1 ether);
        
        // Start quiz
        uint256 playAmount = 0.001 ether;
        string memory quizId = "defi-fundamentals";
        uint256 expectedCorrectAnswers = 3;
        vm.prank(player);
        quizGame.startQuiz{value: playAmount}(quizId, expectedCorrectAnswers);
        
        // Player gets initial tokens
        uint256 expectedInitialTokens = playAmount * 100;
        assertEq(token.balanceOf(player), expectedInitialTokens);
        
        // Complete with wrong number of correct answers
        vm.prank(player);
        quizGame.completeQuiz(2); // submitted 2 but expected 3
        
        // Player keeps initial tokens but gets no bonus
        assertEq(token.balanceOf(player), expectedInitialTokens);
        
        // Session should be inactive after completion
        assertFalse(quizGame.hasActiveQuiz(player));
    }

    function testStartQuiz_ZeroETH() public {
        vm.deal(player, 1 ether);
        vm.prank(player);
        vm.expectRevert("Must send ETH");
        quizGame.startQuiz{value: 0}("coredao", 3);
    }

    function testStartQuiz_EmptyQuizId() public {
        vm.deal(player, 1 ether);
        vm.prank(player);
        vm.expectRevert("Quiz ID cannot be empty");
        quizGame.startQuiz{value: 0.001 ether}("", 3);
    }

    function testStartQuiz_AlreadyActive() public {
        vm.deal(player, 1 ether);
        
        // Start first quiz
        vm.prank(player);
        quizGame.startQuiz{value: 0.001 ether}("web3-basics", 3);
        
        uint256 tokensAfterFirst = token.balanceOf(player);
        assertEq(tokensAfterFirst, 0.001 ether * 100); // Initial tokens from first quiz
        
        // Verify first session is active
        QuizGame.QuizSession memory session = quizGame.getQuizSession(player);
        assertTrue(session.active);
        assertEq(session.quizId, "web3-basics");
        
        // Start another quiz - should auto-complete previous one and start new one
        vm.prank(player);
        quizGame.startQuiz{value: 0.002 ether}("defi-fundamentals", 2);
        
        // Verify new session is active
        session = quizGame.getQuizSession(player);
        assertTrue(session.active);
        assertEq(session.quizId, "defi-fundamentals");
        assertEq(session.correctAnswers, 2);
        assertEq(session.amountPaid, 0.002 ether);
        
        // Verify total tokens (first quiz tokens + second quiz initial tokens)
        uint256 finalTokens = token.balanceOf(player);
        uint256 expectedTokens = (0.001 ether * 100) + (0.002 ether * 100);
        assertEq(finalTokens, expectedTokens);
    }

    function testCompleteQuiz_NoActiveSession() public {
        vm.prank(player);
        vm.expectRevert("No active quiz session");
        quizGame.completeQuiz(3);
    }

    function testQuizIdStoredCorrectly() public {
        vm.deal(player, 1 ether);
        
        string memory quizId = "coredao";
        
        // Start quiz
        vm.prank(player);
        quizGame.startQuiz{value: 0.001 ether}(quizId, 3);
        
        // Verify quiz ID is stored correctly
        QuizGame.QuizSession memory session = quizGame.getQuizSession(player);
        assertEq(session.quizId, quizId);
        assertTrue(session.active);
        
        // Complete quiz
        vm.prank(player);
        quizGame.completeQuiz(3);
        
        // Quiz ID should still be stored even after completion
        session = quizGame.getQuizSession(player);
        assertEq(session.quizId, quizId);
        assertFalse(session.active);
    }

    function testMultipleUsers() public {
        vm.deal(player, 1 ether);
        vm.deal(player2, 1 ether);
        
        // Player 1 starts quiz
        vm.prank(player);
        quizGame.startQuiz{value: 0.001 ether}("web3-basics", 3);
        
        // Player 2 starts quiz
        vm.prank(player2);
        quizGame.startQuiz{value: 0.002 ether}("defi-fundamentals", 2);
        
        // Verify both sessions
        assertTrue(quizGame.getQuizSession(player).active);
        assertTrue(quizGame.getQuizSession(player2).active);
        assertTrue(quizGame.hasActiveQuiz(player));
        assertTrue(quizGame.hasActiveQuiz(player2));
        assertEq(token.balanceOf(player), 0.001 ether * 100);
        assertEq(token.balanceOf(player2), 0.002 ether * 100);
        
        // Verify quiz IDs are stored correctly
        assertEq(quizGame.getQuizSession(player).quizId, "web3-basics");
        assertEq(quizGame.getQuizSession(player2).quizId, "defi-fundamentals");
        
        // Player 1 completes correctly
        vm.prank(player);
        quizGame.completeQuiz(3);
        
        // Player 2 completes incorrectly
        vm.prank(player2);
        quizGame.completeQuiz(1);
        
        // Verify outcomes
        assertFalse(quizGame.getQuizSession(player).active);
        assertFalse(quizGame.getQuizSession(player2).active);
        assertFalse(quizGame.hasActiveQuiz(player));
        assertFalse(quizGame.hasActiveQuiz(player2));
        
        // Player 1 should have more tokens than initial (got 20% bonus)
        uint256 player1Initial = 0.001 ether * 100;
        uint256 player1Expected = player1Initial + (player1Initial * 20 / 100);
        assertEq(token.balanceOf(player), player1Expected);
        
        // Player 2 should have exactly initial tokens (no bonus for wrong answer)
        assertEq(token.balanceOf(player2), 0.002 ether * 100);
    }

    function testOwnerMintToken() public {
        // Owner mints tokens to player
        quizGame.mintToken(player, 1000);
        
        assertEq(token.balanceOf(player), 1000);
    }

    function testNonOwnerCannotMint() public {
        vm.prank(player);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", player));
        quizGame.mintToken(player, 1000);
    }

    function testTokenRewardCalculation() public {
        vm.deal(player, 1 ether);
        
        // Start quiz with 0.01 ETH
        uint256 playAmount = 0.01 ether;
        string memory quizId = "web3-basics";
        vm.prank(player);
        quizGame.startQuiz{value: playAmount}(quizId, 5);
        
        // Should get 1 token (0.01 ETH * 100 = 1 token)
        assertEq(token.balanceOf(player), 1 ether);
        
        // Verify session details
        QuizGame.QuizSession memory session = quizGame.getQuizSession(player);
        assertEq(session.quizId, quizId);
        assertTrue(session.active);
        
        // Complete correctly
        vm.prank(player);
        quizGame.completeQuiz(5);
        
        // Should get bonus tokens (20% fixed bonus)
        uint256 finalTokens = token.balanceOf(player);
        uint256 expectedFinalTokens = 1 ether + (1 ether * 20 / 100); // 1.2 tokens
        assertEq(finalTokens, expectedFinalTokens);
        
        // Session should be inactive but quiz ID preserved
        session = quizGame.getQuizSession(player);
        assertEq(session.quizId, quizId);
        assertFalse(session.active);
    }

    function testSetTokenMultiplier() public {
        // Initially should be 100
        assertEq(quizGame.tokenMultiplier(), 100);
        
        // Owner can set new multiplier
        quizGame.setTokenMultiplier(200);
        assertEq(quizGame.tokenMultiplier(), 200);
        
        // Test with updated multiplier
        vm.deal(player, 1 ether);
        vm.prank(player);
        quizGame.startQuiz{value: 0.001 ether}("test", 3);
        
        // Should get tokens with new multiplier (0.001 * 200 = 0.2 tokens)
        assertEq(token.balanceOf(player), 0.001 ether * 200);
    }

    function testSetTokenMultiplierOnlyOwner() public {
        vm.prank(player);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", player));
        quizGame.setTokenMultiplier(200);
    }

    function testSetTokenMultiplierZeroReverts() public {
        vm.expectRevert("Multiplier must be greater than zero");
        quizGame.setTokenMultiplier(0);
    }

    function testStartQuizZeroExpectedAnswersReverts() public {
        vm.deal(player, 1 ether);
        vm.prank(player);
        vm.expectRevert("Expected correct answers must be greater than zero");
        quizGame.startQuiz{value: 0.001 ether}("test", 0);
    }

    function testBonusCalculationFixed20Percent() public {
        vm.deal(player, 1 ether);
        
        // Start quiz
        uint256 playAmount = 0.005 ether;
        vm.prank(player);
        quizGame.startQuiz{value: playAmount}("test", 4);
        
        uint256 initialTokens = playAmount * 100; // 0.5 tokens
        assertEq(token.balanceOf(player), initialTokens);
        
        // Complete with correct answers
        vm.prank(player);
        quizGame.completeQuiz(4);
        
        // Should get exactly 20% bonus
        uint256 expectedBonus = (initialTokens * 20) / 100;
        uint256 expectedTotal = initialTokens + expectedBonus;
        assertEq(token.balanceOf(player), expectedTotal);
    }

    function testNoBonusForWrongAnswerCount() public {
        vm.deal(player, 1 ether);
        
        // Start quiz expecting 5 correct answers
        uint256 playAmount = 0.005 ether;
        vm.prank(player);
        quizGame.startQuiz{value: playAmount}("test", 5);
        
        uint256 initialTokens = playAmount * 100;
        assertEq(token.balanceOf(player), initialTokens);
        
        // Complete with 4 correct answers (not matching expected 5)
        vm.prank(player);
        quizGame.completeQuiz(4);
        
        // Should get no bonus, only initial tokens
        assertEq(token.balanceOf(player), initialTokens);
    }
}