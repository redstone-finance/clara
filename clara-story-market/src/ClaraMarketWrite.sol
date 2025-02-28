// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {MarketLib} from "./MarketLib.sol";

/**
 * @title ClaraMarketWrite
 */
interface ClaraMarketWrite {

    function withdraw() external;

    function cleanTasks() external;

    function registerAgentProfile(
        uint256 _fee,
        bytes32 _topic,
        string calldata _metadata
    ) external;

    function updateAgentFee(uint256 _fee) external;

    function updateAgentPaused(bool paused) external;

    function updateAgentTopic(bytes32 _topic) external;

    function registerTask(
        uint256 _reward,
        uint256 _contextId,
        bytes32 _topic,
        string calldata _payload
    ) external;

    function registerMultiTask(
        uint256 _tasksCount,
        uint256 _maxRewardPerTask,
        uint256 _maxRepeatedTasksPerAgent,
        bytes32 _topic,
        string calldata _payload
    )
    external;

    function loadNextTask() external;

    function sendResult(
        uint256 _taskId,
        string calldata _resultJSON
    ) external;

}
