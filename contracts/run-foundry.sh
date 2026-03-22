#!/bin/bash
export FOUNDRY_DIR="/mnt/g/foundry"
export PATH="$FOUNDRY_DIR/bin:$PATH"
curl -L https://foundry.paradigm.xyz | bash
foundryup
cd "/mnt/g/DEX/Fhenix Dex/contracts"
forge build
