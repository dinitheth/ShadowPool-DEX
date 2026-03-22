const hre = require("hardhat");

async function main() {
  console.log("Deploying ShadowPool to Fhenix Nitrogen...\n");

  const ShadowPool = await hre.ethers.getContractFactory("ShadowPool");
  const shadowPool = await ShadowPool.deploy();
  await shadowPool.waitForDeployment();

  const address = await shadowPool.getAddress();
  console.log("ShadowPool deployed to:", address);
  console.log("\nUpdate SHADOW_POOL_ADDRESS in src/lib/wallet-config.ts with this address.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
