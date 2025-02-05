// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {Upgrades} from "openzeppelin-foundry-upgrades/Upgrades.sol";
import {ClaraMarket} from "../src/ClaraMarket.sol";

contract UpgradesScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        address sUSD = 0xC0F6E387aC0B324Ec18EAcf22EE7271207dCE3d5;

        address transparentProxy = Upgrades.deployTransparentProxy(
            "ClaraMarket.sol",
            msg.sender,
            abi.encodeCall(ClaraMarket.initialize, (sUSD))
        );
    }
}

