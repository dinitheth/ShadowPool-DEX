import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy Margin Token (Encrypted USDC)
  const EncryptedERC20 = await hre.ethers.getContractFactory("EncryptedERC20");
  const marginToken = await EncryptedERC20.deploy("Encrypted USDC", "EUSDC");
  await marginToken.waitForDeployment();
  const marginAddress = await marginToken.getAddress();
  console.log("Encrypted USDC Deployed to:", marginAddress);

  // Mint some test tokens to deployer
  console.log("Minting test tokens...");
  const mintTx = await marginToken.mint(1000000);
  await mintTx.wait();

  // 2. Deploy ShadowPool 
  const ShadowPool = await hre.ethers.getContractFactory("ShadowPool");
  const shadowPool = await ShadowPool.deploy(marginAddress);
  await shadowPool.waitForDeployment();
  const poolAddress = await shadowPool.getAddress();
  console.log("ShadowPool Deployed to:", poolAddress);

  console.log(`
=========================================
Deployments Complete!
Update src/lib/wallet-config.ts with:
  export const MARGIN_TOKEN_ADDRESS = "${marginAddress}";
  export const SHADOW_POOL_ADDRESS = "${poolAddress}";
=========================================
  `);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
