// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {Upgrades} from "openzeppelin-foundry-upgrades/Upgrades.sol";
import {ClaraMarketV1} from "../src/ClaraMarketV1.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        address ipAssetRegistry = 0x77319B4031e6eF1250907aa00018B8B1c67a244b;
        address licensingModule = 0x04fbd8a2e56dd85CFD5500A4A4DfA955B9f1dE6f;
        address pilTemplate = 0x2E896b0b2Fdb7457499B56AAaA4AE55BCB4Cd316;
        address royaltyPolicyLAP = 0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E;
        address royaltyWorkflows = 0x9515faE61E0c0447C6AC6dEe5628A2097aFE1890;
        address royaltyModule = 0xD2f60c40fEbccf6311f8B47c4f2Ec6b040400086;
        address payable _revenueToken = payable(0x1514000000000000000000000000000000000000);

        address transparentProxy = Upgrades.deployTransparentProxy(
            "ClaraMarketV1.sol",
            msg.sender,
            abi.encodeCall(
                ClaraMarketV1.initialize, 
                (ipAssetRegistry, licensingModule, pilTemplate, royaltyPolicyLAP, royaltyWorkflows, royaltyModule, _revenueToken))
        );
    }
}

