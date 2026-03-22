#!/bin/bash
export FOUNDRY_DIR="/mnt/g/foundry"
export PATH="$FOUNDRY_DIR/bin:$PATH"
export PRIVATE_KEY="0x9799cf3d371236d871ac1ac0508e0b24f92e823246b94c772bacd15923b333d5"
cd "/mnt/g/DEX/Fhenix Dex/contracts"
forge script script/Deploy.s.sol:DeployScript --rpc-url https://ethereum-sepolia-rpc.publicnode.com --broadcast --legacy
