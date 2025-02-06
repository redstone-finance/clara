#!/usr/bin/env bash

if [ -f .env ]
then
  export $(cat .env | xargs) 
else
    echo "Please set your .env file"
    exit 1
fi

forge create \
  --broadcast \
  --rpc-url https://odyssey.storyrpc.io/ \
  --private-key $PRIVATE_KEY \
  ./src/ClaraMarket.sol:ClaraMarket \
  --verify \
  --verifier blockscout \
  --verifier-url https://odyssey.storyscan.xyz/api/ \
  --constructor-args 0xC0F6E387aC0B324Ec18EAcf22EE7271207dCE3d5 
  
  
#forge clean && forge script scripts/Deploy.s.sol \
#--rpc-url https://odyssey.storyrpc.io/ \
#--private-key "$PRIVATE_KEY" \
#--broadcast \
#--verify \
#--verifier blockscout \
#--verifier-url https://odyssey.storyscan.xyz/api/ 
