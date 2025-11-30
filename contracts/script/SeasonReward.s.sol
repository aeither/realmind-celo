// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {SeasonReward} from "../src/SeasonReward.sol";

contract SeasonRewardScript is Script {
    SeasonReward public seasonReward;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy SeasonReward
        seasonReward = new SeasonReward();
        console.log("SeasonReward deployed at:", address(seasonReward));

        console.log("\n=== Deployment Summary ===");
        console.log("SeasonReward:", address(seasonReward));
        console.log("Owner:", msg.sender);
        console.log("\nNext steps:");
        console.log("1. Fund the contract with native tokens");
        console.log("2. Use setSeasonRewards() to set user rewards");
        console.log("3. Users can then call claimReward()");
        console.log("4. Call endDistribution() when season ends");
        console.log("5. Call withdraw() to retrieve unclaimed funds");

        vm.stopBroadcast();
    }
}

contract FundSeasonRewardScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address seasonRewardAddress = vm.envAddress("SEASON_REWARD_ADDRESS");
        uint256 fundAmount = vm.envUint("FUND_AMOUNT");

        vm.startBroadcast(deployerPrivateKey);

        (bool success, ) = seasonRewardAddress.call{value: fundAmount}("");
        require(success, "Funding failed");

        console.log("Funded SeasonReward contract:");
        console.log("Address:", seasonRewardAddress);
        console.log("Amount:", fundAmount);

        vm.stopBroadcast();
    }
}
