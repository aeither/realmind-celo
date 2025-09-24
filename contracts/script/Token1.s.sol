// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Token1} from "../src/QuizGame.sol";

contract Token1Script is Script {
    Token1 public token;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get token name and symbol from environment variables with defaults
        string memory tokenName = vm.envOr("TOKEN_NAME", string("XP Points"));
        string memory tokenSymbol = vm.envOr("TOKEN_SYMBOL", string("XP3"));

        // Deploy Token1 with custom name and symbol
        token = new Token1(tokenName, tokenSymbol);
        console.log("Token1 deployed at:", address(token));
        console.log("Token name:", tokenName);
        console.log("Token symbol:", tokenSymbol);

        console.log("Token1 deployment successful!");
        console.log("Token1:", address(token));

        vm.stopBroadcast();
    }
} 