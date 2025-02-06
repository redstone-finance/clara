#!/usr/bin/env bash

if [ -f .env ]
then
  export $(cat .env | xargs) 
else
    echo "Please set your .env file"
    exit 1
fi

forge clean && forge script scripts/Upgrade.s.sol \
--rpc-url https://odyssey.storyrpc.io/ \
--private-key "$PRIVATE_KEY" \
--broadcast \
--verify \
--verifier blockscout \
--verifier-url https://odyssey.storyscan.xyz/api/ 
