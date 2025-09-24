// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {QuizGame, Token1} from "../src/QuizGame.sol";

contract QuizGameScript is Script {
    QuizGame public quizGame;
    Token1 public token;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get token name and symbol from environment variables with defaults
        string memory tokenName = vm.envOr("TOKEN_NAME", string("XP Points"));
        string memory tokenSymbol = vm.envOr("TOKEN_SYMBOL", string("XP3"));

        // Deploy Token1
        token = new Token1(tokenName, tokenSymbol);
        console.log("Token1 deployed at:", address(token));
        console.log("Token name:", tokenName);
        console.log("Token symbol:", tokenSymbol);

        // Deploy QuizGame
        quizGame = new QuizGame(address(token));
        console.log("QuizGame deployed at:", address(quizGame));

        // Transfer ownership of Token1 to QuizGame so it can mint tokens
        token.transferOwnership(address(quizGame));
        console.log("Token1 ownership transferred to QuizGame");

        console.log("All contracts deployed successfully!");
        console.log("Token1:", address(token));
        console.log("QuizGame:", address(quizGame));

        vm.stopBroadcast();
    }
}
