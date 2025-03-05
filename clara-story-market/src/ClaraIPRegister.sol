// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;


import "./mocks/AgentNFT.sol";
import "./mocks/RevenueToken.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {ILicensingModule} from "@storyprotocol/core/interfaces/modules/licensing/ILicensingModule.sol";
import {IPAssetRegistry} from "@storyprotocol/core/registries/IPAssetRegistry.sol";
import {IPILicenseTemplate} from "@storyprotocol/core/interfaces/modules/licensing/IPILicenseTemplate.sol";
import {IRoyaltyWorkflows} from "@storyprotocol/periphery/interfaces/workflows/IRoyaltyWorkflows.sol";
import {MarketLib} from "./MarketLib.sol";
import {PILFlavors} from "@storyprotocol/core/lib/PILFlavors.sol";
import {PILTerms} from "@storyprotocol/core/interfaces/modules/licensing/IPILicenseTemplate.sol";
import {RoyaltyPolicyLAP} from "@storyprotocol/core/modules/royalty/policies/LAP/RoyaltyPolicyLAP.sol";

contract ClaraIPRegister is ERC721Holder, Ownable {

    // public
    IPAssetRegistry public IP_ASSET_REGISTRY;
    ILicensingModule public LICENSING_MODULE;
    IPILicenseTemplate public PIL_TEMPLATE;
    RoyaltyPolicyLAP public ROYALTY_POLICY_LAP;
    IRoyaltyWorkflows public ROYALTY_WORKFLOWS;
    RevenueToken public REVENUE_TOKEN;
    AgentNFT public AGENT_NFT;

    constructor(
        address ipAssetRegistry,
        address licensingModule,
        address pilTemplate,
        address royaltyPolicyLAP,
        address royaltyWorkflows,
        address payable _revenueToken) Ownable(msg.sender) {

        IP_ASSET_REGISTRY = IPAssetRegistry(ipAssetRegistry);
        REVENUE_TOKEN = RevenueToken(_revenueToken);
        LICENSING_MODULE = ILicensingModule(licensingModule);
        PIL_TEMPLATE = IPILicenseTemplate(pilTemplate);
        ROYALTY_POLICY_LAP = RoyaltyPolicyLAP(royaltyPolicyLAP);
        ROYALTY_WORKFLOWS = IRoyaltyWorkflows(royaltyWorkflows);
        AGENT_NFT = new AgentNFT("CLARA AGENT IP NFT", "CAIN");
    }

    function registerAgentProfile(address agent) 
    external onlyOwner 
    returns (uint256 tokenId, address ipId, uint256 licenseTermsId) {

        tokenId = AGENT_NFT.mint(address(this));
        ipId = IP_ASSET_REGISTRY.register(block.chainid, address(AGENT_NFT), tokenId);
        licenseTermsId = PIL_TEMPLATE.registerLicenseTerms(
            PILFlavors.commercialRemix({
                mintingFee: 0,
                commercialRevShare: 100 * 10 ** 6, // 100% - i.e. all royalties for the tasks (childIPs) are sent to the Agent assigned to this task
                royaltyPolicy: address(ROYALTY_POLICY_LAP),
                currencyToken: address(REVENUE_TOKEN)
            }));

        // attach the license terms to the IP Asset
        LICENSING_MODULE.attachLicenseTerms(ipId, address(PIL_TEMPLATE), licenseTermsId);

        // transfer the NFT to the receiver so it owns the IPA
        AGENT_NFT.transferFrom(address(this), agent, tokenId);
    }


    function setupTask(
        address agentId,
        address licensorIpId,
        uint256 licenceTermsId) 
    external onlyOwner 
    returns (uint256 childTokenId, address childIpId) {

        childTokenId = AGENT_NFT.mint(address(this));
        childIpId = IP_ASSET_REGISTRY.register(
            block.chainid, address(AGENT_NFT), childTokenId);

        // mint a license token from the parent
        uint256 licenseTokenId = LICENSING_MODULE.mintLicenseTokens({
            licensorIpId: licensorIpId,
            licenseTemplate: address(PIL_TEMPLATE),
            licenseTermsId: licenceTermsId,
            amount: 1,
            receiver: address(this),
            royaltyContext: "", // for PIL, royaltyContext is empty string
            maxMintingFee: 0,
            maxRevenueShare: 0
        });

        uint256[] memory licenseTokenIds = new uint256[](1);
        licenseTokenIds[0] = licenseTokenId;

        // register the new child IPA as a derivative
        // of the parent
        LICENSING_MODULE.registerDerivativeWithLicenseTokens({
            childIpId: childIpId,
            licenseTokenIds: licenseTokenIds,
            royaltyContext: "", // empty for PIL
            maxRts: 0
        });

        // transfer the NFT to the receiver so it owns the child IPA
        AGENT_NFT.transferFrom(address(this), agentId, childTokenId);
    }


    function claimAllRevenue(
        address childIpId,
        address ipAssetId) external onlyOwner {

        address[] memory childIpIds = new address[](1);
        address[] memory royaltyPolicies = new address[](1);
        address[] memory currencyTokens = new address[](1);
        childIpIds[0] = childIpId;
        royaltyPolicies[0] = address(ROYALTY_POLICY_LAP);
        currencyTokens[0] = address(REVENUE_TOKEN);
        uint256[] memory amountsClaimed = ROYALTY_WORKFLOWS.claimAllRevenue({
            ancestorIpId: ipAssetId,
            claimer: ipAssetId,
            childIpIds: childIpIds,
            royaltyPolicies: royaltyPolicies,
            currencyTokens: currencyTokens
        });
    }


}
