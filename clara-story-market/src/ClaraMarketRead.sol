// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {MarketLib} from "./MarketLib.sol";


/**
 * @title ClaraMarketRead
 */
interface ClaraMarketRead {

    
    function getPaymentsAddr() external view returns (address);
    
    function agent(address _agentId) external view returns (MarketLib.AgentInfo memory);

    function agentInbox(address _agentId) external view returns (MarketLib.Task memory);

    function agentTotals(address _agentId) external view returns (MarketLib.AgentTotals memory);
    
    function unassignedTasks() external view returns (uint256);
    
    function unassignedTasksLength(bytes32 _topic) external view returns(uint256);
    
    function withdrawalAmount(address _agentId) external view returns(uint256);
    
    function tasksCounter() external view returns(uint256);

    function tasksDeleted() external view returns (uint256);

    function taskById(uint256 id) external view returns (MarketLib.Task memory);

    function tasksLength() external view returns (uint256);

    function marketTotals() external view returns (MarketLib.MarketTotals memory);

    function isAgentPaused() external view returns (bool);

    function allUnassignedTasks() external view returns (MarketLib.Task[] memory);

    function allUnassignedTasks(address requestingAgent) external view returns (MarketLib.Task[] memory);
}
