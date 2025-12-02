// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {BunnyGame, EggToken, RetentionSystem} from "../src/BunnyGame.sol";

contract BunnyGameScript is Script {
    BunnyGame public bunnyGame;
    EggToken public eggToken;
    RetentionSystem public retentionSystem;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy EggToken first
        eggToken = new EggToken();
        console.log("EggToken deployed at:", address(eggToken));

        // Deploy RetentionSystem
        retentionSystem = new RetentionSystem(address(eggToken));
        console.log("RetentionSystem deployed at:", address(retentionSystem));

        // Deploy BunnyGame with EggToken address
        bunnyGame = new BunnyGame(address(eggToken));
        console.log("BunnyGame deployed at:", address(bunnyGame));

        // Grant minter roles
        eggToken.grantRole(eggToken.MINTER_ROLE(), address(bunnyGame));
        console.log("Granted EggToken MINTER_ROLE to BunnyGame");

        eggToken.grantRole(eggToken.MINTER_ROLE(), address(retentionSystem));
        console.log("Granted EggToken MINTER_ROLE to RetentionSystem");

        console.log("\n=== Deployment Summary ===");
        console.log("EggToken:", address(eggToken));
        console.log("RetentionSystem:", address(retentionSystem));
        console.log("BunnyGame:", address(bunnyGame));
        console.log("Admin (has DEFAULT_ADMIN_ROLE):", msg.sender);
        console.log("\nFeatures:");
        console.log("- BunnyGame: Actions accumulate 1 per 2 hours (max 10)");
        console.log("- RetentionSystem: Daily check-ins (20 hour period) with streak bonuses");
        console.log("- Users start with 10 free instant actions + 10 claimable!");

        vm.stopBroadcast();
    }
}


