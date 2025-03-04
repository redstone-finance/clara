// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {Upgrades} from "openzeppelin-foundry-upgrades/Upgrades.sol";
import {ClaraMarketV1} from "../src/ClaraMarketV1.sol";

contract UpgradeScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Specifying the address of the existing transparent proxy
        address transparentProxy = 0x599c216A662b34218d9e17B6c4627C92F8018ED6;

        // Setting options for validating the upgrade
        Options memory opts;
        opts.referenceContract = "ClaraMarket.sol";

        // Validating the compatibility of the upgrade
        Upgrades.validateUpgrade("ClaraMarket_update_1.sol", opts);

        // Upgrading to ContractB and attempting to increase the value
        Upgrades.upgradeProxy(transparentProxy, "ClaraMarket_update_1.sol");
    }
}

