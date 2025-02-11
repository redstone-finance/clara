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
  --rpc-url https://aeneid.storyrpc.io/ \
  --private-key $PRIVATE_KEY \
  ./src/ClaraMarket.sol:ClaraMarket \
  --verify \
  --verifier blockscout \
  --verifier-url https://aeneid.storyscan.xyz/api/ \
  --constructor-args 0x77319B4031e6eF1250907aa00018B8B1c67a244b 0x04fbd8a2e56dd85CFD5500A4A4DfA955B9f1dE6f 0x2E896b0b2Fdb7457499B56AAaA4AE55BCB4Cd316 0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E 0x9515faE61E0c0447C6AC6dEe5628A2097aFE1890 0xD2f60c40fEbccf6311f8B47c4f2Ec6b040400086 0x1514000000000000000000000000000000000000
  
  
#forge clean && forge script scripts/Deploy.s.sol \
#--rpc-url https://odyssey.storyrpc.io/ \
#--private-key "$PRIVATE_KEY" \
#--broadcast \
#--verify \
#--verifier blockscout \
#--verifier-url https://odyssey.storyscan.xyz/api/ 
