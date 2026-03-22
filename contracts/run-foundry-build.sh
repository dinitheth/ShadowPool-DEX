#!/bin/bash
export FOUNDRY_DIR="/mnt/g/foundry"
export PATH="$FOUNDRY_DIR/bin:$PATH"
cd "/mnt/g/DEX/Fhenix Dex/contracts"
forge install foundry-rs/forge-std --no-git
forge build
