// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {SeasonReward} from "../src/SeasonReward.sol";

/**
 * @title SetSeasonRewardsScript
 * @notice Generated script to set rewards on SeasonReward contract
 * @dev Generated at: 2025-12-09T02:34:05.523Z
 *      Total recipients: 30
 *      Total amount: 249.860000 native tokens
 */
contract SetSeasonRewardsScript is Script {
    SeasonReward public seasonReward;

    function setUp() public {
        seasonReward = SeasonReward(payable(0x49Cde09f1CE2A1C00ef1920BB7C0ae34F565524E)); // ✅ Checksummed with viem
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("Setting rewards on SeasonReward at:", address(seasonReward));
        console.log("Total recipients:", uint256(30));

        // Batch 1 of 1
        {
            address[] memory users = new address[](30);
            uint256[] memory amounts = new uint256[](30);
            users[0] = 0x4f557838F6a3144dd7153E448dEFEE407F3120e3;
            users[1] = 0xe92cf51eD1D9Bb8d1791127711d09ecF28449b1C;
            users[2] = 0xbe68aDCCcC8D63f9cF0E7dCD62F0c47Cc8988ac2;
            users[3] = 0xcE4601EDc2eb577172C505058D70D387831269dF;
            users[4] = 0x96CAEA94Fbfb5CAa2505B9C8BCB2fA1617eb2486;
            users[5] = 0x956900132b5EE2282AA65ce4Fa2120Ea533Dc6c9;
            users[6] = 0x3a57689B86012F91E7A1869c014f0D534bb4E3Ca;
            users[7] = 0xcA7DDbc8EC13cC691E5145a26d0f655ED5df51Ec;
            users[8] = 0xFe1a957aCe79a2F35C912EF7f3667e2F9d24220D;
            users[9] = 0x063c4989cFb40557353EDB8c26Ea8009789F2569;
            users[10] = 0x3f2A7c5cf1954639466E39D1bCdc8f912Ac83cbe;
            users[11] = 0x0A1704606B1F78b0Fb3598d5A00A00e72cE2892F;
            users[12] = 0xb3B6Bb3Ba7F10CC9B6d51964EFf169DF0e2479E1;
            users[13] = 0x5cbEEB487a6F7a65E480a38fff7b4537a8D1C874;
            users[14] = 0x994CACFba4451D2728CD1C10A0B54C9dD7b1fD39;
            users[15] = 0x6b5CA4508eBB2f3c87d3A17298D21A9345103Fd9;
            users[16] = 0x182a4E4759e9f841682DC7D89b5CCcd6ccb6a82D;
            users[17] = 0xf057491474d0C47C410D3d90d5f1DB170818ee64;
            users[18] = 0x0C1732ce5FBA93b333bAB594c0C59A2c2a913E68;
            users[19] = 0x6a1d67C2DaC920796D8B17C16452F880AE22b2ed;
            users[20] = 0x01d2F10a2CDe4047292b5f4c6CB590E94f00bBD6;
            users[21] = 0x3D4232fa57eaC13f9818C63e9dB9e6993cDC10e9;
            users[22] = 0xA5bdD257ca1DEfc723f573eC9dCa3B6528806B40;
            users[23] = 0x69FcdBc0Ea20F1B6413eB089ebE75db13f24B398;
            users[24] = 0x2DA2ed2d76c0d2ca0595D30dEf13f3F2AE3e4AE3;
            users[25] = 0xc4afa5BE44d815D6fcF2d5f61437a2f4bDBee0Cb;
            users[26] = 0x707D9DEfC3C6620696594a0193d5273cDfb9EdA3;
            users[27] = 0xD8BD07818205A5458B721bcddC447eb86C714Ca8;
            users[28] = 0xCa057D71Ef5419D6C78e5271565ACdC0301f0480;
            users[29] = 0x5e3669251e87d7aAa99707846fe22A0be9aAD1f6;
            amounts[0] = 30410000000000000000;
            amounts[1] = 26500000000000000000;
            amounts[2] = 25700000000000000000;
            amounts[3] = 25200000000000000000;
            amounts[4] = 20890000000000000000;
            amounts[5] = 20890000000000000000;
            amounts[6] = 17530000000000000000;
            amounts[7] = 15780000000000000000;
            amounts[8] = 12520000000000000000;
            amounts[9] = 9620000000000000000;
            amounts[10] = 5410000000000000000;
            amounts[11] = 5110000000000000000;
            amounts[12] = 3500000000000000000;
            amounts[13] = 3250000000000000000;
            amounts[14] = 2600000000000000000;
            amounts[15] = 2600000000000000000;
            amounts[16] = 2350000000000000000;
            amounts[17] = 2250000000000000000;
            amounts[18] = 2100000000000000000;
            amounts[19] = 1750000000000000000;
            amounts[20] = 1700000000000000000;
            amounts[21] = 1700000000000000000;
            amounts[22] = 1700000000000000000;
            amounts[23] = 1600000000000000000;
            amounts[24] = 1450000000000000000;
            amounts[25] = 1350000000000000000;
            amounts[26] = 1150000000000000000;
            amounts[27] = 1150000000000000000;
            amounts[28] = 1100000000000000000;
            amounts[29] = 1000000000000000000;

            seasonReward.setSeasonRewards(users, amounts);
            console.log("Batch 1 complete:", uint256(30), "recipients");
        }

        console.log("\n=== Rewards Set Successfully ===");
        console.log("Total recipients:", uint256(30));
        console.log("Remember to fund the contract with at least 249.860000 native tokens");

        vm.stopBroadcast();
    }
}
