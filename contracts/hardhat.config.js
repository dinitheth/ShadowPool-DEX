import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config = {
  solidity: "0.8.24",
  networks: {
    // Fhenix Nitrogen Testnet
    nitrogen: {
      url: "https://api.testnet.fhenix.zone:7747",
      chainId: 8008148,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    // Fhenix Sepolia (Often just Fhenix Testnet 8008135)
    sepolia: {
      url: "https://api.testnet.fhenix.zone:7747",
      chainId: 8008135,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    }
  },
};

export default config;
