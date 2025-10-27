// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {ChickenGame, EggToken} from "../src/ChickenGame.sol";

contract ChickenGameScript is Script {
    ChickenGame public chickenGame;
    EggToken public eggToken;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy EggToken first
        eggToken = new EggToken();
        console.log("EggToken deployed at:", address(eggToken));

        // Deploy ChickenGame with EggToken address
        chickenGame = new ChickenGame(address(eggToken));
        console.log("ChickenGame deployed at:", address(chickenGame));

        // Grant minter role to ChickenGame contract so it can mint eggs
        eggToken.grantRole(eggToken.MINTER_ROLE(), address(chickenGame));
        console.log("Granted MINTER_ROLE to ChickenGame contract");

        console.log("\n=== Deployment Summary ===");
        console.log("EggToken:", address(eggToken));
        console.log("ChickenGame:", address(chickenGame));
        console.log("Admin (has DEFAULT_ADMIN_ROLE):", msg.sender);
        console.log("\nChickenGame can now mint EggTokens when users lay eggs!");
        console.log("Users get 10 free instant actions to get started!");

        vm.stopBroadcast();
    }
}

