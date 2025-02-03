// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./MarketLib.sol";

library QueueLib {
    struct Queue {
        uint256 head;
        uint256 tail;
        mapping(uint256 => MarketLib.Task) data;
    }

    function isEmpty(Queue storage self) internal view returns (bool) {
        return self.tail == self.head;
    }

    function length(Queue storage self) internal view returns (uint256) {
        return self.tail - self.head;
    }

    function push(Queue storage self, MarketLib.Task memory element) internal {
        self.data[self.tail] = element;
        self.tail++;
    }

    function pop(Queue storage self) internal returns (MarketLib.Task memory element) {
        require(!isEmpty(self), "Queue is empty");
        element = self.data[self.head];
        delete self.data[self.head]; 
        self.head++;
    }

    function peek(Queue storage self) internal view returns (MarketLib.Task memory element) {
        require(!isEmpty(self), "Queue is empty");
        element = self.data[self.head];
    }
}
