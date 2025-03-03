#!/usr/bin/env bash

forge clean && forge build --build-info && forge test --fork-url https://aeneid.storyrpc.io/ --match-path test/ClaraMarket.t.sol --no-match-test "Skip" -vv --no-storage-caching
