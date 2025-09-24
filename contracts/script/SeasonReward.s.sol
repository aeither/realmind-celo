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

        // Deploy SeasonReward contract
        seasonReward = new SeasonReward();
        console.log("SeasonReward deployed at:", address(seasonReward));
        console.log("Owner:", seasonReward.owner());

        console.log("SeasonReward contract deployed successfully!");
        console.log("Contract address:", address(seasonReward));

        vm.stopBroadcast();
    }
}