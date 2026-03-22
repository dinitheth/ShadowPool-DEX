// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/EncryptedERC20.sol";
import "../src/ShadowPool.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Margin Token (Encrypted USDC) with built-in faucet
        EncryptedERC20 marginToken = new EncryptedERC20("Encrypted USDC", "EUSDC");
        console.log("Encrypted USDC deployed to:", address(marginToken));

        // 2. Deploy ShadowPool (owner = deployer)
        ShadowPool pool = new ShadowPool(address(marginToken));
        console.log("ShadowPool deployed to:", address(pool));

        // 3. Authorise ShadowPool as a minter on EUSDC
        //    This allows settlePosition() to mintTo() winners
        marginToken.setMinter(address(pool), true);
        console.log("ShadowPool authorised as EUSDC minter");

        // 4. Pre-mint some tokens to the deployer for initial pool funding
        //    1B USDC = 1_000_000_000 * 10^6 = 1_000_000_000_000_000 raw units
        pool.fundPool(1_000_000_000_000_000);
        console.log("Funded ShadowPool with 1B EUSDC for settlement");

        vm.stopBroadcast();
    }
}
