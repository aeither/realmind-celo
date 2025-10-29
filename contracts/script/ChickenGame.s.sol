// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {ChickenGame, EggToken, MegaEgg, RetentionSystem} from "../src/ChickenGame.sol";

contract ChickenGameScript is Script {
    ChickenGame public chickenGame;
    EggToken public eggToken;
    MegaEgg public megaEgg;
    RetentionSystem public retentionSystem;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy EggToken first
        eggToken = new EggToken();
        console.log("EggToken deployed at:", address(eggToken));

        // Deploy MegaEgg
        megaEgg = new MegaEgg();
        console.log("MegaEgg deployed at:", address(megaEgg));

        // Deploy RetentionSystem
        retentionSystem = new RetentionSystem(address(eggToken));
        console.log("RetentionSystem deployed at:", address(retentionSystem));

        // Deploy ChickenGame with EggToken and MegaEgg addresses
        chickenGame = new ChickenGame(address(eggToken), address(megaEgg));
        console.log("ChickenGame deployed at:", address(chickenGame));

        // Grant minter roles
        eggToken.grantRole(eggToken.MINTER_ROLE(), address(chickenGame));
        console.log("Granted EggToken MINTER_ROLE to ChickenGame");

        eggToken.grantRole(eggToken.MINTER_ROLE(), address(retentionSystem));
        console.log("Granted EggToken MINTER_ROLE to RetentionSystem");

        megaEgg.grantRole(megaEgg.MINTER_ROLE(), address(chickenGame));
        console.log("Granted MegaEgg MINTER_ROLE to ChickenGame");

        console.log("\n=== Deployment Summary ===");
        console.log("EggToken:", address(eggToken));
        console.log("MegaEgg:", address(megaEgg));
        console.log("RetentionSystem:", address(retentionSystem));
        console.log("ChickenGame:", address(chickenGame));
        console.log("Admin (has DEFAULT_ADMIN_ROLE):", msg.sender);
        console.log("\nFeatures:");
        console.log("- ChickenGame: Actions accumulate 1 per 2 hours (max 10)");
        console.log("- RetentionSystem: Daily check-ins (20 hour period) with streak bonuses");
        console.log("- Buy eggs with ETH & merge to MegaEggs");
        console.log("- Users start with 10 free instant actions!");

        vm.stopBroadcast();
    }
}

